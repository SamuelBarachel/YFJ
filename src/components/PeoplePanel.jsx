import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Users } from 'lucide-react';

const ROLE_COLORS = {
  'YFJ Chair':             '#9b72f3',
  'Territory Coordinator': '#4285f4',
  'Regional Coordinator':  '#0dbfcf',
  'Deacon':                '#34a853',
  'EY':                    '#fbbc04',
  'YFJ':                   '#d96570',
};

export default function PeoplePanel() {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('fullName'));
    const unsub = onSnapshot(q, snap => {
      setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {
      const q2 = query(collection(db, 'users'));
      onSnapshot(q2, snap2 => setPeople(snap2.docs.map(d => ({ id: d.id, ...d.data() }))));
    });
    return unsub;
  }, []);

  const filtered = people.filter(p =>
    !search ||
    (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, p) => {
    const role = p.role || 'Member';
    if (!acc[role]) acc[role] = [];
    acc[role].push(p);
    return acc;
  }, {});

  const roleOrder = ['YFJ Chair','Territory Coordinator','Regional Coordinator','Deacon','EY','YFJ'];
  const sortedRoles = [
    ...roleOrder.filter(r => grouped[r]),
    ...Object.keys(grouped).filter(r => !roleOrder.includes(r)),
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-1.5" style={{ color: '#4285f4' }}>Organization</p>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">People</h2>
        <p className="text-sm text-white/60 mt-1">{people.length} member{people.length !== 1 ? 's' : ''} · Youth for Jesus North America</p>
      </div>

      <input
        className="yfj-input mb-6"
        placeholder="Search by name or role…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {sortedRoles.length === 0 && (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/60">No members found.</p>
        </div>
      )}

      <div className="space-y-6">
        {sortedRoles.map(role => (
          <div key={role}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ color: ROLE_COLORS[role] || '#aaa' }}>
              {role} · {grouped[role].length}
            </p>
            <div className="space-y-2">
              {grouped[role].map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ background: ROLE_COLORS[p.role] || '#555' }}>
                    {(p.fullName || p.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.fullName || p.email}</p>
                    {p.fullName && <p className="text-[11px] text-white/55 truncate">{p.email}</p>}
                  </div>
                  {p.territory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)' }}>
                      {p.territory}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
