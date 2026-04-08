import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Sun', count: 45 },
  { day: 'Mon', count: 32 },
  { day: 'Tue', count: 56 },
  { day: 'Wed', count: 88 },
  { day: 'Thu', count: 45 },
  { day: 'Fri', count: 90 },
  { day: 'Sat', count: 110 },
];

export default function AttendanceChart() {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9b72f3" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#9b72f3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#666'}} />
          <Tooltip contentStyle={{backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px'}} />
          <Area type="monotone" dataKey="count" stroke="#9b72f3" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}