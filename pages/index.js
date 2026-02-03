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
    <div id="MainCore" className="crt">
      <style jsx global>{`
        @font-face {
          font-family: 'smalle';
          src: url(https://files.catbox.moe/5vgwr0.ttf) format('truetype');
        }
        :root {
          --panel: #d4d4d4;
          --panel-lite: #f2f2f2;
          --ink: #303030;
          --border: #000;
          --grid: #969696;
          --link: #0400ff;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background-image: url(background.gif);
          background-color: #f0efed;
          overflow-y: scroll;
          cursor: url(https://cur.cursors-4u.net/mechanics/mec-5/mec443.cur), auto;
          font-family: "MS UI Gothic", "MS PGothic", sans-serif;
          color: var(--ink);
        }
        a { color: var(--link); text-decoration: underline; }
        h1 {
          color: var(--ink);
          font-size: 24px;
          text-align: center;
          font-family: 'smalle', "MS UI Gothic", sans-serif;
          margin: 10px 0 4px 0;
        }
        hr {
          display: block;
          margin: 0.5em auto;
          color: gray;
          overflow: hidden;
          border-style: inset;
          border-width: 1px;
        }
        .crt::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 2px, 3px 100%;
          z-index: 1;
          pointer-events: none;
        }
        .container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 10px;
          margin: 0 auto;
          padding: 170px 10px 40px;
          min-height: 100vh;
          box-sizing: border-box;
          z-index: 2;
        }
        .header {
          position: absolute;
          top: 0;
          left: 50%;
          margin-top: 10px;
          transform: translateX(-50%);
          width: 1050px;
          max-width: calc(100% - 20px);
          height: 150px;
          background-color: var(--panel);
          border: 1px solid var(--border);
          background-image: url(https://kaththingy.neocities.org/ImgStorage/background.jpg);
          background-position: 50%;
        }
        #Left-column {
          margin: 3px;
          width: 180px;
          padding: 10px;
          background-image: url(https://kaththingy.neocities.org/ImgStorage/halftone_1768490195.png);
          background-size: 150px;
          background-color: var(--panel);
          border: 1px solid var(--border);
          font-size: 14px;
          line-height: 1.4;
          word-break: break-word;
        }
        .MenuBox {
          border: 1px solid #5e5e5e;
          background: var(--panel-lite);
          margin-top: -6px;
          padding: 6px;
        }
        #Left-column .styled-link {
          display: block;
          padding: 4px 0 4px 4px;
          color: #000;
          background-color: var(--panel-lite);
          text-decoration: none;
        }
        #holder {
          margin: 5px;
          width: 680px;
          max-width: 100%;
          padding: 10px;
          background: var(--panel);
          border: 1px solid var(--border);
          font-size: 14px;
        }
        .panel-title {
          font-family: 'smalle', "MS UI Gothic", sans-serif;
          font-size: 20px;
          margin: 2px 0 8px;
          text-align: center;
        }
        .comment-rules {
          border: 1px solid var(--grid);
          padding: 8px;
          background: #efefef;
          margin-bottom: 10px;
        }
        .comment-rules ul { margin: 0; padding-left: 18px; }
        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 700;
          font-size: 14px;
        }
        input, textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 8px;
          background: #fff;
          border: 1px solid #5e5e5e;
          color: #000;
          font-family: "MS UI Gothic", "MS PGothic", sans-serif;
          font-size: 14px;
          outline: none;
        }
        input:focus, textarea:focus {
          border-color: #000;
          background: #f7f7f7;
        }
        button {
          padding: 4px 18px;
          background: var(--panel-lite);
          color: #000;
          border: 1px solid #000;
          font-family: "MS UI Gothic", "MS PGothic", sans-serif;
          cursor: pointer;
          border-color: #5e5e5e;
          box-shadow: inset 13px 0px 6px -10px rgba(66, 66, 66, 0.2),
            inset -13px 0px 6px -10px rgba(66, 66, 66, 0.56),
            inset 0px 13px 6px -10px #ffffff,
            inset 0px -13px 6px -10px rgba(66, 66, 66, 0.38);
        }
        #comments-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .comment {
          border: 1px solid var(--grid);
          padding: 8px;
          margin-bottom: 8px;
          background: #f7f7f7;
        }
        .comment .author {
          display: block;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .comment .text {
          margin: 4px 0;
        }
        .comment .time {
          font-size: 12px;
          color: #4a4a4a;
        }
        .char-count {
          text-align: right;
          font-size: 12px;
          color: #4a4a4a;
        }
        .empty-note {
          text-align: center;
          color: #4a4a4a;
          margin: 8px 0 0;
        }
        @media (max-width: 900px) {
          .container { flex-direction: column; align-items: center; padding-top: 190px; }
          #Left-column { width: 95%; max-width: 520px; }
          #holder { width: 95%; }
          .header { height: 120px; }
        }
      `}</style>
      <div className="header" />
      <div className="container">
        <aside id="Left-column">
          <div className="MenuBox">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>main</div>
            <a className="styled-link" href="https://kaththingy.neocities.org/about" target="_blank">about</a>
            <a className="styled-link" href="https://kaththingy.neocities.org/comments" target="_blank">comments</a>
            <a className="styled-link" href="https://janitorai.com/profiles/9e8fb842-fd61-48b4-91cd-c9ff573a4274_profile-of-lucyleak" target="_blank">janitorai</a>
          </div>
        </aside>
        <main id="holder">
          <h1>comments</h1>
          <hr />
          <div className="comment-rules">
            <ul>
              <li>Give your feedback here! Just avoid commenting on things that break JanitorAI's rules. Breaking this rule will cause me to delete your comment.</li>
            </ul>
          </div>
          <section>
            <div className="panel-title">Add a Comment</div>
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
          <hr />
          <section>
            <div className="panel-title">Comments</div>
            <ul id="comments-list">
              {comments.length === 0
                ? <p className="empty-note">Be the first to comment!</p>
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
    </div>
  );
}
