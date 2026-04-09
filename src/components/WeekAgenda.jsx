import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_COLORS = {
  'Weekly Devotional': 'badge-blue',
  'Monthly Coordination': 'badge-purple',
  'Quarterly Review': 'badge-coral',
  'Annual General Assembly': 'badge-yellow',
  'Kingdom Activity': 'badge-green',
  'Special Session': 'badge-teal',
};

const TYPE_BG = {
  'Weekly Devotional': 'rgba(66,133,244,0.12)',
  'Monthly Coordination': 'rgba(155,114,243,0.12)',
  'Quarterly Review': 'rgba(217,101,112,0.12)',
  'Kingdom Activity': 'rgba(52,168,83,0.12)',
  'Special Session': 'rgba(13,191,207,0.12)',
};

export default function WeekAgenda() {
  const [meetings, setMeetings] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('date', 'asc'));
    return onSnapshot(q, (snap) => {
      setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const getWeekStart = (offset) => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day + offset * 7);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const weekStart = getWeekStart(weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDateStr = (d) => d.toISOString().split('T')[0];

  const getMeetingsForDay = (date) =>
    meetings.filter(m => m.date === toDateStr(date));

  const weekRange = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  const allThisWeek = meetings.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date + 'T00:00:00');
    return d >= weekDays[0] && d <= weekDays[6];
  }).sort((a, b) => a.date.localeCompare(b.date));

  const selectedMeetings = selectedDay !== null ? getMeetingsForDay(weekDays[selectedDay]) : [];

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-2" style={{ color: '#d96570' }}>Weekly Overview</p>
          <h2 className="text-2xl font-black text-white tracking-tight">Week's Agenda</h2>
          <p className="text-sm text-white/30 mt-1 italic">"I understood by the books..."</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-secondary p-2.5 !px-2.5">
            <ChevronLeft size={16} />
          </button>
          <div className="glass-panel px-5 py-2.5 rounded-xl text-sm font-bold text-white/70">
            {weekRange}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-secondary p-2.5 !px-2.5">
            <ChevronRight size={16} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="btn-secondary text-xs">Today</button>
          )}
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {weekDays.map((day, i) => {
          const dayMeetings = getMeetingsForDay(day);
          const isToday = day.getTime() === today.getTime();
          const isPast = day < today;
          const isFuture = day > today;
          const isSelected = selectedDay === i;
          const hasActivity = dayMeetings.length > 0;

          let dateColor = 'text-white/80';
          if (isToday) dateColor = 'text-green-500';
          else if (isPast) dateColor = 'text-red-500';
          else if (isFuture) dateColor = 'text-yellow-500';

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : i)}
              className={`day-card text-left transition-all ${isToday ? 'today' : ''} ${hasActivity ? 'has-meeting' : ''} ${isSelected ? 'ring-2 ring-purple-500/50' : ''} ${isPast && !isToday ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{DAY_SHORT[i]}</span>
              </div>
              <div className={`text-2xl font-black mb-2 ${dateColor} ${hasActivity ? 'underline decoration-2 underline-offset-4' : ''}`}>
                {day.getDate()}
              </div>
              {dayMeetings.length > 0 ? (
                <div className="space-y-1">
                  {dayMeetings.slice(0, 2).map((m, mi) => (
                    <div key={mi} className={`text-[9px] font-bold truncate rounded px-1.5 py-0.5 ${m.status === 'Completed' ? 'line-through opacity-50 bg-white/5 text-white/40' : 'text-blue-300 bg-blue-500/10'}`}>
                      {m.timeStart && `${m.timeStart} `}{m.title.slice(0, 14)}{m.title.length > 14 ? '…' : ''}
                    </div>
                  ))}
                  {dayMeetings.length > 2 && (
                    <p className="text-[9px] text-white/30 font-bold">+{dayMeetings.length - 2} more</p>
                  )}
                </div>
              ) : (
                <p className="text-[9px] text-white/20"> - - </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day meetings */}
      {selectedDay !== null && (
        <div className="mb-8 animate-slide-up">
          <div className="section-card p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4">
              {DAYS[selectedDay]}, {MONTHS[weekDays[selectedDay].getMonth()]} {weekDays[selectedDay].getDate()}
            </h3>
            {selectedMeetings.length === 0 ? (
              <p className="text-white/30 text-sm py-4 text-center">No meetings scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedMeetings.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full week agenda */}
      <div className="section-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="section-header-icon" style={{ background: 'linear-gradient(135deg, #d96570, #9b72f3)' }}>
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Full Week Schedule</h3>
            <p className="text-xs text-white/35">{allThisWeek.length} meeting{allThisWeek.length !== 1 ? 's' : ''} this week</p>
          </div>
        </div>
        {allThisWeek.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={40} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/30 text-sm">No meetings scheduled this week.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allThisWeek.filter(m => m.status !== 'Completed').map(m => <MeetingCard key={m.id} m={m} showDate />)}
            {allThisWeek.filter(m => m.status === 'Completed').map(m => <MeetingCard key={m.id} m={m} showDate completed />)}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ m, showDate, completed }) {
  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '';
  const bgColor = TYPE_BG[m.type] || 'rgba(155,114,243,0.08)';

  return (
    <div
      className="rounded-xl p-4 border border-white/[0.07] transition-all hover:border-white/[0.12]"
      style={{
        background: completed ? 'rgba(255,255,255,0.01)' : bgColor,
        opacity: completed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${TYPE_COLORS[m.type] || 'badge-blue'}`}>{m.type}</span>
            <h4 className={`text-sm font-black text-white ${completed ? 'line-through opacity-60' : ''}`}>{m.title}</h4>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/40 flex-wrap">
            {showDate && m.date && <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(m.date)}</span>}
            {(m.timeStart || m.timeEnd) && (
              <span className="flex items-center gap-1">
                <Clock size={10} />{m.timeStart}{m.timeStart && m.timeEnd ? ' – ' : ''}{m.timeEnd}
              </span>
            )}
            {m.chair && <span className="flex items-center gap-1"><User size={10} />Chair: <strong className="text-white/60">{m.chair}</strong></span>}
            {m.location && <span>📍 {m.location}</span>}
          </div>
        </div>
        <span className={`badge shrink-0 ${m.status === 'Completed' ? 'badge-green' : m.status === 'In Progress' ? 'badge-purple' : m.status === 'Cancelled' ? 'badge-coral' : 'badge-blue'}`}>
          {m.status}
        </span>
      </div>
      {m.agenda && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Agenda</p>
          <p className="text-xs text-white/50 whitespace-pre-line leading-relaxed">{m.agenda}</p>
        </div>
      )}
    </div>
  );
}
