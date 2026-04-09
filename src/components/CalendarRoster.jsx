import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, Edit2, Trash2, X, Clock, CheckCircle,
  MapPin, LayoutList, UserCheck, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const PRIVILEGED_ROLES = ['YFJ Chair', 'TC', 'Territory Coordinator', 'RC', 'Regional Coordinator', 'Deacon'];
const RESTRICTED_ROLES = ['EY', 'YFJ'];

function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
function formatDateLong(d) {
  if (!d) return 'TBD';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const STATUS_STYLE = {
  'Scheduled':   { bg: 'rgba(66,133,244,0.18)',  color: '#4285f4' },
  'In Progress': { bg: 'rgba(155,114,243,0.18)', color: '#9b72f3' },
  'Completed':   { bg: 'rgba(52,168,83,0.18)',   color: '#34a853' },
  'Cancelled':   { bg: 'rgba(217,101,112,0.18)', color: '#d96570' },
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

const EMPTY_MEETING = { title: '', agenda: '', date: '', timeStart: '', timeEnd: '', chair: '', location: '', type: 'Weekly Devotional', status: 'Scheduled', notes: '' };
const EMPTY_ROSTER  = { date: '', timeEST: '', chair: '', secretary: '' };

function Label({ children, color = '#4285f4' }) {
  return <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color }}>{children}</label>;
}

export default function CalendarRoster() {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || '';
  const canEdit = PRIVILEGED_ROLES.includes(userRole);
  const isRestricted = RESTRICTED_ROLES.includes(userRole);

  const [innerTab, setInnerTab] = useState('roster');

  /* ── Roster state ── */
  const [roster, setRoster] = useState([]);
  const [showRosterForm, setShowRosterForm] = useState(false);
  const [rosterEditId, setRosterEditId] = useState(null);
  const [rosterForm, setRosterForm] = useState(EMPTY_ROSTER);

  /* ── Meetings state ── */
  const [meetings, setMeetings] = useState([]);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingEditId, setMeetingEditId] = useState(null);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING);
  const [filter, setFilter] = useState('All');

  /* ── Firestore listeners ── */
  useEffect(() => {
    const q1 = query(collection(db, 'roster'), orderBy('date'));
    const unsub1 = onSnapshot(q1, snap => setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const q2 = query(collection(db, 'meetings'), orderBy('date'));
    const unsub2 = onSnapshot(q2, snap => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, []);

  /* ─────────── ROSTER CRUD ─────────── */
  const openNewRoster  = () => { setRosterForm(EMPTY_ROSTER); setRosterEditId(null); setShowRosterForm(true); };
  const openEditRoster = (r) => { setRosterForm({ ...r }); setRosterEditId(r.id); setShowRosterForm(true); };

  const saveRoster = async () => {
    if (!rosterForm.date) return;
    if (rosterEditId) {
      await updateDoc(doc(db, 'roster', rosterEditId), { ...rosterForm, updatedAt: new Date().toISOString() });
    } else {
      await addDoc(collection(db, 'roster'), {
        ...rosterForm,
        createdBy: currentUser?.fullName || '',
        creatorRole: userRole,
        createdAt: serverTimestamp(),
      });
    }
    setShowRosterForm(false); setRosterEditId(null);
  };

  const deleteRoster = async (id) => {
    await deleteDoc(doc(db, 'roster', id));
  };

  /* ─────────── MEETINGS CRUD ─────────── */
  const openNewMeeting  = () => { setMeetingForm(EMPTY_MEETING); setMeetingEditId(null); setShowMeetingForm(true); };
  const openEditMeeting = (m) => { setMeetingForm({ ...m }); setMeetingEditId(m.id); setShowMeetingForm(true); };

  const saveMeeting = async () => {
    if (!meetingForm.title.trim()) return;
    if (meetingEditId) {
      await updateDoc(doc(db, 'meetings', meetingEditId), { ...meetingForm, updatedAt: new Date().toISOString() });
    } else {
      await addDoc(collection(db, 'meetings'), {
        ...meetingForm,
        createdBy: currentUser?.fullName || currentUser?.email || 'Unknown',
        creatorRole: userRole,
        createdAt: serverTimestamp(),
      });
    }
    setShowMeetingForm(false); setMeetingEditId(null);
  };

  const deleteMeeting = async (id) => {
    await deleteDoc(doc(db, 'meetings', id));
  };

  const markComplete = async (id) => {
    await updateDoc(doc(db, 'meetings', id), { status: 'Completed' });
  };

  /* ─────────── Meetings split into active + completed ─────────── */
  const allVisible = meetings.filter(m => {
    const typeMatch = filter === 'All' || m.type === filter;
    return typeMatch;
  }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const activeMeetings    = allVisible.filter(m => m.status !== 'Completed' && m.status !== 'Cancelled');
  const completedMeetings = allVisible.filter(m => m.status === 'Completed');
  const cancelledMeetings = allVisible.filter(m => m.status === 'Cancelled');

  /* ─────────── RENDER ─────────── */
  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: '#0dbfcf' }}>Meeting Management</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Calendar & Roster</h2>
          <p className="text-xs md:text-sm italic mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>"I understood by the books..."</p>
        </div>
        {innerTab === 'roster' && canEdit && (
          <button onClick={openNewRoster} className="btn-primary flex-shrink-0"><Plus size={14} /> Add to Roster</button>
        )}
        {innerTab === 'meetings' && (
          <button onClick={openNewMeeting} className="btn-primary flex-shrink-0"><Plus size={14} /> Schedule Meeting</button>
        )}
      </div>

      {/* Inner tab bar */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <button onClick={() => setInnerTab('roster')}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wide transition-all"
          style={innerTab === 'roster' ? { background: 'linear-gradient(135deg,#0dbfcf,#4285f4)', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
          <UserCheck size={14} /> Weekly Roster
        </button>
        <button onClick={() => setInnerTab('meetings')}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wide transition-all"
          style={innerTab === 'meetings' ? { background: 'linear-gradient(135deg,#4285f4,#9b72f3)', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
          <FileText size={14} /> Meeting Details
        </button>
      </div>

      {/* ═══ ROSTER TAB ═══ */}
      {innerTab === 'roster' && (
        <div>
          {!canEdit && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
              style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.15)' }}>
              <UserCheck size={13} style={{ color: '#4285f4' }} />
              <p className="text-xs font-semibold" style={{ color: '#4285f4' }}>Roster is managed by YFJ Chair, TC, and RC/Deacon.</p>
            </div>
          )}

          {roster.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30"
                style={{ background: 'linear-gradient(135deg,#0dbfcf,#4285f4)' }}>
                <UserCheck size={28} className="text-white" />
              </div>
              <p className="font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No roster entries yet.</p>
              {canEdit && <button onClick={openNewRoster} className="mt-3 text-xs font-bold" style={{ color: '#0dbfcf' }}>Add the first roster entry →</button>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="col-span-3 text-[10px] font-black uppercase tracking-widest" style={{ color: '#0dbfcf' }}>Date</div>
                <div className="col-span-2 text-[10px] font-black uppercase tracking-widest" style={{ color: '#4285f4' }}>Time (EST)</div>
                <div className="col-span-3 text-[10px] font-black uppercase tracking-widest" style={{ color: '#9b72f3' }}>Meeting Chair</div>
                <div className="col-span-3 text-[10px] font-black uppercase tracking-widest" style={{ color: '#d96570' }}>Secretary</div>
                <div className="col-span-1" />
              </div>

              {roster.map(r => {
                const isToday = r.date === new Date().toISOString().split('T')[0];
                return (
                  <div key={r.id} className="rounded-2xl overflow-hidden group"
                    style={{ background: isToday ? 'rgba(13,191,207,0.07)' : 'rgba(255,255,255,0.03)', border: isToday ? '1px solid rgba(13,191,207,0.25)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="h-1 w-full" style={{ background: isToday ? 'linear-gradient(90deg,#0dbfcf,#4285f4)' : 'linear-gradient(90deg,rgba(66,133,244,0.4),rgba(155,114,243,0.4))' }} />
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-5 py-4">
                      <div className="col-span-3">
                        <p className="text-sm font-black text-white">{formatDateShort(r.date)}</p>
                        {isToday && <span className="text-[10px] font-black rounded px-1.5 py-0.5" style={{ background: 'rgba(13,191,207,0.2)', color: '#0dbfcf' }}>TODAY</span>}
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} style={{ color: '#4285f4' }} />
                          <span className="text-sm font-bold text-white">{r.timeEST ? formatTime(r.timeEST) + ' EST' : '—'}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#9b72f3,#4285f4)', color: 'white' }}>{getInitials(r.chair)}</div>
                          <span className="text-sm font-bold text-white truncate">{r.chair || '—'}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#d96570,#fbbc04)', color: 'white' }}>{getInitials(r.secretary)}</div>
                          <span className="text-sm font-bold text-white truncate">{r.secretary || '—'}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {canEdit && (
                          <>
                            <button onClick={() => openEditRoster(r)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.15)', color: '#4285f4' }}><Edit2 size={11} /></button>
                            <button onClick={() => deleteRoster(r.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(217,101,112,0.15)', color: '#d96570' }}><Trash2 size={11} /></button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-black text-white">{formatDateLong(r.date)}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock size={11} style={{ color: '#4285f4' }} />
                            <span className="text-xs font-bold" style={{ color: '#4285f4' }}>{r.timeEST ? formatTime(r.timeEST) + ' EST' : 'Time TBD'}</span>
                          </div>
                        </div>
                        {isToday && <span className="text-[10px] font-black rounded px-2 py-1" style={{ background: 'rgba(13,191,207,0.2)', color: '#0dbfcf' }}>TODAY</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-xl" style={{ background: 'rgba(155,114,243,0.08)' }}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#9b72f3' }}>Chair</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#9b72f3,#4285f4)', color: 'white' }}>{getInitials(r.chair)}</div>
                            <span className="text-xs font-bold text-white truncate">{r.chair || '—'}</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl" style={{ background: 'rgba(217,101,112,0.08)' }}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#d96570' }}>Secretary</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#d96570,#fbbc04)', color: 'white' }}>{getInitials(r.secretary)}</div>
                            <span className="text-xs font-bold text-white truncate">{r.secretary || '—'}</span>
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => openEditRoster(r)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(66,133,244,0.15)', color: '#4285f4' }}><Edit2 size={11} /> Edit</button>
                          <button onClick={() => deleteRoster(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(217,101,112,0.12)', color: '#d96570' }}><Trash2 size={11} /> Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roster Form Modal */}
          {showRosterForm && canEdit && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
              style={{ background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(16px)' }}>
              <div className="section-card p-6 w-full max-w-lg my-8 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">{rosterEditId ? 'Edit Roster Entry' : 'New Roster Entry'}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Assign chair and secretary for a meeting date</p>
                  </div>
                  <button onClick={() => setShowRosterForm(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/05" style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label color="#0dbfcf">Date *</Label><input type="date" className="yfj-input" value={rosterForm.date} onChange={e => setRosterForm({ ...rosterForm, date: e.target.value })} /></div>
                    <div><Label color="#4285f4">Time (EST)</Label><input type="time" className="yfj-input" value={rosterForm.timeEST} onChange={e => setRosterForm({ ...rosterForm, timeEST: e.target.value })} /></div>
                  </div>
                  <div><Label color="#9b72f3">Meeting Chair</Label><input className="yfj-input" placeholder="Full name of the chair..." value={rosterForm.chair} onChange={e => setRosterForm({ ...rosterForm, chair: e.target.value })} /></div>
                  <div><Label color="#d96570">Secretary</Label><input className="yfj-input" placeholder="Full name of the secretary..." value={rosterForm.secretary} onChange={e => setRosterForm({ ...rosterForm, secretary: e.target.value })} /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveRoster} className="btn-primary flex-1">{rosterEditId ? 'Save Changes' : 'Add to Roster'}</button>
                    <button onClick={() => setShowRosterForm(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MEETINGS TAB ═══ */}
      {innerTab === 'meetings' && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-5">
            {['All', ...MEETING_TYPES.slice(0, 4)].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`period-tab flex-shrink-0 ${filter === f ? 'active' : 'inactive'}`}>
                {f === 'All' ? 'All Types' : f.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Active meetings */}
          {activeMeetings.length === 0 && completedMeetings.length === 0 ? (
            <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30"
                style={{ background: 'linear-gradient(135deg,#4285f4,#9b72f3)' }}>
                <CalendarDays size={28} className="text-white" />
              </div>
              <p className="font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No meetings scheduled.</p>
              <button onClick={openNewMeeting} className="mt-3 text-xs font-bold" style={{ color: '#4285f4' }}>Schedule one →</button>
            </div>
          ) : (
            <>
              {activeMeetings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {activeMeetings.map(m => <MeetingCard key={m.id} m={m} canEdit={canEdit} onEdit={openEditMeeting} onDelete={deleteMeeting} onComplete={markComplete} />)}
                </div>
              )}

              {/* Completed meetings – not deleted, shown at bottom with strike-through */}
              {completedMeetings.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: 'rgba(52,168,83,0.2)' }} />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(52,168,83,0.10)', border: '1px solid rgba(52,168,83,0.2)' }}>
                      <CheckCircle size={12} style={{ color: '#34a853' }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34a853' }}>Completed Meetings</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'rgba(52,168,83,0.2)' }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
                    {completedMeetings.map(m => <MeetingCard key={m.id} m={m} canEdit={canEdit} completed onEdit={openEditMeeting} onDelete={deleteMeeting} onComplete={markComplete} />)}
                  </div>
                </>
              )}
            </>
          )}

          {/* Meeting Form Modal */}
          {showMeetingForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
              style={{ background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(16px)' }}>
              <div className="section-card p-6 w-full max-w-2xl my-8 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-black text-white">{meetingEditId ? 'Edit Meeting' : 'Schedule Meeting'}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>All fields are synced across all devices in real-time</p>
                  </div>
                  <button onClick={() => setShowMeetingForm(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/05" style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><Label color="#4285f4">Meeting Title *</Label><input className="yfj-input" placeholder="e.g. Weekly Devotional Meeting" value={meetingForm.title} onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })} /></div>
                  <div><Label color="#0dbfcf">Meeting Type</Label>
                    <select className="yfj-input" value={meetingForm.type} onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value })}>
                      {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><Label color="#9b72f3">Status</Label>
                    <select className="yfj-input" value={meetingForm.status} onChange={e => setMeetingForm({ ...meetingForm, status: e.target.value })}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><Label color="#d96570">Date</Label><input type="date" className="yfj-input" value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label color="#fbbc04">Start Time</Label><input type="time" className="yfj-input" value={meetingForm.timeStart} onChange={e => setMeetingForm({ ...meetingForm, timeStart: e.target.value })} /></div>
                    <div><Label color="#fbbc04">End Time</Label><input type="time" className="yfj-input" value={meetingForm.timeEnd} onChange={e => setMeetingForm({ ...meetingForm, timeEnd: e.target.value })} /></div>
                  </div>
                  <div><Label color="#9b72f3">Chair</Label><input className="yfj-input" placeholder="Meeting chair name..." value={meetingForm.chair} onChange={e => setMeetingForm({ ...meetingForm, chair: e.target.value })} /></div>
                  <div><Label color="#0dbfcf">Location / Platform</Label><input className="yfj-input" placeholder="e.g. Zoom, Church Hall..." value={meetingForm.location} onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label color="#4285f4">Agenda Items</Label><textarea className="yfj-textarea" rows={4} placeholder={"• Opening Prayer\n• Minutes from last meeting\n• Main discussion"} value={meetingForm.agenda} onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label color="#9b72f3">Notes</Label><textarea className="yfj-textarea" rows={2} placeholder="Additional notes..." value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })} /></div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button onClick={saveMeeting} className="btn-primary flex-1">{meetingEditId ? 'Save Changes' : 'Schedule Meeting'}</button>
                    <button onClick={() => setShowMeetingForm(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Meeting Card ─── */
function MeetingCard({ m, canEdit, completed, onEdit, onDelete, onComplete }) {
  const ts = TYPE_STYLE[m.type] || TYPE_STYLE['Weekly Devotional'];
  const ss = STATUS_STYLE[m.status] || STATUS_STYLE['Scheduled'];
  const bullets = getBullets(m.agenda, 3);

  return (
    <div className="rounded-2xl overflow-hidden group"
      style={{
        background: completed ? 'rgba(52,168,83,0.04)' : 'rgba(255,255,255,0.03)',
        border: completed ? '1px solid rgba(52,168,83,0.15)' : '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="h-1.5 w-full" style={{ background: ts.gradient, opacity: completed ? 0.4 : 1 }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
            style={{ background: ts.gradient, opacity: completed ? 0.6 : 1 }}>
            {getInitials(m.chair || m.createdBy)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate" style={{ opacity: completed ? 0.6 : 1 }}>{m.chair || 'Chair TBD'}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: ts.accent, opacity: completed ? 0.5 : 1 }}>Meeting Chair</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(m)} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(66,133,244,0.15)', color: '#4285f4' }}><Edit2 size={11} /></button>
            <button onClick={() => onDelete(m.id)} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(217,101,112,0.15)', color: '#d96570' }}><Trash2 size={11} /></button>
          </div>
        </div>

        {/* Title with strike-through if completed */}
        <h3 className="text-base font-black text-white mb-2 leading-tight"
          style={{ textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.55 : 1 }}>
          {m.title}
        </h3>

        <div className="flex flex-wrap gap-2 mb-3">
          {m.date && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1"
              style={{ background: `${ts.accent}18`, color: completed ? 'rgba(255,255,255,0.4)' : ts.accent }}>
              <CalendarDays size={10} /> {formatDateShort(m.date)}
            </span>
          )}
          {m.timeStart && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-2.5 py-1"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
              <Clock size={10} /> {formatTime(m.timeStart)}{m.timeEnd ? ` – ${formatTime(m.timeEnd)}` : ''}
            </span>
          )}
        </div>

        {bullets.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: ts.gradient }} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: completed ? 'line-through' : 'none' }}>{b}</p>
              </div>
            ))}
          </div>
        )}

        {m.location && (
          <div className="flex items-center gap-1.5 text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <MapPin size={10} /> {m.location}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] font-black rounded-lg px-2.5 py-1" style={{ background: ss.bg, color: ss.color }}>{m.status}</span>
          {!completed && m.status !== 'Cancelled' && (
            <button onClick={() => onComplete(m.id)}
              className="flex items-center gap-1.5 text-[10px] font-black rounded-lg px-2.5 py-1 transition-all"
              style={{ background: 'rgba(52,168,83,0.12)', color: '#34a853', border: '1px solid rgba(52,168,83,0.2)' }}>
              <CheckCircle size={10} /> Mark Done
            </button>
          )}
          {completed && (
            <span className="text-[10px] font-black" style={{ color: 'rgba(52,168,83,0.6)' }}>✓ Completed</span>
          )}
        </div>
      </div>
    </div>
  );
}
