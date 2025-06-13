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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

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

    const res = await fetch('/api/comments.json');
    const data = await res.json();
    setComments(data.comments || []);
    setName('');
    setMessage('');
    setCharCount(0);
  };

  return (
    <div id="MainCore" style={{
      backgroundImage: 'url(https://ella.janitorai.com/background-image/Z2X3TqVV3-lUNjwqlFGIx.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      paddingBottom: '4rem',
      backgroundColor: '#1b1118'
    }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        body { margin:0; font-family:'Open Sans',sans-serif; color:#e2e2e2; background: #1b1118; }
        * { box-sizing:border-box; }
        a { color:#FFE033; text-decoration:none; }
        nav.navbar { background:rgba(27, 17, 24, 0.9); padding:.8em 1em; border-bottom:1px solid #3a2a34; }
        nav.navbar a { font-family:'Press Start 2P',sans-serif; font-size:.9em; color:#FFE033; }
        nav.navbar a:hover { text-decoration:underline; }
        #PageTitle { font-family:'Press Start 2P',sans-serif; font-size:3em; margin:0; }
        .comment-rules { background:rgba(27, 17, 24, 0.9); border:1px dashed #555; color:#ddd; padding:.8em; margin:1em; font-size:.9em; }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        .PageModule { background:rgba(27, 17, 24, 0.8); border:1px solid rgba(255,255,255,0.05); margin:1em; padding:1em; border-radius:8px; }
        label { display:block; margin-bottom:.5em; font-weight:500; }
        input,textarea { width:100%; padding:.75rem; margin-bottom:1em; background:rgba(34,34,34,0.8); border:1px solid #444; color:#ccc; border-radius:4px; }
        button { background:#FFE033; color:#1b1118; border:none; padding:.6em 1em; font-family:'Press Start 2P',sans-serif; cursor:pointer; }
        button:hover { background:#ffd700; }
        #comments-list { list-style:none; margin:0 1em 1em; padding:0; }
        .comment { background:rgba(27, 17, 24, 0.9); border:1px solid #3a2a34; padding:.7em; margin-bottom:.8em; border-radius:4px; }
        .comment .author { display:block; font-family:'Press Start 2P',sans-serif; font-size:.9em; color:#FFE033; margin-bottom:.4em; text-transform:uppercase; }
        .comment .text { margin:.4em 0; font-size:.95em; color:#e2e2e2; }
        .comment .time { font-size:.8em; color:#999; }
      `}</style>

      <nav className="navbar">
        <a href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank">
          ⬅ Back to my profile
        </a>
      </nav>

      <main id="MainContentWrapper" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>

        <div className="comment-rules">
          <ul>
            <li>Give your feedback here! Just avoid commenting on things that break JanitorAI's rules. Breaking this rule will cause me to delete your comment.</li>
          </ul>
        </div>

        <section className="PageModule">
          <h2 style={{ fontFamily: 'Press Start 2P', color: '#FFE033' }}>Add a Comment</h2>
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
            <div style={{ textAlign: 'right', color: '#94A3B8' }}>{charCount}/{MAX_CHARS}</div>

            <button type="submit">Post Comment</button>
          </form>
        </section>

        <section className="PageModule">
          <h2 style={{ fontFamily: 'Press Start 2P', color: '#FFE033' }}>Comments</h2>
          <ul id="comments-list">
            {comments.length === 0
              ? <p>Be the first to comment!</p>
              : comments.map(c => (
                <li key={c.id || c.created_at} className="comment">
                  <span className="author">{c.name}</span>
                  <p className="text">{c.message}</p>
                  <span className="time">{getTimeAgo(c.created_at)}</span>
                </li>
              ))
            }
          </ul>
        </section>

      </main>
    </div>
  );
}