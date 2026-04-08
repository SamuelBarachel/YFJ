import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { registerUser } from './firebase/auth'; // Removed loginWithCode if using Firebase Email Auth
import { compileYFJReport } from './api/aiService';
import ReportDisplay from './components/ReportDisplay';
import AttendanceChart from './components/AttendanceChart'; // Added the missing chart
import './assets/index.css'; // CRITICAL: This links your Gemini gradients

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

  // Registration State (Email/Password)
  const [regData, setRegData] = useState({ email: '', password: '', fullName: '', role: 'EY' });

  // 1. GUEST VIEW (Login / Registration)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 selection:bg-purple-500/30">
        {/* Animated Gemini Background Blur */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4285f4]/10 blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#9b72f3]/10 blur-[120px] animate-pulse-slow" />
        </div>

        <div className="relative z-10 w-full max-w-md glass-card p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black gemini-gradient-text mb-3">
              YFJ North America
            </h1>
            <p className="text-gray-400 italic font-light">"I understood by the books ..."</p>
          </div>

          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { accessCode } = await registerUser(regData.email, regData.password, regData.fullName, regData.role);
              alert(`Success! Code: ${accessCode}\nWait for admin approval.`);
            } catch (err) {
              alert(err.message);
            }
          }}>
            <input 
              className="gemini-input"
              placeholder="Full Name"
              onChange={(e) => setRegData({...regData, fullName: e.target.value})}
              required
            />
            <input 
              className="gemini-input"
              placeholder="Email"
              type="email"
              onChange={(e) => setRegData({...regData, email: e.target.value})}
              required
            />
            <input 
              className="gemini-input"
              placeholder="Password"
              type="password"
              onChange={(e) => setRegData({...regData, password: e.target.value})}
              required
            />
            <select 
              className="gemini-input bg-[#1a1a1a]"
              onChange={(e) => setRegData({...regData, role: e.target.value})}
            >
              <option value="EY">EY</option>
              <option value="YFJ Leader/Not Chair">Leader</option>
              <option value="YFJ Chair">Chair</option>
              <option value="TC">TC</option>
              <option value="RC/Deacon">RC/Deacon</option>
            </select>
            <button className="gemini-button w-full">
              Request Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. PRIVILEGE CHECK
  const isPrivileged = ["RC/Deacon", "TC", "YFJ Chair"].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col p-4 lg:p-6">
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gemini-gradient flex items-center justify-center">
            <Sparkles className="text-white size-6" />
          </div>
          <span className="hidden lg:block font-black text-sm tracking-tighter">YFJ NORTH AMERICA</span>
        </div>

        <div className="flex-1 space-y-2">
          <NavButton icon={<FileText />} label="Meeting Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
          <NavButton icon={<BarChart3 />} label="Attendance" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          {isPrivileged && (
            <NavButton icon={<ShieldCheck />} label="Admin Control" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
        </div>

        <button onClick={logout} className="p-4 flex items-center gap-4 text-gray-500 hover:text-red-400 transition group">
          <LogOut />
          <span className="hidden lg:block font-medium">Logout</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12">
            <h2 className="text-xs font-bold text-[#9b72f3] uppercase tracking-[0.3em] mb-2">
              {currentUser.role} Portal
            </h2>
            <h1 className="text-4xl font-bold">Shalom, {currentUser.fullName}</h1>
            <p className="text-gray-500 mt-2 font-mono">ID: {currentUser.accessCode}</p>
          </header>

          {activeTab === 'notes' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Note Entry</h3>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      const res = await compileYFJReport(notes);
                      setReport(res);
                      setLoading(true); // Small delay for effect
                      setTimeout(() => setLoading(false), 500);
                    }}
                    className="gemini-button !py-2 !px-5 text-sm"
                    disabled={loading}
                  >
                    <Sparkles className="size-4" />
                    {loading ? "Compiling..." : "Generate Report"}
                  </button>
                </div>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-64 bg-transparent border-none outline-none text-gray-300 resize-none text-lg"
                  placeholder="Paste attendance and notes here..."
                />
              </div>
              <ReportDisplay content={report} />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="glass-card p-8 h-[500px]">
              <h3 className="text-xl font-semibold mb-8">Attendance Trends</h3>
              <AttendanceChart />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-component for Sidebar Buttons
function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all ${
        active 
        ? 'bg-white/10 text-white border border-white/10' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden lg:block font-semibold text-sm">{label}</span>
    </button>
  );
}
