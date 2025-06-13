import { useState, useEffect, useRef } from 'react';

const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  for (const [unit, sec] of Object.entries(intervals)) {
    const count = Math.floor(seconds / sec);
    if (count >= 1) return `${count}${unit[0]}`;
  }
  return 'Now';
};

export default function Home() {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const MAX_CHARS = 100;

  // auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // fetch comments
  useEffect(() => {
    fetch('/api/comments.json')
      .then(res => res.json())
      .then(data => setComments(data.comments || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim().slice(0, 30);
    const trimmedMessage = message.trim().slice(0, MAX_CHARS);
    if (!trimmedName || !trimmedMessage) return;

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, message: trimmedMessage }),
    });
    // reload
    const res = await fetch('/api/comments.json');
    const data = await res.json();
    setComments(data.comments || []);
    setName('');
    setMessage('');
    setCharCount(0);
  };

  return (
    <div id="MainCore" style={{ background: '#0F172A', minHeight: '100vh', paddingBottom: '4rem' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap');
        body { margin:0; font-family:'Open Sans',sans-serif; color:#e2e2e2; background:#0F172A; }
        * { box-sizing:border-box; }
        a { color:#FFE033; text-decoration:none; }
        header { background:rgba(15,23,42,0.8); padding:2em 1em; position:sticky; top:0; border-bottom:1px solid rgba(255,255,255,0.1); }
        #PageTitle { font-size:3em; margin:0; }
        .PageModule { background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); margin:1em 0; padding:1em; border-radius:8px; }
        .PageModule>h2 { font-size:1.25rem; margin:0 0 .5em; }
        label { display:block; margin-bottom:.5em; font-weight:500; }
        input,textarea { width:100%; padding:.75rem; margin-bottom:1em; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#e2e2e2; font-family:inherit; }
        button { background:#FFE033; color:#0F172A; border:none; padding:.75rem 1.5rem; border-radius:4px; font-weight:600; cursor:pointer; }
        .CommentCard { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:1em; margin-bottom:1em; }
        .CommentCard h3 { margin:0; font-size:1.125rem; color:#FFE033; }
        .CommentCard time { font-size:.875rem; color:#94A3B8; }
        .CommentCard p { margin:.5em 0 0; color:#cbd5e1; line-height:1.5; }
      `}</style>

      <header>
        <div id="MainContentWrapper">
          <h1 id="PageTitle">💬 Lucy's Profile Comments</h1>
        </div>
      </header>

      <main id="MainContentWrapper" style={{ maxWidth:'800px', margin:'2rem auto', padding:'0 1.5rem' }}>
        <section className="PageModule">
          <h2>Add a Comment</h2>
          <form onSubmit={handleSubmit}>
            <label>Your Name</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30} required />
            <label>Comment</label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
              maxLength={MAX_CHARS}
              rows={3}
              required />
            <div style={{ textAlign:'right', color:'#94A3B8' }}>{charCount}/{MAX_CHARS}</div>
            <button type="submit">Post Comment</button>
          </form>
        </section>

        <section className="PageModule">
          <h2>Comments</h2>
          {comments.length === 0
            ? <p>Be the first to comment!</p>
            : comments.map(c => (
              <div key={c.id || c.created_at} className="CommentCard">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <h3>{c.name}</h3>
                  <time>{getTimeAgo(c.created_at)}</time>
                </div>
                <p>{c.message}</p>
              </div>
            ))
          }
        </section>
      </main>
    </div>
  );
}