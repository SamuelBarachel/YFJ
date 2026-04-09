import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase/config';
import {
  collection, onSnapshot, query, orderBy, getDocs,
  doc, updateDoc
} from 'firebase/firestore';
import NotesPanel from './components/NotesPanel';
import WeekAgenda from './components/WeekAgenda';
import CalendarRoster from './components/CalendarRoster';
import AnnouncementsPanel from './components/AnnouncementsPanel';
import ReportsPanel from './components/ReportsPanel';
import {
  playChime, requestNotificationPermission,
  showWebNotification, scheduleMeetingReminders
} from './services/notificationService';
import {
  FileText, CalendarDays, LayoutGrid, Megaphone,
  Sparkles, LogOut, BookOpen, ChevronRight, ChevronLeft,
  Clock, CheckCircle, Globe, Settings, X, MapPin,
  Bell, BellOff, UserPlus, Eye, EyeOff
} from 'lucide-react';
import './assets/index.css';

/* ─── Profile hook (localStorage + Firestore) ─── */
function useProfile(uid) {
  const KEY = uid ? `yfj_profile_${uid}` : null;
  const [profile, setProfileState] = useState(() => {
    if (!KEY) return { territory: '', region: 'North America', notificationsEnabled: false };
    try { return { region: 'North America', notificationsEnabled: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { territory: '', region: 'North America', notificationsEnabled: false }; }
  });
  const saveProfile = async (updates) => {
    const next = { ...profile, ...updates, region: 'North America' };
    setProfileState(next);
    if (KEY) localStorage.setItem(KEY, JSON.stringify(next));
    if (uid) {
      try { await updateDoc(doc(db, 'users', uid), updates); } catch {}
    }
  };
  return [profile, saveProfile];
}

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',        mobileLabel: 'Home',   icon: <LayoutGrid size={20} />,   iconSm: <LayoutGrid size={18} />,   color: 'linear-gradient(135deg,#4285f4,#9b72f3)' },
  { id: 'notes',         label: 'Notes & Records',   mobileLabel: 'Notes',  icon: <FileText size={20} />,     iconSm: <FileText size={18} />,     color: 'linear-gradient(135deg,#9b72f3,#d96570)' },
  { id: 'agenda',        label: "Week's Agenda",     mobileLabel: 'Agenda', icon: <CalendarDays size={20} />, iconSm: <CalendarDays size={18} />, color: 'linear-gradient(135deg,#d96570,#fbbc04)' },
  { id: 'calendar',      label: 'Calendar & Roster', mobileLabel: 'Roster', icon: <BookOpen size={20} />,     iconSm: <BookOpen size={18} />,     color: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
  { id: 'reports',       label: 'Cub AI Reports',    mobileLabel: 'Cub',    icon: <Sparkles size={20} />,     iconSm: <Sparkles size={18} />,     color: 'linear-gradient(135deg,#fbbc04,#d96570)' },
  { id: 'announcements', label: 'Announcements',     mobileLabel: 'News',   icon: <Megaphone size={20} />,    iconSm: <Megaphone size={18} />,    color: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
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

/* ─────────────────────────────────────────────────────
   NOTIFICATION BANNER
───────────────────────────────────────────────────── */
function NotificationBanner({ notif, onDismiss }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    const start = Date.now();
    const duration = 9000;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct === 0) { clearInterval(tick); onDismiss(); }
    }, 80);
    return () => clearInterval(tick);
  }, [notif]);

  return (
    <div
      className="fixed z-[200] animate-slide-up"
      style={{
        bottom: '90px',
        right: '16px',
        left: '16px',
        maxWidth: '380px',
        marginLeft: 'auto',
      }}
    >
      <div style={{
        background: 'rgba(4,8,15,0.97)',
        border: '1px solid rgba(155,114,243,0.35)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(0,0,0,0.85), 0 0 50px rgba(155,114,243,0.18)',
        backdropFilter: 'blur(30px)',
      }}>
        {/* Gradient top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#4285f4,#9b72f3,#d96570)' }} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg,#9b72f3,#4285f4)' }}>
              <Megaphone size={20} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#9b72f3' }}>
                {notif.isReminder ? '⏰ Meeting Reminder' : '📢 New Announcement'}
              </p>
              <p className="text-sm font-black text-white leading-tight mb-1">
                {notif.isReminder ? `${notif.label}` : 'Greetings Brethren!'}
              </p>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {notif.title}
              </p>
              {notif.content && (
                <p className="text-xs leading-relaxed mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {notif.content.slice(0, 90)}{notif.content.length > 90 ? '…' : ''}
                </p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#4285f4,#9b72f3)',
              transition: 'width 0.08s linear',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────── */
export default function App() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const isMobile = useIsMobile();
  const [profile, saveProfile] = useProfile(currentUser?.uid);
  const [notifQueue, setNotifQueue] = useState([]);
  const sessionStart = useRef(Date.now());
  const reminderTimers = useRef([]);

  /* ── Announcement listener for live notifications ── */
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      snap.docChanges().forEach(change => {
        if (change.type !== 'added') return;
        const data = change.doc.data();
        const createdMs = data.createdAt?.toMillis ? data.createdAt.toMillis()
          : data.createdAt ? new Date(data.createdAt).getTime() : 0;
        if (createdMs < sessionStart.current) return;
        if (data.author === (currentUser.fullName || currentUser.email)) return;
        const roles = data.notifyRoles || ['All'];
        const userRole = currentUser.role || '';
        const shouldNotify = roles.includes('All') || roles.includes(userRole);
        if (!shouldNotify) return;
        playChime();
        showWebNotification(
          'Greetings Brethren! — YFJ NA',
          data.title + (data.content ? ': ' + data.content.slice(0, 60) : '')
        );
        setNotifQueue(q => [...q, { id: change.doc.id, title: data.title, content: data.content }]);
      });
    });
    return unsub;
  }, [currentUser]);

  /* ── Meeting reminders (when notifications enabled) ── */
  useEffect(() => {
    if (!currentUser || !profile.notificationsEnabled) return;
    reminderTimers.current.forEach(clearTimeout);
    const q = query(collection(db, 'meetings'), orderBy('date'));
    getDocs(q).then(snap => {
      const meetings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      reminderTimers.current = scheduleMeetingReminders(meetings, (meeting, label) => {
        playChime();
        showWebNotification(
          `⏰ ${label} — YFJ NA`,
          `${meeting.title}${meeting.timeStart ? ' at ' + meeting.timeStart : ''}`
        );
        setNotifQueue(q => [...q, {
          id: `reminder-${meeting.id}-${label}`,
          title: meeting.title,
          content: meeting.date + (meeting.timeStart ? ' · ' + meeting.timeStart : ''),
          isReminder: true,
          label,
        }]);
      });
    }).catch(() => {});
    return () => reminderTimers.current.forEach(clearTimeout);
  }, [currentUser, profile.notificationsEnabled]);

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
      <aside className="hidden md:flex w-64 flex-col z-20 flex-shrink-0"
        style={{ background: 'rgba(4,8,15,0.72)', borderRight: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, height: '100vh' }}>
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
            <button key={item.id} onClick={() => handleTabClick(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
              <div className="nav-icon flex-shrink-0" style={{ background: activeTab === item.id ? item.color : 'rgba(255,255,255,0.06)' }}>
                <span style={{ color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.35)' }}>{item.iconSm}</span>
              </div>
              <span className={activeTab === item.id ? 'text-white' : 'text-white/35'}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.fullName || 'Member'}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {currentUser.role && <span className="badge badge-purple text-[9px]">{currentUser.role}</span>}
                {profile.territory && <span className="badge badge-blue text-[9px]">{profile.territory}</span>}
              </div>
            </div>
            <button onClick={() => setShowProfile(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
              title="Edit Profile" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Settings size={13} />
            </button>
          </div>
          {!profile.territory && (
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

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 overflow-hidden">

        {/* DESKTOP TOP BAR */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-30"
          style={{ background: 'rgba(4,8,15,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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

        {/* MOBILE TOP BAR */}
        <div className="flex md:hidden items-center justify-between px-4 sticky top-0 z-30"
          style={{ background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: '56px' }}>
          {isSubPage ? (
            <button onClick={handleBack} className="flex items-center gap-1.5" style={{ minWidth: '72px', color: '#9b72f3' }}>
              <ChevronLeft size={20} />
              <span className="text-xs font-bold">Back</span>
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
            <button onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
              title="Profile"
              style={{ background: 'linear-gradient(135deg, #4285f4, #9b72f3)', color: 'white' }}>
              {initials}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
          <div className={`${isMobile ? 'px-4 py-5' : 'p-8'}`}>
            <div className={`${isMobile ? 'w-full' : 'max-w-7xl mx-auto'}`}>
              {activeTab === 'dashboard'     && <DashboardPanel setActiveTab={handleTabClick} currentUser={currentUser} isMobile={isMobile} />}
              {activeTab === 'notes'         && <NotesPanel />}
              {activeTab === 'agenda'        && <WeekAgenda />}
              {activeTab === 'calendar'      && <CalendarRoster notificationsEnabled={profile.notificationsEnabled} />}
              {activeTab === 'reports'       && <ReportsPanel />}
              {activeTab === 'announcements' && <AnnouncementsPanel />}
            </div>
          </div>
        </main>

        {/* MOBILE BOTTOM TAB BAR */}
        <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{ background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex w-full">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => handleTabClick(item.id)}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative active:scale-90 transition-transform"
                  style={{ minHeight: '60px' }}>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                      style={{ background: 'linear-gradient(90deg,#4285f4,#9b72f3)' }} />
                  )}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: isActive ? item.color : 'transparent', boxShadow: isActive ? '0 4px 14px rgba(155,114,243,0.35)' : 'none' }}>
                    <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}>{item.iconSm}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tight leading-none"
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}>{item.mobileLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* NOTIFICATION BANNER */}
      {notifQueue.length > 0 && (
        <NotificationBanner
          notif={notifQueue[0]}
          onDismiss={() => setNotifQueue(q => q.slice(1))}
        />
      )}

      {/* PROFILE MODAL */}
      {showProfile && (
        <ProfileModal
          currentUser={currentUser}
          profile={profile}
          saveProfile={saveProfile}
          logout={logout}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PROFILE MODAL
───────────────────────────────────────────────────── */
function ProfileModal({ currentUser, profile, saveProfile, logout, onClose }) {
  const [territory, setTerritory] = useState(profile.territory || '');
  const [notifEnabled, setNotifEnabled] = useState(profile.notificationsEnabled || false);
  const [notifStatus, setNotifStatus] = useState('');
  const [saved, setSaved] = useState(false);

  const handleNotifToggle = async () => {
    if (!notifEnabled) {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        setNotifEnabled(true);
        setNotifStatus('Notifications enabled!');
      } else if (perm === 'denied') {
        setNotifStatus('Permission denied. Enable in browser settings.');
      } else {
        setNotifEnabled(true);
      }
    } else {
      setNotifEnabled(false);
      setNotifStatus('');
    }
  };

  const handleSave = async () => {
    await saveProfile({ territory, notificationsEnabled: notifEnabled });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const handleLogout = () => { logout(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(4,8,15,0.90)', backdropFilter: 'blur(20px)' }}>
      <div className="section-card p-7 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#4285f4' }}>My Profile</p>
            <h3 className="text-lg font-black text-white">Account Settings</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-black text-white mb-0.5">{currentUser?.fullName || currentUser?.email}</p>
          <p className="text-xs text-white/35 mb-1">{currentUser?.email}</p>
          {currentUser?.role && (
            <span className="text-[10px] font-black rounded px-2 py-0.5" style={{ background: 'rgba(155,114,243,0.2)', color: '#9b72f3' }}>{currentUser.role}</span>
          )}
        </div>

        {/* Territory selector */}
        <div className="mb-4">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#0dbfcf' }}>Territory</label>
          <div className="grid grid-cols-2 gap-3">
            {['USA', 'Canada'].map(t => (
              <button key={t} onClick={() => setTerritory(t)}
                className="p-4 rounded-xl text-center font-black text-sm transition-all"
                style={territory === t
                  ? { background: 'linear-gradient(135deg,#0dbfcf,#4285f4)', color: 'white', boxShadow: '0 4px 20px rgba(13,191,207,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                }>
                <Globe size={18} className="mx-auto mb-1.5" />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="mb-4">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#9b72f3' }}>Region</label>
          <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(155,114,243,0.08)', border: '1px solid rgba(155,114,243,0.15)' }}>
            <MapPin size={13} style={{ color: '#9b72f3' }} />
            <span className="text-sm font-bold text-white">North America</span>
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>auto-assigned</span>
          </div>
        </div>

        {/* Notification opt-in */}
        <div className="mb-5">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#fbbc04' }}>Sound Notifications</label>
          <div className="p-3 rounded-xl flex items-center justify-between gap-3"
            style={{ background: 'rgba(251,188,4,0.06)', border: '1px solid rgba(251,188,4,0.15)' }}>
            <div className="flex items-center gap-2">
              {notifEnabled ? <Bell size={14} style={{ color: '#fbbc04' }} /> : <BellOff size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
              <div>
                <p className="text-xs font-bold text-white">{notifEnabled ? 'Enabled' : 'Disabled'}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {notifEnabled ? 'Meeting reminders + announcements' : 'Tap to enable alerts'}
                </p>
              </div>
            </div>
            <button onClick={handleNotifToggle}
              className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: notifEnabled ? '#fbbc04' : 'rgba(255,255,255,0.12)' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: notifEnabled ? '24px' : '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            </button>
          </div>
          {notifStatus && (
            <p className="text-[10px] mt-1.5 font-bold"
              style={{ color: notifStatus.includes('enabled') ? '#34a853' : '#d96570' }}>
              {notifStatus}
            </p>
          )}
        </div>

        <button onClick={handleSave} disabled={!territory} className="btn-primary w-full mb-3">
          {saved ? <><span style={{ color: '#34a853' }}>✓</span> Saved!</> : <><Globe size={14} /> Save Profile</>}
        </button>

        {/* Logout button — always visible on mobile, also on desktop */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
          style={{ background: 'rgba(217,101,112,0.10)', border: '1px solid rgba(217,101,112,0.2)', color: '#d96570' }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   AUTH PORTAL  (Sign In + Create Account)
───────────────────────────────────────────────────── */
const ALL_ROLES = ['EY', 'YFJ', 'Deacon', 'RC', 'TC', 'YFJ Chair'];

function AuthPortal() {
  const { register } = useAuth();
  const [mode, setMode] = useState('signin');

  /* ── Sign In ── */
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
        'auth/too-many-requests': 'Too many attempts. Please wait.',
        'auth/invalid-email': 'Please enter a valid email address.',
      };
      setError(msgs[err.code] || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  /* ── Create Account ── */
  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', confirm: '', role: '' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.fullName.trim()) return setRegError('Full name is required.');
    if (!regForm.role) return setRegError('Please select your role.');
    if (regForm.password.length < 6) return setRegError('Password must be at least 6 characters.');
    if (regForm.password !== regForm.confirm) return setRegError('Passwords do not match.');
    setRegLoading(true);
    try {
      await register({ email: regForm.email, password: regForm.password, fullName: regForm.fullName, role: regForm.role });
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
      };
      setRegError(msgs[err.code] || 'Registration failed. Please try again.');
    }
    setRegLoading(false);
  };

  const BG = (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" /><div className="aurora-blob-2" /><div className="aurora-blob-3" /><div className="aurora-blob-4" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5" style={{ background: '#04080F' }}>
      <div className="aurora-blob-1" /><div className="aurora-blob-2" /><div className="aurora-blob-3" /><div className="aurora-blob-4" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="section-card p-7 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl gemini-gradient flex items-center justify-center animate-pulse-glow">
                <Sparkles size={26} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight mb-1">Youth for Jesus</h1>
            <p className="text-white/35 text-sm font-semibold">North America</p>
            <p className="text-white/20 text-xs italic mt-2">"I understood by the books..."</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button onClick={() => { setMode('signin'); setError(''); setRegError(''); }}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide transition-all"
              style={mode === 'signin' ? { background: 'linear-gradient(135deg,#4285f4,#9b72f3)', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
              Sign In
            </button>
            <button onClick={() => { setMode('register'); setError(''); setRegError(''); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-wide transition-all"
              style={mode === 'register' ? { background: 'linear-gradient(135deg,#9b72f3,#d96570)', color: 'white' } : { color: 'rgba(255,255,255,0.4)' }}>
              <UserPlus size={12} /> Create Account
            </button>
          </div>

          {/* ── SIGN IN FORM ── */}
          {mode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Email Address</label>
                <input type="email" autoComplete="email" className="yfj-input" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} autoComplete="current-password" className="yfj-input pr-10"
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25"><p className="text-red-400 text-sm">{error}</p></div>}
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
                {loading ? <><div className="spinner" /> Signing in...</> : <><Sparkles size={15} /> Sign In</>}
              </button>
            </form>
          )}

          {/* ── CREATE ACCOUNT FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1.5">Full Name *</label>
                <input className="yfj-input" placeholder="Your full name" value={regForm.fullName}
                  onChange={e => setRegForm({ ...regForm, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1.5">Email Address *</label>
                <input type="email" autoComplete="email" className="yfj-input" placeholder="your@email.com"
                  value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1.5">Role *</label>
                <select className="yfj-input" value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })} required>
                  <option value="">Select your role...</option>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} autoComplete="new-password" className="yfj-input pr-10"
                    placeholder="At least 6 characters" value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/35 mb-1.5">Confirm Password *</label>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" className="yfj-input"
                  placeholder="Repeat password" value={regForm.confirm}
                  onChange={e => setRegForm({ ...regForm, confirm: e.target.value })} required />
              </div>
              {regError && <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25"><p className="text-red-400 text-sm">{regError}</p></div>}
              <button type="submit" disabled={regLoading} className="btn-primary w-full !mt-4" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
                {regLoading ? <><div className="spinner" /> Creating account...</> : <><UserPlus size={15} /> Create Account</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────── */
function getData(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }

function DashboardPanel({ setActiveTab, currentUser, isMobile }) {
  const [counts, setCounts] = useState({ notes: 0, weekMeetings: 0, announcements: 0, completedMeetings: 0 });
  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('date'));
    const q2 = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(q, snap => {
      const meetings = snap.docs.map(d => d.data());
      const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
      setCounts(c => ({
        ...c,
        weekMeetings: meetings.filter(m => m.date && new Date(m.date + 'T00:00:00') >= weekStart).length,
        completedMeetings: meetings.filter(m => m.status === 'Completed').length,
      }));
    });
    const unsub2 = onSnapshot(q2, snap => setCounts(c => ({ ...c, announcements: snap.size })));
    return () => { unsub1(); unsub2(); };
  }, []);

  const STATS = [
    { label: 'This Week',  value: counts.weekMeetings,      icon: <CalendarDays size={16} />, color: '#4285f4', bg: 'rgba(66,133,244,0.14)' },
    { label: 'News',       value: counts.announcements,     icon: <Megaphone size={16} />,    color: '#34a853', bg: 'rgba(52,168,83,0.14)' },
    { label: 'Done',       value: counts.completedMeetings, icon: <CheckCircle size={16} />,  color: '#fbbc04', bg: 'rgba(251,188,4,0.14)' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Write a Note',      desc: 'Record meeting notes',        tab: 'notes',         gradient: 'linear-gradient(135deg,#9b72f3,#d96570)' },
    { label: "Week's Agenda",     desc: "View this week's schedule",   tab: 'agenda',        gradient: 'linear-gradient(135deg,#d96570,#fbbc04)' },
    { label: 'Schedule Meeting',  desc: 'Add to calendar & roster',    tab: 'calendar',      gradient: 'linear-gradient(135deg,#0dbfcf,#4285f4)' },
    { label: 'Ask Cub',           desc: 'Generate AI-powered reports', tab: 'reports',       gradient: 'linear-gradient(135deg,#fbbc04,#d96570)' },
    { label: 'Post Announcement', desc: 'Share organization news',     tab: 'announcements', gradient: 'linear-gradient(135deg,#34a853,#0dbfcf)' },
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
            <p className="text-white/35 text-xs md:text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="py-3 px-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(66,133,244,0.1),rgba(155,114,243,0.15))' }}>
            <p className="text-xs font-bold text-white italic">"I understood by the books..."</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card p-4 md:p-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5">{s.value}</div>
            <div className="text-[10px] text-white/35 font-bold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">Quick Actions</p>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {QUICK_ACTIONS.map((a, i) => (
            <button key={i} onClick={() => setActiveTab(a.tab)}
              className="glass-card text-left shimmer-hover group active:scale-[0.98] transition-all"
              style={{ padding: isMobile ? '14px 16px' : '20px' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.gradient }}>
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
    const q = query(collection(db, 'meetings'), orderBy('date'));
    const unsub = onSnapshot(q, snap => {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      setMeetings(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.date && new Date(m.date + 'T00:00:00') >= now && m.status !== 'Cancelled' && m.status !== 'Completed')
          .slice(0, isMobile ? 3 : 4)
      );
    });
    return unsub;
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
                <div className="text-lg font-black text-white leading-none">{m.date ? new Date(m.date + 'T00:00:00').getDate() : '?'}</div>
                <div className="text-[9px] font-bold text-white/30 uppercase">{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) : ''}</div>
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
        <div className="section-header-icon" style={{ background: 'linear-gradient(135deg,#d96570,#fbbc04)' }}>
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
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: t.color }} />
            <p className="text-xs text-white/50 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
