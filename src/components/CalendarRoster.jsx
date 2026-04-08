import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, X, Clock, User, FileText, CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KEY = 'yfj_meetings';

function getMeetings() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function saveMeetings(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const STATUS_COLORS = {
  'Scheduled': 'badge-blue',
  'In Progress': 'badge-purple',
  'Completed': 'badge-green',
  'Cancelled': 'badge-coral',
};

const EMPTY_FORM = {
  title: '', agenda: '', date: '', timeStart: '', timeEnd: '',
  chair: '', location: '', type: 'Weekly Devotional', status: 'Scheduled', notes: ''
};

const MEETING_TYPES = [
  'Weekly Devotional', 'Monthly Coordination', 'Quarterly Review',
  'Annual General Assembly', 'Kingdom Activity', 'Special Session'
];

export default function CalendarRoster() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('All');

  useEffect(() => { setMeetings(getMeetings()); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); setShowForm(true); };

  const save = () => {
    if (!form.title.trim()) return;
    const all = getMeetings();
    if (editId) {
      const updated = all.map(m => m.id === editId ? { ...m, ...form, updatedAt: new Date().toISOString() } : m);
      saveMeetings(updated); setMeetings(updated);
    } else {
      const newM = { id: Date.now().toString(), ...form, createdBy: currentUser?.fullName || currentUser?.email || 'Unknown', createdAt: new Date().toISOString() };
      const updated = [...all, newM];
      saveMeetings(updated); setMeetings(updated);
    }
    setShowForm(false); setEditId(null);
  };

  const remove = (id) => {
    const updated = getMeetings().filter(m => m.id !== id);
    saveMeetings(updated); setMeetings(updated);
  };

  const setStatus = (id, status) => {
    const updated = getMeetings().map(m => m.id === id ? { ...m, status } : m);
    saveMeetings(updated); setMeetings(updated);
  };

  const filters = ['All', ...MEETING_TYPES.slice(0, 4)];
  const filtered = meetings.filter(m => filter === 'All' || m.type === filter)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-teal-400 mb-2">Meeting Management</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Calendar & Roster</h2>
          <p className="text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={14} /> Schedule Meeting</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`period-tab ${filter === f ? 'active' : 'inactive'}`}>{f}</button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto" style={{background: 'rgba(4,8,15,0.88)', backdropFilter: 'blur(14px)'}}>
          <div className="section-card p-8 w-full max-w-2xl my-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">{editId ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Meeting Title *</label>
                <input className="yfj-input" placeholder="e.g. Wednesday Evening Devotional" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Meeting Type</label>
                  <select className="yfj-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Meeting Chair</label>
                  <input className="yfj-input" placeholder="Chair's name..." value={form.chair} onChange={e => setForm({...form, chair: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Date</label>
                  <input type="date" className="yfj-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Start Time</label>
                  <input type="time" className="yfj-input" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">End Time</label>
                  <input type="time" className="yfj-input" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Location</label>
                <input className="yfj-input" placeholder="Meeting location..." value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Agenda</label>
                <textarea className="yfj-textarea" rows={4} placeholder="List the agenda items for this meeting..." value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Status</label>
                <select className="yfj-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Additional Notes</label>
                <textarea className="yfj-textarea" rows={2} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="btn-primary flex-1">{editId ? 'Save Changes' : 'Schedule Meeting'}</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meetings list */}
      {filtered.length === 0 ? (
        <div className="section-card p-16 text-center">
          <CalendarDays size={48} className="mx-auto mb-4 text-white/15" />
          <p className="text-white/30 text-sm">No meetings scheduled.</p>
          <p className="text-white/20 text-xs mt-1">Click "Schedule Meeting" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(m => (
            <div key={m.id} className="glass-card p-6 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl gemini-gradient-subtle border border-white/10 flex items-center justify-center">
                    <CalendarDays size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-base font-black text-white">{m.title}</h3>
                      <span className={`badge ${STATUS_COLORS[m.status] || 'badge-blue'}`}>{m.status}</span>
                      <span className="badge badge-purple">{m.type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-white/40 mb-3 flex-wrap">
                      {m.date && <span className="flex items-center gap-1"><CalendarDays size={10} /> {formatDate(m.date)}</span>}
                      {(m.timeStart || m.timeEnd) && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {m.timeStart}{m.timeStart && m.timeEnd ? ' – ' : ''}{m.timeEnd}
                        </span>
                      )}
                      {m.chair && <span className="flex items-center gap-1"><User size={10} /> Chair: <strong className="text-white/60">{m.chair}</strong></span>}
                      {m.location && <span>📍 {m.location}</span>}
                    </div>
                    {m.agenda && (
                      <div className="text-sm text-white/50 leading-relaxed bg-white/[0.03] rounded-xl p-3 mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Agenda</p>
                        <p className="whitespace-pre-line">{m.agenda}</p>
                      </div>
                    )}
                    {m.createdBy && (
                      <p className="text-[11px] text-white/25">Created by {m.createdBy}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex-col">
                  <button onClick={() => openEdit(m)} className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/15 hover:text-blue-400 text-white/30 transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(m.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-white/30 transition-all">
                    <Trash2 size={14} />
                  </button>
                  {m.status !== 'Completed' && (
                    <button onClick={() => setStatus(m.id, 'Completed')} title="Mark Complete" className="p-2 rounded-lg bg-white/5 hover:bg-green-500/15 hover:text-green-400 text-white/30 transition-all">
                      <CheckCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
