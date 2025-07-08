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
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    setSubmitting(true);
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
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 2000);
    setSubmitting(false);
  };

  return (
    <div className="cozy-bg">
      <header className="header">
        <a href="#" className="back-btn">
          <span className="arrow">&#8592;</span> Back to Profile
        </a>
        <h1 className="site-title">
          <span className="coffee-icon">&#9749;</span> Cozy Coffee Comment Corner
        </h1>
      </header>
      <main className="main-content">
        <section className="intro">
          <h2>Share Your Thoughts</h2>
          <p>
            "A good conversation is like a perfect cup of coffee - rich, warm, and never rushed."<br />
            Pour yourself a cup and join our fireside chat. No login required - just your name and thoughts.
          </p>
          <div className="badges">
            <span className="badge">Cozy Atmosphere</span>
            <span className="badge">Friendly Chat</span>
            <span className="badge">Always Brewing</span>
          </div>
        </section>
        <section className="comment-form-section">
          <h3>Leave a Comment</h3>
          <form className="comment-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Your Name</label>
            <input type="text" id="name" required maxLength={30}
              placeholder="e.g., Coffee Lover"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <label htmlFor="comment">Your Comment</label>
            <textarea id="comment" rows={4} required maxLength={MAX_CHARS}
              placeholder="Share your thoughts..."
              ref={textareaRef}
              value={message}
              onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
            />
            <div className="char-count">{charCount}/{MAX_CHARS}</div>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitSuccess ? 'Comment Posted!' : 'Post Comment'}
            </button>
          </form>
        </section>
        <section className="comments-section">
          <h3>Recent Conversations</h3>
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">Be the first to comment!</p>
            ) : (
              comments.map((c, i) => (
                <div key={c.id || c.created_at || i} className="comment-card">
                  <div className="comment-avatar">
                    <span role="img" aria-label="user">👤</span>
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{c.name}</span>
                      <span className="comment-time">{getTimeAgo(c.created_at)}</span>
                    </div>
                    <div className="comment-text">{c.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <footer className="footer">
        <p>Made with <span className="footer-heart">&#10084;</span> and <span className="footer-coffee">&#9749;</span></p>
        <p>© 2025 Cozy Coffee Comment Corner. All thoughts welcome.</p>
      </footer>
      <style jsx global>{`
        body, html, #__next { min-height: 100vh; margin: 0; padding: 0; }
        .cozy-bg {
          min-height: 100vh;
          background: #f5f0e6 url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4c4a8' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          font-family: 'Garamond', serif;
        }
        .header {
          background: #f5f0e6;
          box-shadow: 0 4px 20px rgba(109, 76, 50, 0.1);
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .back-btn {
          background: #6d4c32;
          color: #f5f0e6;
          border-radius: 999px;
          padding: 10px 24px;
          text-decoration: none;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.1em;
          display: flex;
          align-items: center;
          transition: background 0.3s;
        }
        .back-btn:hover { background: #553c29; }
        .arrow { font-size: 1.3em; margin-right: 8px; }
        .site-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2em;
          color: #3d2c1f;
          font-style: italic;
          display: flex;
          align-items: center;
        }
        .coffee-icon { color: #6d4c32; margin-right: 16px; animation: float 6s ease-in-out infinite; }
        .main-content { max-width: 800px; margin: 32px auto; padding: 0 16px; }
        .intro { text-align: center; margin-bottom: 48px; }
        .intro h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 2.5em; color: #a27b56; margin-bottom: 12px; }
        .intro p { color: #a27b56; font-size: 1.2em; margin-bottom: 18px; }
        .badges { display: flex; justify-content: center; gap: 16px; }
        .badge { background: #ede6db; color: #6d4c32; padding: 6px 18px; border-radius: 999px; font-size: 0.95em; }
        .comment-form-section { background: #f5f0e6; border-radius: 18px; box-shadow: 0 4px 20px rgba(109, 76, 50, 0.1); padding: 36px 32px; margin-bottom: 48px; }
        .comment-form-section h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 1.6em; color: #3d2c1f; margin-bottom: 18px; font-style: italic; }
        .comment-form { display: flex; flex-direction: column; gap: 12px; }
        .comment-form label { color: #6d4c32; font-weight: 500; margin-bottom: 4px; }
        .comment-form input, .comment-form textarea {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: 1px solid #d4c4a8;
          background: #fff;
          color: #3d2c1f;
          font-size: 1em;
          font-family: 'Garamond', serif;
          margin-bottom: 4px;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .comment-form input:focus, .comment-form textarea:focus {
          border: 1.5px solid #a27b56;
          outline: none;
          box-shadow: 0 0 0 2px #d4c4a8;
        }
        .char-count { text-align: right; color: #a27b56; font-size: 0.95em; margin-bottom: 8px; }
        .submit-btn {
          background: #6d4c32;
          color: #f5f0e6;
          border: none;
          border-radius: 999px;
          padding: 12px 32px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.1em;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }
        .submit-btn:hover { background: #553c29; transform: translateY(-2px) scale(1.03); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .comments-section { margin-bottom: 48px; }
        .comments-section h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 2em; color: #3d2c1f; text-align: center; margin-bottom: 32px; font-style: italic; }
        .comments-list { display: flex; flex-direction: column; gap: 32px; }
        .no-comments { text-align: center; color: #a27b56; }
        .comment-card {
          display: flex;
          background: #ede6db;
          border-radius: 18px;
          box-shadow: 0 4px 20px rgba(109, 76, 50, 0.08);
          padding: 24px 20px;
          align-items: flex-start;
          gap: 18px;
          position: relative;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .comment-card:hover { box-shadow: 0 12px 32px rgba(109, 76, 50, 0.18); transform: translateY(-4px) scale(1.01); }
        .comment-avatar {
          width: 48px; height: 48px;
          background: #d4c4a8;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2em;
          color: #6d4c32;
          box-shadow: 0 2px 8px rgba(109, 76, 50, 0.08) inset;
          flex-shrink: 0;
        }
        .comment-body { flex: 1; }
        .comment-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .comment-author { font-family: 'Playfair Display', Georgia, serif; font-size: 1.1em; color: #3d2c1f; font-style: italic; }
        .comment-time { color: #a27b56; font-size: 0.95em; margin-left: 12px; }
        .comment-text { color: #6d4c32; font-size: 1.08em; margin-bottom: 0; }
        .footer {
          background: #f5f0e6;
          color: #6d4c32;
          text-align: center;
          padding: 32px 0 18px 0;
          border-top: 1px solid #d4c4a8;
          font-size: 1.1em;
        }
        .footer-heart { color: #a27b56; }
        .footer-coffee { color: #6d4c32; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
      `}</style>
    </div>
  );
}
