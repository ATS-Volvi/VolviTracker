import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MeetingForm } from '../forms/MeetingForm';

const fmt = (dt) => new Date(dt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES = {
  'Not started': 'bg-gray-100 text-gray-600',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700'
};

export const MeetingList = ({ meetings, defaultAttendeeId = '' }) => {
  const { getEmployee } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
        <button
          className="btn-primary text-sm flex items-center gap-1.5"
          onClick={() => { setEditing(null); setOpen(true); }}
        >
          <span>+</span> Add meeting
        </button>
      </div>
      {meetings.length === 0 ? (
        <p className="text-sm text-gray-400">No meetings scheduled.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Attendees</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {[...meetings].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(m => {
                const attendeeIds = Array.isArray(m.attendeeIds) && m.attendeeIds.length > 0 ? m.attendeeIds : (m.attendeeId ? [m.attendeeId] : []);
                const attendeeEmps = attendeeIds.map(id => getEmployee(id)).filter(Boolean);
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-slate-50/60">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <button className="text-left font-medium text-gray-800 hover:text-indigo-600" onClick={() => { setEditing(m); setOpen(true); }}>
                          {m.name}
                        </button>
                        {m.url && (
                          <a
                            href={m.url.startsWith('http://') || m.url.startsWith('https://') ? m.url : `https://${m.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-0.5 rounded transition inline-flex items-center"
                            title="Open meeting link in new tab"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {attendeeEmps.map(emp => (
                          <span key={emp.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium" title={emp.fullName}>
                            {emp.avatar ? <img src={emp.avatar} alt={emp.fullName} className="w-4 h-4 rounded-full object-cover" /> : null}
                            <span>{emp.fullName}</span>
                          </span>
                        ))}
                        {attendeeEmps.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{fmt(m.dateTime)}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${STATUS_STYLES[m.status] || 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                    </td>
                    <td className="py-2 pr-4">
                      {m.url ? <a className="text-indigo-600 hover:underline font-medium" href={m.url} target="_blank" rel="noreferrer">Join</a> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <MeetingForm open={open} onClose={() => setOpen(false)} initial={editing} />
    </section>
  );
};

export default MeetingList;