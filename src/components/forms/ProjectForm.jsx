import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';
import { sortTasks } from '../../utils/taskSort';
import { downloadTaskTemplateExcel, parseTaskExcelFile } from '../../utils/excelTaskImport';
import { loadFinanceData } from '../../pages/finance/financeData';

const STATUSES = ['Not started', 'In progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ProjectForm = ({ isOpen, onClose, initial = null }) => {
  const { employees, addProjectWithTasks, updateProjectWithTasks, getProjectTasks } = useData();
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();

  // Load registered master entities (Clients & Suppliers)
  const [financeData, setFinanceData] = useState(() => loadFinanceData());
  useEffect(() => {
    if (isOpen) {
      setFinanceData(loadFinanceData());
    }
  }, [isOpen]);

  const masterDirectory = financeData.masterDirectory || [];
  const clientsList = useMemo(() => masterDirectory.filter(e => e.category === 'Client'), [masterDirectory]);
  const suppliersList = useMemo(() => masterDirectory.filter(e => e.category === 'Supplier'), [masterDirectory]);

  const [clientSearch, setClientSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    clientName: '',
    clientId: '',
    supplierName: '',
    supplierId: '',
    contactDesignation: '',
    clientDesignation: '',
    pocName: '',
    refererName: '',
    contactNumber: '',
    contactEmail: '',
    assigneeIds: [],
    status: 'Not started',
    startDate: '',
    endDate: '',
    startValue: 0,
    endValue: 100,
    progress: 0
  });

  // Project tasks state
  const [projectTasks, setProjectTasks] = useState([]);

  // New task inline input state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState([]);
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef(null);

  // Edit task state (for editing existing tasks in the list)
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    name: '',
    dueDate: '',
    assigneeIds: [],
    priority: 'Medium',
    status: 'Not started',
    parentId: null
  });
  const [showEditAssigneeDropdown, setShowEditAssigneeDropdown] = useState(false);
  const editAssigneeDropdownRef = useRef(null);

  // Subtask & Sub-subtask inline add state
  const [addingSubtaskId, setAddingSubtaskId] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDeadline, setSubtaskDeadline] = useState('');
  const [subtaskAssigneeIds, setSubtaskAssigneeIds] = useState([]);
  const [subtaskPriority, setSubtaskPriority] = useState('Medium');
  const [showSubtaskAssigneeDropdown, setShowSubtaskAssigneeDropdown] = useState(false);
  const subtaskAssigneeDropdownRef = useRef(null);

  // Collapsed parents set for collapsible task trees
  const [collapsedParentIds, setCollapsedParentIds] = useState(new Set());
  const toggleCollapseTask = (id) => {
    setCollapsedParentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Excel import/export state and ref
  const excelFileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  // Close assignee dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
      if (editAssigneeDropdownRef.current && !editAssigneeDropdownRef.current.contains(e.target)) {
        setShowEditAssigneeDropdown(false);
      }
      if (subtaskAssigneeDropdownRef.current && !subtaskAssigneeDropdownRef.current.contains(e.target)) {
        setShowSubtaskAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  useEffect(() => {
    if (initial) {
      let initialAssigneeIds = [];
      if (Array.isArray(initial.assigneeIds)) {
        initialAssigneeIds = initial.assigneeIds;
      } else if (initial.assigneeId) {
        initialAssigneeIds = [initial.assigneeId];
      }

      // Non-admins can only assign projects to themselves
      if (!isAdmin && user?.id) {
        initialAssigneeIds = initialAssigneeIds.includes(user.id) ? [user.id] : [user.id];
      }

      let prog = initial.progress || 0;
      if (prog <= 1 && prog > 0) prog = Math.round(prog * 100);

      let initialStatus = initial.status || 'Not started';
      if (prog === 0) initialStatus = 'Not started';
      else if (prog === 100) initialStatus = 'Done';
      else if (initialStatus === 'Not started' && prog > 0) initialStatus = 'In progress';

      const existingTasks = getProjectTasks(initial.id) || [];
      // Normalize task assigneeIds and cascade parent assignees to subtasks if unassigned
      const normalizedTasks = existingTasks.map(t => {
        let taskAssigneeIds = [];
        if (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0) {
          taskAssigneeIds = t.assigneeIds;
        } else if (t.assigneeId) {
          taskAssigneeIds = [t.assigneeId];
        }
        return { ...t, assigneeIds: taskAssigneeIds };
      });

      const taskMap = new Map(normalizedTasks.map(t => [String(t.id), t]));
      normalizedTasks.forEach(t => {
        if ((!t.assigneeIds || t.assigneeIds.length === 0) && t.parentId) {
          let curr = taskMap.get(String(t.parentId));
          while (curr) {
            const pAssignees = Array.isArray(curr.assigneeIds) && curr.assigneeIds.length > 0
              ? curr.assigneeIds
              : (curr.assigneeId ? [curr.assigneeId] : []);
            if (pAssignees.length > 0) {
              t.assigneeIds = [...pAssignees];
              t.assigneeId = pAssignees[0] || '';
              break;
            }
            curr = curr.parentId ? taskMap.get(String(curr.parentId)) : null;
          }
        }
      });

      setProjectTasks(normalizedTasks);

      const today = getLocalDateString();
      const start = initial.startDate ? initial.startDate.slice(0, 10) : today;
      const end = initial.endDate ? initial.endDate.slice(0, 10) : '';

      const desig = initial.contactDesignation || initial.clientDesignation || '';
      setForm({
        name: initial.name || '',
        clientName: initial.clientName || '',
        clientId: initial.clientId || '',
        supplierName: initial.supplierName || '',
        supplierId: initial.supplierId || '',
        contactDesignation: desig,
        clientDesignation: desig,
        pocName: initial.pocName || initial.pointOfContactName || '',
        refererName: initial.refererName || '',
        contactNumber: initial.contactNumber || initial.contactPhone || '',
        contactEmail: initial.contactEmail || '',
        assigneeIds: initialAssigneeIds,
        status: initialStatus,
        startDate: start,
        endDate: end,
        startValue: 0,
        endValue: 100,
        progress: prog
      });

      setNewTaskDeadline(today);
      const defaultNewAssignees = (!isAdmin && user?.id)
        ? [user.id]
        : (initialAssigneeIds.length > 0 ? [initialAssigneeIds[0]] : (employees[0] ? [employees[0].id] : []));
      setNewTaskAssigneeIds(defaultNewAssignees);
      setEditingTaskId(null);
    } else {
      const today = getLocalDateString();
      const twoWeeksLaterDate = new Date();
      twoWeeksLaterDate.setDate(twoWeeksLaterDate.getDate() + 14);
      const twoWeeksLater = getLocalDateString(twoWeeksLaterDate);

      const defaultProjectAssignees = (!isAdmin && user?.id) ? [user.id] : [];

      setForm({
        name: '',
        clientName: '',
        clientId: '',
        supplierName: '',
        supplierId: '',
        contactDesignation: '',
        clientDesignation: '',
        pocName: '',
        refererName: '',
        contactNumber: '',
        contactEmail: '',
        assigneeIds: defaultProjectAssignees,
        status: 'Not started',
        startDate: today,
        endDate: twoWeeksLater,
        startValue: 0,
        endValue: 100,
        progress: 0
      });

      setProjectTasks([]);
      setNewTaskTitle('');
      setNewTaskDeadline(today);
      const defaultNewAssignees = (!isAdmin && user?.id)
        ? [user.id]
        : (employees[0] ? [employees[0].id] : []);
      setNewTaskAssigneeIds(defaultNewAssignees);
      setNewTaskPriority('Medium');
      setEditingTaskId(null);
    }
  }, [initial, isOpen, employees, isAdmin, user?.id]);

  // Recalculate progress whenever projectTasks change
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
  const hasTasks = totalTasks > 0;
  const autoProgress = hasTasks ? Math.round((completedTasks / totalTasks) * 100) : form.progress;

  // Sync form status and progress when tasks change
  useEffect(() => {
    if (hasTasks) {
      setForm(prev => {
        let nextStatus = 'In progress';
        if (autoProgress === 100) nextStatus = 'Done';
        else if (autoProgress === 0) nextStatus = 'Not started';
        return { ...prev, progress: autoProgress, status: nextStatus };
      });
    }
  }, [autoProgress, hasTasks]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Filtered Clients and Suppliers for Master Data Selector Boxes
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clientsList;
    const q = clientSearch.toLowerCase();
    return clientsList.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  }, [clientsList, clientSearch]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliersList;
    const q = supplierSearch.toLowerCase();
    return suppliersList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.country || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  }, [suppliersList, supplierSearch]);

  const handleSelectClient = (client) => {
    if (form.clientId === client.id) {
      setForm(prev => ({
        ...prev,
        clientId: '',
        clientName: ''
      }));
      return;
    }

    setForm(prev => {
      const primaryStakeholder = Array.isArray(client.stakeholders) && client.stakeholders.length > 0
        ? client.stakeholders[0]
        : null;

      return {
        ...prev,
        clientId: client.id,
        clientName: client.name,
        pocName: prev.pocName || client.contactPerson || primaryStakeholder?.name || '',
        contactEmail: prev.contactEmail || client.companyMail || client.contactEmail || primaryStakeholder?.email || '',
        contactNumber: prev.contactNumber || client.contactPhone || primaryStakeholder?.phone || '',
        contactDesignation: prev.contactDesignation || primaryStakeholder?.role || 'Lead Commercial POC'
      };
    });
  };

  const handleSelectSupplier = (supplier) => {
    if (form.supplierId === supplier.id) {
      setForm(prev => ({
        ...prev,
        supplierId: '',
        supplierName: ''
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.name
    }));
  };

  const toggleAssignee = (empId) => {
    setForm(prev => {
      const exists = prev.assigneeIds.includes(empId);
      const newIds = exists
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId];
      return { ...prev, assigneeIds: newIds };
    });
  };

  const toggleNewTaskAssignee = (empId) => {
    setNewTaskAssigneeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const toggleEditTaskAssignee = (empId) => {
    setEditTaskForm(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(empId)
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId]
    }));
  };

  const getTaskAssignees = (task) => {
    if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) {
      return task.assigneeIds.map(id => employees.find(e => e.id === id)).filter(Boolean);
    }
    if (task.assigneeId) {
      const emp = employees.find(e => e.id === task.assigneeId);
      return emp ? [emp] : [];
    }
    return [];
  };

  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const assignedIds = newTaskAssigneeIds.length > 0
      ? [...newTaskAssigneeIds]
      : (form.assigneeIds.length > 0 ? [form.assigneeIds[0]] : []);
    const primaryAssigneeId = assignedIds[0] || (employees[0]?.id || '');

    const taskItem = {
      id: 'temp_' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: title,
      dueDate: newTaskDeadline || form.endDate || form.startDate,
      assigneeIds: assignedIds,
      assigneeId: primaryAssigneeId,
      priority: newTaskPriority,
      status: 'Not started',
      description: '',
      parentId: null
    };

    setProjectTasks(prev => [...prev, taskItem]);
    setNewTaskTitle('');
    setNewTaskDeadline(getLocalDateString());
  };

  const handleStartAddSubtask = (parentTask) => {
    setAddingSubtaskId(parentTask.id);
    setSubtaskTitle('');
    setSubtaskDeadline(parentTask.dueDate ? parentTask.dueDate.slice(0, 10) : (form.endDate || getLocalDateString()));
    setSubtaskPriority(parentTask.priority || 'Medium');
    const parentAssignees = Array.isArray(parentTask.assigneeIds) && parentTask.assigneeIds.length > 0
      ? parentTask.assigneeIds
      : (parentTask.assigneeId ? [parentTask.assigneeId] : []);
    const defaultIds = (!isAdmin && user?.id)
      ? [user.id]
      : (parentAssignees.length > 0 ? [...parentAssignees] : (user?.id ? [user.id] : []));
    setSubtaskAssigneeIds(defaultIds);
    setShowSubtaskAssigneeDropdown(false);
  };

  const handleCancelAddSubtask = () => {
    setAddingSubtaskId(null);
    setSubtaskTitle('');
    setShowSubtaskAssigneeDropdown(false);
  };

  const handleSaveSubtask = (parentTask) => {
    const title = subtaskTitle.trim();
    if (!title) return;

    const parentAssignees = Array.isArray(parentTask.assigneeIds) && parentTask.assigneeIds.length > 0
      ? parentTask.assigneeIds
      : (parentTask.assigneeId ? [parentTask.assigneeId] : []);
    const assignedIds = (!isAdmin && user?.id)
      ? [user.id]
      : (subtaskAssigneeIds.length > 0 ? [...subtaskAssigneeIds] : parentAssignees);
    const primaryAssigneeId = assignedIds[0] || parentTask.assigneeId || (employees[0]?.id || '');

    const newSubtask = {
      id: 'temp_' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: title,
      dueDate: subtaskDeadline || parentTask.dueDate || form.endDate || form.startDate,
      assigneeIds: assignedIds,
      assigneeId: primaryAssigneeId,
      priority: subtaskPriority,
      status: 'Not started',
      description: '',
      parentId: parentTask.id
    };

    setProjectTasks(prev => [...prev, newSubtask]);
    setAddingSubtaskId(null);
    setSubtaskTitle('');
    setShowSubtaskAssigneeDropdown(false);
    // Auto-expand parent
    setCollapsedParentIds(prev => {
      const next = new Set(prev);
      next.delete(parentTask.id);
      return next;
    });
    addToast(`Added subtask to "${parentTask.name}"`, 'success', 2000);
  };

  // Hierarchical tasks list with depth levels:
  // level 0: Main task
  // level 1: Sub-task
  // level 2: Sub-sub-task
  const hierarchicalTasks = useMemo(() => {
    const list = projectTasks;
    const mainTasks = list.filter(t => !t.parentId || !list.some(p => String(p.id) === String(t.parentId)));
    const sortedMain = sortTasks(mainTasks);
    const result = [];

    sortedMain.forEach(mainTask => {
      result.push({ ...mainTask, level: 0 });
      // Children (level 1 subtasks)
      const subTasks = sortTasks(list.filter(t => String(t.parentId) === String(mainTask.id)));
      subTasks.forEach(subTask => {
        result.push({ ...subTask, level: 1, parentName: mainTask.name });
        // Grandchildren (level 2 sub-subtasks)
        const subSubTasks = sortTasks(list.filter(t => String(t.parentId) === String(subTask.id)));
        subSubTasks.forEach(subSubTask => {
          result.push({ ...subSubTask, level: 2, parentName: subTask.name, grandParentName: mainTask.name });
        });
      });
    });

    return result;
  }, [projectTasks]);

  const handleStartEditTask = (task) => {
    setEditingTaskId(task.id);
    let ids = [];
    if (!isAdmin && user?.id) {
      ids = [user.id];
    } else if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) {
      ids = [...task.assigneeIds];
    } else if (task.assigneeId) {
      ids = [task.assigneeId];
    }

    setEditTaskForm({
      name: task.name || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : getLocalDateString(),
      assigneeIds: ids,
      priority: task.priority || 'Medium',
      status: task.status || 'Not started',
      parentId: task.parentId || null
    });
    setShowEditAssigneeDropdown(false);
  };

  const handleSaveEditTask = () => {
    if (!editTaskForm.name.trim()) return;

    const finalEditAssignees = editTaskForm.assigneeIds;

    setProjectTasks(prev => {
      // Find all descendant tasks (subtasks & sub-subtasks) of editingTaskId
      const descendants = new Set();
      let added = true;
      while (added) {
        added = false;
        prev.forEach(t => {
          if (t.parentId && (String(t.parentId) === String(editingTaskId) || descendants.has(String(t.parentId))) && !descendants.has(String(t.id))) {
            descendants.add(String(t.id));
            added = true;
          }
        });
      }

      return prev.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            name: editTaskForm.name.trim(),
            dueDate: editTaskForm.dueDate,
            assigneeIds: finalEditAssignees,
            assigneeId: finalEditAssignees[0] || '',
            priority: editTaskForm.priority,
            status: editTaskForm.status,
            parentId: editTaskForm.parentId !== undefined ? editTaskForm.parentId : t.parentId
          };
        }
        if (descendants.has(String(t.id))) {
          return {
            ...t,
            assigneeIds: finalEditAssignees,
            assigneeId: finalEditAssignees[0] || ''
          };
        }
        return t;
      });
    });
    setEditingTaskId(null);
    setShowEditAssigneeDropdown(false);
    addToast('Task & subtasks updated!', 'success', 2000);
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setShowEditAssigneeDropdown(false);
  };

  const handleToggleTaskStatus = (taskId) => {
    setProjectTasks(prev => {
      const target = prev.find(t => t.id === taskId);
      if (!target) return prev;
      const nextStatus = target.status === 'Done' ? 'In progress' : 'Done';

      // If marking Done, also cascade to all child subtasks
      const toUpdate = new Set([taskId]);
      if (nextStatus === 'Done') {
        let added = true;
        while (added) {
          added = false;
          prev.forEach(t => {
            if (t.parentId && toUpdate.has(t.parentId) && !toUpdate.has(t.id)) {
              toUpdate.add(t.id);
              added = true;
            }
          });
        }
      }

      return prev.map(t => toUpdate.has(t.id) ? { ...t, status: nextStatus } : t);
    });
  };

  const handleRemoveTask = (taskId) => {
    const toDelete = new Set([taskId]);
    let added = true;
    while (added) {
      added = false;
      projectTasks.forEach(t => {
        if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
          toDelete.add(t.id);
          added = true;
        }
      });
    }

    if (editingTaskId && toDelete.has(editingTaskId)) {
      setEditingTaskId(null);
      setShowEditAssigneeDropdown(false);
    }
    if (addingSubtaskId && toDelete.has(addingSubtaskId)) {
      setAddingSubtaskId(null);
      setShowSubtaskAssigneeDropdown(false);
    }
    setProjectTasks(prev => prev.filter(t => !toDelete.has(t.id)));
    addToast('Task removed', 'info', 1500);
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTaskTemplateExcel(employees);
      addToast('Tasks template downloaded!', 'success', 3000);
    } catch (err) {
      console.error('Template download error:', err);
      addToast('Failed to download template', 'error', 3000);
    }
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { tasks, count } = await parseTaskExcelFile(
        file,
        employees,
        newTaskDeadline || form.endDate || form.startDate || getLocalDateString()
      );

      if (count === 0) {
        addToast('No tasks found in the uploaded file.', 'warning', 4000);
      } else {
        const finalTasks = (!isAdmin && user?.id)
          ? tasks.map(t => ({ ...t, assigneeIds: [user.id], assigneeId: user.id }))
          : tasks;
        setProjectTasks(prev => [...prev, ...finalTasks]);
        addToast(`Successfully imported ${count} task${count > 1 ? 's' : ''}!`, 'success', 4000);
      }
    } catch (err) {
      console.error('Excel import error:', err);
      addToast(err.message || 'Failed to parse Excel file.', 'error', 4000);
    } finally {
      setIsImporting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const progVal = Number(form.progress) || 0;
    const effectiveProgress = progVal / 100;
    let finalStatus = form.status;
    if (progVal === 0) finalStatus = 'Not started';
    else if (progVal === 100) finalStatus = 'Done';
    else if (finalStatus === 'Not started' && progVal > 0) finalStatus = 'In progress';

    const finalAssigneeIds = (!isAdmin && user?.id)
      ? (form.assigneeIds.includes(user.id) ? [user.id] : (form.assigneeIds.length > 0 ? [user.id] : []))
      : form.assigneeIds;

    const payload = {
      ...form,
      assigneeIds: finalAssigneeIds,
      assigneeId: finalAssigneeIds[0] || '', // legacy compatibility
      startValue: 0,
      endValue: 100,
      progress: effectiveProgress,
      status: finalStatus
    };

    // Ensure each task in projectTasks has both assigneeIds and assigneeId
    const formattedTasks = projectTasks.map(t => ({
      ...t,
      assigneeIds: Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []),
      assigneeId: (Array.isArray(t.assigneeIds) && t.assigneeIds[0]) || t.assigneeId || ''
    }));

    if (initial) {
      updateProjectWithTasks(initial.id, payload, formattedTasks);
      addToast(`Updated project "${form.name}"!`, 'success');
    } else {
      addProjectWithTasks(payload, formattedTasks);
      addToast(`Created project "${form.name}" with ${formattedTasks.length} tasks!`, 'success');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit Project' : 'Create New Project'}
      maxWidth="max-w-5xl xl:max-w-6xl"
    >
      <form onSubmit={submit} className="space-y-6">
        {/* Top: Project Info & Team */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Core Fields */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="input-field text-sm font-semibold"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="e.g. Mobile App Redesign"
              />
            </div>

            {/* Client Name & Referer Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Client Name
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={form.clientName || ''}
                  onChange={set('clientName')}
                  placeholder="e.g. Acme Corp / Sarah Jenkins"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Referer Name
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={form.refererName || ''}
                  onChange={set('refererName')}
                  placeholder="e.g. Michael Scott / Partner Agency"
                />
              </div>
            </div>

            {/* Point of Contact & Contact Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Point of Contact Name
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={form.pocName || ''}
                  onChange={set('pocName')}
                  placeholder="e.g. Alex Rivera"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Contact Designation
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={form.contactDesignation || form.clientDesignation || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      contactDesignation: val,
                      clientDesignation: val
                    }));
                  }}
                  placeholder="e.g. VP of Product"
                />
              </div>
            </div>

            {/* Contact Number & Contact Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Contact Number
                </label>
                <input
                  type="tel"
                  className="input-field text-sm"
                  value={form.contactNumber || ''}
                  onChange={set('contactNumber')}
                  placeholder="e.g. +1 (555) 019-2834"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="input-field text-sm"
                  value={form.contactEmail || ''}
                  onChange={set('contactEmail')}
                  placeholder="e.g. alex.rivera@acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Status</label>
                <select
                  className="input-field text-sm bg-white"
                  value={form.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let nextProg = form.progress;
                    if (newStatus === 'Not started') {
                      nextProg = 0;
                    } else if (newStatus === 'Done') {
                      nextProg = 100;
                    } else if (newStatus === 'In progress') {
                      if (form.progress === 0) nextProg = 25;
                      else if (form.progress === 100) nextProg = 50;
                    }
                    setForm(prev => ({ ...prev, status: newStatus, progress: nextProg }));
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Progress
                    {hasTasks && (
                      <span className="ml-1 text-[11px] font-normal text-gray-400">
                        ({completedTasks}/{totalTasks} tasks)
                      </span>
                    )}
                  </label>
                  <span className="text-xs font-bold text-emerald-600 tabular-nums">
                    {form.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-2 h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-xs hover:border-gray-300 transition">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      let nextStatus = 'In progress';
                      if (val === 0) nextStatus = 'Not started';
                      else if (val === 100) nextStatus = 'Done';
                      setForm(prev => ({ ...prev, progress: val, status: nextStatus }));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.startDate}
                  onChange={set('startDate')}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">End Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.endDate}
                  onChange={set('endDate')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Column: Client & Supplier Selection */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            {/* Box 1: Choose Client */}
            <div className="flex flex-col border border-gray-200 rounded-xl bg-white p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-blue-600">domain</span>
                  <label className="text-xs font-bold text-gray-800">
                    Client {form.clientName ? <span className="text-blue-600 font-bold">• 1 Selected</span> : <span className="text-gray-400 font-normal">(Choose Client)</span>}
                  </label>
                </div>
                {form.clientName ? (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, clientId: '', clientName: '' }))}
                    className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition"
                  >
                    Clear selection
                  </button>
                ) : (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100">
                    Select 1 Client
                  </span>
                )}
              </div>

              {/* Search input for Client */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px]">search</span>
                <input
                  type="text"
                  placeholder="Search client by name, country, department..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Client List */}
              <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {filteredClients.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No matching clients found in Master Data
                  </div>
                ) : (
                  filteredClients.map(client => {
                    const isSelected = form.clientId === client.id || form.clientName === client.name;
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                            : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {client.avatarText || client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{client.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono font-normal">({client.id})</span>
                            </div>
                            <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                              <span>{client.country}</span>
                              <span>•</span>
                              <span className="truncate">{client.department || 'Client Entity'}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-[12px]">check</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Box 2: Add Supplier (Optional - need not be selected all the time) */}
            <div className="flex flex-col border border-gray-200 rounded-xl bg-white p-3 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-emerald-600">local_shipping</span>
                  <label className="text-xs font-bold text-gray-800">
                    Supplier {form.supplierName ? <span className="text-emerald-600 font-bold">• {form.supplierName}</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                  </label>
                </div>
                {form.supplierName ? (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, supplierId: '', supplierName: '' }))}
                    className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition"
                  >
                    Remove supplier
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium border border-gray-200">
                    Optional
                  </span>
                )}
              </div>

              {/* Search input for Supplier */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px]">search</span>
                <input
                  type="text"
                  placeholder="Search supplier by name, country, specialty..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Supplier List */}
              <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {/* Direct Delivery / None Option */}
                <div
                  onClick={() => setForm(prev => ({ ...prev, supplierId: '', supplierName: '' }))}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                    !form.supplierId && !form.supplierName
                      ? 'bg-gray-100/90 border-gray-300 text-gray-800 font-semibold'
                      : 'bg-white border-dashed border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">block</span>
                    <span>No Supplier Assigned (Direct Project)</span>
                  </div>
                  {!form.supplierId && !form.supplierName && (
                    <span className="material-symbols-outlined text-[14px] text-gray-600">check</span>
                  )}
                </div>

                {filteredSuppliers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No matching suppliers found
                  </div>
                ) : (
                  filteredSuppliers.map(supplier => {
                    const isSelected = form.supplierId === supplier.id || form.supplierName === supplier.name;
                    return (
                      <div
                        key={supplier.id}
                        onClick={() => handleSelectSupplier(supplier)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs font-semibold'
                            : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {supplier.avatarText || supplier.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{supplier.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono font-normal">({supplier.id})</span>
                            </div>
                            <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                              <span>{supplier.country}</span>
                              <span>•</span>
                              <span className="truncate">{supplier.department || 'Supplier Entity'}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-[12px]">check</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Tasks & Deadlines Section */}
        <div className="border-t border-gray-200 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Project Tasks & Deadlines</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {completedTasks}/{totalTasks} Completed ({hasTasks ? autoProgress : 0}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Tasks marked as <span className="font-semibold text-emerald-600">Done</span> automatically calculate this project's progress percentage. You can add, edit, or assign multiple employees.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {hasTasks && (
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{autoProgress}% Progress</span>
                </div>
              )}

              {/* Template Download Button */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                title="Download formatted Excel template for tasks"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Template</span>
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => excelFileInputRef.current?.click()}
                disabled={isImporting}
                title="Import tasks from an Excel file (.xlsx, .xls, .csv)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 border border-emerald-600 rounded-lg shadow-sm transition hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{isImporting ? 'Importing...' : 'Import Excel'}</span>
              </button>

              {/* Hidden file input */}
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleImportExcelFile}
              />
            </div>
          </div>

          {/* Quick Task Adder Form */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200/90 bg-slate-50/70 space-y-3">
            <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{isAdmin ? 'Add Task with Deadlines & Multiple Assignees' : 'Add Task (Self-assigned)'}</span>
              </div>
              {isAdmin ? (
                newTaskAssigneeIds.length > 0 && (
                  <span className="text-[11px] font-medium text-blue-600">
                    {newTaskAssigneeIds.length} employee{newTaskAssigneeIds.length > 1 ? 's' : ''} assigned
                  </span>
                )
              ) : (
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Assigned to: {user?.fullName || 'You'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
              {/* Task Title */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Task title (e.g. Design wireframes)..."
                  className="input-field text-xs h-9 bg-white"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                />
              </div>

              {/* Deadline */}
              <div className="sm:col-span-3">
                <input
                  type="date"
                  className="input-field text-xs h-9 bg-white"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  title="Task deadline"
                />
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNewTaskDeadline(getLocalDateString())}
                    className={`px-1.5 py-0.5 rounded font-medium transition ${
                      newTaskDeadline === getLocalDateString()
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setNewTaskDeadline(getLocalDateString(d));
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setNewTaskDeadline(getLocalDateString(d));
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                  >
                    +1w
                  </button>
                  {form.endDate && (
                    <button
                      type="button"
                      onClick={() => setNewTaskDeadline(form.endDate)}
                      className={`px-1.5 py-0.5 rounded font-medium transition ${
                        newTaskDeadline === form.endDate
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Set to project end date"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>

              {/* Assignee Selection in Quick Task Adder */}
              <div className="sm:col-span-3 relative" ref={assigneeDropdownRef}>
                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="input-field text-xs h-9 bg-white flex items-center justify-between gap-1.5 w-full text-left cursor-pointer"
                      title="Assign one or more employees"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                        {newTaskAssigneeIds.length === 0 ? (
                          <span className="text-gray-400 truncate flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Assign team (0)</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                            <div className="flex items-center -space-x-1.5 shrink-0">
                              {newTaskAssigneeIds.slice(0, 3).map(id => {
                                const emp = employees.find(e => e.id === id);
                                return emp ? (
                                  <img
                                    key={id}
                                    src={emp.avatar}
                                    alt={emp.fullName}
                                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
                                  />
                                ) : null;
                              })}
                            </div>
                            <span className="text-[11px] font-semibold text-gray-800 truncate">
                              {newTaskAssigneeIds.length === 1
                                ? employees.find(e => e.id === newTaskAssigneeIds[0])?.fullName.split(' ')[0]
                                : `${newTaskAssigneeIds.length} assignees`}
                            </span>
                          </div>
                        )}
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
                          showAssigneeDropdown ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Multi-Select Assignee Popover */}
                    {showAssigneeDropdown && (
                      <div className="absolute z-30 left-0 mt-1 w-64 rounded-xl bg-white border border-gray-200 shadow-xl p-2 max-h-56 overflow-y-auto custom-scrollbar animate-slide-up text-left">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-[11px]">
                          <span className="font-semibold text-gray-700">Assign Multiple Employees</span>
                          <div className="flex items-center gap-1.5">
                            {form.assigneeIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setNewTaskAssigneeIds([...form.assigneeIds])}
                                className="text-blue-600 hover:underline text-[10px] font-medium"
                              >
                                All Project
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setNewTaskAssigneeIds([])}
                              className="text-gray-400 hover:text-gray-600 text-[10px]"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {employees.map(e => {
                            const isSelected = newTaskAssigneeIds.includes(e.id);
                            return (
                              <div
                                key={e.id}
                                onClick={() => toggleNewTaskAssignee(e.id)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                                  isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="h-3.5 w-3.5 accent-blue-600 rounded"
                                />
                                <img
                                  src={e.avatar}
                                  alt={e.fullName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                  onError={(ev) => {
                                    ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=0070F3&color=fff`;
                                  }}
                                />
                                <div className="min-w-0 flex-1 truncate">
                                  <div className="truncate">{e.fullName}</div>
                                  <div className="text-[10px] text-gray-400 font-normal truncate">{e.role || 'Member'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="input-field text-xs h-9 bg-gray-50/90 border-gray-200 flex items-center justify-between gap-1.5 w-full text-gray-700 select-none"
                    title="Non-admin users can only add tasks for themselves"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                      <img
                        src={user?.avatar || employees.find(e => e.id === user?.id)?.avatar}
                        alt={user?.fullName}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-white shrink-0"
                        onError={(ev) => {
                          ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0070F3&color=fff`;
                        }}
                      />
                      <span className="text-[11px] font-semibold text-gray-800 truncate">
                        {user?.fullName || 'Self'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                      Self
                    </span>
                  </div>
                )}
              </div>

              {/* Priority & Add Button */}
              <div className="sm:col-span-2 flex items-start gap-1.5">
                <select
                  className="input-field text-xs h-9 bg-white flex-1"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="btn-primary text-xs font-semibold px-3.5 h-9 shrink-0 disabled:opacity-50 inline-flex items-center justify-center"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List / Checklist with Inline Edit */}
          {projectTasks.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs max-h-72 overflow-y-auto custom-scrollbar">
              {hierarchicalTasks.map((task, idx) => {
                const isEditing = editingTaskId === task.id;
                const isDone = task.status === 'Done';
                const taskAssignees = getTaskAssignees(task);

                // Check if hidden because an ancestor is collapsed
                const isHiddenByCollapse = (() => {
                  if (task.level === 0) return false;
                  if (collapsedParentIds.has(task.parentId)) return true;
                  if (task.level === 2) {
                    const parentTask = projectTasks.find(t => String(t.id) === String(task.parentId));
                    if (parentTask && collapsedParentIds.has(parentTask.parentId)) return true;
                  }
                  return false;
                })();

                if (isHiddenByCollapse) return null;

                const childCount = projectTasks.filter(t => String(t.parentId) === String(task.id)).length;
                const hasChildren = childCount > 0;
                const isCollapsed = collapsedParentIds.has(task.id);

                // INLINE EDIT MODE FOR THIS TASK
                if (isEditing) {
                  return (
                    <div
                      key={task.id || idx}
                      className="p-3 bg-blue-50/50 border-l-4 border-l-blue-600 space-y-2.5 transition animate-slide-up"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editing Task
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditTask}
                            className="text-xs font-semibold px-2.5 py-1 text-gray-600 hover:bg-gray-200/70 rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditTask}
                            disabled={!editTaskForm.name.trim()}
                            className="btn-primary text-xs font-bold px-3 py-1 inline-flex items-center gap-1 shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                        {/* Title input */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={editTaskForm.name}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                            className="input-field text-xs h-9 bg-white font-medium"
                            placeholder="Task name..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditTask();
                              } else if (e.key === 'Escape') {
                                handleCancelEditTask();
                              }
                            }}
                          />
                        </div>

                        {/* Deadline */}
                        <div className="sm:col-span-3">
                          <input
                            type="date"
                            value={editTaskForm.dueDate}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                            className="input-field text-xs h-9 bg-white"
                          />
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString() })}
                              className={`px-1.5 py-0.5 rounded font-medium transition ${
                                editTaskForm.dueDate === getLocalDateString()
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 3);
                                setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString(d) });
                              }}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 7);
                                setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString(d) });
                              }}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                            >
                              +1w
                            </button>
                            {form.endDate && (
                              <button
                                type="button"
                                onClick={() => setEditTaskForm({ ...editTaskForm, dueDate: form.endDate })}
                                className={`px-1.5 py-0.5 rounded font-medium transition ${
                                  editTaskForm.dueDate === form.endDate
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Set to project end date"
                              >
                                End
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assignee selector in edit */}
                        <div className="sm:col-span-3 relative" ref={editAssigneeDropdownRef}>
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowEditAssigneeDropdown(!showEditAssigneeDropdown)}
                                className="input-field text-xs h-9 bg-white flex items-center justify-between gap-1 w-full text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                                  {editTaskForm.assigneeIds.length === 0 ? (
                                    <span className="text-gray-400 truncate">Assign team (0)</span>
                                  ) : (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                      <div className="flex items-center -space-x-1 shrink-0">
                                        {editTaskForm.assigneeIds.slice(0, 3).map(id => {
                                          const emp = employees.find(e => e.id === id);
                                          return emp ? (
                                            <img key={id} src={emp.avatar} alt={emp.fullName} className="w-4 h-4 rounded-full object-cover ring-1 ring-white" />
                                          ) : null;
                                        })}
                                      </div>
                                      <span className="text-[11px] font-semibold text-gray-800 truncate">
                                        {editTaskForm.assigneeIds.length === 1
                                          ? employees.find(e => e.id === editTaskForm.assigneeIds[0])?.fullName.split(' ')[0]
                                          : `${editTaskForm.assigneeIds.length} assignees`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {showEditAssigneeDropdown && (
                                <div className="absolute z-30 left-0 mt-1 w-60 rounded-xl bg-white border border-gray-200 shadow-xl p-2 max-h-52 overflow-y-auto custom-scrollbar animate-slide-up text-left">
                                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-[11px]">
                                    <span className="font-semibold text-gray-700">Assign Employees</span>
                                    <button
                                      type="button"
                                      onClick={() => setEditTaskForm(prev => ({ ...prev, assigneeIds: [] }))}
                                      className="text-gray-400 hover:text-gray-600 text-[10px]"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {employees.map(e => {
                                      const isSelected = editTaskForm.assigneeIds.includes(e.id);
                                      return (
                                        <div
                                          key={e.id}
                                          onClick={() => toggleEditTaskAssignee(e.id)}
                                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                                            isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}}
                                            className="h-3.5 w-3.5 accent-blue-600 rounded"
                                          />
                                          <img src={e.avatar} alt={e.fullName} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                          <span className="truncate">{e.fullName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div
                              className="input-field text-xs h-9 bg-gray-50/90 border-gray-200 flex items-center justify-between gap-1 w-full text-gray-700 select-none"
                              title="Non-admin users can only assign tasks to themselves"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                <img
                                  src={user?.avatar || employees.find(e => e.id === user?.id)?.avatar}
                                  alt={user?.fullName}
                                  className="w-4 h-4 rounded-full object-cover ring-1 ring-white shrink-0"
                                />
                                <span className="text-[11px] font-semibold text-gray-800 truncate">
                                  {user?.fullName || 'Self'}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                Self
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Priority & Status */}
                        <div className="sm:col-span-2 flex items-start gap-1.5">
                          <select
                            className="input-field text-xs h-9 bg-white flex-1"
                            value={editTaskForm.priority}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                            title="Priority"
                          >
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select
                            className="input-field text-xs h-9 bg-white flex-1"
                            value={editTaskForm.status}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                            title="Status"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                }

                // NORMAL TASK ROW DISPLAY WITH HIERARCHICAL INDENTATION & SUBTASK ACTIONS
                return (
                  <React.Fragment key={task.id || idx}>
                    <div
                      className={`flex items-center justify-between p-2.5 transition text-xs group ${
                        isDone ? 'bg-emerald-50/30' : 'hover:bg-gray-50/80'
                      } ${
                        task.level === 1
                          ? 'pl-7 bg-blue-50/15 border-l-2 border-l-blue-400'
                          : task.level === 2
                          ? 'pl-12 bg-purple-50/20 border-l-2 border-l-purple-400'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Collapse/Expand Toggle if has children */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleCollapseTask(task.id)}
                            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 transition shrink-0"
                            title={isCollapsed ? 'Expand subtasks' : 'Collapse subtasks'}
                          >
                            <svg
                              className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-4 shrink-0" />
                        )}

                        {/* Status Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(task.id)}
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

                        {/* Tree Branch Symbol */}
                        {task.level === 1 && (
                          <span className="text-blue-500 font-bold text-xs select-none shrink-0" title="Subtask">↳</span>
                        )}
                        {task.level === 2 && (
                          <span className="text-purple-500 font-bold text-xs select-none shrink-0" title="Sub-subtask">↳↳</span>
                        )}

                        {/* Level Badge */}
                        {task.level === 1 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            Subtask
                          </span>
                        )}
                        {task.level === 2 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                            Sub-subtask
                          </span>
                        )}

                        {/* Task Title */}
                        <div className="min-w-0 flex-1 cursor-pointer flex items-center gap-1.5" onClick={() => handleStartEditTask(task)}>
                          <span
                            className={`font-semibold text-gray-900 block truncate group-hover:text-blue-600 transition ${
                              isDone ? 'line-through text-gray-400' : ''
                            }`}
                            title="Click to edit task"
                          >
                            {task.name}
                          </span>
                          {hasChildren && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded-full font-medium shrink-0">
                              {childCount} {task.level === 0 ? (childCount === 1 ? 'sub' : 'subs') : (childCount === 1 ? 'sub-sub' : 'sub-subs')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {/* + Subtask / + Sub-subtask Add Button */}
                        {task.level === 0 && (
                          <button
                            type="button"
                            onClick={() => handleStartAddSubtask(task)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                            title="Add a subtask under this task"
                          >
                            <span className="font-bold">+</span> Subtask
                          </button>
                        )}
                        {task.level === 1 && (
                          <button
                            type="button"
                            onClick={() => handleStartAddSubtask(task)}
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200 hover:border-purple-300 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                            title="Add a sub-subtask under this subtask"
                          >
                            <span className="font-bold">+</span> Sub-subtask
                          </button>
                        )}

                        {/* Priority pill */}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>

                        {/* Deadline chip */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-md">
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{task.dueDate.slice(0, 10)}</span>
                          </div>
                        )}

                        {/* Multi-Assignee Avatars Cluster */}
                        {taskAssignees.length > 0 ? (
                          <div
                            className="flex items-center gap-1.5"
                            title={`Assigned to: ${taskAssignees.map(a => a.fullName).join(', ')}`}
                          >
                            <div className="flex items-center -space-x-1.5 shrink-0">
                              {taskAssignees.slice(0, 3).map(a => (
                                <img
                                  key={a.id}
                                  src={a.avatar}
                                  alt={a.fullName}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white border border-gray-200"
                                  onError={(ev) => {
                                    ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.fullName)}&background=0070F3&color=fff`;
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-600 hidden sm:inline max-w-[90px] truncate">
                              {taskAssignees.length === 1
                                ? taskAssignees[0].fullName.split(' ')[0]
                                : `${taskAssignees.length} assignees`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                        )}

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'In progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {task.status || 'Not started'}
                        </span>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => handleStartEditTask(task)}
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
                          title="Edit task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                          title={hasChildren ? `Remove task and its ${childCount} child subtask(s)` : 'Remove task'}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Inline Subtask Creation Form under this task */}
                    {addingSubtaskId === task.id && (
                      <div
                        className={`p-3 space-y-2.5 transition animate-slide-up border-y ${
                          task.level === 0
                            ? 'ml-6 pl-4 border-l-4 border-l-blue-500 bg-blue-50/70 border-blue-200'
                            : 'ml-11 pl-4 border-l-4 border-l-purple-500 bg-purple-50/70 border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs ${
                                task.level === 0 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                              }`}
                            >
                              {task.level === 0 ? '↳ Add Subtask' : '↳↳ Add Sub-subtask'}
                            </span>
                            <span className="text-xs text-gray-600 truncate max-w-[280px]">
                              under: <strong className="text-gray-900">{task.name}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelAddSubtask}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200/60"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                          {/* Title input */}
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={subtaskTitle}
                              onChange={(e) => setSubtaskTitle(e.target.value)}
                              className="input-field text-xs h-9 bg-white font-medium"
                              placeholder={task.level === 0 ? "Subtask title..." : "Sub-subtask title..."}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSubtask(task);
                                } else if (e.key === 'Escape') {
                                  handleCancelAddSubtask();
                                }
                              }}
                            />
                          </div>

                          {/* Deadline */}
                          <div className="sm:col-span-3">
                            <input
                              type="date"
                              value={subtaskDeadline}
                              onChange={(e) => setSubtaskDeadline(e.target.value)}
                              className="input-field text-xs h-9 bg-white"
                            />
                            <div className="flex items-center gap-1 mt-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setSubtaskDeadline(getLocalDateString())}
                                className={`px-1.5 py-0.5 rounded font-medium transition ${
                                  subtaskDeadline === getLocalDateString()
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 3);
                                  setSubtaskDeadline(getLocalDateString(d));
                                }}
                                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
                              >
                                +3d
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 7);
                                  setSubtaskDeadline(getLocalDateString(d));
                                }}
                                className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
                              >
                                +1w
                              </button>
                            </div>
                          </div>

                          {/* Multi-Assignee selector */}
                          <div className="sm:col-span-3 relative" ref={subtaskAssigneeDropdownRef}>
                            {isAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowSubtaskAssigneeDropdown(!showSubtaskAssigneeDropdown)}
                                  className="input-field text-xs h-9 bg-white flex items-center justify-between gap-1 w-full text-left"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                    {subtaskAssigneeIds.length === 0 ? (
                                      <span className="text-gray-400">Assign team...</span>
                                    ) : (
                                      <div className="flex items-center gap-1 min-w-0 truncate">
                                        <div className="flex items-center -space-x-1 shrink-0">
                                          {subtaskAssigneeIds.slice(0, 2).map(id => {
                                            const emp = employees.find(e => e.id === id);
                                            return emp ? (
                                              <img
                                                key={id}
                                                src={emp.avatar}
                                                alt={emp.fullName}
                                                className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
                                              />
                                            ) : null;
                                          })}
                                        </div>
                                        <span className="text-[11px] font-medium text-gray-800 truncate">
                                          {subtaskAssigneeIds.length === 1
                                            ? employees.find(e => e.id === subtaskAssigneeIds[0])?.fullName
                                            : `${subtaskAssigneeIds.length} assignees`}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {showSubtaskAssigneeDropdown && (
                                  <div className="absolute z-30 left-0 mt-1 w-60 rounded-xl bg-white border border-gray-200 shadow-xl p-2 max-h-52 overflow-y-auto custom-scrollbar animate-slide-up text-left">
                                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-[11px]">
                                      <span className="font-semibold text-gray-700">Assign Employees</span>
                                      <button
                                        type="button"
                                        onClick={() => setSubtaskAssigneeIds([])}
                                        className="text-gray-400 hover:text-gray-600 text-[10px]"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                    <div className="space-y-1">
                                      {employees.map(e => {
                                        const isSelected = subtaskAssigneeIds.includes(e.id);
                                        return (
                                          <div
                                            key={e.id}
                                            onClick={() => {
                                              setSubtaskAssigneeIds(prev =>
                                                prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]
                                              );
                                            }}
                                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                                              isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => {}}
                                              className="h-3.5 w-3.5 accent-blue-600 rounded"
                                            />
                                            <img src={e.avatar} alt={e.fullName} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                            <span className="truncate">{e.fullName}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div
                                className="input-field text-xs h-9 bg-gray-50/90 border-gray-200 flex items-center justify-between gap-1 w-full text-gray-700 select-none"
                                title="Non-admin users can only assign tasks to themselves"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                  <img
                                    src={user?.avatar || employees.find(e => e.id === user?.id)?.avatar}
                                    alt={user?.fullName}
                                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white shrink-0"
                                  />
                                  <span className="text-[11px] font-semibold text-gray-800 truncate">
                                    {user?.fullName || 'Self'}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                  Self
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Priority & Add Button */}
                          <div className="sm:col-span-2 flex items-start gap-1.5">
                            <select
                              className="input-field text-xs h-9 bg-white flex-1"
                              value={subtaskPriority}
                              onChange={(e) => setSubtaskPriority(e.target.value)}
                            >
                              {PRIORITIES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveSubtask(task)}
                              disabled={!subtaskTitle.trim()}
                              className="btn-primary text-xs font-semibold px-3 h-9 shrink-0 disabled:opacity-50 inline-flex items-center justify-center shadow-xs"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-4 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-xs font-semibold text-gray-700">No tasks added to this project yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Add tasks and deadlines above. Their completion status will automatically compute this project's progress!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {hasTasks ? (
              <span>
                Progress: <strong className="text-emerald-600">{autoProgress}%</strong> ({completedTasks}/{totalTasks} tasks done)
              </span>
            ) : (
              <span>No tasks linked (using manual progress)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs font-bold px-5 py-2">
              {initial ? 'Save Project & Tasks' : 'Create Project with Tasks'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;
