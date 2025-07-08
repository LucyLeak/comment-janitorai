import { useState, useEffect, useRef } from 'react';

// Helper for time ago
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
      background: 'repeating-linear-gradient(135deg, #f7f4ef 0 40px, #ece7df 40px 80px)',
      fontFamily: 'Georgia, Times New Roman, Times, serif',
      color: '#2d2a26',
      paddingBottom: '4rem',
      letterSpacing: '0.01em',
      position: 'relative',
    }}>
      {/* Subtle paper texture overlay */}
      <div style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.18,
        background: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png") repeat',
        mixBlendMode: 'multiply',
      }} />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        body { margin:0; background:transparent; }
        * { box-sizing:border-box; }
        a { color:#5a4e3c; text-decoration:underline; font-style:italic; }
        a:hover { color:#b89c6b; }
        #MainCore {
          background:repeating-linear-gradient(135deg, #f7f4ef 0 40px, #ece7df 40px 80px);
        }
        .terminal {
          background:rgba(255,255,255,0.85);
          border:2px solid #b89c6b;
          border-radius:12px;
          box-shadow:0 2px 16px #e6e0d6;
          padding:2.2em 1.5em 1.5em 1.5em;
          margin:2em auto;
          max-width:700px;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          position:relative;
          overflow:hidden;
        }
        .terminal:before {
          content:'';
          display:block;
          position:absolute;
          left:0; right:0; top:0; height:8px;
          background:linear-gradient(90deg, #e6e0d6 0%, #b89c6b 50%, #e6e0d6 100%);
          opacity:0.3;
        }
        .terminal-title {
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          font-size:2.1em;
          color:#5a4e3c;
          font-style:italic;
          margin-bottom:0.7em;
          text-align:center;
          letter-spacing:0.04em;
        }
        .comment-rules {
          background:rgba(255,255,255,0.7);
          border:1.5px dashed #b89c6b;
          color:#5a4e3c;
          padding:1em 1.5em;
          margin:1.5em auto 2em;
          font-size:1.1em;
          border-radius:10px;
          max-width:600px;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
        }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        label {
          display:block;
          margin-bottom:.5em;
          font-weight:700;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          color:#b89c6b;
          font-size:1.1em;
        }
        input,textarea {
          width:100%;
          padding:1em;
          margin-bottom:1.1em;
          background:rgba(255,255,255,0.7);
          border:1.5px solid #b89c6b;
          color:#2d2a26;
          border-radius:6px;
          font-family:'Georgia', Times New Roman, Times, serif;
          font-size:1.1em;
          outline:none;
          box-shadow:0 1px 4px #e6e0d6 inset;
          transition: border 0.2s;
        }
        input:focus,textarea:focus {
          border:1.5px solid #5a4e3c;
          background:rgba(255,255,255,0.95);
        }
        button {
          background:linear-gradient(90deg,#e6e0d6,#b89c6b 80%);
          color:#5a4e3c;
          border:none;
          padding:.8em 2em;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          font-size:1.1em;
          border-radius:6px;
          cursor:pointer;
          box-shadow:0 1px 8px #e6e0d6;
          font-weight:700;
          letter-spacing:0.04em;
          margin-top:0.5em;
          transition: background 0.2s;
        }
        button:hover {
          background:linear-gradient(90deg,#b89c6b,#e6e0d6 80%);
          color:#2d2a26;
        }
        #comments-list {
          list-style:none;
          margin:0 0 1em 0;
          padding:0;
        }
        .comment {
          background:rgba(255,255,255,0.6);
          border:1.5px solid #b89c6b;
          padding:1em 1.1em;
          margin-bottom:1.1em;
          border-radius:6px;
          box-shadow:0 1px 6px #e6e0d6;
          position:relative;
          font-family:'Georgia', Times New Roman, Times, serif;
        }
        .comment .author {
          display:block;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          font-size:1.05em;
          color:#b89c6b;
          margin-bottom:.3em;
          font-style:italic;
        }
        .comment .text {
          margin:.3em 0;
          font-size:1.08em;
          color:#2d2a26;
          font-family:'Georgia', Times New Roman, Times, serif;
        }
        .comment .time {
          font-size:.92em;
          color:#b89c6b;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
          font-style:italic;
        }
        .char-count {
          text-align:right;
          color:#b89c6b;
          font-size:0.95em;
          font-family:'Playfair Display', Georgia, Times New Roman, Times, serif;
        }
        /* 8-bit pixel border for terminal */
        .pixel-border {
          border: 4px solid #b89c6b;
          border-radius: 0;
          box-shadow: 0 0 0 2px #ece7df, 0 0 0 6px #b89c6b;
        }
        /* Terminal blinking cursor animation */
        .blinking-cursor {
          display:inline-block;
          width:0.7em;
          height:1.1em;
          background:#b89c6b;
          margin-left:0.2em;
          vertical-align:middle;
          animation: blink 1s steps(1) infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (max-width: 600px) {
          .terminal { padding:1.1em 0.3em 1.2em 0.3em; }
          .terminal-title { font-size:1.2em; }
        }
      `}</style>
      <nav style={{
        width: '100%',
        background: 'rgba(255,255,255,0.7)',
        borderBottom: '2px solid #b89c6b',
        boxShadow: '0 1px 8px #e6e0d6',
        padding: '1.1em 0',
        marginBottom: '2em',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        fontFamily: 'Playfair Display, Georgia, Times New Roman, Times, serif',
        fontStyle: 'italic',
        fontSize: '1.1em',
      }}>
        <a href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank">
          ⬅ Back to my profile
        </a>
      </nav>
      <main style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="comment-rules">
          <ul>
            <li>Give your feedback here! Just avoid commenting on things that break JanitorAI's rules. Breaking this rule will cause me to delete your comment.</li>
          </ul>
        </div>
        <section className="terminal pixel-border">
          <div className="terminal-title">Add a Comment <span className="blinking-cursor" /></div>
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
        <section className="terminal pixel-border">
          <div className="terminal-title">Comments <span className="blinking-cursor" /></div>
          <ul id="comments-list">
            {comments.length === 0
              ? <p style={{ color: '#b89c6b', textAlign: 'center', fontFamily: 'Playfair Display, Georgia, Times New Roman, Times, serif', fontStyle: 'italic' }}>Be the first to comment!</p>
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
