import React, { useState, useEffect } from 'react';
import { X, Bell, Cross } from 'lucide-react';

export default function GreetingsToast({ announcement, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const duration = 9000;
    const tick = 100;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += tick;
      setProgress(100 - (elapsed / duration) * 100);
      if (elapsed >= duration) { clearInterval(interval); handleClose(); }
    }, tick);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 400);
  };

  return (
    <div
      className="fixed z-[9999] inset-x-0 flex justify-center pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)', padding: '0 16px' }}
    >
      <div
        className="pointer-events-auto w-full max-w-sm"
        style={{
          transform: visible && !exiting ? 'translateY(0)' : exiting ? 'translateY(-120%)' : 'translateY(-120%)',
          opacity: visible && !exiting ? 1 : 0,
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(10,14,24,0.97)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(155,114,243,0.4)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(155,114,243,0.15) inset',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, #4285f4, #9b72f3, #d96570)',
              transformOrigin: 'left center',
              width: `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4285f4,#9b72f3,#d96570)', backgroundSize: '200% auto' }}
              >
                <Bell size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-black text-sm mb-0.5"
                  style={{ color: '#b899ff', fontStyle: 'italic' }}
                >
                  Greetings Brethren,
                </p>
                <p className="text-sm font-black text-white leading-snug mb-1 truncate">
                  {announcement.title}
                </p>
                {announcement.content && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {announcement.content}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(155,114,243,0.2)', color: '#b899ff', border: '1px solid rgba(155,114,243,0.3)' }}
                  >
                    {announcement.category || 'General'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {announcement.author}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
