import { useState, useEffect, useRef } from 'react';
import bcrypt from 'bcryptjs';

const getTimeAgo = (timestamp) => {
  if (typeof window === 'undefined') return '';
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    ano: 31536000,
    mês: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit[0]}`;
    }
  }
  return 'Agora';
};

export default function Home() {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const textareaRef = useRef(null);

  const MAX_CHARS = 100;
  
  const theme = {
    primary: '#4F46E5',
    secondary: 'rgba(255, 255, 255, 0.05)',
    background: '#0F172A',
    text: '#E2E8F0',
    accent: '#EF4444',
    font: 'Inter, sans-serif',
    blur: 'blur(10px)'
  };

  // Auto-expansão do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    setIsMounted(true);
    
    const savedComments = localStorage.getItem('comments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }

    const savedHash = localStorage.getItem('adminHash');
    if (!savedHash) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('lucyferyn', salt);
      localStorage.setItem('adminHash', hash);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('comments', JSON.stringify(comments));
    }
  }, [comments, isMounted]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const savedHash = localStorage.getItem('adminHash');
    
    if (bcrypt.compareSync(adminPassword, savedHash)) {
      setAdminLoggedIn(true);
      setShowAdminLogin(false);
      setAdminPassword('Lucyfer');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim().slice(0, MAX_CHARS);
    const trimmedName = name.trim().slice(0, 30);
    
    if (!trimmedName || !trimmedMessage) return;

    const newComment = { 
      id: Date.now(), 
      name: trimmedName, 
      message: trimmedMessage,
      timestamp: new Date().toISOString()
    };

    setComments(prev => [newComment, ...prev].slice(0, 50));
    setName('');
    setMessage('');
  };

  const handleDelete = (id) => {
    if (adminLoggedIn) {
      setComments(prev => prev.filter(c => c.id !== id));
    }
  };

  if (!isMounted) {
    return (
      <div style={{
        backgroundColor: theme.background,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ color: theme.text }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: theme.background,
      minHeight: '100vh',
      paddingBottom: '4rem'
    }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: ${theme.font};
          color: ${theme.text};
        }
        
        * {
          box-sizing: border-box;
        }
        
        button {
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        input, textarea {
          font-family: inherit;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: ${theme.text};
          border-radius: 8px;
          padding: 0.75rem;
          width: 100%;
          outline: none;
          resize: none;
        }
      `}</style>

      <header style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: theme.blur,
        padding: '1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            color: theme.primary, 
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 600
          }}>
            💬 Comentários Lucy
          </h1>
          {!adminLoggedIn && (
            <button 
              onClick={() => setShowAdminLogin(true)}
              style={{
                background: `linear-gradient(145deg, ${theme.primary}, #4338CA)`,
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
              }}>
              Admin Login
            </button>
          )}
        </div>
      </header>

      <main style={{ 
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '0 1.5rem'
      }}>
        <section style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          backdropFilter: theme.blur,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>Seu Nome:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>Comentário:</label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                maxLength={MAX_CHARS}
                style={{
                  minHeight: '120px',
                  overflowY: 'hidden'
                }}
                rows="1"
                required
              />
              <div style={{ 
                textAlign: 'right', 
                fontSize: '0.875rem', 
                color: '#94A3B8',
                marginTop: '0.5rem'
              }}>
                {charCount}/{MAX_CHARS}
              </div>
            </div>

            <button
              type="submit"
              style={{
                background: `linear-gradient(145deg, ${theme.primary}, #4338CA)`,
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                width: '100%',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
              }}>
              Publicar Comentário
            </button>
          </form>
        </section>

        <section>
          {comments.length === 0 ? (
            <p style={{ 
              color: '#64748B',
              textAlign: 'center',
              padding: '2rem'
            }}>
              Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map(comment => (
              <div 
                key={comment.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  backdropFilter: theme.blur,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                  ':hover': {
                    transform: 'translateY(-2px)'
                  }
                }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ 
                        color: theme.text, 
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: 600
                      }}>
                        {comment.name}
                      </h3>
                      <span style={{
                        color: '#64748B',
                        fontSize: '0.875rem'
                      }}>
                        {getTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p style={{ 
                      margin: 0,
                      color: '#94A3B8',
                      lineHeight: 1.5
                    }}>
                      {comment.message}
                    </p>
                  </div>
                  {adminLoggedIn && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: theme.accent,
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        ':hover': {
                          background: 'rgba(239, 68, 68, 0.2)'
                        }
                      }}>
                      Deletar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {adminLoggedIn && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '1.5rem',
          borderRadius: '12px',
          backdropFilter: theme.blur,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{ 
            color: theme.primary, 
            margin: '0 0 1rem 0',
            fontSize: '1rem'
          }}>
            Painel Administrativo
          </h3>
          <div style={{ 
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setAdminLoggedIn(false)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: theme.accent,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 500
              }}>
              Sair
            </button>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: '2rem',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              color: theme.primary, 
              marginTop: 0,
              marginBottom: '1.5rem'
            }}>
              Acesso Administrativo
            </h3>
            <form onSubmit={handleAdminLogin}>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Digite a senha"
                style={{ marginBottom: '1.5rem' }}
                required
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    background: `linear-gradient(145deg, ${theme.primary}, #4338CA)`,
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    flex: 1,
                    fontWeight: 500
                  }}>
                  Acessar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: theme.text,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    flex: 1
                  }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}