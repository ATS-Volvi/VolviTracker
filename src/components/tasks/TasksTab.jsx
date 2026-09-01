import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Avatar } from '../widgets/Avatar';
import { StatusSelect } from '../widgets/StatusSelect';
import { PriorityPill } from '../widgets/PriorityPill';
import { TaskForm } from '../forms/TaskForm';

const TABS = ['All Tasks', 'By Status', 'Checklist', 'Table'];
const STATUSES = ['Not started', 'In progress', 'Done'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export const TasksTab = ({ tasks: tasksProp, heading = 'Tasks Tracker' }) => {
  const { tasks: allTasks, getEmployee, updateTask } = useData();
  const tasks = tasksProp || allTasks;
  const [tab, setTab] = useState('All Tasks');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const Th = ({ children }) => <th className="py-2 pr-4 font-medium text-gray-500">{children}</th>;
  const Td = ({ children, className = '' }) => <td className={`py-2 pr-4 align-middle ${className}`}>{children}</td>;

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
        <button className="btn-primary text-sm" onClick={() => { setEditing(null); setOpen(true); }}>+ New task</button>
      </div>

      <div className="w-full flex items-center border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition whitespace-nowrap ${
              tab === t ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 'All Tasks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tasks.map(t => {
            const emp = getEmployee(t.assigneeId);
            return (
              <div key={t.id} className="rounded-xl border border-gray-100 p-3 hover:border-indigo-200">
                <div className="flex items-start justify-between gap-2">
                  <button className="text-left font-medium text-gray-800 hover:text-indigo-600" onClick={() => { setEditing(t); setOpen(true); }}>{t.name}</button>
                  <StatusSelect value={t.status} onChange={(s) => updateTask(t.id, { status: s })} />
                </div>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description || 'No description'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {emp && <Avatar src={emp.avatar} alt={emp.fullName} className="h-6 w-6" />}
                    <span className="text-xs text-gray-500">{emp?.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityPill priority={t.priority} />
                    <span className="text-xs text-gray-400">{fmtDate(t.dueDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && <p className="text-sm text-gray-400">No tasks.</p>}
        </div>
      )}

      {tab === 'By Status' && (
        <div className="space-y-4">
          {STATUSES.map(s => {
            const list = tasks.filter(t => t.status === s);
            return (
              <div key={s}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{s} ({list.length})</div>
                <div className="space-y-1">
                  {list.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <button className="text-sm text-gray-700 hover:text-indigo-600" onClick={() => { setEditing(t); setOpen(true); }}>{t.name}</button>
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={t.priority} />
                        <span className="text-xs text-gray-400">{fmtDate(t.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && <p className="text-xs text-gray-400">None.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Checklist' && (
        <div className="space-y-1">
          {tasks.map(t => (
            <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={t.status === 'Done'}
                onChange={(e) => updateTask(t.id, { status: e.target.checked ? 'Done' : 'Not started' })}
              />
              <span className={`flex-1 text-sm ${t.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.name}</span>
              <PriorityPill priority={t.priority} />
            </label>
          ))}
          {tasks.length === 0 && <p className="text-sm text-gray-400">No tasks.</p>}
        </div>
      )}

      {tab === 'Table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <Th>Task</Th><Th>Assignee</Th><Th>Status</Th><Th>Due</Th><Th>Priority</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const emp = getEmployee(t.assigneeId);
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-slate-50/60">
                    <Td><button className="font-medium text-gray-800 hover:text-indigo-600" onClick={() => { setEditing(t); setOpen(true); }}>{t.name}</button></Td>
                    <Td><div className="flex items-center gap-2">{emp && <Avatar src={emp.avatar} alt={emp.fullName} className="h-6 w-6" />}<span className="text-gray-600">{emp?.fullName}</span></div></Td>
                    <Td><StatusSelect value={t.status} onChange={(s) => updateTask(t.id, { status: s })} /></Td>
                    <Td className="text-gray-600">{fmtDate(t.dueDate)}</Td>
                    <Td><PriorityPill priority={t.priority} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tasks.length === 0 && <p className="mt-2 text-sm text-gray-400">No tasks.</p>}
        </div>
      )}

      <TaskForm isOpen={open} open={open} onClose={() => setOpen(false)} initial={editing} />
    </section>
  );
};

export default TasksTab;