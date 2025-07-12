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
      minHeight: '100vh',
      background: '#000',
      fontFamily: 'Fira Mono, Consolas, monospace',
      color: '#fff',
      paddingBottom: '4rem',
      letterSpacing: '0.01em',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* CRT scanlines and flicker */}
      <div style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.18,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #0f1a0f 3px, transparent 4px)',
        mixBlendMode: 'screen',
        animation: 'crt-flicker 1.2s infinite',
      }} />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&display=swap');
        body { margin:0; background:#000; }
        * { box-sizing:border-box; }
        a { color:#fff; text-decoration:underline; }
        a:hover { color:#fff; }
        #MainCore {
          background:#000;
          color:#fff;
        }
        .terminal {
          background:#000;
          border:2px solid #fff;
          border-radius:0;
          box-shadow:none;
          padding:2em 1.2em 1.2em 1.2em;
          margin:2em auto;
          max-width:700px;
          font-family:'Fira Mono', Consolas, monospace;
          position:relative;
          overflow:hidden;
          color:#fff;
        }
        .terminal-title {
          font-family:'Fira Mono', Consolas, monospace;
          font-size:1.5em;
          color:#fff;
          margin-bottom:0.7em;
          text-align:left;
          letter-spacing:0.04em;
          border-bottom:1px solid #fff;
          padding-bottom:0.3em;
          margin-left:0.1em;
        }
        .terminal-title .prompt {
          color:#fff;
          font-weight:bold;
          margin-right:0.3em;
        }
        .blinking-cursor {
          display:inline-block;
          width:0.7em;
          height:1.1em;
          background:#fff;
          margin-left:0.2em;
          vertical-align:middle;
          animation: blink 1s steps(1) infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes crt-flicker {
          0%, 100% { opacity: 0.18; }
          10% { opacity: 0.22; }
          20% { opacity: 0.15; }
          30% { opacity: 0.20; }
          40% { opacity: 0.16; }
          50% { opacity: 0.19; }
          60% { opacity: 0.17; }
          70% { opacity: 0.21; }
          80% { opacity: 0.16; }
          90% { opacity: 0.20; }
        }
        .comment-rules {
          background:#000;
          border:1px solid #fff;
          color:#fff;
          padding:1em 1.5em;
          margin:1.5em auto 2em;
          font-size:1.1em;
          border-radius:0;
          max-width:600px;
          font-family:'Fira Mono', Consolas, monospace;
        }
        .comment-rules ul { margin:0; padding-left:1.2em; }
        .comment-rules li { margin-bottom:.3em; }
        label {
          display:block;
          margin-bottom:.5em;
          font-weight:700;
          font-family:'Fira Mono', Consolas, monospace;
          color:#fff;
          font-size:1.1em;
        }
        input,textarea {
          width:100%;
          padding:1em;
          margin-bottom:1.1em;
          background:#000;
          border:1.5px solid #fff;
          color:#fff;
          border-radius:0;
          font-family:'Fira Mono', Consolas, monospace;
          font-size:1.1em;
          outline:none;
          box-shadow:none;
          transition: border 0.2s;
        }
        input:focus,textarea:focus {
          border:1.5px solid #fff;
          background:#111;
        }
        button {
          background:#fff;
          color:#000;
          border:none;
          padding:.8em 2em;
          font-family:'Fira Mono', Consolas, monospace;
          font-size:1.1em;
          border-radius:0;
          cursor:pointer;
          box-shadow:none;
          font-weight:700;
          letter-spacing:0.04em;
          margin-top:0.5em;
          transition: background 0.2s, color 0.2s;
        }
        button:hover {
          background:#222;
          color:#fff;
        }
        #comments-list {
          list-style:none;
          margin:0 0 1em 0;
          padding:0;
        }
        .comment {
          background:#000;
          border:1.5px solid #fff;
          padding:1em 1.1em;
          margin-bottom:1.1em;
          border-radius:0;
          box-shadow:none;
          position:relative;
          font-family:'Fira Mono', Consolas, monospace;
          color:#fff;
        }
        .comment .author {
          display:block;
          font-family:'Fira Mono', Consolas, monospace;
          font-size:1.15em;
          color:#fff;
          margin-bottom:.3em;
        }
        .comment .text {
          margin:.3em 0;
          font-size:1.15em;
          color:#fff;
          font-family:'Fira Mono', Consolas, monospace;
        }
        .comment .time {
          font-size:.98em;
          color:#fff;
          font-family:'Fira Mono', Consolas, monospace;
        }
        .char-count {
          text-align:right;
          color:#fff;
          font-size:0.95em;
          font-family:'Fira Mono', Consolas, monospace;
        }
        @media (max-width: 600px) {
          .terminal { padding:1.1em 0.3em 1.2em 0.3em; max-width:100vw; }
          .terminal-title { font-size:1.1em; }
          .comment-rules { max-width:98vw; padding:0.7em 0.5em; }
          #MainCore { padding-bottom:2em; }
          main { max-width:100vw !important; }
          .comment { padding:0.7em 0.3em; font-size:1em; }
          input,textarea { font-size:1em; padding:0.7em; }
          button { font-size:1em; padding:.7em 1.2em; }
        }
      `}</style>
      <nav style={{
        width: '100%',
        background: 'rgba(24,28,24,0.9)',
        borderBottom: '2px solid #00ff66',
        boxShadow: '0 1px 8px #00ff6620',
        padding: '1.1em 0',
        marginBottom: '2em',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        fontFamily: 'Fira Mono, Consolas, monospace',
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
        <section className="terminal">
          <div className="terminal-title"><span className="prompt">$</span> Add a Comment <span className="blinking-cursor" /></div>
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
        <section className="terminal">
          <div className="terminal-title"><span className="prompt">$</span> Comments <span className="blinking-cursor" /></div>
          <ul id="comments-list">
            {comments.length === 0
              ? <p style={{ color: '#00ff66', textAlign: 'center', fontFamily: 'Fira Mono, Consolas, monospace' }}>Be the first to comment!</p>
              : comments.map(c => (
                <li key={c.id || c.created_at} className="comment">
                  <span className="author">{c.name}
                    {c.liked_by_owner && (
                      <img src="/likedC.png" alt="Liked" style={{ width: 18, height: 18, marginLeft: 8, verticalAlign: 'middle' }} />
                    )}
                    {c.pinned && (
                      <img src="/pinned.png" alt="Pinned" style={{ width: 18, height: 18, marginLeft: 8, verticalAlign: 'middle', float: 'right' }} />
                    )}
                  </span>
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
