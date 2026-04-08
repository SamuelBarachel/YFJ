import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Edit2, Trash2, X, Clock, Users,
  MapPin, CheckCircle, LayoutList, LayoutGrid, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KEY = 'yfj_meetings';

const PRIVILEGED_ROLES = ['YFJ Chair', 'TC', 'Territory Coordinator', 'RC', 'Regional Coordinator', 'Deacon'];
const RESTRICTED_ROLES = ['EY', 'YFJ'];

function getMeetings() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function saveMeetings(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

function canViewSensitive(role) { return !RESTRICTED_ROLES.includes(role); }

function filterForUser(list, userRole) {
  if (canViewSensitive(userRole)) return list;
  return list.filter(m => !PRIVILEGED_ROLES.includes(m.creatorRole));
}

function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_STYLE = {
  'Scheduled':   { bg: 'rgba(66,133,244,0.18)',  color: '#4285f4',  label: 'Scheduled' },
  'In Progress': { bg: 'rgba(155,114,243,0.18)', color: '#9b72f3',  label: 'In Progress' },
  'Completed':   { bg: 'rgba(52,168,83,0.18)',   color: '#34a853',  label: 'Completed' },
  'Cancelled':   { bg: 'rgba(217,101,112,0.18)', color: '#d96570',  label: 'Cancelled' },
};

const TYPE_STYLE = {
  'Weekly Devotional':       { gradient: 'linear-gradient(135deg,#4285f4,#9b72f3)', accent: '#4285f4' },
  'Monthly Coordination':    { gradient: 'linear-gradient(135deg,#9b72f3,#d96570)', accent: '#9b72f3' },
  'Quarterly Review':        { gradient: 'linear-gradient(135deg,#d96570,#fbbc04)', accent: '#d96570' },
  'Annual General Assembly': { gradient: 'linear-gradient(135deg,#fbbc04,#d96570)', accent: '#fbbc04' },
  'Kingdom Activity':        { gradient: 'linear-gradient(135deg,#34a853,#0dbfcf)', accent: '#34a853' },
  'Special Session':         { gradient: 'linear-gradient(135deg,#0dbfcf,#4285f4)', accent: '#0dbfcf' },
};

const MEETING_TYPES = Object.keys(TYPE_STYLE);

const EMPTY_FORM = {
  title: '', agenda: '', date: '', timeStart: '', timeEnd: '',
  chair: '', location: '', type: 'Weekly Devotional', status: 'Scheduled', notes: ''
};

function formatDate(d) {
  if (!d) return 'TBD';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function getBullets(agenda, max = 3) {
  if (!agenda) return [];
  return agenda.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).slice(0, max);
}

export default function CalendarRoster() {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || '';
  const isRestricted = RESTRICTED_ROLES.includes(userRole);
  const isPrivileged = PRIVILEGED_ROLES.includes(userRole);

  const [meetings, setMeetings] = useState([]);
  const [view, setView] = useState('roster');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('All');

  useEffect(() => { setMeetings(getMeetings()); }, []);

  const visible = filterForUser(meetings, userRole)
    .filter(m => filter === 'All' || m.type === filter)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (m) => { setForm({ ...m }); setEditId(m.id); setShowForm(true); };

  const save = () => {
    if (!form.title.trim()) return;
    const all = getMeetings();
    if (editId) {
      const updated = all.map(m => m.id === editId ? { ...m, ...form, updatedAt: new Date().toISOString() } : m);
      saveMeetings(updated); setMeetings(updated);
    } else {
      const newM = {
        id: Date.now().toString(), ...form,
        createdBy: currentUser?.fullName || currentUser?.email || 'Unknown',
        creatorRole: userRole,
        createdAt: new Date().toISOString(),
      };
      const updated = [...all, newM];
      saveMeetings(updated); setMeetings(updated);
    }
    setShowForm(false); setEditId(null);
  };

  const remove = (id) => {
    const updated = getMeetings().filter(m => m.id !== id);
    saveMeetings(updated); setMeetings(updated);
  };

  const markComplete = (id) => {
    const updated = getMeetings().map(m => m.id === id ? { ...m, status: 'Completed' } : m);
    saveMeetings(updated); setMeetings(updated);
  };

  const typeFilters = ['All', ...MEETING_TYPES.slice(0, 4)];

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{color: '#0dbfcf'}}>Meeting Management</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Calendar & Roster</h2>
          <p className="text-xs md:text-sm italic mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>
            "I understood by the books..."
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex-shrink-0">
          <Plus size={14} /> Schedule Meeting
        </button>
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
        <div className="flex rounded-xl overflow-hidden border border-white/10 flex-shrink-0"
          style={{background: 'rgba(255,255,255,0.04)'}}>
          <button
            onClick={() => setView('roster')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wide transition-all"
            style={view === 'roster' ? {background: 'linear-gradient(135deg,#4285f4,#9b72f3)', color: 'white'} : {color: 'rgba(255,255,255,0.4)'}}
          >
            <LayoutGrid size={14} /> Roster
          </button>
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wide transition-all"
            style={view === 'list' ? {background: 'linear-gradient(135deg,#4285f4,#9b72f3)', color: 'white'} : {color: 'rgba(255,255,255,0.4)'}}
          >
            <LayoutList size={14} /> List
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {typeFilters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`period-tab flex-shrink-0 ${filter === f ? 'active' : 'inactive'}`}>
              {f === 'All' ? 'All Types' : f.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {isRestricted && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5" style={{background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.2)'}}>
          <Shield size={13} style={{color: '#4285f4'}} />
          <p className="text-xs font-semibold" style={{color: '#4285f4'}}>Some meetings may be restricted based on your access level.</p>
        </div>
      )}

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="section-card p-16 text-center">
          <div className="w-16 h-16 rounded-full gemini-gradient flex items-center justify-center mx-auto mb-4 opacity-40">
            <CalendarDays size={28} className="text-white" />
          </div>
          <p className="text-white/40 font-bold">No meetings scheduled.</p>
          <p className="text-white/25 text-xs mt-1">Click "Schedule Meeting" to get started.</p>
        </div>
      )}

      {/* ROSTER VIEW */}
      {view === 'roster' && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(m => {
            const ts = TYPE_STYLE[m.type] || TYPE_STYLE['Weekly Devotional'];
            const ss = STATUS_STYLE[m.status] || STATUS_STYLE['Scheduled'];
            const bullets = getBullets(m.agenda, 3);
            const initials = getInitials(m.chair || m.createdBy);
            const isUpcoming = m.date && new Date(m.date + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0));

            return (
              <div key={m.id} className="rounded-2xl overflow-hidden group" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                {/* Gradient header strip */}
                <div className="h-1.5 w-full" style={{background: ts.gradient}} />

                <div className="p-5">
                  {/* Leader row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                      style={{background: ts.gradient, boxShadow: `0 4px 14px ${ts.accent}40`}}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{m.chair || 'Chair TBD'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{color: ts.accent}}>Meeting Chair</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(m)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        style={{background: 'rgba(66,133,244,0.15)', color: '#4285f4'}}>
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => remove(m.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        style={{background: 'rgba(217,101,112,0.15)', color: '#d96570'}}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Meeting title */}
                  <h3 className="text-base font-black text-white mb-2 leading-tight">{m.title}</h3>

                  {/* Date + time */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {m.date && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1"
                        style={{background: `${ts.accent}18`, color: ts.accent}}>
                        <CalendarDays size={10} /> {formatDate(m.date)}
                      </span>
                    )}
                    {m.timeStart && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1"
                        style={{background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)'}}>
                        <Clock size={10} /> {formatTime(m.timeStart)}{m.timeEnd ? ` – ${formatTime(m.timeEnd)}` : ''}
                      </span>
                    )}
                  </div>

                  {/* 3 bullet points */}
                  {bullets.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{background: ts.gradient}} />
                          <p className="text-xs leading-relaxed" style={{color: 'rgba(255,255,255,0.65)'}}>{b}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.location && (
                    <div className="flex items-center gap-1.5 text-[11px] mb-3" style={{color: 'rgba(255,255,255,0.45)'}}>
                      <MapPin size={10} /> {m.location}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{borderColor: 'rgba(255,255,255,0.05)'}}>
                    <span className="text-[10px] font-black uppercase rounded-lg px-2.5 py-1"
                      style={{background: ss.bg, color: ss.color}}>{ss.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold rounded-lg px-2 py-1"
                        style={{background: `${ts.accent}15`, color: ts.accent}}>
                        {m.type?.split(' ')[0]}
                      </span>
                      {m.status !== 'Completed' && m.status !== 'Cancelled' && (
                        <button onClick={() => markComplete(m.id)}
                          className="text-[10px] font-bold flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all"
                          style={{background: 'rgba(52,168,83,0.15)', color: '#34a853'}}>
                          <CheckCircle size={10} /> Done
                        </button>
                      )}
                    </div>
                  </div>

                  {m.createdBy && (
                    <p className="text-[10px] mt-2" style={{color: 'rgba(255,255,255,0.22)'}}>
                      Added by {m.createdBy}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map(m => {
            const ts = TYPE_STYLE[m.type] || TYPE_STYLE['Weekly Devotional'];
            const ss = STATUS_STYLE[m.status] || STATUS_STYLE['Scheduled'];
            const bullets = getBullets(m.agenda, 3);

            return (
              <div key={m.id} className="rounded-2xl overflow-hidden group" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <div className="flex items-stretch">
                  {/* Left gradient bar */}
                  <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{background: ts.gradient}} />

                  <div className="flex-1 p-4 md:p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-black text-white">{m.title}</h3>
                          <span className="text-[10px] font-black rounded-lg px-2 py-0.5"
                            style={{background: ss.bg, color: ss.color}}>{ss.label}</span>
                          <span className="text-[10px] font-black rounded-lg px-2 py-0.5"
                            style={{background: `${ts.accent}18`, color: ts.accent}}>{m.type}</span>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          {m.chair && (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold"
                              style={{color: ts.accent}}>
                              <Users size={10} /> {m.chair}
                            </span>
                          )}
                          {m.date && (
                            <span className="flex items-center gap-1.5 text-[11px]" style={{color: 'rgba(255,255,255,0.55)'}}>
                              <CalendarDays size={10} /> {formatDate(m.date)}
                            </span>
                          )}
                          {m.timeStart && (
                            <span className="flex items-center gap-1.5 text-[11px]" style={{color: 'rgba(255,255,255,0.55)'}}>
                              <Clock size={10} /> {formatTime(m.timeStart)}{m.timeEnd ? ` – ${formatTime(m.timeEnd)}` : ''}
                            </span>
                          )}
                          {m.location && (
                            <span className="flex items-center gap-1.5 text-[11px]" style={{color: 'rgba(255,255,255,0.45)'}}>
                              <MapPin size={10} /> {m.location}
                            </span>
                          )}
                        </div>

                        {/* Bullets */}
                        {bullets.length > 0 && (
                          <div className="space-y-1">
                            {bullets.map((b, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{background: ts.gradient}} />
                                <p className="text-xs" style={{color: 'rgba(255,255,255,0.6)'}}>{b}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => openEdit(m)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{background: 'rgba(66,133,244,0.15)', color: '#4285f4'}}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => remove(m.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{background: 'rgba(217,101,112,0.15)', color: '#d96570'}}>
                          <Trash2 size={13} />
                        </button>
                        {m.status !== 'Completed' && (
                          <button onClick={() => markComplete(m.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{background: 'rgba(52,168,83,0.15)', color: '#34a853'}}>
                            <CheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(16px)'}}>
          <div className="section-card p-6 md:p-8 w-full max-w-2xl my-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">{editId ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                <p className="text-xs text-white/35 mt-0.5">Enter meeting details below</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white transition-colors w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/05">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#4285f4'}}>Meeting Title *</label>
                <input className="yfj-input" placeholder="e.g. Wednesday Evening Devotional" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#9b72f3'}}>Meeting Type</label>
                  <select className="yfj-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#9b72f3'}}>Meeting Chair</label>
                  <input className="yfj-input" placeholder="Full name of chair..." value={form.chair} onChange={e => setForm({...form, chair: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#0dbfcf'}}>Date</label>
                  <input type="date" className="yfj-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#0dbfcf'}}>Start</label>
                  <input type="time" className="yfj-input" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#0dbfcf'}}>End</label>
                  <input type="time" className="yfj-input" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#34a853'}}>Location</label>
                <input className="yfj-input" placeholder="Meeting venue or online link..." value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#fbbc04'}}>
                  Agenda <span style={{color: 'rgba(255,255,255,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0}}>— one item per line (up to 3 shown on roster)</span>
                </label>
                <textarea className="yfj-textarea" rows={4} placeholder="Prayer and worship&#10;Scripture reading&#10;Announcements..." value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#d96570'}}>Status</label>
                  <select className="yfj-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{color: '#d96570'}}>Additional Notes</label>
                  <input className="yfj-input" placeholder="Any extra notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>

              {isPrivileged && (
                <div className="p-3 rounded-xl flex items-center gap-2" style={{background: 'rgba(251,188,4,0.08)', border: '1px solid rgba(251,188,4,0.15)'}}>
                  <Shield size={12} style={{color: '#fbbc04'}} />
                  <p className="text-[11px]" style={{color: '#fbbc04'}}>This meeting will be flagged as privileged — EY and YFJ accounts will not see it.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={save} className="btn-primary flex-1">{editId ? 'Save Changes' : 'Schedule Meeting'}</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
