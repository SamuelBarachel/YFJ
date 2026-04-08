import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { registerUser, loginWithCode } from './firebase/auth';
import { compileYFJReport } from './api/aiService';
import ReportDisplay from './components/ReportDisplay';
import { 
  Users, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  // Registration State
  const [regData, setRegData] = useState({ email: '', password: '', fullName: '', role: 'EY' });

  // 1. Auth Guard / Login View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 selection:bg-gemini-purple/30">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#4285f4] via-[#9b72f3] to-[#d96570] bg-clip-text text-transparent mb-3">
              YFJ North America
            </h1>
            <p className="text-gray-400 italic">"I understood by the books ..."</p>
          </div>

          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const { accessCode } = await registerUser(regData.email, regData.password, regData.fullName, regData.role);
            alert(`Registration successful! Your Unique Access Code: ${accessCode}\nWait for TC/RC approval.`);
          }}>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:border-gemini-blue outline-none transition"
              placeholder="Full Name"
              onChange={(e) => setRegData({...regData, fullName: e.target.value})}
              required
            />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:border-gemini-blue outline-none transition"
              placeholder="Email"
              type="email"
              onChange={(e) => setRegData({...regData, email: e.target.value})}
              required
            />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:border-gemini-blue outline-none transition"
              placeholder="Password"
              type="password"
              onChange={(e) => setRegData({...regData, password: e.target.value})}
              required
            />
            <select 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-gray-400 outline-none"
              onChange={(e) => setRegData({...regData, role: e.target.value})}
            >
              <option value="EY">EY</option>
              <option value="YFJ Leader/Not Chair">Leader</option>
              <option value="YFJ Chair">Chair</option>
              <option value="TC">TC</option>
              <option value="RC/Deacon">RC/Deacon</option>
            </select>
            <button className="w-full py-4 bg-gradient-to-r from-[#4285f4] to-[#9b72f3] rounded-2xl font-bold text-white hover:opacity-90 transition transform active:scale-95 shadow-lg shadow-blue-500/20">
              Request Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Main Dashboard View
  const isPrivileged = ["RC/Deacon", "TC", "YFJ Chair"].includes(currentUser.role);
  const canWriteReport = isPrivileged || (currentUser.role === "YFJ Leader/Not Chair" && currentUser.authorized);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      
      {/* Sidebar Navigation */}
      <nav className="w-20 lg:w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col p-4 lg:p-6">
        <div className="mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="text-white size-6" />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <NavButton icon={<FileText />} label="Meeting Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <NavButton icon={<BarChart3 />} label="Attendance" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          {isPrivileged && (
            <NavButton icon={<ShieldCheck />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
        </div>

        <button onClick={logout} className="p-4 flex items-center gap-4 text-gray-500 hover:text-red-400 transition group">
          <LogOut />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-12 flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-gemini-purple uppercase tracking-[0.2em] mb-2">
                {currentUser.role} Dashboard
              </h2>
              <h1 className="text-4xl font-bold">Welcome, {currentUser.fullName}</h1>
              <p className="text-gray-500 mt-2 font-mono text-sm uppercase tracking-widest">
                Access Code: <span className="text-white">{currentUser.accessCode}</span>
              </p>
            </div>
          </header>

          {activeTab === 'notes' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Write Meeting Notes</h3>
                  {canWriteReport && (
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        setReport(await compileYFJReport(notes));
                        setLoading(false);
                      }}
                      disabled={loading || !notes}
                      className="flex items-center gap-2 px-6 py-2 bg-white/10 border border-white/10 rounded-full hover:bg-white/20 disabled:opacity-50 transition"
                    >
                      <Sparkles className="size-4 text-gemini-blue" />
                      {loading ? "AI is thinking..." : "AI Compile"}
                    </button>
                  )}
                </div>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type notes or attendance list here... (e.g. John: Present, Mary: Absent)"
                  className="w-full h-64 bg-transparent border-none outline-none text-lg text-gray-300 resize-none placeholder:text-gray-700"
                />
              </div>

              <ReportDisplay content={report} />
            </div>
          )}

          {activeTab === 'stats' && (
             <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Attendance Graph coming soon...</p>
             </div>
          )}

          {activeTab === 'admin' && (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h3 className="text-xl font-semibold mb-6">Notification Center</h3>
              <p className="text-gray-500 italic text-sm">Reviewing pending account requests...</p>
              {/* Approval List Component would go here */}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all duration-300 ${
        active 
        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon, { size: 24 })}
      <span className="hidden lg:block font-semibold text-sm">{label}</span>
      {active && <ChevronRight className="ml-auto size-4 text-gemini-purple hidden lg:block" />}
    </button>
  );
}