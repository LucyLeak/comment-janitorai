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

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit[0]}`;
    }
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

  const theme = {
    primary: '#4F46E5',
    secondary: 'rgba(255, 255, 255, 0.05)',
    background: '#0F172A',
    text: '#E2E8F0',
    accent: '#EF4444',
    font: 'Inter, sans-serif',
    blur: 'blur(10px)',
  };

  // Auto-expansão do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Carrega comentários do backend
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch('/api/comments.json');
        const data = await res.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Erro ao buscar comentários:', err);
      }
    }
    fetchComments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim().slice(0, 30);
    const trimmedMessage = message.trim().slice(0, MAX_CHARS);
    if (!trimmedName || !trimmedMessage) return;

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, message: trimmedMessage }),
      });
      // Recarrega comentários após postar
      const res = await fetch('/api/comments.json');
      const data = await res.json();
      setComments(data.comments || []);
      setName('');
      setMessage('');
      setCharCount(0);
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
    }
  };

  return (
    <div style={{ backgroundColor: theme.background, minHeight: '100vh', paddingBottom: '4rem' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        html, body { margin: 0; padding: 0; font-family: ${theme.font}; color: ${theme.text}; }
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; transition: all 0.2s ease; }
        input, textarea { font-family: inherit; background: ${theme.secondary}; border: 1px solid rgba(255,255,255,0.1);
          color: ${theme.text}; border-radius: 8px; padding: 0.75rem; width: 100%; outline: none; resize: none; }
      `}</style>

      <header style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: theme.blur,
        padding: '1.5rem', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: theme.primary, margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>💬 Lucy's profile comments</h1>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <section style={{ backgroundColor: theme.secondary, borderRadius: '16px', padding: '2rem', marginBottom: '2rem', backdropFilter: theme.blur, border: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Your name:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={30} required />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Comment:</label>
              <textarea ref={textareaRef} value={message} onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
                maxLength={MAX_CHARS} style={{ minHeight: '120px', overflowY: 'hidden' }} rows="1" required />
              <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.5rem' }}>{charCount}/{MAX_CHARS}</div>
            </div>
            <button type="submit" style={{ background: `linear-gradient(145deg, ${theme.primary}, #4338CA)`, color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', width: '100%', fontWeight: 600, fontSize: '1rem' }}>Add comment</button>
          </form>
        </section>

        <section>
          {comments.length === 0 ? (
            <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Be the first to comment!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id || comment.created_at} style={{ backgroundColor: theme.secondary, borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', backdropFilter: theme.blur, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ color: theme.text, margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{comment.name}</h3>
                      <span style={{ color: '#64748B', fontSize: '0.875rem' }}>{getTimeAgo(comment.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, color: '#94A3B8', lineHeight: 1.5 }}>{comment.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}