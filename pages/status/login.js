import { useState, useEffect } from 'react';

export default function StatusLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/status/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setOk(true);
      setPassword('');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Login failed');
    }
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
          margin: 0 auto;
          padding: 120px 10px 40px;
          min-height: 100vh;
          box-sizing: border-box;
          z-index: 2;
        }
        #holder {
          margin: 5px;
          width: 420px;
          max-width: 100%;
          padding: 10px;
          background: var(--panel);
          border: 1px solid var(--border);
          font-size: 14px;
        }
        h1 {
          color: var(--ink);
          font-size: 22px;
          text-align: center;
          font-family: 'smalle', "MS UI Gothic", sans-serif;
          margin: 10px 0 4px 0;
        }
        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 700;
          font-size: 14px;
        }
        input {
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
        .note { font-size: 12px; color: #4a4a4a; text-align: center; }
        .error { color: #a10000; font-size: 12px; }
      `}</style>
      <div className="container">
        <main id="holder">
          <h1>status login</h1>
          {ok ? (
            <p className="note">Logged in! Open the status page.</p>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="off">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <div className="error">{error}</div>}
              <button type="submit">Login</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
