import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MeetingForm } from '../forms/MeetingForm';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const buildMonth = (year, month) => {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const timeTag = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const MeetingCalendar = ({ meetings: meetingsProp = null }) => {
  const { meetings: allMeetings } = useData();
  const meetings = meetingsProp ?? allMeetings;
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultDate, setDefaultDate] = useState('');

  const cells = buildMonth(view.year, view.month);
  const byDay = {};
  meetings.forEach(m => {
    const k = dayKey(new Date(m.dateTime));
    (byDay[k] = byDay[k] || []).push(m);
  });

  const goToday = () => setView({ year: today.getFullYear(), month: today.getMonth() });
  const prev = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={goToday}>Today</button>
          <button className="btn-ghost text-sm px-3" onClick={prev}>&larr;</button>
          <button className="btn-ghost text-sm px-3" onClick={next}>&rarr;</button>
          <button className="btn-primary text-sm" onClick={() => { setEditing(null); setDefaultDate(''); setOpen(true); }}>Manage in Calendar</button>
        </div>
      </div>

      <div className="mb-3 text-base font-medium text-gray-700">{MONTHS[view.month]} {view.year}</div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-gray-100 text-center text-xs font-medium text-gray-500">
        {DOW.map(d => <div key={d} className="bg-white py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[88px] bg-slate-50/40" />;
          const k = dayKey(d);
          const list = byDay[k] || [];
          const isToday = dayKey(today) === k;
          return (
            <div key={i} className={`min-h-[88px] bg-white p-1.5 ${isToday ? 'ring-1 ring-inset ring-indigo-300' : ''}`}>
              <div className={`mb-1 text-xs ${isToday ? 'font-bold text-indigo-600' : 'text-gray-400'}`}>{d.getDate()}</div>
              <div className="space-y-1">
                {list.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setEditing(m); setOpen(true); }}
                    className="block w-full rounded-md bg-indigo-50 px-1.5 py-1 text-left text-[11px] leading-tight hover:bg-indigo-100"
                  >
                    <div className="truncate font-medium text-indigo-700">{m.name}</div>
                    <div className="text-[10px] text-indigo-500">{timeTag(m.dateTime)}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <MeetingForm open={open} onClose={() => setOpen(false)} initial={editing} defaultDate={defaultDate} />
    </section>
  );
};

export default MeetingCalendar;