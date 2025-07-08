import { useState, useEffect, useRef } from 'react';

// Y2K/2000s fonts: Orbitron, Press Start 2P, Audiowide, etc.
// Static effect: animated SVG overlay

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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ff 0%, #f0f 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Orbitron, Press Start 2P, Audiowide, monospace',
      color: '#fff',
      letterSpacing: '0.03em',
    }}>
      {/* Y2K/CRT static overlay */}
      <div style={{
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 9999,
        inset: 0,
        opacity: 0.18,
        mixBlendMode: 'screen',
      }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <filter id="static">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2" result="turb"/>
            <feDisplacementMap in2="turb" in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#static)" fill="#fff" />
        </svg>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Press+Start+2P&family=Audiowide&display=swap');
        body { margin:0; background:transparent; }
        * { box-sizing:border-box; }
        a { color:#0ff; text-shadow:0 0 6px #fff,0 0 12px #0ff; text-decoration:none; }
        a:hover { color:#f0f; text-shadow:0 0 8px #f0f,0 0 16px #fff; }
        #MainCore {
          box-shadow: 0 0 80px #0ff8, 0 0 120px #f0f8;
        }
        .y2k-glow {
          text-shadow: 0 0 8px #fff, 0 0 24px #0ff, 0 0 32px #f0f;
        }
        .crt {
          position:relative;
          background:rgba(0,0,0,0.7);
          border:2px solid #0ff;
          border-radius:18px;
          box-shadow:0 0 32px #0ff8,0 0 64px #f0f8;
          padding:2.5em 2em 2em 2em;
          margin:2em auto;
          max-width:700px;
          overflow:hidden;
        }
        .crt:before {
          content:'';
          display:block;
          position:absolute;
          left:0; right:0; top:0; height:8px;
          background:linear-gradient(90deg, #fff2 0%, #0ff8 50%, #fff2 100%);
          opacity:0.7;
          filter: blur(2px);
        }
        .crt:after {
          content:'';
          display:block;
          position:absolute;
          left:0; right:0; bottom:0; height:8px;
          background:linear-gradient(90deg, #fff2 0%, #f0f8 50%, #fff2 100%);
          opacity:0.5;
          filter: blur(2px);
        }
        .crt-title {
          font-family:'Orbitron', 'Audiowide', 'Press Start 2P', monospace;
          font-size:2.2em;
          color:#fff;
          letter-spacing:0.08em;
          margin-bottom:0.5em;
          text-align:center;
          text-shadow:0 0 12px #0ff,0 0 24px #f0f;
        }
        .comment-rules {
          background:rgba(0,0,0,0.5);
          border:2px dashed #f0f;
          color:#fff;
          padding:1em 1.5em;
          margin:1.5em auto 2em;
          font-size:1.1em;
          border-radius:12px;
          max-width:600px;
          box-shadow:0 0 16px #f0f8;
        }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        label { display:block; margin-bottom:.5em; font-weight:700; letter-spacing:0.04em; color:#0ff; text-shadow:0 0 8px #0ff,0 0 16px #fff; }
        input,textarea {
          width:100%;
          padding:1.1em;
          margin-bottom:1.2em;
          background:rgba(0,0,0,0.7);
          border:2px solid #f0f;
          color:#fff;
          border-radius:8px;
          font-family:'Audiowide','Orbitron',monospace;
          font-size:1.1em;
          outline:none;
          box-shadow:0 0 8px #f0f8 inset;
          transition: border 0.2s;
        }
        input:focus,textarea:focus {
          border:2px solid #0ff;
          box-shadow:0 0 16px #0ff8;
        }
        button {
          background:linear-gradient(90deg,#0ff,#f0f 80%);
          color:#222;
          border:none;
          padding:.9em 2.2em;
          font-family:'Orbitron','Audiowide',monospace;
          font-size:1.1em;
          border-radius:8px;
          cursor:pointer;
          box-shadow:0 0 12px #0ff8,0 0 24px #f0f8;
          text-shadow:0 0 8px #fff;
          font-weight:700;
          letter-spacing:0.06em;
          margin-top:0.5em;
        }
        button:hover {
          background:linear-gradient(90deg,#f0f,#0ff 80%);
          color:#fff;
          box-shadow:0 0 24px #f0f8,0 0 32px #0ff8;
        }
        #comments-list {
          list-style:none;
          margin:0 0 1em 0;
          padding:0;
        }
        .comment {
          background:rgba(0,0,0,0.6);
          border:2px solid #0ff8;
          padding:1.1em 1.2em;
          margin-bottom:1.2em;
          border-radius:8px;
          box-shadow:0 0 12px #0ff8,0 0 24px #f0f8;
          position:relative;
        }
        .comment .author {
          display:block;
          font-family:'Press Start 2P','Orbitron',monospace;
          font-size:1em;
          color:#f0f;
          margin-bottom:.4em;
          text-transform:uppercase;
          text-shadow:0 0 8px #f0f,0 0 16px #fff;
        }
        .comment .text {
          margin:.4em 0;
          font-size:1.1em;
          color:#fff;
          text-shadow:0 0 4px #0ff8;
        }
        .comment .time {
          font-size:.9em;
          color:#0ff;
          text-shadow:0 0 6px #0ff8;
        }
        .char-count {
          text-align:right;
          color:#f0f;
          font-size:0.95em;
          text-shadow:0 0 6px #fff,0 0 12px #f0f;
        }
        @media (max-width: 600px) {
          .crt { padding:1.2em 0.5em 1.5em 0.5em; }
          .crt-title { font-size:1.2em; }
        }
      `}</style>
      <nav style={{
        width: '100%',
        background: 'rgba(0,0,0,0.7)',
        borderBottom: '2px solid #0ff',
        boxShadow: '0 0 16px #0ff8',
        padding: '1.2em 0',
        marginBottom: '2em',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <a href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank" className="y2k-glow">
          ⬅ Back to my profile
        </a>
      </nav>
      <main style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="comment-rules">
          <ul>
            <li>Give your feedback here! Just avoid commenting on things that break JanitorAI's rules. Breaking this rule will cause me to delete your comment.</li>
          </ul>
        </div>
        <section className="crt">
          <div className="crt-title">Add a Comment</div>
          <form onSubmit={handleSubmit} autoComplete="off">
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
            <div className="char-count">{charCount}/{MAX_CHARS}</div>
            <button type="submit">Post Comment</button>
          </form>
        </section>
        <section className="crt">
          <div className="crt-title">Comments</div>
          <ul id="comments-list">
            {comments.length === 0
              ? <p style={{ color: '#0ff', textAlign: 'center', fontFamily: 'Orbitron, monospace', textShadow: '0 0 8px #0ff,0 0 16px #fff' }}>Be the first to comment!</p>
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
