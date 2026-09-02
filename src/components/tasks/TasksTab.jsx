import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';
import { StatusSelect } from '../widgets/StatusSelect';
import { PriorityPill } from '../widgets/PriorityPill';
import { TaskForm } from '../forms/TaskForm';

const TABS = ['All Tasks', 'Completed', 'By Status', 'Checklist', 'Table'];
const STATUSES = ['Not started', 'In progress', 'Done'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export const TasksTab = ({ tasks: tasksProp, heading = 'Tasks Tracker' }) => {
  const { tasks: allTasks, projects = [], getEmployee, updateTask, removeTask } = useData();
  const { addToast } = useToast();
  const tasks = tasksProp || allTasks;
  const [tab, setTab] = useState('All Tasks');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const getProject = (pId) => projects.find(p => p.id === pId);

  const completedTasks = tasks.filter(t => t.status === 'Done');

  const handleDeleteTask = (e, task) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${task.name}"?`)) {
      removeTask(task.id);
      addToast(`Removed task "${task.name}"`, 'info');
    }
  };

  const handleStatusChange = (taskId, newStatus, taskName) => {
    updateTask(taskId, { status: newStatus });
    if (newStatus === 'Done') {
      addToast(`Completed "${taskName}"! Moved to Completed tab.`, 'success');
    } else {
      addToast(`Updated status to "${newStatus}"`, 'info');
    }
  };

  const Th = ({ children }) => <th className="py-2 pr-4 font-medium text-gray-500">{children}</th>;
  const Td = ({ children, className = '' }) => <td className={`py-2 pr-4 align-middle ${className}`}>{children}</td>;

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
        <button className="btn-primary text-sm" onClick={() => { setEditing(null); setOpen(true); }}>+ New task</button>
      </div>

      <div className="w-full flex items-center border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map(t => {
          const count = t === 'Completed' ? completedTasks.length : (t === 'All Tasks' ? tasks.length : null);
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold border-b-2 text-center transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
                tab === t ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{t}</span>
              {count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  tab === t
                    ? (t === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'All Tasks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tasks.map(t => {
            const emp = getEmployee(t.assigneeId);
            const proj = getProject(t.projectId);
            return (
              <div key={t.id} className="rounded-xl border border-gray-100 p-3 hover:border-indigo-200 flex flex-col justify-between group transition">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <button className="text-left font-medium text-gray-800 hover:text-indigo-600 flex-1 truncate" onClick={() => { setEditing(t); setOpen(true); }}>
                      {t.name}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusSelect value={t.status} onChange={(s) => handleStatusChange(t.id, s, t.name)} />
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(e, t)}
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition"
                        title="Remove task"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {proj && (
                    <div className="mt-1">
                      <span className="badge bg-blue-50 text-blue-700 text-[10px] font-semibold">{proj.name}</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description || 'No description'}</p>
                </div>
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

      {tab === 'Completed' && (
        <div className="space-y-3">
          {completedTasks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedTasks.map(t => {
                const emp = getEmployee(t.assigneeId);
                const proj = getProject(t.projectId);
                return (
                  <div key={t.id} className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 hover:border-emerald-300 flex flex-col justify-between transition">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-emerald-500 font-bold text-xs shrink-0">✓</span>
                          <button
                            className="text-left font-medium text-gray-800 hover:text-emerald-700 truncate"
                            onClick={() => { setEditing(t); setOpen(true); }}
                          >
                            {t.name}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <StatusSelect value={t.status} onChange={(s) => handleStatusChange(t.id, s, t.name)} />
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(e, t)}
                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition"
                            title="Remove task"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {proj && (
                        <div className="mt-1">
                          <span className="badge bg-emerald-100/70 text-emerald-800 text-[10px] font-semibold">{proj.name}</span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description || 'No description'}</p>
                    </div>
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
            </div>
          ) : (
            <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                ✓
              </div>
              <p className="text-sm font-semibold text-gray-700">No completed tasks yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Finish tasks or mark their status as "Done" to move them here.</p>
            </div>
          )}
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
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100/80 transition">
                      <button className="text-sm text-gray-700 hover:text-indigo-600 text-left flex-1 truncate pr-2" onClick={() => { setEditing(t); setOpen(true); }}>
                        {t.name}
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityPill priority={t.priority} />
                        <span className="text-xs text-gray-400">{fmtDate(t.dueDate)}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(e, t)}
                          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition ml-1"
                          title="Remove task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition group">
              <label className="flex cursor-pointer items-center gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600 rounded"
                  checked={t.status === 'Done'}
                  onChange={(e) => handleStatusChange(t.id, e.target.checked ? 'Done' : 'Not started', t.name)}
                />
                <span className={`flex-1 text-sm truncate ${t.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {t.name}
                </span>
              </label>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityPill priority={t.priority} />
                <button
                  type="button"
                  onClick={(e) => handleDeleteTask(e, t)}
                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition"
                  title="Remove task"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-gray-400">No tasks.</p>}
        </div>
      )}

      {tab === 'Table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <Th>Task</Th><Th>Project</Th><Th>Assignee</Th><Th>Status</Th><Th>Due</Th><Th>Priority</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const emp = getEmployee(t.assigneeId);
                const proj = getProject(t.projectId);
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-slate-50/60">
                    <Td><button className="font-medium text-gray-800 hover:text-indigo-600" onClick={() => { setEditing(t); setOpen(true); }}>{t.name}</button></Td>
                    <Td className="text-gray-600 text-xs">{proj ? <span className="badge bg-blue-50 text-blue-700 text-[10px] font-semibold">{proj.name}</span> : '—'}</Td>
                    <Td><div className="flex items-center gap-2">{emp && <Avatar src={emp.avatar} alt={emp.fullName} className="h-6 w-6" />}<span className="text-gray-600">{emp?.fullName}</span></div></Td>
                    <Td><StatusSelect value={t.status} onChange={(s) => handleStatusChange(t.id, s, t.name)} /></Td>
                    <Td className="text-gray-600">{fmtDate(t.dueDate)}</Td>
                    <Td><PriorityPill priority={t.priority} /></Td>
                    <Td>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(e, t)}
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition"
                        title="Remove task"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Td>
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