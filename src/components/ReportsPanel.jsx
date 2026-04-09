import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Calendar, BarChart3, BookOpen, Download, Globe, Lock, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { compileYFJReport } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, serverTimestamp, getDocs
} from 'firebase/firestore';

const PRIVILEGED_ROLES = ['YFJ Chair', 'TC', 'Territory Coordinator', 'RC', 'Regional Coordinator', 'Deacon'];
const RESTRICTED_ROLES = ['EY', 'YFJ'];

const PERIODS = [
  { id: 'weekly',    label: 'Weekly',    icon: <Calendar size={14} />,  color: '#4285f4', desc: 'Current week summary' },
  { id: 'monthly',   label: 'Monthly',   icon: <BarChart3 size={14} />, color: '#9b72f3', desc: 'Monthly overview' },
  { id: 'quarterly', label: 'Quarterly', icon: <FileText size={14} />,  color: '#d96570', desc: 'Quarterly analysis' },
  { id: 'yearly',    label: 'Yearly',    icon: <BookOpen size={14} />,  color: '#fbbc04', desc: 'Annual report' },
];

function getDateRange(period) {
  const now = new Date();
  let start, end, label;
  if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0,0,0,0);
    end = new Date(start); end.setDate(start.getDate() + 6);
    label = `Week of ${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    label = now.toLocaleDateString('en-US', {month:'long', year:'numeric'});
  } else if (period === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), q * 3 + 3, 0);
    label = `Q${q + 1} ${now.getFullYear()}`;
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
    label = `Full Year ${now.getFullYear()}`;
  }
  return { start, end, label };
}

async function buildContext(period, uid, userRole) {
  const { start, end, label } = getDateRange(period);
  const isRestricted = RESTRICTED_ROLES.includes(userRole);

  const notesSnap = await getDocs(query(collection(db, 'users', uid, 'notes'), orderBy('createdAt', 'desc')));
  const allNotes = notesSnap.docs.map(d => d.data()).filter(n => {
    const d = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || 0);
    return d >= start && d <= end;
  });

  const meetingsSnap = await getDocs(query(collection(db, 'meetings'), orderBy('date')));
  const allMeetings = meetingsSnap.docs.map(d => d.data()).filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date + 'T00:00:00');
    return d >= start && d <= end;
  });

  let ctx = `REPORT PERIOD: ${label.toUpperCase()}\nPERIOD TYPE: ${period.toUpperCase()} REPORT\n`;
  if (isRestricted) ctx += `ACCESS LEVEL: Standard\n`;
  ctx += '\n';

  ctx += `=== MEETINGS (${allMeetings.length} total) ===\n`;
  if (!allMeetings.length) ctx += 'No meetings in this period.\n';
  else allMeetings.forEach(m => {
    ctx += `\nMeeting: ${m.title}\n`;
    if (m.date) ctx += `Date: ${m.date}\n`;
    if (m.timeStart) ctx += `Time: ${m.timeStart}${m.timeEnd ? ' - ' + m.timeEnd : ''}\n`;
    if (m.chair) ctx += `Chair: ${m.chair}\n`;
    if (m.status) ctx += `Status: ${m.status}\n`;
    if (m.agenda) ctx += `Agenda:\n${m.agenda}\n`;
  });

  ctx += `\n=== MEETING NOTES (${allNotes.length} entries) ===\n`;
  if (!allNotes.length) ctx += 'No notes in this period.\n';
  else allNotes.forEach(n => {
    ctx += `\nTitle: ${n.title}\nDate: ${n.date || ''}\n`;
    if (n.summary) ctx += `Summary: ${n.summary}\n`;
    ctx += `Content:\n${n.details || ''}\n`;
  });

  return ctx;
}

export default function ReportsPanel() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const userRole = currentUser?.role || '';

  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [publishedReports, setPublishedReports] = useState([]);
  const [viewSaved, setViewSaved] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [showPublished, setShowPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  /* ── My private reports ── */
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'users', uid, 'reports'), orderBy('generatedAt', 'desc'));
    const unsub = onSnapshot(q, snap => setSavedReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [uid]);

  /* ── Published reports (org-wide) ── */
  useEffect(() => {
    const q = query(collection(db, 'publishedReports'), orderBy('publishedAt', 'desc'));
    const unsub = onSnapshot(q, snap => setPublishedReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const generate = async () => {
    if (!uid) return;
    setLoading(true); setReport(''); setViewSaved(null);
    const context = await buildContext(period, uid, userRole);
    const { label } = getDateRange(period);
    const prompt = `Generate a professional YFJ North America ${period} report for: ${label}\n\n${context}`;
    try {
      const result = await compileYFJReport(prompt);
      setReport(result);
    } catch {
      setReport('Error generating report. Please check your AI configuration.');
    }
    setLoading(false);
  };

  const saveReport = async () => {
    if (!report || !uid) return;
    const { label } = getDateRange(period);
    await addDoc(collection(db, 'users', uid, 'reports'), {
      period, label, content: report,
      generatedAt: serverTimestamp(),
      authorName: currentUser?.fullName || currentUser?.email || 'Unknown',
      authorRole: userRole,
      published: false,
    });
  };

  const publishReport = async (savedReport) => {
    if (!uid) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, 'publishedReports'), {
        ...savedReport,
        publishedAt: serverTimestamp(),
        publishedBy: currentUser?.fullName || currentUser?.email || 'Unknown',
        publishedRole: userRole,
      });
    } catch {}
    setPublishing(false);
  };

  const download = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const periodInfo = PERIODS.find(p => p.id === period);
  const hasOutput = report || viewSaved;
  const activeReport = viewSaved ? viewSaved.content : report;
  const activeLabel = viewSaved ? viewSaved.label : getDateRange(period).label;
  const activePeriod = viewSaved ? viewSaved.period : period;
  const isViewingPublished = viewSaved && publishedReports.some(p => p.id === viewSaved.id);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: '#fbbc04' }}>Cub Intelligence</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Reports</h2>
          <p className="text-xs md:text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {publishedReports.length > 0 && (
            <button onClick={() => { setShowPublished(!showPublished); setShowSaved(false); }} className="btn-secondary text-xs">
              <Globe size={12} /> Published ({publishedReports.length})
            </button>
          )}
          {savedReports.length > 0 && (
            <button onClick={() => { setShowSaved(!showSaved); setShowPublished(false); }} className="btn-secondary text-xs">
              <Lock size={12} /> My Reports ({savedReports.length})
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => { setPeriod(p.id); setReport(''); setViewSaved(null); }}
            className={`period-tab flex-shrink-0 ${period === p.id ? 'active' : 'inactive'}`}>
            <span className="flex items-center gap-1.5">{p.icon} {p.label}</span>
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading} className="btn-primary w-full mb-6">
        {loading ? <><div className="spinner !w-4 !h-4" /> Cub is thinking...</> : <><Sparkles size={15} /> Ask Cub — {periodInfo?.label} Report</>}
      </button>

      {/* My private reports */}
      {showSaved && savedReports.length > 0 && (
        <div className="section-card p-4 mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={12} style={{ color: '#9b72f3' }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9b72f3' }}>My Private Reports</p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {savedReports.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                style={viewSaved?.id === r.id ? { borderColor: 'rgba(155,114,243,0.3)', background: 'rgba(155,114,243,0.08)' } : { borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                onClick={() => { setViewSaved(r); setReport(''); setShowSaved(false); }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/70 truncate">{r.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-purple">{r.period}</span>
                    <span className="text-[10px] text-white/30">
                      {r.generatedAt?.toDate ? r.generatedAt.toDate().toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); publishReport(r); }} disabled={publishing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all flex-shrink-0"
                  style={{ background: 'rgba(52,168,83,0.12)', color: '#34a853', border: '1px solid rgba(52,168,83,0.2)' }}>
                  <Globe size={10} /> Publish
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published reports (org-wide, everyone sees) */}
      {showPublished && publishedReports.length > 0 && (
        <div className="section-card p-4 mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={12} style={{ color: '#34a853' }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34a853' }}>Published Reports</p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {publishedReports.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                style={viewSaved?.id === r.id ? { borderColor: 'rgba(52,168,83,0.3)', background: 'rgba(52,168,83,0.08)' } : { borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
                onClick={() => { setViewSaved(r); setReport(''); setShowPublished(false); }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white/70 truncate">{r.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-teal">{r.period}</span>
                    <span className="text-[10px] text-white/30">by {r.publishedBy}</span>
                  </div>
                </div>
                <Eye size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasOutput && !loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{ minHeight: '320px' }}>
          <div className="w-16 h-16 rounded-full gemini-gradient flex items-center justify-center mb-5 animate-pulse-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Meet Cub</h3>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs">
            Your YFJ AI assistant. Select a period above and let Cub compile your meetings and notes into a professional report.
          </p>
          <div className="mt-4 flex items-center gap-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <div className="flex items-center gap-1"><Lock size={10} /> Reports are private by default</div>
            <span>·</span>
            <div className="flex items-center gap-1"><Globe size={10} /> Publish to share with all</div>
          </div>
          <p className="mt-4 text-[11px] text-white/20 italic">"I understood by the books..."</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{ minHeight: '320px' }}>
          <div className="w-14 h-14 rounded-full gemini-gradient flex items-center justify-center mb-4"
            style={{ animation: 'spin-slow 1.8s linear infinite' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <p className="text-white/70 font-black text-sm">Cub is thinking...</p>
          <p className="text-white/30 text-xs mt-1">Reviewing your records</p>
        </div>
      )}

      {/* Report output */}
      {hasOutput && !loading && (
        <div className="report-container animate-slide-up">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07] flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl gemini-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Cub Report</p>
                <p className="text-xs font-bold text-white">{activeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-purple">{activePeriod}</span>
              {isViewingPublished && <span className="badge badge-teal"><Globe size={8} /> Published</span>}
              {!isViewingPublished && viewSaved && <span className="badge" style={{ background: 'rgba(251,188,4,0.15)', color: '#fbbc04' }}><Lock size={8} /> Private</span>}
              {report && !viewSaved && (
                <button onClick={saveReport} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px' }}>
                  <Lock size={11} /> Save Private
                </button>
              )}
              {viewSaved && !isViewingPublished && (
                <button onClick={() => publishReport(viewSaved)} disabled={publishing} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px', color: '#34a853', borderColor: 'rgba(52,168,83,0.3)' }}>
                  <Globe size={11} /> {publishing ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <button onClick={() => download(activeReport, `yfj-cub-${activePeriod}-${Date.now()}.md`)}
                className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px' }}>
                <Download size={11} /> Export
              </button>
            </div>
          </div>
          <div className="prose-yfj max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeReport}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
