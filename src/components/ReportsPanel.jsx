import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Calendar, BarChart3, BookOpen, Download, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { compileYFJReport } from '../api/aiService';

const NOTES_KEY = 'yfj_notes';
const MEETINGS_KEY = 'yfj_meetings';
const REPORTS_KEY = 'yfj_saved_reports';

function getData(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

const PERIODS = [
  { id: 'weekly', label: 'Weekly', icon: <Calendar size={14} />, color: '#4285f4', desc: 'Current week summary' },
  { id: 'monthly', label: 'Monthly', icon: <BarChart3 size={14} />, color: '#9b72f3', desc: 'Monthly overview' },
  { id: 'quarterly', label: 'Quarterly', icon: <FileText size={14} />, color: '#d96570', desc: 'Quarterly analysis' },
  { id: 'yearly', label: 'Yearly', icon: <BookOpen size={14} />, color: '#fbbc04', desc: 'Annual report' },
];

function getDateRange(period) {
  const now = new Date();
  let start, end, label;
  if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0,0,0,0);
    end = new Date(start); end.setDate(start.getDate() + 6);
    label = `Week of ${start.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} – ${end.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    label = now.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
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

function buildContext(period) {
  const { start, end, label } = getDateRange(period);
  const notes = getData(NOTES_KEY).filter(n => {
    const d = new Date(n.createdAt);
    return d >= start && d <= end;
  });
  const meetings = getData(MEETINGS_KEY).filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date + 'T00:00:00');
    return d >= start && d <= end;
  });

  let ctx = `REPORT PERIOD: ${label.toUpperCase()}\nPERIOD TYPE: ${period.toUpperCase()} REPORT\n\n`;
  ctx += `=== MEETINGS (${meetings.length} total) ===\n`;
  if (meetings.length === 0) { ctx += 'No meetings scheduled in this period.\n'; }
  else {
    meetings.forEach(m => {
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
  }

  ctx += `\n=== MEETING NOTES (${notes.length} entries) ===\n`;
  if (notes.length === 0) { ctx += 'No meeting notes recorded in this period.\n'; }
  else {
    notes.forEach(n => {
      ctx += `\nNote Title: ${n.title}\n`;
      ctx += `Author: ${n.author}${n.role ? ' (' + n.role + ')' : ''}\n`;
      ctx += `Date: ${new Date(n.createdAt).toLocaleDateString()}\n`;
      ctx += `Content:\n${n.content}\n`;
    });
  }

  return ctx;
}

export default function ReportsPanel() {
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [viewSaved, setViewSaved] = useState(null);

  useEffect(() => { setSavedReports(getData(REPORTS_KEY)); }, []);

  const generate = async () => {
    setLoading(true);
    setReport('');
    const context = buildContext(period);
    const { label } = getDateRange(period);
    const prompt = `Generate a professional YFJ North America ${period} report for: ${label}\n\n${context}`;
    try {
      const result = await compileYFJReport(prompt);
      setReport(result);
    } catch (e) {
      setReport('Error generating report. Please check your AI configuration.');
    }
    setLoading(false);
  };

  const saveReport = () => {
    if (!report) return;
    const { label } = getDateRange(period);
    const all = getData(REPORTS_KEY);
    const newR = {
      id: Date.now().toString(),
      period, label,
      content: report,
      generatedAt: new Date().toISOString(),
    };
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

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-2" style={{color: '#fbbc04'}}>AI Intelligence Suite</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Reports</h2>
          <p className="text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left panel: controls + saved */}
        <div className="space-y-5">
          {/* Period selector */}
          <div className="section-card p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Report Period</p>
            <div className="space-y-2">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPeriod(p.id); setReport(''); setViewSaved(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${period === p.id ? 'border-white/15 bg-white/[0.06]' : 'border-transparent hover:bg-white/[0.03]'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: `${p.color}22`, color: p.color}}>
                    {p.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-black ${period === p.id ? 'text-white' : 'text-white/50'}`}>{p.label}</p>
                    <p className="text-[10px] text-white/25">{p.desc}</p>
                  </div>
                  {period === p.id && <div className="w-2 h-2 rounded-full" style={{background: p.color}} />}
                </button>
              ))}
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="btn-primary w-full mt-5"
            >
              {loading ? (
                <><div className="spinner !w-4 !h-4" /> Generating...</>
              ) : (
                <><Sparkles size={14} /> Generate {periodInfo?.label} Report</>
              )}
            </button>
          </div>

          {/* Saved reports */}
          {savedReports.length > 0 && (
            <div className="section-card p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Saved Reports</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedReports.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setViewSaved(r); setReport(''); }}
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
        </div>

        {/* Right panel: report display */}
        <div className="xl:col-span-2">
          {!report && !viewSaved && !loading && (
            <div className="section-card h-full flex items-center justify-center p-12 text-center" style={{minHeight: '400px'}}>
              <div>
                <div className="w-20 h-20 rounded-full gemini-gradient flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Ready to Generate</h3>
                <p className="text-white/35 text-sm leading-relaxed max-w-xs mx-auto">
                  Select a report period and click "Generate" — the AI will compile your meetings, notes, and traditions into a professional report.
                </p>
                <p className="mt-6 text-[11px] text-white/20 italic">"I understood by the books..."</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="section-card h-full flex items-center justify-center p-12" style={{minHeight: '400px'}}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full gemini-gradient flex items-center justify-center mx-auto mb-4" style={{animation: 'spin-slow 2s linear infinite'}}>
                  <Sparkles size={28} className="text-white" />
                </div>
                <p className="text-white/60 font-bold">Compiling Intelligence...</p>
                <p className="text-white/30 text-sm mt-1">AI is reviewing your records</p>
              </div>
            </div>
          )}

          {(report || viewSaved) && (() => {
            const activeReport = viewSaved ? viewSaved.content : report;
            const activeLabel = viewSaved ? viewSaved.label : getDateRange(period).label;
            const activePeriod = viewSaved ? viewSaved.period : period;
            return (
              <div className="report-container animate-slide-up">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gemini-gradient flex items-center justify-center">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">AI Compiled Report</p>
                      <p className="text-sm font-bold text-white">{activeLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-purple">{activePeriod}</span>
                    {report && !viewSaved && (
                      <button onClick={saveReport} className="btn-secondary text-xs">
                        <FileText size={12} /> Save
                      </button>
                    )}
                    <button
                      onClick={() => download(activeReport, `yfj-${activePeriod}-report-${Date.now()}.md`)}
                      className="btn-secondary text-xs"
                    >
                      <Download size={12} /> Export
                    </button>
                  </div>
                </div>
                <div className="prose-yfj max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeReport}</ReactMarkdown>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
