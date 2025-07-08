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
      background: 'linear-gradient(120deg, #e9dac1 0%, #b08968 100%)',
      minHeight: '100vh',
      paddingBottom: '4rem',
      fontFamily: 'Georgia, Times New Roman, Garamond, serif',
      color: '#4e342e',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated floating coffee beans/cups */}
      <div className="floating-bg">
        <span className="bean" style={{ top: '10%', left: '5%' }}>☕</span>
        <span className="bean" style={{ top: '30%', left: '80%' }}>🍪</span>
        <span className="bean" style={{ top: '60%', left: '15%' }}>🥐</span>
        <span className="bean" style={{ top: '80%', left: '70%' }}>☕</span>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        body { margin:0; font-family:'Georgia', 'Times New Roman', Garamond, serif; color:#4e342e; background:#e9dac1; }
        * { box-sizing:border-box; }
        a { color:#7c4f29; text-decoration:none; font-style:italic; }
        nav.navbar { background:rgba(176,137,104,0.12); padding:.8em 1em; border-bottom:1px solid #b08968; }
        nav.navbar a { font-family:'Playfair Display', serif; font-size:1.1em; color:#7c4f29; font-style:italic; }
        nav.navbar a:hover { text-decoration:underline; }
        #PageTitle { font-family:'Playfair Display', serif; font-size:2.5em; margin:0; color:#7c4f29; font-style:italic; }
        .floating-bg { position:fixed; width:100vw; height:100vh; left:0; top:0; pointer-events:none; z-index:0; }
        .bean { position:absolute; font-size:2.2em; opacity:0.18; animation: floatBean 8s infinite alternate ease-in-out; }
        .bean:nth-child(2) { animation-delay: 2s; }
        .bean:nth-child(3) { animation-delay: 4s; }
        .bean:nth-child(4) { animation-delay: 6s; }
        @keyframes floatBean {
          0% { transform: translateY(0) scale(1) rotate(-5deg); }
          100% { transform: translateY(-30px) scale(1.1) rotate(8deg); }
        }
        .comment-rules { background:rgba(233,218,193,0.7); border:1px dashed #b08968; color:#6d4c41; padding:.8em; margin:1em; font-size:1em; border-radius:8px; font-family:'Georgia', serif; }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        .PageModule { background:rgba(255,255,255,0.7); border:1px solid #b08968; margin:1em; padding:1.5em; border-radius:12px; box-shadow:0 2px 8px rgba(176,137,104,0.08); font-family:'Georgia', serif; }
        label { display:block; margin-bottom:.5em; font-weight:700; font-family:'Playfair Display', serif; color:#7c4f29; font-style:italic; }
        .input-group { background:rgba(233,218,193,0.85); border:2px solid #b08968; border-radius:10px; box-shadow:0 2px 12px rgba(176,137,104,0.10); padding:1.2em 1.5em 1.5em 1.5em; margin-bottom:1.5em; position:relative; transition:box-shadow 0.3s, border-color 0.3s; }
        .input-group:hover, .input-group:focus-within { box-shadow:0 4px 24px 0 #b08968cc; border-color:#7c4f29; }
        .input-group .input-icon { position:absolute; left:1.1em; top:1.1em; font-size:1.5em; opacity:0.5; pointer-events:none; }
        input,textarea { width:100%; padding:.75rem 1.5rem .75rem 2.5rem; margin-bottom:1em; background:rgba(255,255,255,0.7); border:1.5px solid #b08968; color:#4e342e; border-radius:6px; font-family:'Georgia', serif; font-size:1em; box-shadow:0 1px 4px rgba(176,137,104,0.06); transition:border-color 0.3s, box-shadow 0.3s, background 0.3s; }
        input:focus, textarea:focus { border-color:#7c4f29; background:rgba(255,245,230,0.95); box-shadow:0 0 0 2px #b08968; outline:none; }
        button { background:#7c4f29; color:#fffbe7; border:none; padding:.7em 1.3em; font-family:'Playfair Display', serif; font-size:1em; border-radius:6px; cursor:pointer; font-style:italic; box-shadow:0 2px 6px rgba(176,137,104,0.08); transition:background 0.2s, transform 0.2s, box-shadow 0.2s; position:relative; overflow:hidden; }
        button:before { content:''; position:absolute; left:0; top:0; width:100%; height:100%; background:linear-gradient(120deg,rgba(255,255,255,0.12),rgba(176,137,104,0.08)); opacity:0; transition:opacity 0.3s; z-index:1; }
        button:hover:before { opacity:1; }
        button:hover { background:#a47149; transform:scale(1.04) translateY(-2px); box-shadow:0 4px 16px #b0896844; }
        #comments-list { list-style:none; margin:0 1em 1em; padding:0; }
        .comment { background:rgba(233,218,193,0.7); border:1px solid #b08968; padding:1em; margin-bottom:1.2em; border-radius:8px; box-shadow:0 1px 4px rgba(176,137,104,0.06); }
        .comment .author { display:flex; align-items:center; font-family:'Playfair Display', serif; font-size:1.1em; color:#7c4f29; margin-bottom:.3em; font-style:italic; }
        .comment .author .icon { margin-right:.5em; font-size:1.2em; }
        .comment .text { margin:.4em 0; font-size:1.05em; color:#4e342e; font-family:'Georgia', serif; }
        .comment .time { font-size:.9em; color:#a47149; font-style:italic; }
      `}</style>

      <nav className="navbar">
        <a href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank">
          <span role="img" aria-label="coffee">☕</span> Back to my profile
        </a>
      </nav>

      <main id="MainContentWrapper" style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.5rem', position:'relative', zIndex:1 }}>
        <h1 id="PageTitle"><span role="img" aria-label="coffee">☕</span> Cozy Comments</h1>
        <div className="comment-rules">
          <ul>
            <li><span role="img" aria-label="rules">📜</span> Welcome to the cozy corner! Share your thoughts over a virtual cup of coffee. Please be kind and follow the rules—let's keep this a warm, rustic space.</li>
          </ul>
        </div>
        <section className="PageModule">
          <h2 style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#7c4f29' }}><span role="img" aria-label="add">✍️</span> Add a Comment</h2>
          <div className="input-group">
            <span className="input-icon" role="img" aria-label="mug">☕</span>
            <label>Your Name</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30} required placeholder="e.g. Ana, João, or CoffeeLover" />
            <label>Comment</label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
              maxLength={MAX_CHARS}
              rows={3}
              required
              placeholder="Share your cozy thoughts..." />
            <div style={{ textAlign: 'right', color: '#a47149', fontStyle: 'italic', fontSize:'0.98em' }}>{charCount}/{MAX_CHARS} <span style={{marginLeft:4,opacity:0.7}}>☕</span></div>
            <button type="submit"><span role="img" aria-label="coffee">☕</span> Post Comment</button>
            <div style={{marginTop:'0.7em', color:'#7c4f29', fontStyle:'italic', fontSize:'1em', textAlign:'center', opacity:0.8}}>
              "A good comment is like a warm cup of coffee—best when shared."
            </div>
          </div>
        </section>
        <section className="PageModule">
          <h2 style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#7c4f29' }}><span role="img" aria-label="comments">💬</span> Comments</h2>
          <ul id="comments-list">
            {comments.length === 0
              ? <p style={{fontStyle:'italic',color:'#a47149'}}>Be the first to comment and warm up this space!</p>
              : comments.map(c => (
                <li key={c.id || c.created_at} className="comment">
                  <span className="author"><span className="icon" role="img" aria-label="user">👤</span>{c.name}</span>
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
