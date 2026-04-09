import React, { useState, useEffect, useRef } from 'react';
import { useAuth, ALL_ROLES } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/config';
import { db } from './firebase/config';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import NotesPanel from './components/NotesPanel';
import WeekAgenda from './components/WeekAgenda';
import CalendarRoster from './components/CalendarRoster';
import PeoplePanel from './components/PeoplePanel';
import AnnouncementsPanel from './components/AnnouncementsPanel';
import ReportsPanel from './components/ReportsPanel';
import GreetingsToast from './components/GreetingsToast';
import {
  FileText, CalendarDays, LayoutGrid, Megaphone,
  Sparkles, LogOut, BookOpen, ChevronRight, ChevronLeft,
  Clock, CheckCircle, User, Users, Globe, Settings, X, MapPin, Bell, BellOff, Eye, EyeOff
} from 'lucide-react';
import { requestNotificationPermission, scheduleNotification, playReminderChime } from './utils/notifications';
import './assets/index.css';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',        mobileLabel: 'Home',   icon: <LayoutGrid size={20} />,   iconSm: <LayoutGrid size={18} />,   color: 'linear-gradient(135deg,#4285f4,#9b72f3)' },
  { id: 'notes',         label: 'Notes & Records',   mobileLabel: 'Notes',  icon: <FileText size={20} />,     iconSm: <FileText size={18} />,     color: 'linear-gradient(135deg,#9b72f3,#d96570)' },
  { id: 'agenda',        label: "Week's Agenda",     mobileLabel: 'Agenda', icon: <CalendarDays size={20} />, iconSm: <CalendarDays size={18} />, color: 'linear-gradient(135deg,#d96570,#fbbc04)' },
  { id: 'calendar',      label: 'Calendar & Roster', mobileLabel: 'Roster', icon: <BookOpen size={20} />,     iconSm: <BookOpen size={18} />,     color: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
  { id: 'reports',       label: 'Cub AI Reports',    mobileLabel: 'Cub',    icon: <Sparkles size={20} />,     iconSm: <Sparkles size={18} />,     color: 'linear-gradient(135deg,#fbbc04,#d96570)' },
  { id: 'announcements', label: 'Announcements',     mobileLabel: 'News',   icon: <Megaphone size={20} />,    iconSm: <Megaphone size={18} />,    color: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
  { id: 'people',        label: 'People',            mobileLabel: 'People', icon: <Users size={20} />,        iconSm: <Users size={18} />,        color: 'linear-gradient(135deg,#4285f4,#34a853)' },
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
  const [showProfile, setShowProfile] = useState(false);
  const isMobile = useIsMobile();
  const [toastAnn, setToastAnn] = useState(null);
  const seenIdsRef = useRef(new Set());
  const mountTimeRef = useRef(Date.now());

  if (!currentUser) return <ToastProvider><AuthPortal /></ToastProvider>;

  const initials = (currentUser.fullName || currentUser.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const navItem = NAV_ITEMS.find(n => n.id === activeTab);
  const isSubPage = isMobile && activeTab !== 'dashboard';
  const handleTabClick = (id) => setActiveTab(id);
  const handleBack = () => setActiveTab('dashboard');

  return (
    <ToastProvider>
    <div className="min-h-screen flex" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="aurora-blob-4" />

      <AnnouncementListener
        currentUser={currentUser}
        mountTime={mountTimeRef.current}
        seenIds={seenIdsRef.current}
        onToast={(ann) => setToastAnn(ann)}
      />
      <MeetingReminderScheduler currentUser={currentUser} />

      {toastAnn && (
        <GreetingsToast
          announcement={toastAnn}
          onClose={() => setToastAnn(null)}
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden md:flex w-64 flex-col z-20 flex-shrink-0"
        style={{
          background: 'rgba(4,8,15,0.72)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        <div className="px-6 py-7 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gemini-gradient flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-base leading-none tracking-tight">YFJ</h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/58 font-bold mt-0.5">North America</p>
            </div>
          </div>
          <p className="text-[10px] italic text-white/48 mt-3 leading-relaxed">"I understood by the books..."</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <div className="nav-icon flex-shrink-0" style={{ background: activeTab === item.id ? item.color : 'rgba(255,255,255,0.06)' }}>
                <span style={{ color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.65)' }}>
                  {item.iconSm}
                </span>
              </div>
              <span className={activeTab === item.id ? 'text-white' : 'text-white/65'}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.fullName || 'Member'}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {currentUser.role && <span className="badge badge-purple text-[9px]">{currentUser.role}</span>}
                {currentUser.territory && <span className="badge badge-blue text-[9px]">{currentUser.territory}</span>}
              </div>
            </div>
            <button onClick={() => setShowProfile(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
              title="Edit Profile" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <Settings size={13} />
            </button>
          </div>
          {!currentUser.territory && (
            <button onClick={() => setShowProfile(true)}
              className="w-full mb-2 py-1.5 px-3 rounded-xl text-left text-[11px] font-bold flex items-center gap-2"
              style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.2)', color: '#4285f4' }}>
              <Globe size={11} /> Set your territory →
            </button>
          )}
          <button onClick={logout} className="btn-secondary w-full text-red-400/70 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">

        {/* DESKTOP TOP BAR */}
        <div
          className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-30"
          style={{ background: 'rgba(4,8,15,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-white/52 text-sm">/</div>
            <h2 className="text-sm font-black text-white">{navItem?.label}</h2>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2">
            <Clock size={12} className="text-purple-400" />
            <span className="text-xs font-bold text-white/72">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* MOBILE TOP BAR */}
        <div
          className="flex md:hidden items-center justify-between px-4 sticky top-0 z-30"
          style={{
            background: 'rgba(4,8,15,0.85)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight: '56px',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
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

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-black text-white leading-none">{navItem?.mobileLabel || navItem?.label}</p>
          </div>

          <div className="flex items-center gap-2" style={{ minWidth: '72px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
              title="Profile"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}
            >
              {initials}
            </button>
          </div>
        </div>

        {/* CONTENT */}
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
              {activeTab === 'people'         && <PeoplePanel />}
            </div>
          </div>
        </main>

        {/* MOBILE BOTTOM TAB BAR */}
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
                  {isActive && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #4285f4, #9b72f3)' }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? item.color : 'transparent',
                      boxShadow: isActive ? '0 4px 14px rgba(155,114,243,0.35)' : 'none',
                    }}
                  >
                    <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.62)' }}>
                      {item.iconSm}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-black uppercase tracking-tight leading-none"
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.62)' }}
                  >
                    {item.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {showProfile && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setShowProfile(false)}
          onLogout={logout}
        />
      )}
    </div>
    </ToastProvider>
  );
}

/* ─── ANNOUNCEMENT LISTENER ─── */
function AnnouncementListener({ currentUser, mountTime, seenIds, onToast }) {
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    let firstLoad = true;
    const unsub = onSnapshot(q, (snap) => {
      if (firstLoad) {
        snap.docs.forEach(d => seenIds.add(d.id));
        firstLoad = false;
        return;
      }
      snap.docChanges().forEach(change => {
        if (change.type !== 'added') return;
        const ann = { id: change.doc.id, ...change.doc.data() };
        if (seenIds.has(ann.id)) return;
        seenIds.add(ann.id);
        if (ann.notifyRoles && ann.notifyRoles.length > 0) {
          const userRole = currentUser?.role || '';
          if (!ann.notifyRoles.includes('All') && !ann.notifyRoles.includes(userRole)) return;
        }
        import('./utils/notifications').then(({ playChurchBell }) => playChurchBell());
        onToast(ann);
      });
    });
    return unsub;
  }, []);
  return null;
}

/* ─── MEETING REMINDER SCHEDULER ─── */
function MeetingReminderScheduler({ currentUser }) {
  useEffect(() => {
    if (!currentUser?.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const unsub = onSnapshot(
      query(collection(db, 'meetings'), orderBy('date', 'asc')),
      (snap) => {
        const meetings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const now = Date.now();
        const userRole = currentUser?.role || '';
        meetings.forEach(m => {
          if (!m.date || !m.timeStart) return;
          if (m.status === 'Completed' || m.status === 'Cancelled') return;
          if (m.notifyRoles && m.notifyRoles.length > 0) {
            if (!m.notifyRoles.includes('All') && !m.notifyRoles.includes(userRole)) return;
          }
          const meetingTime = new Date(`${m.date}T${m.timeStart}`).getTime();
          if (meetingTime <= now) return;
          const diffs = [
            { label: '1 week',  ms: 7 * 24 * 60 * 60 * 1000 },
            { label: '1 day',   ms: 24 * 60 * 60 * 1000 },
            { label: '1 hour',  ms: 60 * 60 * 1000 },
          ];
          diffs.forEach(({ label, ms }) => {
            const fireAt = meetingTime - ms;
            const delay = fireAt - now;
            if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
              scheduleNotification(
                `Meeting Reminder — ${m.title}`,
                `Your meeting starts in ${label}: ${m.date} at ${m.timeStart}`,
                delay,
                `reminder-${m.id}-${label}`
              );
            }
          });
        });
      }
    );
    return unsub;
  }, [currentUser?.notificationsEnabled, currentUser?.uid]);
  return null;
}

/* ─── DASHBOARD ─── */
function DashboardPanel({ setActiveTab, currentUser, isMobile }) {
  const [counts, setCounts] = useState({ notes: 0, weekMeetings: 0, announcements: 0, completedMeetings: 0 });

  useEffect(() => {
    const q = query(collection(db, 'meetings'));
    const qn = query(collection(db, 'notes'));
    const qa = query(collection(db, 'announcements'));

    const unsubs = [];
    let meetingData = [], noteData = [], annData = [];

    const compute = () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      setCounts({
        notes: noteData.length,
        weekMeetings: meetingData.filter(m => m.date && new Date(m.date + 'T00:00:00') >= weekStart).length,
        announcements: annData.length,
        completedMeetings: meetingData.filter(m => m.status === 'Completed').length,
      });
    };

    unsubs.push(onSnapshot(q, s => { meetingData = s.docs.map(d => d.data()); compute(); }));
    unsubs.push(onSnapshot(qn, s => { noteData = s.docs.map(d => d.data()); compute(); }));
    unsubs.push(onSnapshot(qa, s => { annData = s.docs.map(d => d.data()); compute(); }));
    return () => unsubs.forEach(u => u());
  }, []);

  const STATS = [
    { label: 'Notes',     value: counts.notes,             icon: <FileText size={16} />,    color: '#9b72f3', bg: 'rgba(155,114,243,0.14)' },
    { label: 'This Week', value: counts.weekMeetings,      icon: <CalendarDays size={16} />, color: '#4285f4', bg: 'rgba(66,133,244,0.14)' },
    { label: 'News',      value: counts.announcements,     icon: <Megaphone size={16} />,    color: '#34a853', bg: 'rgba(52,168,83,0.14)' },
    { label: 'Done',      value: counts.completedMeetings, icon: <CheckCircle size={16} />,  color: '#fbbc04', bg: 'rgba(251,188,4,0.14)' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Write a Note',      desc: 'Record meeting notes',        tab: 'notes',          gradient: 'linear-gradient(135deg,#9b72f3,#d96570)' },
    { label: "Week's Agenda",     desc: "View this week's schedule",   tab: 'agenda',         gradient: 'linear-gradient(135deg,#d96570,#fbbc04)' },
    { label: 'Schedule Meeting',  desc: 'Add to calendar & roster',    tab: 'calendar',       gradient: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
    { label: 'Ask Cub',           desc: 'Generate AI-powered reports', tab: 'reports',        gradient: 'linear-gradient(135deg,#fbbc04,#d96570)' },
    { label: 'Post Announcement', desc: 'Share organization news',     tab: 'announcements',  gradient: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
  ];

  const firstName = currentUser?.fullName ? currentUser.fullName.split(' ')[0] : null;

  return (
    <div className="animate-slide-up space-y-5">
      <div className="section-card p-5 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-2">Welcome Back</p>
            <h1 className={`font-black text-white tracking-tight mb-1 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              {firstName ? `Hello, ${firstName}.` : 'Hello.'}
            </h1>
            <p className="text-white/65 text-xs md:text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="py-3 px-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(155,114,243,0.15))' }}>
            <p className="text-xs font-bold text-white italic">"I understood by the books..."</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card p-4 md:p-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5">{s.value}</div>
            <div className="text-[10px] text-white/65 font-bold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/58 mb-3">Quick Actions</p>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(a.tab)}
              className="glass-card text-left shimmer-hover group active:scale-[0.98] transition-all"
              style={{ padding: isMobile ? '14px 16px' : '20px' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.gradient }}>
                  <ChevronRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{a.label}</p>
                  <p className="text-[11px] text-white/65 truncate">{a.desc}</p>
                </div>
                {isMobile && <ChevronRight size={16} className="text-white/20 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <UpcomingMeetings setActiveTab={setActiveTab} isMobile={isMobile} />
        <TraditionsCard isMobile={isMobile} />
      </div>
    </div>
  );
}

function UpcomingMeetings({ setActiveTab, isMobile }) {
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('date', 'asc'));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = new Date(); now.setHours(0, 0, 0, 0);
      setMeetings(
        all.filter(m => m.date && new Date(m.date + 'T00:00:00') >= now && m.status !== 'Cancelled' && m.status !== 'Completed')
          .slice(0, isMobile ? 3 : 4)
      );
    });
  }, []);

  return (
    <div className="section-card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="section-header-icon" style={{ background: 'linear-gradient(135deg,#4285f4,#9b72f3)' }}>
            <CalendarDays size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Upcoming Meetings</h3>
            <p className="text-[10px] text-white/58">Next sessions</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('calendar')} className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
          All <ChevronRight size={11} />
        </button>
      </div>
      {meetings.length === 0 ? (
        <div className="text-center py-6">
          <CalendarDays size={24} className="mx-auto mb-2 text-white/30" />
          <p className="text-white/58 text-xs">No upcoming meetings.</p>
          <button onClick={() => setActiveTab('calendar')} className="mt-2 text-xs text-purple-400">Schedule one →</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {meetings.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <div className="flex-shrink-0 text-center w-10">
                <div className="text-lg font-black text-white leading-none">{m.date ? new Date(m.date + 'T00:00:00').getDate() : '?'}</div>
                <div className="text-[9px] font-bold text-white/60 uppercase">{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : ''}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{m.title}</p>
                <p className="text-[10px] text-white/65">{m.timeStart || ''}{m.chair ? ` · ${m.chair}` : ''}</p>
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
    { text: 'JRM Youth traditions are instructions and guidelines expected from all the boys and girls(in the flesh), who believe in the doctrine of Christ.', color: '#4285f4' },
    { text: 'The ministers of the gospel or the senior stewards responsible for the youth department ordain these traditions.', color: '#9b72f3' },
  ];
  return (
    <div className="section-card p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="section-header-icon" style={{ background: 'linear-gradient(135deg,#d96570,#fbbc04)' }}>
          <BookOpen size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Youth Traditions</h3>
          <p className="text-[10px] text-white/58">By the books</p>
        </div>
      </div>
      <div className="space-y-2">
        {traditions.slice(0, isMobile ? 3 : 5).map((t, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.02]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: t.color }} />
            <p className="text-xs text-white/75 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <a href="/traditions.pdf" target="_blank" rel="noopener noreferrer"
        className="mt-4 text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
        <BookOpen size={10} /> Full Traditions Document
      </a>
    </div>
  );
}

/* ─── PROFILE MODAL ─── */
function ProfileModal({ currentUser, onClose, onLogout }) {
  const { updateUserData } = useAuth();
  const { showDone } = useToast();
  const [territory, setTerritory] = useState(currentUser.territory || '');
  const [saved, setSaved] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    currentUser.notificationsEnabled ? 'enabled' : 'idle'
  );
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleSave = async () => {
    await updateUserData(currentUser.uid, { territory, region: 'North America' });
    setSaved(true);
    showDone('Profile saved!');
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  const handleEnableNotifications = async () => {
    setNotifStatus('requesting');
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      await updateUserData(currentUser.uid, { notificationsEnabled: true });
      setNotifStatus('enabled');
      showDone('Notifications enabled!');
    } else {
      setNotifStatus('denied');
    }
  };

  const handleDisableNotifications = async () => {
    await updateUserData(currentUser.uid, { notificationsEnabled: false });
    setNotifStatus('idle');
    showDone('Notifications disabled.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(4,8,15,0.88)', backdropFilter: 'blur(20px)' }}>
      <div className="section-card p-7 w-full max-w-sm animate-slide-up overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#4285f4' }}>My Account</p>
            <h3 className="text-lg font-black text-white">Profile & Settings</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/05 transition-colors" style={{ color: 'rgba(255,255,255,0.70)' }}>
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-black text-white mb-0.5">{currentUser?.fullName || currentUser?.email}</p>
          <p className="text-xs text-white/70 mb-1">{currentUser?.email}</p>
          {currentUser?.role && (
            <span className="text-[10px] font-black rounded px-2 py-0.5" style={{ background: 'rgba(155,114,243,0.2)', color: '#9b72f3' }}>{currentUser.role}</span>
          )}
        </div>

        {/* Territory */}
        <div className="mb-4">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#0dbfcf' }}>Territory</label>
          <div className="grid grid-cols-2 gap-3">
            {['USA', 'Canada'].map(t => (
              <button key={t} onClick={() => setTerritory(t)}
                className="p-4 rounded-xl text-center font-black text-sm transition-all"
                style={territory === t
                  ? { background: 'linear-gradient(135deg,#0dbfcf,#4285f4)', color: 'white', boxShadow: '0 4px 20px rgba(13,191,207,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }
                }>
                <Globe size={18} className="mx-auto mb-1.5" />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="mb-5">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#9b72f3' }}>Region</label>
          <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(155,114,243,0.08)', border: '1px solid rgba(155,114,243,0.15)' }}>
            <MapPin size={13} style={{ color: '#9b72f3' }} />
            <span className="text-sm font-bold text-white">North America</span>
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.62)' }}>auto-assigned</span>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={13} style={{ color: '#4285f4' }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#4285f4' }}>Sound Notifications</p>
          </div>
          {notifPermission === 'unsupported' ? (
            <p className="text-xs text-white/70">Notifications not supported on this browser.</p>
          ) : notifPermission === 'denied' ? (
            <p className="text-xs text-white/70">Notifications blocked. Please enable them in your browser settings.</p>
          ) : notifStatus === 'enabled' || (currentUser.notificationsEnabled && notifPermission === 'granted') ? (
            <div>
              <p className="text-xs text-white/78 mb-2">You'll receive reminders 1 week, 1 day, and 1 hour before meetings.</p>
              <button onClick={handleDisableNotifications} className="btn-secondary text-xs w-full">
                <BellOff size={12} /> Disable Notifications
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-white/78 mb-2">Enable to receive meeting reminders and announcement alerts.</p>
              <button onClick={handleEnableNotifications} disabled={notifStatus === 'requesting'} className="btn-primary text-xs w-full">
                {notifStatus === 'requesting' ? <><div className="spinner !w-3 !h-3" /> Requesting...</> : <><Bell size={12} /> Enable Notifications</>}
              </button>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={!territory} className="btn-primary w-full mb-3">
          {saved ? <><span style={{ color: '#34a853' }}>✓</span> Saved!</> : <><Globe size={14} /> Save Profile</>}
        </button>

        {/* Logout button — always visible in profile modal */}
        <button
          onClick={onLogout}
          className="btn-secondary w-full"
          style={{ color: '#d96570', borderColor: 'rgba(217,101,112,0.25)' }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─── AUTH PORTAL ─── */
function AuthPortal() {
  const [mode, setMode] = useState('login');
  return mode === 'login'
    ? <LoginForm onSwitch={() => setMode('register')} />
    : <RegisterForm onSwitch={() => setMode('login')} />;
}

function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" /><div className="aurora-blob-2" />
      <div className="aurora-blob-3" /><div className="aurora-blob-4" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="section-card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl gemini-gradient flex items-center justify-center animate-pulse-glow">
                <Sparkles size={26} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight mb-1">Youth for Jesus</h1>
            <p className="text-white/65 text-sm font-semibold">North America</p>
            <p className="text-white/52 text-xs italic mt-3">"I understood by the books..."</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-2">Email Address</label>
              <input type="email" autoComplete="email" className="yfj-input" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-2">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" className="yfj-input pr-11"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
              {loading ? <><div className="spinner" /> Signing in...</> : <><Sparkles size={15} /> Sign In</>}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-white/65 mb-3">Don't have an account?</p>
            <button onClick={onSwitch} className="btn-secondary w-full">
              <User size={13} /> Create Account
            </button>
          </div>

          <p className="text-center text-[10px] mt-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Access restricted to authorized personnel.<br />
            Contact your Territory Coordinator for access.
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'YFJ', territory: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!form.territory) { setError('Please select your territory.'); return; }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        territory: form.territory,
      });
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
      };
      setError(msgs[err.code] || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" /><div className="aurora-blob-2" />
      <div className="aurora-blob-3" /><div className="aurora-blob-4" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="section-card p-8 animate-slide-up" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl gemini-gradient flex items-center justify-center animate-pulse-glow">
                <User size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mb-1">Create Account</h1>
            <p className="text-white/65 text-sm">Youth for Jesus North America</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Full Name *</label>
              <input className="yfj-input" placeholder="Your full name" value={form.fullName}
                onChange={e => f('fullName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Email Address *</label>
              <input type="email" autoComplete="email" className="yfj-input" placeholder="your@email.com"
                value={form.email} onChange={e => f('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="yfj-input pr-11" placeholder="Min 6 characters"
                  value={form.password} onChange={e => f('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Confirm Password *</label>
              <input type="password" className="yfj-input" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => f('confirmPassword', e.target.value)} required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Role *</label>
              <select className="yfj-input" value={form.role} onChange={e => f('role', e.target.value)}>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/65 mb-1.5">Territory *</label>
              <div className="grid grid-cols-2 gap-2">
                {['USA', 'Canada'].map(t => (
                  <button type="button" key={t} onClick={() => f('territory', t)}
                    className="p-3 rounded-xl text-center font-black text-sm transition-all"
                    style={form.territory === t
                      ? { background: 'linear-gradient(135deg,#0dbfcf,#4285f4)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' }
                    }>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 animate-fade-in">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ paddingTop: '14px', paddingBottom: '14px', marginTop: '8px' }}>
              {loading ? <><div className="spinner" /> Creating account...</> : <><User size={15} /> Create Account</>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-white/65 mb-2">Already have an account?</p>
            <button onClick={onSwitch} className="btn-secondary w-full">
              <Sparkles size={13} /> Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
