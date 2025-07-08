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
      backgroundColor: '#f5f0e6',
      minHeight: '100vh',
      fontFamily: 'Garamond, Times New Roman, serif',
      color: '#6d4c41',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Coffee stains for decoration */}
      <div className="coffee-stain" style={{position:'absolute',top:40,left:40,width:96,height:96,borderRadius:'50%',background:'#b99d7a',opacity:0.10,zIndex:0}}></div>
      <div className="coffee-stain" style={{position:'absolute',top:160,right:80,width:128,height:128,borderRadius:'50%',background:'#a27b56',opacity:0.10,zIndex:0}}></div>
      <div className="coffee-stain" style={{position:'absolute',bottom:120,left:'33%',width:80,height:80,borderRadius:'50%',background:'#d4c4a8',opacity:0.10,zIndex:0}}></div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Garamond:wght@400;700&display=swap');
        body { margin:0; font-family:'Garamond', 'Times New Roman', serif; color:#6d4c41; background:#f5f0e6; }
        * { box-sizing:border-box; }
        a { color:#8a6343; text-decoration:none; font-style:italic; }
        nav.navbar { background:rgba(210,180,140,0.13); padding:.8em 1em; border-bottom:1px solid #b99d7a; }
        nav.navbar a { font-family:'Playfair Display', serif; font-size:1.1em; color:#8a6343; font-style:italic; }
        nav.navbar a:hover { text-decoration:underline; }
        #PageTitle { font-family:'Playfair Display', serif; font-size:2.5em; margin:0; color:#6d4c41; font-style:italic; display:flex; align-items:center; gap:.5em; animation:rustle 4s ease-in-out infinite; }
        @keyframes rustle { 0%{transform:rotate(0deg);} 25%{transform:rotate(1deg);} 50%{transform:rotate(-1deg);} 75%{transform:rotate(0.5deg);} 100%{transform:rotate(0deg);} }
        .comment-rules { background:rgba(245,240,230,0.9); border:1px dashed #b99d7a; color:#6d4c41; padding:1.2em; margin:1.5em 0; font-size:1.1em; border-radius:14px; font-family:'Garamond', serif; box-shadow:0 2px 8px rgba(176,137,104,0.06); }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        .PageModule { background:rgba(255,255,255,0.85); border:1.5px solid #b99d7a; margin:1.5em 0; padding:2em 1.5em; border-radius:18px; box-shadow:0 2px 12px rgba(176,137,104,0.10); font-family:'Garamond', serif; }
        label { display:block; margin-bottom:.5em; font-weight:700; font-family:'Playfair Display', serif; color:#8a6343; font-style:italic; }
        .input-group { background:rgba(245,240,230,0.95); border:2px solid #b99d7a; border-radius:14px; box-shadow:0 2px 12px rgba(176,137,104,0.10); padding:1.5em 2em 2em 2em; margin-bottom:1.5em; position:relative; transition:box-shadow 0.3s, border-color 0.3s; }
        .input-group:hover, .input-group:focus-within { box-shadow:0 4px 24px 0 #b99d7acc; border-color:#8a6343; }
        .input-group .input-icon { position:absolute; left:1.1em; top:1.1em; font-size:1.5em; opacity:0.5; pointer-events:none; }
        input,textarea { width:100%; padding:.85rem 1.5rem .85rem 2.5rem; margin-bottom:1em; background:rgba(255,255,255,0.9); border:1.5px solid #b99d7a; color:#6d4c41; border-radius:8px; font-family:'Garamond', serif; font-size:1.08em; box-shadow:0 1px 4px rgba(176,137,104,0.06); transition:border-color 0.3s, box-shadow 0.3s, background 0.3s; }
        input:focus, textarea:focus { border-color:#8a6343; background:rgba(255,245,230,0.98); box-shadow:0 0 0 2px #b99d7a; outline:none; }
        button { background:#8a6343; color:#f5f0e6; border:none; padding:.8em 1.5em; font-family:'Playfair Display', serif; font-size:1.08em; border-radius:8px; cursor:pointer; font-style:italic; box-shadow:0 2px 6px rgba(176,137,104,0.08); transition:background 0.2s, transform 0.2s, box-shadow 0.2s; position:relative; overflow:hidden; }
        button:before { content:''; position:absolute; left:0; top:0; width:100%; height:100%; background:linear-gradient(120deg,rgba(255,255,255,0.12),rgba(176,137,104,0.08)); opacity:0; transition:opacity 0.3s; z-index:1; }
        button:hover:before { opacity:1; }
        button:hover { background:#6d4c32; transform:scale(1.04) translateY(-2px); box-shadow:0 4px 16px #b99d7a44; }
        button:active { transform:scale(0.98); }
        #comments-list { list-style:none; margin:0 1em 1em; padding:0; }
        .comment-card { background:rgba(245,240,230,0.97); border:1.5px solid #b99d7a; padding:1.3em 1.5em; margin-bottom:1.5em; border-radius:14px; box-shadow:0 1px 8px rgba(176,137,104,0.08); position:relative; overflow:hidden; transition:all 0.5s cubic-bezier(0.25,0.8,0.25,1); transform-origin:top center; animation:fadeIn 0.8s cubic-bezier(0.39,0.575,0.565,1) forwards; }
        .comment-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg,rgba(210,180,140,0.1) 0%,rgba(255,255,255,0) 60%); z-index:0; transition:all 0.6s ease; opacity:0; }
        .comment-card:hover { transform:translateY(-5px) rotate(0.5deg); box-shadow:0 15px 30px rgba(109,76,50,0.18); }
        .comment-card:hover::before { opacity:1; }
        .comment-card .author { display:flex; align-items:center; font-family:'Playfair Display', serif; font-size:1.1em; color:#8a6343; margin-bottom:.3em; font-style:italic; }
        .comment-card .author .icon { margin-right:.5em; font-size:1.2em; }
        .comment-card .text { margin:.4em 0; font-size:1.08em; color:#6d4c41; font-family:'Garamond', serif; }
        .comment-card .time { font-size:.92em; color:#b99d7a; font-style:italic; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px) rotate(1deg);} to{opacity:1;transform:translateY(0) rotate(0);} }
      `}</style>
      <nav className="navbar">
        <a href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank">
          <span role="img" aria-label="coffee">☕</span> Back to my profile
        </a>
      </nav>
      <main id="MainContentWrapper" style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1.5rem', position:'relative', zIndex:1 }}>
        <h1 id="PageTitle"><span role="img" aria-label="coffee">☕</span> Cozy Coffee Comment Corner</h1>
        <div className="comment-rules">
          <ul>
            <li><span role="img" aria-label="rules">📜</span> "A good conversation is like a perfect cup of coffee - rich, warm, and never rushed." Pour yourself a cup and join our fireside chat. No login required—just your name and thoughts.</li>
          </ul>
        </div>
        <section className="PageModule">
          <h2 style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#8a6343', fontSize:'1.6em', marginBottom:'1em' }}><span role="img" aria-label="add">✍️</span> Leave a Comment</h2>
          <div className="input-group">
            <span className="input-icon" role="img" aria-label="mug">☕</span>
            <label>Your Name</label>
            <input
              type="text" value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30} required placeholder="e.g., Coffee Lover" />
            <label>Comment</label>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
              maxLength={MAX_CHARS}
              rows={3}
              required
              placeholder="Share your cozy thoughts..." />
            <div style={{ textAlign: 'right', color: '#b99d7a', fontStyle: 'italic', fontSize:'0.98em' }}>{charCount}/{MAX_CHARS} <span style={{marginLeft:4,opacity:0.7}}>☕</span></div>
            <button type="submit"><span role="img" aria-label="coffee">☕</span> Post Comment</button>
            <div style={{marginTop:'0.7em', color:'#8a6343', fontStyle:'italic', fontSize:'1em', textAlign:'center', opacity:0.8}}>
              "A good comment is like a warm cup of coffee—best when shared."
            </div>
          </div>
        </section>
        <section className="PageModule">
          <h2 style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#8a6343', fontSize:'1.5em', marginBottom:'1em', textAlign:'center' }}><span role="img" aria-label="comments">💬</span> Recent Conversations</h2>
          <ul id="comments-list">
            {comments.length === 0
              ? <p style={{fontStyle:'italic',color:'#b99d7a'}}>Be the first to comment and warm up this space!</p>
              : comments.map((c, i) => (
                <li key={c.id || c.created_at || i} className="comment-card">
                  <span className="author"><span className="icon" role="img" aria-label="user">👤</span>{c.name}</span>
                  <p className="text">{c.message}</p>
                  <span className="time">{getTimeAgo(c.created_at)}</span>
                </li>
              ))
            }
          </ul>
        </section>
      </main>
      <footer style={{background:'#f5f0e6',color:'#8a6343',textAlign:'center',padding:'2em 0',borderTop:'1.5px solid #d4c4a8',fontFamily:'Garamond, serif',fontSize:'1.08em',marginTop:'2em'}}>
        <div>Made with <span role="img" aria-label="heart">❤️</span> and <span role="img" aria-label="coffee">☕</span> | © 2025 Cozy Coffee Comment Corner</div>
      </footer>
    </div>
  );
}
