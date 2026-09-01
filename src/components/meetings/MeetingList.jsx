import React from 'react';
import { useData } from '../../context/DataContext';

const fmt = (dt) => new Date(dt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES = {
  'Not started': 'bg-gray-100 text-gray-600',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700'
};

export const MeetingList = ({ meetings }) => {
  const { getEmployee } = useData();
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Meetings</h2>
      {meetings.length === 0 ? (
        <p className="text-sm text-gray-400">No meetings scheduled.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Attendee</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(m => {
                const emp = getEmployee(m.attendeeId);
                return (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-800">{m.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{emp?.fullName || '—'}</td>
                    <td className="py-2 pr-4 text-gray-600">{fmt(m.dateTime)}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${STATUS_STYLES[m.status] || 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                    </td>
                    <td className="py-2 pr-4">
                      {m.url ? <a className="text-indigo-600 hover:underline" href={m.url} target="_blank" rel="noreferrer">Join</a> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default MeetingList;