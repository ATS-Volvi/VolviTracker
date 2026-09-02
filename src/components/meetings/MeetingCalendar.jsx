import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
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
  const { meetings: allMeetings, removeMeeting } = useData();
  const { addToast } = useToast();
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

  // Sort meetings chronologically by time for each day
  Object.keys(byDay).forEach(k => {
    byDay[k].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  });

  const goToday = () => setView({ year: today.getFullYear(), month: today.getMonth() });
  const prev = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });

  const handleAddOnDate = (d) => {
    const dt = new Date(d);
    dt.setHours(10, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T10:00`;
    setEditing(null);
    setDefaultDate(dateStr);
    setOpen(true);
  };

  const handleDeleteMeeting = (e, m) => {
    e.stopPropagation();
    if (window.confirm(`Delete meeting reservation "${m.name}"?`)) {
      removeMeeting(m.id);
      addToast(`Removed meeting "${m.name}"`, 'info');
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm" onClick={goToday}>Today</button>
          <button className="btn-ghost text-sm px-3" onClick={prev} title="Previous month">&larr;</button>
          <button className="btn-ghost text-sm px-3" onClick={next} title="Next month">&rarr;</button>
          <button
            className="btn-primary text-sm flex items-center gap-1.5"
            onClick={() => { setEditing(null); setDefaultDate(''); setOpen(true); }}
          >
            <span>+</span> Add meeting
          </button>
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
            <div
              key={i}
              onClick={() => handleAddOnDate(d)}
              className={`group min-h-[88px] bg-white p-1.5 cursor-pointer hover:bg-slate-50/80 transition ${isToday ? 'ring-1 ring-inset ring-indigo-300' : ''}`}
              title="Click to add meeting on this day"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${isToday ? 'font-bold text-indigo-600' : 'text-gray-400'}`}>{d.getDate()}</span>
                <span className="opacity-0 group-hover:opacity-100 text-[11px] font-bold text-indigo-500 transition">+</span>
              </div>
              <div className="space-y-1">
                {list.map(m => {
                  const attendeeIds = Array.isArray(m.attendeeIds) && m.attendeeIds.length > 0 ? m.attendeeIds : (m.attendeeId ? [m.attendeeId] : []);
                  const meetingUrl = m.url ? (m.url.startsWith('http://') || m.url.startsWith('https://') ? m.url : `https://${m.url}`) : null;
                  return (
                    <div
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); setEditing(m); setDefaultDate(''); setOpen(true); }}
                      className="block w-full rounded-md bg-indigo-50/90 hover:bg-indigo-100 p-1.5 text-left text-[11px] leading-tight transition cursor-pointer group/tile"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-indigo-800 flex-1">{m.name}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {meetingUrl && (
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-500 hover:text-indigo-800 hover:bg-indigo-200/70 p-0.5 rounded transition inline-flex items-center"
                              title="Open meeting link in new tab"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMeeting(e, m)}
                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-100/70 p-0.5 rounded transition inline-flex items-center"
                            title="Remove meeting reservation"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-indigo-600 mt-1">
                        <span>{timeTag(m.dateTime)}</span>
                        {attendeeIds.length > 1 && (
                          <span className="text-[9px] bg-indigo-100/90 text-indigo-700 px-1 py-0.2 rounded font-semibold">
                            {attendeeIds.length} ppl
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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