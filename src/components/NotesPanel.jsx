import React, { useState, useEffect } from 'react';
import { FileText, Save, Search, Trash2, BookOpen, PenLine, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const EMPTY = { title: '', summary: '', date: todayISO(), details: '' };

export default function NotesPanel() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'notes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [uid]);

  const filtered = notes.filter(n =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.summary || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.details || '').toLowerCase().includes(search.toLowerCase())
  );

  const startNew = () => { setActive(null); setForm({ ...EMPTY, date: todayISO() }); setIsNew(true); setSaved(false); };
  const openNote = (note) => {
    setActive(note.id);
    setForm({ title: note.title || '', summary: note.summary || '', date: note.date || todayISO(), details: note.details || '' });
    setIsNew(false); setSaved(false);
  };

  const saveNote = async () => {
    if (!uid) return;
    setSaving(true);
    const signedAt = new Date().toISOString();
    const signedBy = currentUser?.fullName || currentUser?.email || 'Unknown';
    const signedRole = currentUser?.role || '';
    const data = {
      title: form.title || 'Untitled',
      summary: form.summary,
      date: form.date,
      details: form.details,
      author: signedBy,
      role: signedRole,
      creatorRole: signedRole,
      signature: { signedBy, signedRole, signedAt },
      updatedAt: signedAt,
    };
    try {
      if (active && !isNew) {
        await updateDoc(doc(db, 'users', uid, 'notes', active), data);
      } else {
        const ref = await addDoc(collection(db, 'users', uid, 'notes'), {
          ...data, createdAt: serverTimestamp(),
        });
        setActive(ref.id); setIsNew(false);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const deleteNote = async (id, e) => {
    e?.stopPropagation();
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'notes', id));
    if (active === id) startNew();
  };

  const currentNote = notes.find(n => n.id === active);

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: '#9b72f3' }}>Secretary's Workspace</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Notes & Records</h2>
          <p className="text-xs md:text-sm italic mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>"I understood by the books..."</p>
        </div>
        <button onClick={startNew} className="btn-primary flex-shrink-0"><Plus size={14} /> New Note</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Notes list */}
        <div className="rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 'calc(100vh - 220px)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
              <input className="yfj-input pl-9 text-sm" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <BookOpen size={28} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>No notes yet.</p>
                <button onClick={startNew} className="text-xs mt-2" style={{ color: '#9b72f3' }}>Create the first one →</button>
              </div>
            )}
            {filtered.map(note => (
              <button key={note.id} onClick={() => openNote(note)}
                className="w-full text-left p-4 transition-all group"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: active === note.id ? 'rgba(155,114,243,0.08)' : 'transparent',
                  borderLeft: active === note.id ? '3px solid #9b72f3' : '3px solid transparent',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-black text-white truncate leading-tight">{note.title || 'Untitled'}</p>
                  <button onClick={e => deleteNote(note.id, e)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(217,101,112,0.15)', color: '#d96570' }}><Trash2 size={11} /></button>
                </div>
                {note.summary && <p className="text-xs mb-1.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{note.summary}</p>}
                <div className="flex items-center gap-3">
                  {note.date && <span className="text-[10px] font-bold" style={{ color: '#9b72f3' }}>{fmtDate(note.date)}</span>}
                  <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{note.author}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="section-card p-5 md:p-6">
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#9b72f3' }}>Title</label>
              <input className="w-full bg-transparent border-none outline-none font-black text-white placeholder:text-white/15 tracking-tight"
                style={{ fontSize: '22px' }} placeholder="Note title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#4285f4' }}>
                Summary <span style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>— one sentence</span>
              </label>
              <input className="yfj-input" placeholder="Brief one-sentence summary..." value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })} maxLength={200} />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#0dbfcf' }}>Date</label>
              <input type="date" className="yfj-input" style={{ maxWidth: '200px' }} value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#fbbc04' }}>Details</label>
              <textarea className="yfj-textarea w-full" style={{ minHeight: '240px' }}
                placeholder={"Full meeting notes...\n\nAttendance, discussions, decisions, action items."}
                value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
            </div>

            {/* Electronic Signature */}
            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(155,114,243,0.07)', border: '1px dashed rgba(155,114,243,0.2)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <PenLine size={13} style={{ color: '#9b72f3' }} />
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9b72f3' }}>Electronic Signature</p>
              </div>
              {!isNew && currentNote?.signature ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <span className="font-black text-white">{currentNote.signature.signedBy}</span>
                  {currentNote.signature.signedRole && (
                    <span className="ml-2 text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: 'rgba(155,114,243,0.2)', color: '#9b72f3' }}>{currentNote.signature.signedRole}</span>
                  )}
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}> — Signed {fmtDateTime(currentNote.signature.signedAt)}</span>
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Will be signed by <span className="font-bold text-white">{currentUser?.fullName || currentUser?.email || 'you'}</span> upon saving.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {form.details.length} chars · {form.details.split(/\s+/).filter(Boolean).length} words
              </p>
              <button onClick={saveNote} disabled={(!form.title && !form.details) || saving} className="btn-primary">
                {saving ? <><div className="spinner !w-4 !h-4" /> Saving...</> :
                  saved ? <><span style={{ color: '#34a853' }}>✓</span> Signed & Saved</> :
                    <><Save size={14} /> Sign & Save</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
