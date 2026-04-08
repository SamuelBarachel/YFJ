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
  Sparkles, LogOut, BookOpen, ChevronRight, ChevronLeft,
  Clock, CheckCircle, User
} from 'lucide-react';
import './assets/index.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',       mobileLabel: 'Home',    icon: <LayoutGrid size={20} />,  iconSm: <LayoutGrid size={18} />,  color: 'linear-gradient(135deg,#4285f4,#9b72f3)' },
  { id: 'notes',     label: 'Notes & Records',  mobileLabel: 'Notes',   icon: <FileText size={20} />,    iconSm: <FileText size={18} />,    color: 'linear-gradient(135deg,#9b72f3,#d96570)' },
  { id: 'agenda',    label: "Week's Agenda",    mobileLabel: 'Agenda',  icon: <CalendarDays size={20} />,iconSm: <CalendarDays size={18} />,color: 'linear-gradient(135deg,#d96570,#fbbc04)' },
  { id: 'calendar',  label: 'Calendar & Roster',mobileLabel: 'Roster',  icon: <BookOpen size={20} />,    iconSm: <BookOpen size={18} />,    color: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
  { id: 'reports',   label: 'Cub AI Reports',   mobileLabel: 'Cub',     icon: <Sparkles size={20} />,    iconSm: <Sparkles size={18} />,    color: 'linear-gradient(135deg,#fbbc04,#d96570)' },
  { id: 'announcements', label: 'Announcements',mobileLabel: 'News',    icon: <Megaphone size={20} />,   iconSm: <Megaphone size={18} />,   color: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function App() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useIsMobile();

  if (!currentUser) return <AuthPortal />;

  const initials = (currentUser.fullName || currentUser.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItem = NAV_ITEMS.find(n => n.id === activeTab);
  const isSubPage = isMobile && activeTab !== 'dashboard';

  const handleTabClick = (id) => setActiveTab(id);
  const handleBack = () => setActiveTab('dashboard');

  return (
    <div className="min-h-screen flex" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="aurora-blob-4" />

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className="hidden md:flex w-64 flex-col z-20 flex-shrink-0"
        style={{
          background: 'rgba(4,8,15,0.72)',
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

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <div className="nav-icon flex-shrink-0" style={{ background: activeTab === item.id ? item.color : 'rgba(255,255,255,0.06)' }}>
                <span style={{ color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.35)' }}>
                  {item.iconSm}
                </span>
              </div>
              <span className={activeTab === item.id ? 'text-white' : 'text-white/35'}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.fullName || 'Member'}</p>
              {currentUser.role && <span className="badge badge-purple text-[9px]">{currentUser.role}</span>}
            </div>
          </div>
          <button onClick={logout} className="btn-secondary w-full text-red-400/70 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">

        {/* ===== DESKTOP TOP BAR ===== */}
        <div
          className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-30"
          style={{ background: 'rgba(4,8,15,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-white/20 text-sm">/</div>
            <h2 className="text-sm font-black text-white">{navItem?.label}</h2>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
            <Clock size={12} className="text-purple-400" />
            <span className="text-xs font-bold text-white/50">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ===== MOBILE TOP BAR ===== */}
        <div
          className="flex md:hidden items-center justify-between px-4 sticky top-0 z-30"
          style={{
            background: 'rgba(4,8,15,0.85)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight: '56px',
          }}
        >
          {/* Left: Back (sub-pages) or brand (dashboard) */}
          {isSubPage ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-white/70 hover:text-white active:scale-95 transition-all"
              style={{ minWidth: '72px' }}
            >
              <ChevronLeft size={20} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-400">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2" style={{ minWidth: '72px' }}>
              <div className="w-7 h-7 rounded-lg gemini-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="text-xs font-black text-white tracking-tight">YFJ NA</span>
            </div>
          )}

          {/* Center: Page title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-black text-white leading-none">{navItem?.mobileLabel || navItem?.label}</p>
          </div>

          {/* Right: User avatar / Sign out */}
          <div className="flex items-center gap-2" style={{ minWidth: '72px', justifyContent: 'flex-end' }}>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
              title="Sign Out"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}
            >
              {initials}
            </button>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: isMobile ? '80px' : '0' }}
        >
          <div className={`${isMobile ? 'px-4 py-5' : 'p-8'}`}>
            <div className={`${isMobile ? 'w-full' : 'max-w-7xl mx-auto'}`}>
              {activeTab === 'dashboard'      && <DashboardPanel setActiveTab={handleTabClick} currentUser={currentUser} isMobile={isMobile} />}
              {activeTab === 'notes'          && <NotesPanel />}
              {activeTab === 'agenda'         && <WeekAgenda />}
              {activeTab === 'calendar'       && <CalendarRoster />}
              {activeTab === 'reports'        && <ReportsPanel />}
              {activeTab === 'announcements'  && <AnnouncementsPanel />}
            </div>
          </div>
        </main>

        {/* ===== MOBILE BOTTOM TAB BAR ===== */}
        <nav
          className="flex md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{
            background: 'rgba(4,8,15,0.92)',
            backdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="flex w-full">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative active:scale-90 transition-transform"
                  style={{ minHeight: '60px' }}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                      style={{ background: isActive ? 'linear-gradient(90deg, #4285f4, #9b72f3)' : 'transparent' }}
                    />
                  )}
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? item.color : 'transparent',
                      boxShadow: isActive ? '0 4px 14px rgba(155,114,243,0.35)' : 'none',
                    }}
                  >
                    <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}>
                      {item.iconSm}
                    </span>
                  </div>
                  {/* Label */}
                  <span
                    className="text-[9px] font-black uppercase tracking-tight leading-none"
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}
                  >
                    {item.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

/* ===== DASHBOARD ===== */
function DashboardPanel({ setActiveTab, currentUser, isMobile }) {
  const [counts, setCounts] = useState({ notes: 0, weekMeetings: 0, announcements: 0, completedMeetings: 0 });

  useEffect(() => {
    const notes = getData('yfj_notes');
    const meetings = getData('yfj_meetings');
    const announcements = getData('yfj_announcements');
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);
    setCounts({
      notes: notes.length,
      weekMeetings: meetings.filter(m => m.date && new Date(m.date + 'T00:00:00') >= weekStart).length,
      announcements: announcements.length,
      completedMeetings: meetings.filter(m => m.status === 'Completed').length,
    });
  }, []);

  const STATS = [
    { label: 'Notes',      value: counts.notes,             icon: <FileText size={16} />,    color: '#9b72f3', bg: 'rgba(155,114,243,0.14)' },
    { label: 'This Week',  value: counts.weekMeetings,      icon: <CalendarDays size={16} />, color: '#4285f4', bg: 'rgba(66,133,244,0.14)' },
    { label: 'News',       value: counts.announcements,     icon: <Megaphone size={16} />,    color: '#34a853', bg: 'rgba(52,168,83,0.14)' },
    { label: 'Done',       value: counts.completedMeetings, icon: <CheckCircle size={16} />,  color: '#fbbc04', bg: 'rgba(251,188,4,0.14)' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Write a Note',         desc: 'Record meeting notes',          tab: 'notes',          gradient: 'linear-gradient(135deg,#9b72f3,#d96570)' },
    { label: "Week's Agenda",        desc: 'View this week\'s schedule',    tab: 'agenda',         gradient: 'linear-gradient(135deg,#d96570,#fbbc04)' },
    { label: 'Schedule Meeting',     desc: 'Add to calendar & roster',      tab: 'calendar',       gradient: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
    { label: 'Ask Cub',              desc: 'Generate AI-powered reports',   tab: 'reports',        gradient: 'linear-gradient(135deg,#fbbc04,#d96570)' },
    { label: 'Post Announcement',    desc: 'Share organization news',       tab: 'announcements',  gradient: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
  ];

  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : null;

  return (
    <div className="animate-slide-up space-y-5">
      {/* Welcome card */}
      <div className="section-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-2">Welcome Back</p>
            <h1 className={`font-black text-white tracking-tight mb-1 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              {firstName ? `Hello, ${firstName}.` : 'Hello.'}
            </h1>
            <p className="text-white/35 text-xs md:text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="py-3 px-4 rounded-2xl" style={{background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(155,114,243,0.15))'}}>
            <p className="text-xs font-bold text-white italic">"I understood by the books..."</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card p-4 md:p-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background: s.bg, color: s.color}}>
              {s.icon}
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5">{s.value}</div>
            <div className="text-[10px] text-white/35 font-bold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Quick Actions</p>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(a.tab)}
              className="glass-card text-left shimmer-hover group active:scale-[0.98] transition-all"
              style={{ padding: isMobile ? '14px 16px' : '20px' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: a.gradient}}>
                  <ChevronRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{a.label}</p>
                  <p className="text-[11px] text-white/35 truncate">{a.desc}</p>
                </div>
                {isMobile && <ChevronRight size={16} className="text-white/20 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: upcoming + traditions */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <UpcomingMeetings setActiveTab={setActiveTab} isMobile={isMobile} />
        <TraditionsCard isMobile={isMobile} />
      </div>
    </div>
  );
}

function getData(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }

function UpcomingMeetings({ setActiveTab, isMobile }) {
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    const all = getData('yfj_meetings');
    const now = new Date(); now.setHours(0,0,0,0);
    setMeetings(
      all.filter(m => m.date && new Date(m.date + 'T00:00:00') >= now && m.status !== 'Cancelled')
        .sort((a, b) => a.date.localeCompare(b.date)).slice(0, isMobile ? 3 : 4)
    );
  }, []);

  return (
    <div className="section-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="section-header-icon" style={{background: 'linear-gradient(135deg,#4285f4,#9b72f3)'}}>
            <CalendarDays size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Upcoming Meetings</h3>
            <p className="text-[10px] text-white/30">Next sessions</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('calendar')} className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
          All <ChevronRight size={11} />
        </button>
      </div>
      {meetings.length === 0 ? (
        <div className="text-center py-6">
          <CalendarDays size={24} className="mx-auto mb-2 text-white/15" />
          <p className="text-white/25 text-xs">No upcoming meetings.</p>
          <button onClick={() => setActiveTab('calendar')} className="mt-2 text-xs text-purple-400">Schedule one →</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {meetings.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <div className="flex-shrink-0 text-center w-10">
                <div className="text-lg font-black text-white leading-none">{m.date ? new Date(m.date+'T00:00:00').getDate() : '?'}</div>
                <div className="text-[9px] font-bold text-white/30 uppercase">{m.date ? new Date(m.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'}) : ''}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{m.title}</p>
                <p className="text-[10px] text-white/35">{m.timeStart || ''}{m.chair ? ` · ${m.chair}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraditionsCard({ isMobile }) {
  const traditions = [
    { text: 'All meetings open with prayer and the reading of the Motto.', color: '#4285f4' },
    { text: 'Quorum requires 2/3 of confirmed leadership present.', color: '#9b72f3' },
    { text: 'Minutes must begin with "I understood by the books..."', color: '#d96570' },
    { text: 'Kingdom Activities must be reported at the next meeting.', color: '#34a853' },
    { text: 'Three unexcused absences trigger a pastoral follow-up.', color: '#fbbc04' },
  ];
  return (
    <div className="section-card p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="section-header-icon" style={{background: 'linear-gradient(135deg,#d96570,#fbbc04)'}}>
          <BookOpen size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Key Traditions</h3>
          <p className="text-[10px] text-white/30">Governance highlights</p>
        </div>
      </div>
      <div className="space-y-2">
        {traditions.slice(0, isMobile ? 3 : 5).map((t, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{background: t.color}} />
            <p className="text-xs text-white/50 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <a href="/traditions.txt" target="_blank" rel="noopener noreferrer" className="mt-4 text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
        <BookOpen size={10} /> Full Traditions Document
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
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setError(msgs[err.code] || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5" style={{background: '#04080F'}}>
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="aurora-blob-4" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="section-card p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl gemini-gradient flex items-center justify-center animate-pulse-glow">
                <Sparkles size={26} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight mb-1">Youth for Jesus</h1>
            <p className="text-white/35 text-sm font-semibold">North America</p>
            <p className="text-white/20 text-xs italic mt-3">"I understood by the books..."</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Email Address</label>
              <input
                type="email"
                autoComplete="email"
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
                autoComplete="current-password"
                className="yfj-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1" style={{paddingTop: '14px', paddingBottom: '14px'}}>
              {loading ? <><div className="spinner" /> Signing in...</> : <><Sparkles size={15} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-[10px] text-white/18 mt-7 leading-relaxed" style={{color: 'rgba(255,255,255,0.18)'}}>
            Access restricted to authorized personnel.<br />
            Contact your Territory Coordinator for access.
          </p>
        </div>
      </div>
    </div>
  );
}
