import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Calendar, BarChart3, BookOpen, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { compileYFJReport } from '../api/aiService';
import { useAuth } from '../context/AuthContext';

const PRIVILEGED_ROLES = ['YFJ Chair', 'TC', 'Territory Coordinator', 'RC', 'Regional Coordinator', 'Deacon'];
const RESTRICTED_ROLES = ['EY', 'YFJ'];

const NOTES_KEY = 'yfj_notes';
const MEETINGS_KEY = 'yfj_meetings';
const REPORTS_KEY = 'yfj_saved_reports';

function getData(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

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
    label = `Week of ${start.toLocaleDateString('en-US', {month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}`;
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

function buildContext(period, userRole) {
  const { start, end, label } = getDateRange(period);
  const isRestricted = RESTRICTED_ROLES.includes(userRole);

  const allNotes = getData(NOTES_KEY).filter(n => {
    const d = new Date(n.createdAt);
    const inRange = d >= start && d <= end;
    const visible = !isRestricted || !PRIVILEGED_ROLES.includes(n.creatorRole || n.role);
    return inRange && visible;
  });

  const allMeetings = getData(MEETINGS_KEY).filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date + 'T00:00:00');
    const inRange = d >= start && d <= end;
    const visible = !isRestricted || !PRIVILEGED_ROLES.includes(m.creatorRole);
    return inRange && visible;
  });

  let ctx = `REPORT PERIOD: ${label.toUpperCase()}\nPERIOD TYPE: ${period.toUpperCase()} REPORT\n`;
  if (isRestricted) ctx += `ACCESS LEVEL: Standard (some privileged records excluded)\n`;
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
    ctx += `\nTitle: ${n.title}\nAuthor: ${n.author}${n.role ? ' (' + n.role + ')' : ''}\nDate: ${new Date(n.createdAt).toLocaleDateString()}\n`;
    if (n.summary) ctx += `Summary: ${n.summary}\n`;
    ctx += `Content:\n${n.details || n.content || ''}\n`;
  });

  return ctx;
}

export default function ReportsPanel() {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || '';

  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [viewSaved, setViewSaved] = useState(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => { setSavedReports(getData(REPORTS_KEY)); }, []);

  const generate = async () => {
    setLoading(true); setReport(''); setViewSaved(null);
    const context = buildContext(period, userRole);
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

  const saveReport = () => {
    if (!report) return;
    const { label } = getDateRange(period);
    const all = getData(REPORTS_KEY);
    const newR = { id: Date.now().toString(), period, label, content: report, generatedAt: new Date().toISOString() };
    const updated = [newR, ...all].slice(0, 20);
    saveData(REPORTS_KEY, updated);
    setSavedReports(updated);
  };

  const download = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
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
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{color: '#fbbc04'}}>Cub Intelligence</p>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Reports</h2>
          <p className="text-xs md:text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        {savedReports.length > 0 && (
          <button onClick={() => setShowSaved(!showSaved)} className="btn-secondary text-xs">
            <FileText size={12} /> Saved ({savedReports.length})
          </button>
        )}
      </div>

      {/* Period selector — horizontal on mobile */}
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

      {/* Ask Cub button */}
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
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Saved Reports</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {savedReports.map(r => (
              <button
                key={r.id}
                onClick={() => { setViewSaved(r); setReport(''); setShowSaved(false); }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${viewSaved?.id === r.id ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/05 bg-white/[0.02] hover:bg-white/[0.04]'}`}
              >
                <p className="text-xs font-bold text-white/70 truncate">{r.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-purple">{r.period}</span>
                  <span className="text-[10px] text-white/30">{new Date(r.generatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasOutput && !loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{minHeight: '320px'}}>
          <div className="w-16 h-16 rounded-full gemini-gradient flex items-center justify-center mb-5 animate-pulse-glow">
            <Sparkles size={28} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Meet Cub</h3>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs">
            Your YFJ AI assistant. Select a period above and let Cub compile your meetings and notes into a professional report.
          </p>
          <p className="mt-5 text-[11px] text-white/20 italic">"I understood by the books..."</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="section-card flex flex-col items-center justify-center text-center p-12" style={{minHeight: '320px'}}>
          <div className="w-14 h-14 rounded-full gemini-gradient flex items-center justify-center mb-4"
            style={{animation: 'spin-slow 1.8s linear infinite'}}>
            <Sparkles size={24} className="text-white" />
          </div>
          <p className="text-white/70 font-black text-sm">Cub is thinking...</p>
          <p className="text-white/30 text-xs mt-1">Reviewing your records</p>
        </div>
      )}

      {/* Report output */}
      {hasOutput && !loading && (
        <div className="report-container animate-slide-up">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
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
              {report && !viewSaved && (
                <button onClick={saveReport} className="btn-secondary" style={{padding: '6px 12px', fontSize: '10px'}}>
                  <FileText size={11} /> Save
                </button>
              )}
              <button
                onClick={() => download(activeReport, `yfj-cub-${activePeriod}-${Date.now()}.md`)}
                className="btn-secondary" style={{padding: '6px 12px', fontSize: '10px'}}
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
