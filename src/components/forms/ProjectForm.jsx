import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';
import { loadFinanceData } from '../../pages/finance/financeData';

const STATUSES = ['Not started', 'In progress', 'Done'];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ProjectForm = ({ isOpen, onClose, initial = null }) => {
  const navigate = useNavigate();
  const { employees, addProjectWithTasks, updateProjectWithTasks, getProjectTasks } = useData();
  const { user, isAdmin, isProjectManager } = useAuth();
  const canAssignAnyone = Boolean(isAdmin || isProjectManager);
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
  const [isCustomPoc, setIsCustomPoc] = useState(false);

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

  // Identify currently selected client entity from Master Data
  const selectedClient = useMemo(() => {
    if (!form.clientId && !form.clientName) return null;
    return clientsList.find(c =>
      (form.clientId && c.id === form.clientId) ||
      (form.clientName && c.name?.toLowerCase() === form.clientName?.toLowerCase())
    ) || null;
  }, [clientsList, form.clientId, form.clientName]);

  // Aggregate all registered stakeholders for the selected company
  const availableStakeholders = useMemo(() => {
    if (!selectedClient) return [];
    const list = [];
    if (Array.isArray(selectedClient.stakeholders) && selectedClient.stakeholders.length > 0) {
      selectedClient.stakeholders.forEach(s => {
        if (s && (s.name || s.email)) {
          list.push({
            name: s.name || '',
            role: s.role || s.designation || '',
            email: s.email || '',
            phone: s.phone || '',
            dept: s.dept || s.department || ''
          });
        }
      });
    }
    // Also include primary contactPerson if defined and not already in stakeholders
    if (selectedClient.contactPerson && !list.some(s => s.name?.toLowerCase() === selectedClient.contactPerson?.toLowerCase())) {
      list.unshift({
        name: selectedClient.contactPerson,
        role: selectedClient.contactDesignation || 'Lead Commercial POC',
        email: selectedClient.companyMail || selectedClient.contactEmail || '',
        phone: selectedClient.contactPhone || '',
        dept: selectedClient.department || ''
      });
    }
    return list;
  }, [selectedClient]);

  // Handle Point of Contact dropdown selection with automatic details autofill
  const handlePocSelect = (e) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__custom__') {
      setIsCustomPoc(true);
      return;
    }

    const matched = availableStakeholders.find(s => s.name === selectedVal);
    if (matched) {
      setForm(prev => ({
        ...prev,
        pocName: matched.name,
        contactDesignation: matched.role || '',
        clientDesignation: matched.role || '',
        contactNumber: matched.phone || '',
        contactEmail: matched.email || ''
      }));
    } else {
      setForm(prev => ({
        ...prev,
        pocName: selectedVal
      }));
    }
  };

  // Project tasks state
  const [projectTasks, setProjectTasks] = useState([]);

  // Project team members dropdown state
  const [showProjectTeamDropdown, setShowProjectTeamDropdown] = useState(false);
  const [projectTeamSearch, setProjectTeamSearch] = useState('');
  const projectTeamDropdownRef = useRef(null);

  // Close assignee dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (projectTeamDropdownRef.current && !projectTeamDropdownRef.current.contains(e.target)) {
        setShowProjectTeamDropdown(false);
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

      // Non-admins / non-PMs can only assign projects to themselves
      if (!canAssignAnyone && user?.id) {
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
    } else {
      const today = getLocalDateString();
      const twoWeeksLaterDate = new Date();
      twoWeeksLaterDate.setDate(twoWeeksLaterDate.getDate() + 14);
      const twoWeeksLater = getLocalDateString(twoWeeksLaterDate);

      const isUserProjectManager = Boolean(
        isProjectManager ||
        (user?.role || '').toLowerCase().trim() === 'project manager' ||
        (user?.role || '').toLowerCase().includes('project manager')
      );
      const defaultProjectAssignees = (isUserProjectManager && user?.id)
        ? [user.id]
        : ((!canAssignAnyone && user?.id) ? [user.id] : []);

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
    }
  }, [initial, isOpen, employees, isAdmin, isProjectManager, canAssignAnyone, user?.id]);

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
        clientName: '',
        pocName: '',
        contactDesignation: '',
        clientDesignation: '',
        contactNumber: '',
        contactEmail: ''
      }));
      setIsCustomPoc(false);
      return;
    }

    setIsCustomPoc(false);

    // Auto-select primary stakeholder if available
    const primaryStakeholder = Array.isArray(client.stakeholders) && client.stakeholders.length > 0
      ? client.stakeholders[0]
      : (client.contactPerson ? {
          name: client.contactPerson,
          role: client.contactDesignation || 'Lead Commercial POC',
          email: client.companyMail || client.contactEmail || '',
          phone: client.contactPhone || ''
        } : null);

    setForm(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      pocName: primaryStakeholder?.name || '',
      contactDesignation: primaryStakeholder?.role || client.contactDesignation || 'Lead Commercial POC',
      clientDesignation: primaryStakeholder?.role || client.contactDesignation || 'Lead Commercial POC',
      contactEmail: primaryStakeholder?.email || client.companyMail || client.contactEmail || '',
      contactNumber: primaryStakeholder?.phone || client.contactPhone || ''
    }));
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

  const handleGoToTasksPage = (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      addToast('Please enter a project name first.', 'warning', 3000);
      return;
    }

    const progVal = Number(form.progress) || 0;
    const effectiveProgress = progVal / 100;
    let finalStatus = form.status;
    if (progVal === 0) finalStatus = 'Not started';
    else if (progVal === 1) finalStatus = 'Done';
    else if (finalStatus === 'Not started' && progVal > 0) finalStatus = 'In progress';

    const finalAssigneeIds = (!canAssignAnyone && user?.id)
      ? (form.assigneeIds.includes(user.id) ? [user.id] : (form.assigneeIds.length > 0 ? [user.id] : []))
      : form.assigneeIds;

    const payload = {
      ...form,
      assigneeIds: finalAssigneeIds,
      assigneeId: finalAssigneeIds[0] || '',
      startValue: 0,
      endValue: 100,
      progress: effectiveProgress,
      status: finalStatus,
      createdBy: initial?.createdBy || user?.id || ''
    };

    if (initial) {
      updateProjectWithTasks(initial.id, payload, projectTasks);
      onClose();
      navigate(`/tasks?projectId=${initial.id}`);
    } else {
      const created = addProjectWithTasks(payload, []);
      onClose();
      navigate(`/tasks?projectId=${created.id}`);
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

    const finalAssigneeIds = (!canAssignAnyone && user?.id)
      ? (form.assigneeIds.includes(user.id) ? [user.id] : (form.assigneeIds.length > 0 ? [user.id] : []))
      : form.assigneeIds;

    const payload = {
      ...form,
      assigneeIds: finalAssigneeIds,
      assigneeId: finalAssigneeIds[0] || '', // legacy compatibility
      startValue: 0,
      endValue: 100,
      progress: effectiveProgress,
      status: finalStatus,
      createdBy: initial?.createdBy || user?.id || ''
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
      noPadding={true}
      containerClassName="h-[90vh]"
      headerActions={
        <button
          type="submit"
          form="project-form-modal"
          className="btn-primary text-xs font-bold px-3.5 py-1.5 flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition"
          title="Save project and all tasks"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{initial ? 'Save Project' : 'Create Project'}</span>
        </button>
      }
    >
      <form id="project-form-modal" onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
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
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">
                    Point of Contact Name
                    {availableStakeholders.length > 0 && (
                      <span className="ml-1 text-[11px] text-blue-600 font-normal">
                        ({availableStakeholders.length} Stakeholder{availableStakeholders.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </label>
                  {availableStakeholders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomPoc(!isCustomPoc)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      {isCustomPoc ? 'Select from list' : 'Custom entry'}
                    </button>
                  )}
                </div>

                {!isCustomPoc ? (
                  <div className="relative">
                    <select
                      className="input-field text-sm pr-8 bg-white cursor-pointer"
                      value={form.pocName || ''}
                      onChange={handlePocSelect}
                    >
                      <option value="">
                        {availableStakeholders.length > 0
                          ? '-- Select Point of Contact --'
                          : form.clientName
                          ? `No stakeholders for ${form.clientName}`
                          : '-- Choose a client first --'}
                      </option>
                      {availableStakeholders.map((s, idx) => (
                        <option key={idx} value={s.name}>
                          {s.name} {s.role ? `• ${s.role}` : ''}
                        </option>
                      ))}
                      {form.pocName && !availableStakeholders.some(s => s.name === form.pocName) && (
                        <option value={form.pocName}>
                          {form.pocName} (Selected Contact)
                        </option>
                      )}
                      <option value="__custom__">✏️ Custom / Manual Entry...</option>
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      className="input-field text-sm pr-7"
                      value={form.pocName || ''}
                      onChange={set('pocName')}
                      placeholder="e.g. Alex Rivera"
                      autoFocus
                    />
                    {availableStakeholders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomPoc(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                        title="Back to stakeholder dropdown"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                      </button>
                    )}
                  </div>
                )}
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

            {/* Project Team Members (Assignees Dropdown) */}
            <div className="relative" ref={projectTeamDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Project Team Members {canAssignAnyone ? '(Assign any team member)' : ''}
                </label>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  {form.assigneeIds.length} assigned
                </span>
              </div>
              {canAssignAnyone ? (
                <>
                  {/* Dropdown trigger button */}
                  <button
                    type="button"
                    onClick={() => setShowProjectTeamDropdown(!showProjectTeamDropdown)}
                    className="input-field text-xs min-h-[38px] py-1.5 px-3 bg-white flex items-center justify-between gap-2 w-full text-left cursor-pointer hover:border-purple-400 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                      {form.assigneeIds.length === 0 ? (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <span>Select team members...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                          <div className="flex items-center -space-x-1.5 shrink-0 overflow-hidden">
                            {form.assigneeIds.slice(0, 4).map(id => {
                              const emp = employees.find(e => e.id === id);
                              return emp ? (
                                <img
                                  key={id}
                                  src={emp.avatar}
                                  alt={emp.fullName}
                                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-2xs"
                                  onError={(ev) => {
                                    ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=8b5cf6&color=fff`;
                                  }}
                                />
                              ) : null;
                            })}
                          </div>
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {form.assigneeIds.length === 1
                              ? employees.find(e => e.id === form.assigneeIds[0])?.fullName
                              : form.assigneeIds.length <= 3
                              ? form.assigneeIds.map(id => employees.find(e => e.id === id)?.fullName.split(' ')[0]).filter(Boolean).join(', ')
                              : `${form.assigneeIds.length} team members selected`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                      {form.assigneeIds.length > 0 && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(prev => ({ ...prev, assigneeIds: [] }));
                          }}
                          className="hover:text-rose-500 hover:bg-rose-50 rounded p-0.5 text-xs font-bold transition px-1"
                          title="Clear all"
                        >
                          ✕
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showProjectTeamDropdown ? 'rotate-180 text-purple-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showProjectTeamDropdown && (
                    <div className="absolute z-40 left-0 right-0 mt-1.5 rounded-xl bg-white border border-gray-200 shadow-xl p-2.5 space-y-2 animate-slide-up text-left">
                      {/* Search box inside dropdown */}
                      <div className="relative">
                        <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search members by name or role..."
                          value={projectTeamSearch}
                          onChange={(e) => setProjectTeamSearch(e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-purple-500"
                          autoFocus
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 text-[11px] px-1">
                        <span className="font-semibold text-gray-600">
                          {form.assigneeIds.length} of {employees.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allIds = employees.map(e => e.id);
                              setForm(prev => ({ ...prev, assigneeIds: allIds }));
                            }}
                            className="text-purple-600 hover:text-purple-800 font-semibold hover:underline"
                          >
                            Select all
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, assigneeIds: [] }))}
                            className="text-gray-400 hover:text-gray-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Member list */}
                      <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                        {(() => {
                          const query = projectTeamSearch.toLowerCase().trim();
                          const filtered = employees.filter(e =>
                            !query ||
                            (e.fullName && e.fullName.toLowerCase().includes(query)) ||
                            (e.role && e.role.toLowerCase().includes(query)) ||
                            (e.email && e.email.toLowerCase().includes(query))
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="p-3 text-center text-xs text-gray-400">
                                No matching team members found
                              </div>
                            );
                          }

                          // Sort so selected members appear first
                          const sorted = [...filtered].sort((a, b) => {
                            const aSel = form.assigneeIds.includes(a.id);
                            const bSel = form.assigneeIds.includes(b.id);
                            if (aSel && !bSel) return -1;
                            if (!aSel && bSel) return 1;
                            return (a.fullName || '').localeCompare(b.fullName || '');
                          });

                          return sorted.map(emp => {
                            const isSelected = form.assigneeIds.includes(emp.id);
                            return (
                              <div
                                key={emp.id}
                                onClick={() => toggleAssignee(emp.id)}
                                className={`flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-50 text-purple-900 border border-purple-200/80 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                                    isSelected
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <img
                                    src={emp.avatar}
                                    alt={emp.fullName}
                                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                                    onError={(ev) => {
                                      ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=8b5cf6&color=fff`;
                                    }}
                                  />
                                  <div className="min-w-0 flex-1 truncate">
                                    <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                                      <span>{emp.fullName}</span>
                                      {emp.userType === 'external' && (
                                        <span className="text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200 font-normal">
                                          External
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate">
                                      {emp.role || 'Member'}{emp.organization ? ` • ${emp.organization}` : ''}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="text-[11px] font-bold text-purple-600 shrink-0 ml-2">
                                    ✓
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Selected members chips preview */}
                  {form.assigneeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                      {form.assigneeIds.map(id => {
                        const emp = employees.find(e => e.id === id);
                        if (!emp) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs"
                          >
                            <img
                              src={emp.avatar}
                              alt={emp.fullName}
                              className="w-3.5 h-3.5 rounded-full object-cover"
                              onError={(ev) => {
                                ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=8b5cf6&color=fff`;
                              }}
                            />
                            <span className="max-w-[120px] truncate">{emp.fullName}</span>
                            <button
                              type="button"
                              onClick={() => toggleAssignee(id)}
                              className="text-purple-400 hover:text-purple-700 hover:bg-purple-200/50 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold ml-0.5 transition"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">{user?.fullName || 'You'}</span>
                  <span className="text-[10px] text-gray-400">(Self assigned)</span>
                </div>
              )}
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
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        clientId: '',
                        clientName: '',
                        pocName: '',
                        contactDesignation: '',
                        clientDesignation: '',
                        contactNumber: '',
                        contactEmail: ''
                      }));
                      setIsCustomPoc(false);
                    }}
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
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-gray-900">Project Tasks & Deadlines</h4>
                {hasTasks && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {completedTasks}/{totalTasks} Completed ({autoProgress}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tasks marked as <span className="font-semibold text-emerald-600">Done</span> automatically calculate this project's progress percentage. You can add, edit, or assign multiple employees on the dedicated tasks page.
              </p>
            </div>

            {hasTasks && (
              <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{autoProgress}% Progress</span>
              </div>
            )}
          </div>

          {/* Dedicated Tasks Page Action Card */}
          <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-purple-50/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900">
                  {hasTasks ? `${totalTasks} Task${totalTasks > 1 ? 's' : ''} Linked to this Project` : 'No Tasks Added Yet'}
                </span>
                {hasTasks && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {completedTasks} Done
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                {hasTasks
                  ? `View and manage all ${totalTasks} tasks, assign team members, create subtasks, and import/export Excel templates on the dedicated full-screen page.`
                  : 'Open the dedicated Tasks page to add tasks, configure deadlines, assign team members, create subtasks, and import from Excel.'}
              </p>
              {hasTasks && (
                <div className="w-48 sm:w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${autoProgress}%` }}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGoToTasksPage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-sm hover:shadow transition shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{initial ? 'Manage Project Tasks →' : 'Save & Add Tasks →'}</span>
            </button>
          </div>
        </div>

        </div>

        {/* Pinned Bottom Footer Actions (Always Visible) */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-20">
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
            <button type="submit" className="btn-primary text-xs font-bold px-5 py-2 shadow-xs">
              {initial ? 'Save Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;
