import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { registerUser } from './firebase/auth';
import { compileYFJReport } from './api/aiService';
import ReportDisplay from './components/ReportDisplay';
import { 
  Users, LayoutDashboard, FileText, Calendar, 
  Sparkles, ShieldCheck, LogOut, Plus, 
  ChevronRight, Search, Clock
} from 'lucide-react';
import './assets/index.css';

export default function App() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock Data for the Roster - In a real app, this pulls from Firestore
  const roster = [
    { day: "Monday", leader: "Samuel B.", topic: "Divine Providence", status: "Confirmed" },
    { day: "Wednesday", leader: "Sarah J.", topic: "Grace vs Law", status: "Pending" },
    { day: "Friday", leader: "John D.", topic: "The Great Commission", status: "Confirmed" },
  ];

  if (!currentUser) return <AuthPortal />;

  return (
    <div className="min-h-screen flex bg-[#050505] text-slate-200 overflow-hidden font-sans">
      <div className="aurora-bg" />

      {/* --- SIDEBAR --- */}
      <aside className="w-72 glass-panel border-r border-white/5 flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="size-10 rounded-xl gemini-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter text-white leading-none">YFJ</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">North America</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem icon={<FileText size={18}/>} label="AI Report Suite" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <NavItem icon={<Calendar size={18}/>} label="Leadership Roster" active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} />
          <NavItem icon={<Users size={18}/>} label="Directory" active={activeTab === 'directory'} onClick={() => setActiveTab('directory')} />
        </nav>

        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-gradient-to-br from-slate-700 to-black border border-white/10 flex items-center justify-center text-xs font-bold text-purple-400">
              {currentUser.fullName?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs font-bold border border-white/5">
            <LogOut size={14} /> SIGN OUT
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto relative p-8 lg:p-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <header className="flex justify-between items-end mb-16">
            <div>
              <p className="text-purple-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Secretary Dashboard</p>
              <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
                {activeTab === 'notes' ? 'Notes & Intelligence' : 'Roster Management'}
              </h1>
              <p className="text-slate-500 italic">"I understood by the books..."</p>
            </div>
            <div className="flex gap-3">
              <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-400">
                <Clock size={14} /> 2026 Season
              </div>
            </div>
          </header>

          {/* Tab 1: AI Notes */}
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel p-1 rounded-3xl overflow-hidden">
                  <textarea 
                    className="w-full h-80 bg-transparent p-8 outline-none text-slate-300 text-lg leading-relaxed placeholder:text-slate-800 resize-none"
                    placeholder="Enter today's raw notes and attendance here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] text-slate-600 font-mono">{notes.length} characters</p>
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        setReport(await compileYFJReport(notes));
                        setLoading(false);
                      }}
                      disabled={loading || !notes}
                      className="px-8 py-3 rounded-2xl gemini-gradient text-white font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(155,114,243,0.3)] transition-all disabled:opacity-30 flex items-center gap-2"
                    >
                      {loading ? 'Processing...' : <><Sparkles size={14} /> Compile Intelligence</>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="glass-panel p-8 rounded-3xl">
                  <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Live Output</h3>
                  <div className="prose prose-invert prose-sm">
                    {report ? <ReportDisplay content={report} /> : <p className="text-slate-600 italic">The AI compiled report will appear here...</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Roster */}
          {activeTab === 'roster' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="glass-panel rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                      <th className="px-8 py-5">Assigned Day</th>
                      <th className="px-8 py-5">Leadership</th>
                      <th className="px-8 py-5">Topic Summary</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roster.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6 font-bold text-white">{item.day}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-purple-400">
                              {item.leader[0]}
                            </div>
                            <span className="text-sm font-medium">{item.leader}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm text-slate-400 font-medium italic">"{item.topic}"</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.status === 'Confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100">
                            <Plus size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* --- HELPER COMPONENTS --- */

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
        active 
        ? 'bg-white/10 text-white shadow-xl shadow-black/20 border border-white/10' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      <span className={`${active ? 'text-purple-400' : ''}`}>{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function AuthPortal() {
  // Use the high-end Registration form we discussed previously here
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
       <div className="aurora-bg" />
       <div className="glass-panel p-12 rounded-[40px] w-full max-w-md text-center">
          <Sparkles className="mx-auto text-purple-400 mb-6" size={40} />
          <h2 className="text-3xl font-bold text-white mb-2">Gatekeeper</h2>
          <p className="text-slate-500 text-sm mb-8">Access restricted to authorized personnel.</p>
          <div className="space-y-4">
             <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-purple-500/50 transition-all" placeholder="Access Email" />
             <input type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 outline-none focus:border-purple-500/50 transition-all" placeholder="Password" />
             <button className="w-full gemini-gradient py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20">Authorize</button>
          </div>
       </div>
    </div>
  );
}
