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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f0e6', fontFamily: 'Garamond, serif' }}>
      {/* Coffee stains for decoration */}
      <div className="coffee-stain top-10 left-10 w-24 h-24 rounded-full bg-coffee-500" style={{position:'absolute',opacity:0.1,zIndex:-1}}></div>
      <div className="coffee-stain top-20 right-20 w-32 h-32 rounded-full bg-coffee-400" style={{position:'absolute',opacity:0.1,zIndex:-1}}></div>
      <div className="coffee-stain bottom-20 left-1/3 w-20 h-20 rounded-full bg-coffee-300" style={{position:'absolute',opacity:0.1,zIndex:-1}}></div>

      {/* Header */}
      <header className="parchment-bg py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <a href="#" className="btn-coffee bg-coffee-600 hover:bg-coffee-700 text-parchment font-heading py-2 px-4 rounded-full flex items-center transition-all duration-300">
            <i className="fas fa-arrow-left mr-2"></i> Back to Profile
          </a>
          <h1 className="text-3xl font-heading italic text-coffee-800 flex items-center">
            <i className="fas fa-mug-hot mr-3 text-coffee-600 floating"></i>
            Cozy Coffee Comment Corner
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12 animate-in">
          <h2 className="text-4xl font-heading italic text-coffee-700 mb-4">Share Your Thoughts</h2>
          <p className="text-coffee-600 text-xl max-w-2xl mx-auto leading-relaxed">
            "A good conversation is like a perfect cup of coffee - rich, warm, and never rushed."<br />
            Pour yourself a cup and join our fireside chat. No login required - just your name and thoughts.
          </p>
          <div className="mt-6 flex justify-center space-x-4 animate-in animate-delay-1">
            <span className="inline-block bg-coffee-100 text-coffee-700 px-3 py-1 rounded-full text-sm">
              <i className="fas fa-leaf mr-1"></i> Cozy Atmosphere
            </span>
            <span className="inline-block bg-coffee-100 text-coffee-700 px-3 py-1 rounded-full text-sm">
              <i className="fas fa-comments mr-1"></i> Friendly Chat
            </span>
            <span className="inline-block bg-coffee-100 text-coffee-700 px-3 py-1 rounded-full text-sm">
              <i className="fas fa-mug-hot mr-1"></i> Always Brewing
            </span>
          </div>
        </div>

        {/* Comment Form */}
        <div className="parchment-bg rounded-2xl p-8 mb-12 shadow-lg animate-in">
          <h3 className="text-2xl font-heading italic text-coffee-800 mb-6">Leave a Comment</h3>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-coffee-700 mb-2 font-medium">Your Name</label>
              <input type="text" id="name" required maxLength={30}
                className="w-full px-4 py-3 rounded-lg border border-coffee-300 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white text-coffee-800 placeholder-coffee-400 transition-all"
                placeholder="e.g., Coffee Lover"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="comment" className="block text-coffee-700 mb-2 font-medium">Your Comment</label>
              <textarea id="comment" rows={4} required maxLength={MAX_CHARS}
                className="w-full px-4 py-3 rounded-lg border border-coffee-300 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white text-coffee-800 placeholder-coffee-400 transition-all"
                placeholder="Share your thoughts..."
                ref={textareaRef}
                value={message}
                onChange={e => { setMessage(e.target.value); setCharCount(e.target.value.length); }}
              />
              <div className="text-right text-coffee-400 text-xs mt-1">{charCount}/{MAX_CHARS}</div>
            </div>
            <button type="submit" className={`btn-coffee bg-coffee-600 hover:bg-coffee-700 text-parchment font-heading py-3 px-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 ${submitting ? 'opacity-60 pointer-events-none' : ''}`}
              disabled={submitting}
            >
              {submitSuccess ? <><i className="fas fa-check mr-2"></i> Comment Posted!</> : <><i className="fas fa-paper-plane mr-2"></i> Post Comment</>}
            </button>
          </form>
        </div>

        {/* Comments Section */}
        <div className="mb-12">
          <h3 className="text-3xl font-heading italic text-coffee-800 mb-8 text-center">Recent Conversations</h3>
          <div id="commentsContainer" className="space-y-8">
            {comments.length === 0 ? (
              <p className="text-center text-coffee-400">Be the first to comment!</p>
            ) : (
              comments.map((c, i) => (
                <div key={c.id || c.created_at || i} className="comment-card parchment-bg rounded-2xl p-6 shadow-md animate-in">
                  <div className="flex items-start">
                    <div className="bg-coffee-200 text-coffee-800 rounded-full w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0 shadow-inner">
                      <i className="fas fa-user text-xl"></i>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-heading italic text-coffee-800">{c.name}</h4>
                        <span className="text-coffee-500 text-sm">{getTimeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-coffee-700 mb-4">{c.message}</p>
                      {/* Actions (like/reply) can be implemented here if needed */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="parchment-bg py-6 text-center text-coffee-700 border-t border-coffee-200">
        <div className="container mx-auto">
          <p className="mb-2">Made with <i className="fas fa-heart text-coffee-500"></i> and <i className="fas fa-coffee text-coffee-600"></i></p>
          <p>© 2025 Cozy Coffee Comment Corner. All thoughts welcome.</p>
        </div>
      </footer>
      {/* Tailwind and FontAwesome CDN links for Next.js _document.js or Head */}
      <style jsx global>{`
        body { background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4c4a8' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E"); }
        .parchment-bg { background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4c4a8' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E"); box-shadow: 0 4px 20px rgba(109, 76, 50, 0.1); }
        .coffee-stain { position: absolute; opacity: 0.1; z-index: -1; }
        .comment-card { transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1); transform-origin: top center; position: relative; overflow: hidden; }
        .comment-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(210,180,140,0.1) 0%, rgba(255,255,255,0) 60%); z-index: 0; transition: all 0.6s ease; opacity: 0; }
        .comment-card:hover { transform: translateY(-5px) rotate(0.5deg); box-shadow: 0 15px 30px rgba(109, 76, 50, 0.2); }
        .comment-card:hover::before { opacity: 1; }
        .animate-in { animation: fadeIn 0.8s cubic-bezier(0.39, 0.575, 0.565, 1) forwards; }
        .animate-delay-1 { animation-delay: 0.1s; }
        .animate-delay-2 { animation-delay: 0.2s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px) rotate(1deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }
        @keyframes rustle { 0% { transform: rotate(0deg); } 25% { transform: rotate(1deg); } 50% { transform: rotate(-1deg); } 75% { transform: rotate(0.5deg); } 100% { transform: rotate(0deg); } }
        .rustle { animation: rustle 4s ease-in-out infinite; }
        .btn-coffee { transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 4px 15px rgba(109, 76, 50, 0.3); position: relative; overflow: hidden; }
        .btn-coffee::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: all 0.7s ease; }
        .btn-coffee:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 8px 20px rgba(109, 76, 50, 0.4); }
        .btn-coffee:hover::before { left: 100%; }
        .btn-coffee:active { transform: translateY(1px) scale(0.98); box-shadow: 0 2px 5px rgba(109, 76, 50, 0.2); }
        .floating { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
      `}</style>
    </div>
  );
}
