import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, Plus, Pin, Trash2, X, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const CATEGORY_COLORS = {
  'General': 'badge-blue',
  'Kingdom Activity': 'badge-purple',
  'Urgent': 'badge-coral',
  'Events': 'badge-teal',
  'Leadership': 'badge-yellow',
};

const ALL_NOTIFY_ROLES = ['All', 'YFJ Chair', 'TC', 'Deacon', 'RC', 'EY', 'YFJ'];

export default function AnnouncementsPanel() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', pinned: false, notifyRoles: ['All'] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const toggleNotifyRole = (role) => {
    if (role === 'All') { setForm(f => ({ ...f, notifyRoles: ['All'] })); return; }
    setForm(f => {
      const cur = f.notifyRoles.filter(r => r !== 'All');
      return cur.includes(role) ? { ...f, notifyRoles: cur.filter(r => r !== role) || ['All'] }
        : { ...f, notifyRoles: [...cur, role] };
    });
  };

  const add = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        pinned: form.pinned,
        notifyRoles: form.notifyRoles.length ? form.notifyRoles : ['All'],
        author: currentUser?.fullName || currentUser?.email || 'System',
        role: currentUser?.role || '',
        createdAt: serverTimestamp(),
      });
      setForm({ title: '', content: '', category: 'General', pinned: false, notifyRoles: ['All'] });
      setShowForm(false);
    } catch {}
    setSaving(false);
  };

  const remove = async (id) => {
    try { await deleteDoc(doc(db, 'announcements', id)); } catch {}
  };

  const togglePin = async (id, current) => {
    try { await updateDoc(doc(db, 'announcements', id), { pinned: !current }); } catch {}
  };

  const sorted = [...announcements].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const formatDate = (val) => {
    if (!val) return '';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-400 mb-2">Communication Board</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Announcements</h2>
          <p className="text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={14} /> Post Announcement
        </button>
      </div>

      {/* Announcement form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(4,8,15,0.88)', backdropFilter: 'blur(12px)' }}>
          <div className="section-card p-7 w-full max-w-lg animate-slide-up my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Post Announcement</h3>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Title *</label>
                <input className="yfj-input" placeholder="Announcement title..." value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Details</label>
                <textarea className="yfj-textarea" rows={4} placeholder="Full details of the announcement..."
                  value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">Category</label>
                  <select className="yfj-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setForm({ ...form, pinned: !form.pinned })}
                      className={`w-10 h-6 rounded-full transition-all relative ${form.pinned ? 'bg-purple-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.pinned ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-xs font-bold text-white/60">Pin to top</span>
                  </label>
                </div>
              </div>

              {/* Notify roles */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                  Notify — select who receives this alert
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_NOTIFY_ROLES.map(role => {
                    const active = form.notifyRoles.includes(role);
                    return (
                      <button key={role} type="button" onClick={() => toggleNotifyRole(role)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                        style={active
                          ? { background: 'linear-gradient(135deg,#4285f4,#9b72f3)', color: 'white' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }
                        }>
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={add} disabled={saving || !form.title.trim()} className="btn-primary flex-1">
                  {saving ? <><div className="spinner !w-3.5 !h-3.5" /> Posting...</> : 'Post Announcement'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live ticker */}
      {announcements.length > 0 && (
        <div className="mb-8 glass-panel rounded-2xl overflow-hidden">
          <div className="flex items-center">
            <div className="flex-shrink-0 px-5 py-3 gemini-gradient flex items-center gap-2">
              <Megaphone size={14} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
            </div>
            <div className="ticker-wrapper px-6 py-3 flex-1">
              <div className="ticker-content">
                {[...sorted, ...sorted].map((a, i) => (
                  <span key={i} className="text-sm text-white/60 pr-16">
                    <span className="text-white/90 font-semibold">{a.title}</span>
                    {a.content && <span> — {a.content.slice(0, 60)}{a.content.length > 60 ? '…' : ''}</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="section-card p-16 text-center">
          <Megaphone size={48} className="mx-auto mb-4 text-white/15" />
          <p className="text-white/30 text-sm">No announcements posted yet.</p>
          <p className="text-white/20 text-xs mt-1">Click "Post Announcement" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(a => (
            <div key={a.id} className={`announcement-card group ${a.pinned ? 'pinned' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {a.pinned && <span className="badge badge-yellow"><Pin size={8} /> Pinned</span>}
                    <span className={`badge ${CATEGORY_COLORS[a.category] || 'badge-blue'}`}>{a.category}</span>
                    <h3 className="text-base font-black text-white">{a.title}</h3>
                  </div>
                  {a.content && <p className="text-sm text-white/60 leading-relaxed mb-3">{a.content}</p>}
                  <div className="flex items-center gap-4 text-[11px] text-white/30">
                    <span className="flex items-center gap-1.5"><User size={10} /> {a.author} {a.role && `· ${a.role}`}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={10} /> {formatDate(a.createdAt)}</span>
                    {a.notifyRoles && !a.notifyRoles.includes('All') && (
                      <span className="flex items-center gap-1" style={{ color: '#9b72f3' }}>
                        <Megaphone size={9} /> {a.notifyRoles.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => togglePin(a.id, a.pinned)} title={a.pinned ? 'Unpin' : 'Pin'}
                    className="p-2 rounded-lg bg-white/5 hover:bg-yellow-500/15 hover:text-yellow-400 text-white/30 transition-all">
                    <Pin size={14} />
                  </button>
                  <button onClick={() => remove(a.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-white/30 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
