import React, { useState, useEffect } from 'react';
import { FileText, Save, Search, Trash2, Clock, User, Plus, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NOTES_KEY = 'yfj_notes';

function getNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export default function NotesPanel() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotes(getNotes()); }, []);

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const newNote = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
  };

  const openNote = (note) => {
    setActiveNote(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const saveNote = () => {
    const all = getNotes();
    if (activeNote) {
      const updated = all.map(n => n.id === activeNote ? { ...n, title, content, updatedAt: new Date().toISOString() } : n);
      saveNotes(updated);
      setNotes(updated);
    } else {
      const newN = {
        id: Date.now().toString(),
        title: title || 'Untitled Note',
        content,
        author: currentUser?.fullName || currentUser?.email || 'Unknown',
        role: currentUser?.role || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newN, ...all];
      saveNotes(updated);
      setNotes(updated);
      setActiveNote(newN.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteNote = (id) => {
    const updated = getNotes().filter(n => n.id !== id);
    saveNotes(updated);
    setNotes(updated);
    if (activeNote === id) newNote();
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-2">Secretary's Workspace</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Notes & Records</h2>
          <p className="text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        <button onClick={newNote} className="btn-primary">
          <Plus size={14} /> New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes list */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col" style={{maxHeight: 'calc(100vh - 220px)'}}>
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                className="yfj-input pl-9 text-sm"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-white/25">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notes yet. Create one!</p>
              </div>
            )}
            {filtered.map(note => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={`w-full text-left p-4 transition-all group hover:bg-white/[0.03] ${activeNote === note.id ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-white truncate">{note.title || 'Untitled Note'}</p>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-xs text-white/35 truncate mb-2">{note.content.slice(0, 60)}{note.content.length > 60 ? '...' : ''}</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-white/25">
                    <User size={10} /> {note.author}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Clock size={10} /> {formatDate(note.updatedAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="section-card p-6 flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="section-header-icon gemini-gradient">
                <FileText size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <input
                  className="w-full bg-transparent border-none outline-none text-2xl font-black text-white placeholder:text-white/15 tracking-tight"
                  placeholder="Note Title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
            </div>

            {activeNote && (() => {
              const note = notes.find(n => n.id === activeNote);
              return note ? (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-[11px] text-white/35">
                    <User size={11} />
                    <span className="font-semibold text-white/50">{note.author}</span>
                    {note.role && <span className="badge badge-purple">{note.role}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/30">
                    <Clock size={11} />
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ) : null;
            })()}

            <textarea
              className="yfj-textarea w-full"
              style={{ minHeight: '380px' }}
              placeholder={`Begin your notes here...\n\nAttendance, discussions, action items — everything goes here.\nThe AI Report Suite can compile these into a professional report.`}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/25 font-mono">{content.length} characters · {content.split(/\s+/).filter(Boolean).length} words</p>
            <button
              onClick={saveNote}
              disabled={!title && !content}
              className="btn-primary"
            >
              {saved ? (
                <><span className="text-green-300">✓</span> Saved!</>
              ) : (
                <><Save size={14} /> Save Note</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
