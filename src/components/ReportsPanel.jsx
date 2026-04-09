import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Calendar, BarChart3, BookOpen, Download, Globe, Lock, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { compileYFJReport } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const PRIVILEGED_ROLES = ['YFJ Chair', 'TC', 'Territory Coordinator', 'RC', 'Regional Coordinator', 'Deacon'];
const RESTRICTED_ROLES = ['EY', 'YFJ'];
const NOTES_COLLECTION = 'notes';
const MEETINGS_COLLECTION = 'meetings';

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
    start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
    end = new Date(start); end.setDate(start.getDate() + 6);
    label = `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

async function buildContext(period, userRole) {
  const { start, end, label } = getDateRange(period);
  const isRestricted = RESTRICTED_ROLES.includes(userRole);

  const notesSnap = await getDocs(query(collection(db, NOTES_COLLECTION)));
  const meetingsSnap = await getDocs(query(collection(db, MEETINGS_COLLECTION)));

  const allNotes = notesSnap.docs.map(d => d.data()).filter(n => {
    const d = n.createdAtISO ? new Date(n.createdAtISO) : null;
    if (!d) return false;
    const inRange = d >= start && d <= end;
    const visible = !isRestricted || !PRIVILEGED_ROLES.includes(n.creatorRole || n.role);
    return inRange && visible;
  });

  const allMeetings = meetingsSnap.docs.map(d => d.data()).filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date + 'T00:00:00');
    const inRange = d >= start && d <= end;
    const visible = !isRestricted || !PRIVILEGED_ROLES.includes(m.creatorRole);
    return inRange && visible;
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
    if (m.type) ctx += `Type: ${m.type}\n`;
    if (m.status) ctx += `Status: ${m.status}\n`;
    if (m.location) ctx += `Location: ${m.location}\n`;
    if (m.agenda) ctx += `Agenda:\n${m.agenda}\n`;
    if (m.notes) ctx += `Notes: ${m.notes}\n`;
  });

  ctx += `\n=== MEETING NOTES (${allNotes.length} entries) ===\n`;
  if (!allNotes.length) ctx += 'No notes in this period.\n';
  else allNotes.forEach(n => {
    ctx += `\nTitle: ${n.title}\nAuthor: ${n.author}${n.role ? ' (' + n.role + ')' : ''}\n`;
    if (n.summary) ctx += `Summary: ${n.summary}\n`;
    ctx += `Content:\n${n.details || n.content || ''}\n`;
  });

  return ctx;
}

export default function ReportsPanel() {
  const { currentUser } = useAuth();
  const { showDone } = useToast();
  const userRole = currentUser?.role || '';

  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [viewSaved, setViewSaved] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'users', currentUser.uid, 'reports'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setSavedReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentUser?.uid]);

  const generate = async () => {
    setLoading(true); setReport(''); setViewSaved(null);
    const context = await buildContext(period, userRole);
    const { label } = getDateRange(period);
    const prompt = `Generate a professional YFJ North America ${period} report for: ${label}\n\n${context}`;
    try {
      const result = await compileYFJReport(prompt);
      setReport(result);
    } catch {
      setReport('Error generating report. Please check the AI configuration.');
    }
    setLoading(false);
  };

  const saveReport = async () => {
    if (!report || !currentUser?.uid) return;
    setSaving(true);
    const { label } = getDateRange(period);
    await addDoc(collection(db, 'users', currentUser.uid, 'reports'), {
      period,
      label,
      content: report,
      generatedAt: new Date().toISOString(),
      published: false,
      createdAt: serverTimestamp(),
    });
    setSaving(false);
    showDone('Report saved!');
  };

  const publishReport = async (r) => {
    if (!currentUser?.uid) return;
    setPublishing(true);
    const pubData = {
      ...r,
      publishedBy: currentUser.fullName || currentUser.email,
      publishedByRole: userRole,
      publishedAt: serverTimestamp(),
      publishedAtISO: new Date().toISOString(),
      published: true,
    };
    await setDoc(doc(db, 'publishedReports', r.id), pubData);
    await updateDoc(doc(db, 'users', currentUser.uid, 'reports', r.id), { published: true });
    setPublishing(false);
    showDone('Report published!');
  };

  const download = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showDone('Downloading...');
  };

  const periodInfo = PERIODS.find(p => p.id === period);
  const hasOutput = report || viewSaved;
  const activeReport = viewSaved ? viewSaved.content : report;
  const activeLabel = viewSaved ? viewSaved.label : getDateRange(period).label;
  const activePeriod = viewSaved ? viewSaved.period : period;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: '#fbbc04' }}>Cub Intelligence</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Reports</h2>
          <p className="text-xs md:text-sm text-white/60 mt-1 italic">"I understood by the books..."</p>
        </div>
        {savedReports.length > 0 && (
          <button onClick={() => setShowSaved(!showSaved)} className="btn-secondary text-xs">
            <FileText size={12} /> My Reports ({savedReports.length})
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: 'rgba(155,114,243,0.07)', border: '1px solid rgba(155,114,243,0.15)' }}>
        <Lock size={11} style={{ color: '#9b72f3' }} />
        <p className="text-[11px] text-white/50">Reports are <strong className="text-white/80">private to your account</strong> unless you choose to publish them.</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => { setPeriod(p.id); setReport(''); setViewSaved(null); }}
            className={`period-tab flex-shrink-0 ${period === p.id ? 'active' : 'inactive'}`}
          >
            <span className="flex items-center gap-1.5">{p.icon} {p.label}</span>
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading} className="btn-primary w-full mb-6">
        {loading ? (
          <><div className="spinner !w-4 !h-4" /> Cub is thinking...</>
        ) : (
          <><Sparkles size={15} /> Ask Cub — {periodInfo?.label} Report</>
        )}
      </button>

      {/* Saved reports list */}
      {showSaved && savedReports.length > 0 && (
        <div className="section-card p-4 mb-6 animate-slide-up">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-3">My Reports</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {savedReports.map(r => (
              <div
                key={r.id}
                className={`w-full text-left p-3 rounded-xl border transition-all ${viewSaved?.id === r.id ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/05 bg-white/[0.02] hover:bg-white/[0.04]'}`}
              >
                <div className="flex items-center gap-2">
                  <button onClick={() => { setViewSaved(r); setReport(''); setShowSaved(false); }} className="flex-1 text-left">
                    <p className="text-xs font-bold text-white/70 truncate">{r.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-purple">{r.period}</span>
                      <span className="text-[10px] text-white/60">{r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : ''}</span>
                      {r.published && <span className="badge badge-green"><Globe size={7} /> Published</span>}
                    </div>
                  </button>
                  {!r.published && (
                    <button
                      onClick={() => publishReport(r)}
                      disabled={publishing}
                      className="flex-shrink-0 text-[9px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      style={{ background: 'rgba(52,168,83,0.15)', color: '#34a853', border: '1px solid rgba(52,168,83,0.25)' }}
                    >
                      <Globe size={9} /> Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasOutput && !loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{ minHeight: '320px' }}>
          <div className="w-16 h-16 rounded-full gemini-gradient flex items-center justify-center mb-5 animate-pulse-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Meet Cub</h3>
          <p className="text-white/65 text-sm leading-relaxed max-w-xs">
            Your YFJ AI assistant. Select a period above and let Cub compile your meetings and notes into a professional report.
          </p>
          <p className="mt-5 text-[11px] text-white/52 italic">"I understood by the books..."</p>
        </div>
      )}

      {loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{ minHeight: '320px' }}>
          <div className="w-14 h-14 rounded-full gemini-gradient flex items-center justify-center mb-4"
            style={{ animation: 'spin-slow 1.8s linear infinite' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <p className="text-white/70 font-black text-sm">Cub is thinking...</p>
          <p className="text-white/60 text-xs mt-1">Reviewing your records</p>
        </div>
      )}

      {hasOutput && !loading && (
        <div className="report-container animate-slide-up">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl gemini-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Cub Report</p>
                  {viewSaved?.published ? (
                    <span className="badge badge-green"><Globe size={7} /> Published</span>
                  ) : (
                    <span className="badge badge-purple"><Lock size={7} /> Private</span>
                  )}
                </div>
                <p className="text-xs font-bold text-white">{activeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-purple">{activePeriod}</span>
              {report && !viewSaved && (
                <button onClick={saveReport} disabled={saving} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px' }}>
                  {saving ? <><div className="spinner !w-3 !h-3" /> Saving...</> : <><FileText size={11} /> Save</>}
                </button>
              )}
              {viewSaved && !viewSaved.published && (
                <button onClick={() => publishReport(viewSaved)} disabled={publishing} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px', color: '#34a853' }}>
                  <Globe size={11} /> Publish
                </button>
              )}
              <button
                onClick={() => download(activeReport, `yfj-cub-${activePeriod}-${Date.now()}.md`)}
                className="btn-secondary" style={{ padding: '6px 12px', fontSize: '10px' }}
              >
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
