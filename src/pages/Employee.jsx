import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/widgets/Avatar';
import TasksTab from '../components/tasks/TasksTab';
import MeetingList from '../components/meetings/MeetingList';

const fmt = (dt) => new Date(dt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES = {
  'Not started': 'bg-gray-100 text-gray-600',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700'
};

export const Employee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployee, projects = [], tasks, meetings } = useData();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [props, setProps] = useState([]);

  const emp = getEmployee(id);

  if (!emp) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-500">
          Employee not found. <button className="text-blue-600 hover:underline" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  const myProjects = projects.filter(p => {
    if (Array.isArray(p.assigneeIds)) return p.assigneeIds.includes(id);
    return p.assigneeId === id;
  });
  const myTasks = tasks.filter(t => t.assigneeId === id);
  const myMeetings = meetings.filter(m => m.attendeeId === id);

  const addProperty = () => {
    const v = window.prompt('Add a property (e.g. Department: Engineering)');
    if (v && v.trim()) setProps([...props, v.trim()]);
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section className="card p-5">
          <div className="flex items-start gap-4">
            <Avatar src={emp.avatar} alt={emp.fullName} className="h-16 w-16" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">{emp.fullName}</h1>
                {user && user.id === id && <span className="badge bg-indigo-100 text-indigo-700">You</span>}
              </div>
              <p className="text-sm text-gray-500">{emp.email}</p>
              <p className="text-sm text-gray-500">{emp.role || '—'}</p>
              {props.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {props.map((p, i) => (
                    <span key={i} className="badge bg-slate-100 text-slate-600">{p}</span>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-ghost text-sm" onClick={addProperty}>+ Add property</button>
          </div>
          <div className="mt-4">
            <input
              className="input-field"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </section>

        {/* Assigned Projects Section */}
        {myProjects.length > 0 && (
          <section className="card p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Assigned Projects ({myProjects.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myProjects.map(p => (
                <div key={p.id} className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-white hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-gray-900">{p.name}</span>
                    <span className="badge bg-blue-100 text-blue-700 text-[10px] font-semibold">{p.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {p.startDate ? p.startDate.slice(0, 10) : ''} → {p.endDate ? p.endDate.slice(0, 10) : ''}
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round((p.progress || 0) * (p.progress <= 1 && p.progress > 0 ? 100 : 1))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <TasksTab tasks={myTasks} heading="My Tasks" />
        <MeetingList meetings={myMeetings} />
      </main>
    </div>
  );
};

export default Employee;