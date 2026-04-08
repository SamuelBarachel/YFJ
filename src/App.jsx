import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/config';
import NotesPanel from './components/NotesPanel';
import WeekAgenda from './components/WeekAgenda';
import CalendarRoster from './components/CalendarRoster';
import AnnouncementsPanel from './components/AnnouncementsPanel';
import ReportsPanel from './components/ReportsPanel';
import {
  FileText, CalendarDays, LayoutGrid, Megaphone,
  Sparkles, LogOut, BarChart3, BookOpen, ChevronRight,
  Clock, Users, CheckCircle
} from 'lucide-react';
import './assets/index.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, color: 'linear-gradient(135deg,#4285f4,#9b72f3)' },
  { id: 'notes', label: 'Notes & Records', icon: <FileText size={16} />, color: 'linear-gradient(135deg,#9b72f3,#d96570)' },
  { id: 'agenda', label: "Week's Agenda", icon: <CalendarDays size={16} />, color: 'linear-gradient(135deg,#d96570,#fbbc04)' },
  { id: 'calendar', label: 'Calendar & Roster', icon: <BookOpen size={16} />, color: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
  { id: 'reports', label: 'AI Reports', icon: <Sparkles size={16} />, color: 'linear-gradient(135deg,#fbbc04,#d96570)' },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} />, color: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  notes: 'Notes & Records',
  agenda: "Week's Agenda",
  calendar: 'Calendar & Roster',
  reports: 'AI Reports',
  announcements: 'Announcements',
};

export default function App() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) return <AuthPortal />;

  const initials = (currentUser.fullName || currentUser.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex" style={{ background: '#04080F' }}>
      {/* Aurora background */}
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="aurora-blob-4" />

      {/* ===== SIDEBAR ===== */}
      <aside
        className="w-64 flex flex-col z-20 flex-shrink-0"
        style={{
          background: 'rgba(4,8,15,0.7)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, height: '100vh'
        }}
      >
        {/* Brand */}
        <div className="px-6 py-7 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gemini-gradient flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-base leading-none tracking-tight">YFJ</h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold mt-0.5">North America</p>
            </div>
          </div>
          <p className="text-[10px] italic text-white/20 mt-3 leading-relaxed">"I understood by the books..."</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <div className="nav-icon flex-shrink-0" style={{ background: activeTab === item.id ? item.color : 'rgba(255,255,255,0.06)' }}>
                <span style={{ color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.35)' }}>
                  {item.icon}
                </span>
              </div>
              <span className={activeTab === item.id ? 'text-white' : 'text-white/35'}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-5 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.fullName || 'Member'}</p>
              {currentUser.role && (
                <span className="badge badge-purple text-[9px]">{currentUser.role}</span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-secondary w-full text-red-400/70 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{ background: 'rgba(4,8,15,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-white/20 text-sm">/</div>
            <h2 className="text-sm font-black text-white">{PAGE_TITLES[activeTab]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
              <Clock size={12} className="text-purple-400" />
              <span className="text-xs font-bold text-white/50">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPanel setActiveTab={setActiveTab} currentUser={currentUser} />}
            {activeTab === 'notes' && <NotesPanel />}
            {activeTab === 'agenda' && <WeekAgenda />}
            {activeTab === 'calendar' && <CalendarRoster />}
            {activeTab === 'reports' && <ReportsPanel />}
            {activeTab === 'announcements' && <AnnouncementsPanel />}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ===== DASHBOARD PANEL ===== */
function DashboardPanel({ setActiveTab, currentUser }) {
  const [counts, setCounts] = useState({ notes: 0, meetings: 0, announcements: 0, completedMeetings: 0 });

  useEffect(() => {
    const notes = (() => { try { return JSON.parse(localStorage.getItem('yfj_notes') || '[]'); } catch { return []; } })();
    const meetings = (() => { try { return JSON.parse(localStorage.getItem('yfj_meetings') || '[]'); } catch { return []; } })();
    const announcements = (() => { try { return JSON.parse(localStorage.getItem('yfj_announcements') || '[]'); } catch { return []; } })();
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    const weekMeetings = meetings.filter(m => m.date && new Date(m.date + 'T00:00:00') >= weekStart);
    setCounts({
      notes: notes.length,
      meetings: meetings.length,
      announcements: announcements.length,
      weekMeetings: weekMeetings.length,
      completedMeetings: meetings.filter(m => m.status === 'Completed').length,
    });
  }, []);

  const STATS = [
    { label: 'Total Notes', value: counts.notes, icon: <FileText size={18} />, color: '#9b72f3', bg: 'rgba(155,114,243,0.12)' },
    { label: 'This Week', value: counts.weekMeetings || 0, icon: <CalendarDays size={18} />, color: '#4285f4', bg: 'rgba(66,133,244,0.12)', sub: 'meetings' },
    { label: 'Announcements', value: counts.announcements, icon: <Megaphone size={18} />, color: '#34a853', bg: 'rgba(52,168,83,0.12)' },
    { label: 'Completed', value: counts.completedMeetings, icon: <CheckCircle size={18} />, color: '#fbbc04', bg: 'rgba(251,188,4,0.12)', sub: 'meetings' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Write a Note', desc: 'Record meeting notes and observations', tab: 'notes', gradient: 'linear-gradient(135deg,#9b72f3,#d96570)' },
    { label: "This Week's Agenda", desc: 'View scheduled meetings for this week', tab: 'agenda', gradient: 'linear-gradient(135deg,#d96570,#fbbc04)' },
    { label: 'Schedule a Meeting', desc: 'Add to the calendar and roster', tab: 'calendar', gradient: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
    { label: 'Generate Report', desc: 'AI-powered weekly, monthly, and more', tab: 'reports', gradient: 'linear-gradient(135deg,#fbbc04,#d96570)' },
    { label: 'Post Announcement', desc: 'Share news with the organization', tab: 'announcements', gradient: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
  ];

  return (
    <div className="animate-slide-up space-y-8">
      {/* Welcome */}
      <div className="section-card p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-2">Welcome Back</p>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              {currentUser?.fullName ? `Hello, ${currentUser.fullName.split(' ')[0]}.` : 'Hello.'}
            </h1>
            <p className="text-white/40 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 py-4 px-6 rounded-2xl" style={{background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(155,114,243,0.15))'}}>
            <div className="w-10 h-10 rounded-xl gemini-gradient flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Motto</p>
              <p className="text-sm font-bold text-white italic">"I understood by the books..."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: s.bg, color: s.color}}>
                {s.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-white/35 font-semibold">{s.label} {s.sub ? <span className="text-white/20">{s.sub}</span> : ''}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(a.tab)}
              className="glass-card text-left p-5 shimmer-hover group"
            >
              <div
                className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center"
                style={{background: a.gradient}}
              >
                <ChevronRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm font-black text-white mb-1">{a.label}</p>
              <p className="text-[11px] text-white/35 leading-relaxed">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: upcoming + traditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMeetings setActiveTab={setActiveTab} />
        <TraditionsCard />
      </div>
    </div>
  );
}

function UpcomingMeetings({ setActiveTab }) {
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    const all = (() => { try { return JSON.parse(localStorage.getItem('yfj_meetings') || '[]'); } catch { return []; } })();
    const now = new Date(); now.setHours(0,0,0,0);
    const upcoming = all
      .filter(m => m.date && new Date(m.date + 'T00:00:00') >= now && m.status !== 'Cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    setMeetings(upcoming);
  }, []);

  return (
    <div className="section-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="section-header-icon" style={{background: 'linear-gradient(135deg,#4285f4,#9b72f3)'}}>
            <CalendarDays size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Upcoming Meetings</h3>
            <p className="text-[10px] text-white/30">Next scheduled sessions</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('calendar')} className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
          View all <ChevronRight size={12} />
        </button>
      </div>
      {meetings.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays size={28} className="mx-auto mb-2 text-white/15" />
          <p className="text-white/25 text-sm">No upcoming meetings.</p>
          <button onClick={() => setActiveTab('calendar')} className="mt-3 text-xs text-purple-400 hover:text-purple-300">Schedule one →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:border-purple-500/20 transition-all">
              <div className="flex-shrink-0 text-center w-12">
                <div className="text-xl font-black text-white leading-none">{m.date ? new Date(m.date+'T00:00:00').getDate() : '?'}</div>
                <div className="text-[9px] font-bold text-white/30 uppercase">{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'}) : ''}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{m.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-white/35 mt-0.5">
                  {m.timeStart && <span>{m.timeStart}</span>}
                  {m.chair && <span>· {m.chair}</span>}
                </div>
              </div>
              <span className={`badge shrink-0 ${m.type === 'Kingdom Activity' ? 'badge-green' : 'badge-blue'}`}>{(m.type || '').split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraditionsCard() {
  const traditions = [
    { text: 'All meetings open with prayer and the reading of the Motto.', color: '#4285f4' },
    { text: 'Quorum requires 2/3 of confirmed leadership to be present.', color: '#9b72f3' },
    { text: 'Minutes must begin with "I understood by the books..."', color: '#d96570' },
    { text: 'Kingdom Activities must be reported at the next official meeting.', color: '#34a853' },
    { text: 'Three consecutive unexcused absences trigger a pastoral follow-up.', color: '#fbbc04' },
  ];
  return (
    <div className="section-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="section-header-icon" style={{background: 'linear-gradient(135deg,#d96570,#fbbc04)'}}>
          <BookOpen size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Key Traditions</h3>
          <p className="text-[10px] text-white/30">Governance at a glance</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {traditions.map((t, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{background: t.color}} />
            <p className="text-xs text-white/55 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <a href="/traditions.txt" target="_blank" rel="noopener noreferrer" className="mt-4 text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
        <BookOpen size={11} /> View Full Traditions Document
      </a>
    </div>
  );
}

/* ===== AUTH PORTAL ===== */
function AuthPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const msgs = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please wait.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setError(msgs[err.code] || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background: '#04080F'}}>
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="aurora-blob-4" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="section-card p-10 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gemini-gradient flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
              <Sparkles size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Gatekeeper</h1>
            <p className="text-white/35 text-sm">Youth for Jesus North America</p>
            <p className="text-white/20 text-xs italic mt-3">"I understood by the books..."</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Email Address</label>
              <input
                type="email"
                className="yfj-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Password</label>
              <input
                type="password"
                className="yfj-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 animate-fade-in">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3.5">
              {loading ? (
                <><div className="spinner" /> Authenticating...</>
              ) : (
                <><Sparkles size={15} /> Authorize Access</>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-white/20 mt-8 leading-relaxed">
            Access restricted to authorized YFJ North America personnel.<br />
            Contact your Territory Coordinator for access.
          </p>
        </div>
      </div>
    </div>
  );
}
