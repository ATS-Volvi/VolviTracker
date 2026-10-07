import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to recursively collect all descendants of a task
const getAllDescendants = (rootId, allTasks) => {
  const result = [];
  const queue = [String(rootId)];
  const seen = new Set([String(rootId)]);
  while (queue.length > 0) {
    const parentId = queue.shift();
    allTasks.forEach(t => {
      if (t.parentId && String(t.parentId) === parentId && !seen.has(String(t.id))) {
        seen.add(String(t.id));
        result.push(t);
        queue.push(String(t.id));
      }
    });
  }
  return result;
};

// Recursive subtask tree row for arbitrary n-level nesting
const SubtaskTreeRow = ({
  subtask,
  level = 1,
  tasks,
  handleToggleSubtaskStatus,
  handleStartEditSubtask,
  handleSaveEditSubtask,
  editingSubtaskId,
  editSubtaskTitle,
  setEditSubtaskTitle,
  setEditingSubtaskId,
  handleDeleteSubtask,
  addingUnderSubtaskId,
  setAddingUnderSubtaskId,
  setIsAddingRootSubtask,
  newSubtaskTitle,
  setNewSubtaskTitle,
  newSubtaskDueDate,
  setNewSubtaskDueDate,
  newSubtaskPriority,
  setNewSubtaskPriority,
  handleCreateSubtask,
  renderMiniAssignees
}) => {
  const isDone = subtask.status === 'Done';
  const isEditingThis = editingSubtaskId === subtask.id;
  const directChildren = tasks.filter(t => String(t.parentId) === String(subtask.id));
  const childLevel = level + 1;

  const getLevelBadge = (lvl) => {
    if (lvl === 1) return { label: 'Subtask', arrow: '↳', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (lvl === 2) return { label: 'Sub-sub', arrow: '↳↳', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    return { label: `L${lvl} Sub`, arrow: '↳'.repeat(Math.min(lvl, 3)), color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  };

  const badge = getLevelBadge(level);

  return (
    <div className={`p-2.5 transition space-y-2 hover:bg-slate-50/50 ${level > 1 ? 'border-l-2 border-indigo-200 pl-3 ml-3' : ''}`}>
      {/* Subtask Row */}
      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => handleToggleSubtaskStatus(subtask.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
              isDone
                ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                : 'border-gray-300 hover:border-emerald-500 bg-white'
            }`}
            title={isDone ? 'Mark In progress' : 'Mark as Done'}
          >
            {isDone && (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <span className="text-blue-500 font-bold text-xs select-none shrink-0">{badge.arrow}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badge.color}`}>
            {badge.label}
          </span>

          {isEditingThis ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                type="text"
                value={editSubtaskTitle}
                onChange={(e) => setEditSubtaskTitle(e.target.value)}
                className="input-field text-xs h-7 bg-white font-medium flex-1 py-0.5"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveEditSubtask(subtask.id);
                  } else if (e.key === 'Escape') {
                    setEditingSubtaskId(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleSaveEditSubtask(subtask.id)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 px-1.5 py-0.5"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingSubtaskId(null)}
                className="text-[11px] text-gray-400 hover:text-gray-600 px-1 py-0.5"
              >
                ✕
              </button>
            </div>
          ) : (
            <span
              onClick={() => handleStartEditSubtask(subtask)}
              className={`font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600 transition ${
                isDone ? 'line-through text-gray-400' : ''
              }`}
              title="Click to rename"
            >
              {subtask.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* + Subtask button */}
          <button
            type="button"
            onClick={() => {
              setAddingUnderSubtaskId(addingUnderSubtaskId === subtask.id ? null : subtask.id);
              setIsAddingRootSubtask(false);
              setNewSubtaskTitle('');
              setNewSubtaskDueDate(subtask.dueDate ? subtask.dueDate.slice(0, 10) : getLocalDateString());
            }}
            className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded transition"
            title={`Add subtask under "${subtask.name}"`}
          >
            + Subtask
          </button>

          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${
            subtask.priority === 'High'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : subtask.priority === 'Medium'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {subtask.priority || 'Medium'}
          </span>

          {subtask.dueDate && (
            <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
              {subtask.dueDate.slice(0, 10)}
            </span>
          )}

          {renderMiniAssignees(subtask.assigneeIds, subtask.assigneeId)}

          <button
            type="button"
            onClick={() => handleDeleteSubtask(subtask)}
            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition"
            title="Delete subtask and all its nested subtasks"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inline Subtask Add Form under this subtask */}
      {addingUnderSubtaskId === subtask.id && (
        <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2 animate-slide-up mt-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
              <span>{'↳'.repeat(Math.min(childLevel, 3))} New Subtask (L{childLevel}) under:</span>
              <strong className="text-gray-900 truncate max-w-[180px]">{subtask.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setAddingUnderSubtaskId(null)}
              className="text-[11px] text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
            <div className="sm:col-span-5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="input-field text-xs h-8 bg-white font-medium"
                placeholder="Subtask title..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateSubtask(subtask.id);
                  } else if (e.key === 'Escape') {
                    setAddingUnderSubtaskId(null);
                  }
                }}
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="date"
                value={newSubtaskDueDate}
                onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                className="input-field text-xs h-8 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                className="input-field text-xs h-8 bg-white w-full"
                value={newSubtaskPriority}
                onChange={(e) => setNewSubtaskPriority(e.target.value)}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => handleCreateSubtask(subtask.id)}
                disabled={!newSubtaskTitle.trim()}
                className="btn-primary text-xs font-semibold h-8 w-full disabled:opacity-50 inline-flex items-center justify-center shadow-xs"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recursive children rendering for arbitrary depth */}
      {directChildren.length > 0 && (
        <div className="space-y-1 mt-1">
          {directChildren.map(child => (
            <SubtaskTreeRow
              key={child.id}
              subtask={child}
              level={childLevel}
              tasks={tasks}
              handleToggleSubtaskStatus={handleToggleSubtaskStatus}
              handleStartEditSubtask={handleStartEditSubtask}
              handleSaveEditSubtask={handleSaveEditSubtask}
              editingSubtaskId={editingSubtaskId}
              editSubtaskTitle={editSubtaskTitle}
              setEditSubtaskTitle={setEditSubtaskTitle}
              setEditingSubtaskId={setEditingSubtaskId}
              handleDeleteSubtask={handleDeleteSubtask}
              addingUnderSubtaskId={addingUnderSubtaskId}
              setAddingUnderSubtaskId={setAddingUnderSubtaskId}
              setIsAddingRootSubtask={setIsAddingRootSubtask}
              newSubtaskTitle={newSubtaskTitle}
              setNewSubtaskTitle={setNewSubtaskTitle}
              newSubtaskDueDate={newSubtaskDueDate}
              setNewSubtaskDueDate={setNewSubtaskDueDate}
              newSubtaskPriority={newSubtaskPriority}
              setNewSubtaskPriority={setNewSubtaskPriority}
              handleCreateSubtask={handleCreateSubtask}
              renderMiniAssignees={renderMiniAssignees}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskForm = ({ isOpen, open, onClose, initial = null, projects: projectsProp }) => {
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const { employees, projects: dataProjects = [], tasks = [], addTask, updateTask, removeTask } = useData();
  const { user, isAdmin, isProjectManager } = useAuth();
  const canAssignAnyone = Boolean(isAdmin || isProjectManager);
  const { addToast } = useToast();

  const accessibleProjects = useMemo(() => {
    if (projectsProp && Array.isArray(projectsProp)) return projectsProp;
    if (isAdmin) return dataProjects;
    if (isProjectManager) return dataProjects.filter(p => String(p.createdBy || '') === String(user?.id));
    return dataProjects.filter(p =>
      (Array.isArray(p.assigneeIds) && p.assigneeIds.some(aid => String(aid) === String(user?.id))) ||
      String(p.assigneeId) === String(user?.id)
    );
  }, [projectsProp, dataProjects, isAdmin, isProjectManager, user?.id]);

  const [form, setForm] = useState({
    name: '',
    projectId: '',
    assigneeIds: [],
    assigneeId: '',
    status: 'Not started',
    createdDate: getLocalDateString(),
    dueDate: '',
    priority: 'Medium',
    description: '',
    parentId: ''
  });

  const isEditing = Boolean(initial && initial.id);

  // Parent task info for breadcrumbs & hierarchy (n levels)
  const parentTaskInfo = useMemo(() => {
    if (!initial?.parentId) return null;
    const taskMap = new Map(tasks.map(t => [String(t.id), t]));
    const ancestors = [];
    let currId = String(initial.parentId);
    const visited = new Set([String(initial.id)]);

    while (currId) {
      if (visited.has(currId)) break;
      visited.add(currId);
      const parent = taskMap.get(currId);
      if (!parent) break;
      ancestors.push(parent);
      currId = parent.parentId ? String(parent.parentId) : null;
    }

    if (ancestors.length === 0) return null;
    return {
      level: ancestors.length,
      parent: ancestors[0],
      ancestors
    };
  }, [initial, tasks]);

  const currentTaskLevel = parentTaskInfo ? parentTaskInfo.level : 0;

  // Direct subtasks belonging to this task
  const childSubtasks = useMemo(() => {
    if (!initial?.id) return [];
    return tasks.filter(t => String(t.parentId) === String(initial.id));
  }, [initial?.id, tasks]);

  // All nested descendants
  const allNestedSubtasks = useMemo(() => {
    if (!initial?.id) return [];
    return getAllDescendants(initial.id, tasks);
  }, [initial?.id, tasks]);

  // Inline subtask add state
  const [isAddingRootSubtask, setIsAddingRootSubtask] = useState(false);
  const [addingUnderSubtaskId, setAddingUnderSubtaskId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState('Medium');

  // Quick edit subtask title
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');

  const handleDelete = () => {
    if (isEditing && window.confirm(`Delete task "${form.name}"? Any nested subtasks will also be deleted.`)) {
      removeTask(initial.id);
      addToast(`Deleted task "${form.name}"`, 'info');
      onClose();
    }
  };

  useEffect(() => {
    if (initial) {
      let initialAssigneeIds = [];
      if (Array.isArray(initial.assigneeIds) && initial.assigneeIds.length > 0) {
        initialAssigneeIds = initial.assigneeIds;
      } else if (initial.assigneeId) {
        initialAssigneeIds = [initial.assigneeId];
      }

      const rawCreated = initial.createdDate || initial.createdAt || initial.created_date || initial.created_at;
      const initialCreatedDate = rawCreated ? String(rawCreated).slice(0, 10) : getLocalDateString();

      setForm({
        name: initial.name || '',
        projectId: initial.projectId || '',
        assigneeIds: initialAssigneeIds,
        assigneeId: initialAssigneeIds[0] || (user?.id || ''),
        status: initial.status || 'Not started',
        createdDate: initialCreatedDate,
        dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        priority: initial.priority || 'Medium',
        description: initial.description || '',
        parentId: initial.parentId || ''
      });
    } else {
      const defaultAssignees = !canAssignAnyone && user?.id ? [user.id] : [];
      setForm({
        name: '',
        projectId: '',
        assigneeIds: defaultAssignees,
        assigneeId: defaultAssignees[0] || '',
        status: 'Not started',
        createdDate: getLocalDateString(),
        dueDate: '',
        priority: 'Medium',
        description: '',
        parentId: ''
      });
    }

    // Reset local subtask state
    setIsAddingRootSubtask(false);
    setAddingUnderSubtaskId(null);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(initial?.dueDate ? initial.dueDate.slice(0, 10) : getLocalDateString());
    setNewSubtaskPriority('Medium');
    setEditingSubtaskId(null);
  }, [initial, isModalOpen, employees, user?.id]);

  // Compute potential parent tasks for subtask nesting at any depth n
  const potentialParents = useMemo(() => {
    if (!form.projectId) return [];
    // Only tasks in the same project
    const projectTasksList = tasks.filter(t => String(t.projectId) === String(form.projectId));

    // If editing, exclude the current task and ALL its descendants to prevent circular parenting
    const disallowedIds = new Set();
    if (initial?.id) {
      disallowedIds.add(String(initial.id));
      let added = true;
      while (added) {
        added = false;
        projectTasksList.forEach(t => {
          if (t.parentId && disallowedIds.has(String(t.parentId)) && !disallowedIds.has(String(t.id))) {
            disallowedIds.add(String(t.id));
            added = true;
          }
        });
      }
    }

    const available = projectTasksList.filter(t => !disallowedIds.has(String(t.id)));
    const taskMap = new Map(projectTasksList.map(t => [String(t.id), t]));

    const getLevel = (t) => {
      let lvl = 0;
      let curr = t;
      const seen = new Set([String(t.id)]);
      while (curr && curr.parentId) {
        const p = taskMap.get(String(curr.parentId));
        if (!p || seen.has(String(p.id))) break;
        seen.add(String(p.id));
        lvl++;
        curr = p;
      }
      return lvl;
    };

    return available.map(t => ({
      ...t,
      level: getLevel(t)
    }));
  }, [tasks, form.projectId, initial?.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAssignee = (empId) => {
    setForm(prev => {
      const exists = prev.assigneeIds.includes(empId);
      const newIds = exists
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId];
      return { ...prev, assigneeIds: newIds, assigneeId: newIds[0] || '' };
    });
  };

  const handleSelectAllAssignees = () => {
    const allIds = employees.map(e => e.id);
    setForm(prev => ({
      ...prev,
      assigneeIds: allIds,
      assigneeId: allIds[0] || ''
    }));
  };

  const handleClearAssignees = () => {
    setForm(prev => ({ ...prev, assigneeIds: [], assigneeId: '' }));
  };

  const handleCreateSubtask = (parentId) => {
    const title = newSubtaskTitle.trim();
    if (!title) return;

    // Auto-inherit assignees from parent task or current form
    const parentObj = tasks.find(t => String(t.id) === String(parentId)) || (String(parentId) === String(initial?.id) ? form : null);
    const parentAssignees = parentObj?.assigneeIds && parentObj.assigneeIds.length > 0
      ? parentObj.assigneeIds
      : (parentObj?.assigneeId ? [parentObj.assigneeId] : (form.assigneeIds || []));

    const effectiveAssignees = (!canAssignAnyone && user?.id)
      ? [user.id]
      : (parentAssignees.length > 0 ? [...parentAssignees] : (user?.id ? [user.id] : []));

    const newTaskItem = {
      name: title,
      projectId: form.projectId || initial?.projectId || '',
      parentId: parentId,
      assigneeIds: effectiveAssignees,
      assigneeId: effectiveAssignees[0] || (user?.id || ''),
      status: 'Not started',
      dueDate: newSubtaskDueDate || form.dueDate || getLocalDateString(),
      priority: newSubtaskPriority,
      description: ''
    };

    addTask(newTaskItem);
    addToast(`Added subtask "${title}"!`, 'success');
    setNewSubtaskTitle('');
    setIsAddingRootSubtask(false);
    setAddingUnderSubtaskId(null);
  };

  const handleToggleSubtaskStatus = (subtaskId) => {
    const target = tasks.find(t => String(t.id) === String(subtaskId));
    if (!target) return;
    const nextStatus = target.status === 'Done' ? 'In progress' : 'Done';
    updateTask(subtaskId, { status: nextStatus });
    if (nextStatus === 'Done') {
      const descendants = getAllDescendants(subtaskId, tasks);
      descendants.forEach(d => updateTask(d.id, { status: 'Done' }));
    }
  };

  const handleDeleteSubtask = (subtask) => {
    if (window.confirm(`Delete subtask "${subtask.name}"? Any nested subtasks will also be deleted.`)) {
      removeTask(subtask.id);
      addToast(`Deleted subtask "${subtask.name}"`, 'info');
    }
  };

  const handleStartEditSubtask = (st) => {
    setEditingSubtaskId(st.id);
    setEditSubtaskTitle(st.name);
  };

  const handleSaveEditSubtask = (subtaskId) => {
    if (!editSubtaskTitle.trim()) return;
    updateTask(subtaskId, { name: editSubtaskTitle.trim() });
    setEditingSubtaskId(null);
    addToast('Subtask updated', 'success', 1500);
  };

  const renderMiniAssignees = (assigneeIds, assigneeId) => {
    let ids = Array.isArray(assigneeIds) && assigneeIds.length > 0
      ? assigneeIds
      : (assigneeId ? [assigneeId] : []);
    if (ids.length === 0) return <span className="text-[10px] text-gray-400 italic">Unassigned</span>;
    const emps = ids.map(id => employees.find(e => e.id === id)).filter(Boolean);
    return (
      <div className="flex items-center gap-1 shrink-0 bg-blue-50/70 border border-blue-200/80 px-1.5 py-0.5 rounded-md" title={`Assigned: ${emps.map(e => e.fullName).join(', ')}`}>
        <div className="flex items-center -space-x-1 shrink-0">
          {emps.slice(0, 2).map(e => (
            <img
              key={e.id}
              src={e.avatar}
              alt={e.fullName}
              className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
              onError={(ev) => {
                ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=0070F3&color=fff`;
              }}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-blue-900 truncate max-w-[80px]">
          {emps.length === 1 ? emps[0].fullName.split(' ')[0] : `${emps.length}`}
        </span>
      </div>
    );
  };

  const submit = (e) => {
    e.preventDefault();
    const finalAssigneeIds = form.assigneeIds;
    const effectiveCreatedDate = form.createdDate || getLocalDateString();
    const payload = {
      ...form,
      createdDate: effectiveCreatedDate,
      createdAt: new Date(effectiveCreatedDate).toISOString(),
      parentId: form.parentId || null,
      assigneeIds: finalAssigneeIds,
      assigneeId: finalAssigneeIds[0] || ''
    };

    if (isEditing) {
      updateTask(initial.id, payload);
      addToast(`Updated task "${form.name}"`, 'success');
    } else {
      addTask(payload);
      addToast(`Created new task "${form.name}"`, 'success');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      maxWidth="max-w-2xl"
      noPadding={true}
    >
      <form id="task-form-modal" onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Parent Task Breadcrumb if this task is a subtask at any depth n */}
          {parentTaskInfo && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                <span className="font-bold text-blue-600 shrink-0">
                  {'↳'.repeat(Math.min(parentTaskInfo.level, 3))} Subtask of:
                </span>
                <span className="font-bold text-gray-900 truncate">{parentTaskInfo.parent.name}</span>
                {parentTaskInfo.ancestors.length > 1 && (
                  <span className="text-gray-500 text-[11px] truncate">
                    (Root: {parentTaskInfo.ancestors[parentTaskInfo.ancestors.length - 1].name})
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white/80 border border-blue-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                {parentTaskInfo.level === 1 ? 'Subtask' : parentTaskInfo.level === 2 ? 'Sub-subtask' : `Level ${parentTaskInfo.level} Subtask`}
              </span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Task Name</label>
            <input className="input-field text-sm" value={form.name} onChange={set('name')} required placeholder="e.g. Design homepage hero" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Project (Optional)</label>
            <select className="input-field text-sm bg-white" value={form.projectId} onChange={set('projectId')}>
              <option value="">Select project (Optional)</option>
              {accessibleProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Parent Task Selector (for n-level Subtasks) */}
          {form.projectId && potentialParents.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Parent Task (Optional Hierarchy)</span>
                <span className="text-[10px] text-gray-400 font-normal">Choose parent task for n-level nesting</span>
              </label>
              <select
                className="input-field text-sm bg-white"
                value={form.parentId || ''}
                onChange={set('parentId')}
              >
                <option value="">None (Top-level Main Task)</option>
                {potentialParents.map(pt => {
                  const indent = '\u00A0\u00A0'.repeat(pt.level);
                  const prefix = pt.level === 0 ? '📁 [Main Task] ' : `${'↳'.repeat(Math.min(pt.level, 3))} [L${pt.level}] `;
                  const targetLvl = pt.level + 1;
                  const becomesLabel = targetLvl === 1 ? 'becomes Subtask' : targetLvl === 2 ? 'becomes Sub-subtask' : `becomes Level ${targetLvl} Subtask`;
                  return (
                    <option key={pt.id} value={pt.id}>
                      {indent}{prefix}{pt.name} ({becomesLabel})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Assignee Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Assign Team Members ({form.assigneeIds.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllAssignees}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAssignees}
                  className="text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/60 custom-scrollbar">
              {(() => {
                const selectedProj = accessibleProjects.find(p => p.id === form.projectId);
                const projAssigneeIds = Array.isArray(selectedProj?.assigneeIds)
                  ? selectedProj.assigneeIds
                  : (selectedProj?.assigneeId ? [selectedProj.assigneeId] : []);

                const sorted = [...employees].sort((a, b) => {
                  const aTask = form.assigneeIds.includes(a.id);
                  const bTask = form.assigneeIds.includes(b.id);
                  const aProj = projAssigneeIds.includes(a.id);
                  const bProj = projAssigneeIds.includes(b.id);

                  const aChosen = aTask || aProj;
                  const bChosen = bTask || bProj;
                  if (aChosen && !bChosen) return -1;
                  if (!aChosen && bChosen) return 1;

                  if (aTask && !bTask) return -1;
                  if (!aTask && bTask) return 1;

                  return (a.fullName || '').localeCompare(b.fullName || '');
                });

                return sorted.map(emp => {
                  const isSelected = form.assigneeIds.includes(emp.id);
                  const isProjectMember = projAssigneeIds.includes(emp.id);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleAssignee(emp.id)}
                      className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer border transition text-xs select-none ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAssignee(emp.id);
                        }}
                        className="h-3.5 w-3.5 accent-blue-600 rounded cursor-pointer"
                      />
                      <img
                        src={emp.avatar}
                        alt={emp.fullName}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                        onError={(ev) => {
                          ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=0070F3&color=fff`;
                        }}
                      />
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{emp.fullName}</span>
                          {isProjectMember && (
                            <span className="text-[9px] font-medium text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 shrink-0">
                              Project Team
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-normal truncate">{emp.role || emp.email}</div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Status</label>
              <select className="input-field text-sm bg-white" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Priority</label>
              <select className="input-field text-sm bg-white" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Created Date</label>
              <input
                type="date"
                className="input-field text-sm bg-white"
                value={form.createdDate}
                onChange={set('createdDate')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Due Date</label>
              <input
                type="date"
                className="input-field text-sm bg-white"
                value={form.dueDate}
                onChange={set('dueDate')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
            <textarea className="input-field text-sm" rows="3" value={form.description} onChange={set('description')} placeholder="Task details or requirements..." />
          </div>

          {/* Subtasks Management Section (Arbitrary n-levels) */}
          {isEditing && (
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    {currentTaskLevel === 0 ? 'Subtasks' : `Subtasks (Level ${currentTaskLevel + 1})`}
                  </label>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {childSubtasks.length} {childSubtasks.length === 1 ? 'subtask' : 'subtasks'}
                    {allNestedSubtasks.length > childSubtasks.length && ` (${allNestedSubtasks.length} total nested)`}
                  </span>
                </div>

                {!isAddingRootSubtask && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingRootSubtask(true);
                      setAddingUnderSubtaskId(null);
                      setNewSubtaskTitle('');
                      setNewSubtaskDueDate(form.dueDate || getLocalDateString());
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                  >
                    <span className="font-bold">+</span>
                    {currentTaskLevel === 0 ? 'Add Subtask' : `Add Subtask (Level ${currentTaskLevel + 1})`}
                  </button>
                )}
              </div>

              {/* Inline Subtask Creation Form at Root */}
              {isAddingRootSubtask && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {'↳'.repeat(Math.min(currentTaskLevel + 1, 3))} New Subtask {currentTaskLevel > 0 ? `(Level ${currentTaskLevel + 1})` : ''}
                      </span>
                      under: <strong className="text-gray-900">{form.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRootSubtask(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200/60"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        className="input-field text-xs h-9 bg-white font-medium"
                        placeholder="Subtask title..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateSubtask(initial.id);
                          } else if (e.key === 'Escape') {
                            setIsAddingRootSubtask(false);
                          }
                        }}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="date"
                        value={newSubtaskDueDate}
                        onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                        className="input-field text-xs h-9 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        className="input-field text-xs h-9 bg-white w-full"
                        value={newSubtaskPriority}
                        onChange={(e) => setNewSubtaskPriority(e.target.value)}
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleCreateSubtask(initial.id)}
                        disabled={!newSubtaskTitle.trim()}
                        className="btn-primary text-xs font-semibold h-9 w-full disabled:opacity-50 inline-flex items-center justify-center shadow-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Subtasks List (Recursive Tree) */}
              {childSubtasks.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs max-h-72 overflow-y-auto custom-scrollbar">
                  {childSubtasks.map(subtask => (
                    <SubtaskTreeRow
                      key={subtask.id}
                      subtask={subtask}
                      level={currentTaskLevel + 1}
                      tasks={tasks}
                      handleToggleSubtaskStatus={handleToggleSubtaskStatus}
                      handleStartEditSubtask={handleStartEditSubtask}
                      handleSaveEditSubtask={handleSaveEditSubtask}
                      editingSubtaskId={editingSubtaskId}
                      editSubtaskTitle={editSubtaskTitle}
                      setEditSubtaskTitle={setEditSubtaskTitle}
                      setEditingSubtaskId={setEditingSubtaskId}
                      handleDeleteSubtask={handleDeleteSubtask}
                      addingUnderSubtaskId={addingUnderSubtaskId}
                      setAddingUnderSubtaskId={setAddingUnderSubtaskId}
                      setIsAddingRootSubtask={setIsAddingRootSubtask}
                      newSubtaskTitle={newSubtaskTitle}
                      setNewSubtaskTitle={setNewSubtaskTitle}
                      newSubtaskDueDate={newSubtaskDueDate}
                      setNewSubtaskDueDate={setNewSubtaskDueDate}
                      newSubtaskPriority={newSubtaskPriority}
                      setNewSubtaskPriority={setNewSubtaskPriority}
                      handleCreateSubtask={handleCreateSubtask}
                      renderMiniAssignees={renderMiniAssignees}
                    />
                  ))}
                </div>
              ) : (
                !isAddingRootSubtask && (
                  <div className="p-3 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                    <p className="text-xs font-medium text-gray-600">
                      No subtasks created for this task yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingRootSubtask(true);
                        setNewSubtaskTitle('');
                        setNewSubtaskDueDate(form.dueDate || getLocalDateString());
                      }}
                      className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      + Add the first subtask
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Pinned Bottom Actions Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-white/95 backdrop-blur-xs shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
            >
              Delete task
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs px-4 py-2" onClick={onClose}>Cancel</button>
            <button form="task-form-modal" type="submit" className="btn-primary text-xs font-bold px-4 py-2">{isEditing ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
