import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  fetchProjectPlan,
  updateSprintTask,
  deleteSprintTask,
  deleteSprint
} from '../../../services/projectPlanApi';
import {
  calculateDashboardMetrics,
  calculateTaskScheduleStatus,
  calculateTaskRiskFlag,
  calculateDaysVariance,
  getLocalDateString
} from './planCalcs';
import { downloadBlankPlanTemplate, exportProjectPlanToExcel } from './planExcelExports';
import { PlanImportModal } from './PlanImportModal';
import { AddEditTaskModal } from './AddEditTaskModal';
import { AddEditSprintModal } from './AddEditSprintModal';

export function SprintPlanTab({ project }) {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const projectId = String(project.id);
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState({ sprints: [], tasks: [], gates: [], checklistItems: [] });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sprintFilter, setSprintFilter] = useState('ALL');
  const [workstreamFilter, setWorkstreamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [gateFilter, setGateFilter] = useState('ALL');

  // Collapsed sprints set
  const [collapsedSprints, setCollapsedSprints] = useState(new Set());

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskModalDefaultSprintId, setTaskModalDefaultSprintId] = useState('');

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);

  // Permission: Admin or Project Manager of this project
  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    const pmId = String(project.projectManagerId || project.createdBy || '');
    return Boolean(user?.id && String(user.id) === pmId);
  }, [isAdmin, user?.id, project.projectManagerId, project.createdBy]);

  const loadPlan = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const data = await fetchProjectPlan(projectId, { force });
      setPlanData(data);
    } catch (err) {
      if (!err.message?.includes('Unauthorized')) {
        addToast(err.message || 'Failed to load project plan', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, addToast]);

  useEffect(() => {
    loadPlan();

    const handlePlanUpdated = (e) => {
      if (!e.detail?.projectId || String(e.detail.projectId) === projectId) {
        loadPlan(true);
      }
    };
    window.addEventListener('project_plan_updated', handlePlanUpdated);
    return () => window.removeEventListener('project_plan_updated', handlePlanUpdated);
  }, [projectId, loadPlan]);

  // Derived metrics
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(planData, today);
  }, [planData, today]);

  // Workstream and Gate options for filters
  const workstreams = useMemo(() => {
    const set = new Set();
    planData.tasks.forEach(t => {
      if (t.workstream) set.add(t.workstream);
    });
    return Array.from(set).sort();
  }, [planData.tasks]);

  const gateOptions = useMemo(() => {
    return [...planData.gates].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [planData.gates]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return planData.tasks.filter(t => {
      if (sprintFilter !== 'ALL' && String(t.sprintId) !== sprintFilter) return false;
      if (workstreamFilter !== 'ALL' && t.workstream !== workstreamFilter) return false;
      if (gateFilter !== 'ALL' && String(t.gateId || '') !== gateFilter) return false;

      const schedStatus = calculateTaskScheduleStatus(t, today);
      if (statusFilter !== 'ALL' && schedStatus !== statusFilter) return false;

      const risk = calculateTaskRiskFlag(t, today);
      if (riskFilter !== 'ALL' && risk !== riskFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (t.taskCode || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const owner = (t.owner || '').toLowerCase();
        const ws = (t.workstream || '').toLowerCase();
        if (!code.includes(q) && !title.includes(q) && !owner.includes(q) && !ws.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [planData.tasks, sprintFilter, workstreamFilter, gateFilter, statusFilter, riskFilter, searchQuery, today]);

  // Group filtered tasks by sprint
  const tasksBySprint = useMemo(() => {
    const map = new Map();
    planData.sprints.forEach(s => {
      map.set(String(s.id), []);
    });
    filteredTasks.forEach(t => {
      const sId = String(t.sprintId);
      if (!map.has(sId)) map.set(sId, []);
      map.get(sId).push(t);
    });
    return map;
  }, [planData.sprints, filteredTasks]);

  // Toggle sprint collapse
  const toggleSprintCollapse = (sprintId) => {
    setCollapsedSprints(prev => {
      const next = new Set(prev);
      if (next.has(sprintId)) {
        next.delete(sprintId);
      } else {
        next.add(sprintId);
      }
      return next;
    });
  };

  // Inline editing handler
  const handleInlineTaskUpdate = async (taskId, updates) => {
    if (!canEdit) return;
    try {
      await updateSprintTask(projectId, taskId, updates);
      // Optimistic state update
      setPlanData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));
    } catch (err) {
      addToast(err.message || 'Failed to update task', 'error');
      loadPlan(true);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId, taskCode) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete task ${taskCode}?`)) return;
    try {
      await deleteSprintTask(projectId, taskId);
      addToast(`Deleted task ${taskCode}`, 'success');
      loadPlan(true);
    } catch (err) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Delete sprint handler
  const handleDeleteSprint = async (sprintId, sprintCode) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete ${sprintCode} and all its associated tasks?`)) return;
    try {
      await deleteSprint(projectId, sprintId);
      addToast(`Deleted ${sprintCode}`, 'success');
      loadPlan(true);
    } catch (err) {
      addToast(err.message || 'Failed to delete sprint', 'error');
    }
  };

  if (loading && planData.sprints.length === 0 && planData.tasks.length === 0) {
    return (
      <div className="w-full py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading sprint plan and deliverables...</p>
      </div>
    );
  }

  const isEmptyPlan = planData.sprints.length === 0 && planData.tasks.length === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Detailed Sprint Plan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {planData.tasks.length} Deliverables
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable tracking, schedule baselines, and weight-based sprint completion
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadBlankPlanTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
            title="Download empty Excel template"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            <span>Blank Template</span>
          </button>

          {!isEmptyPlan && (
            <button
              type="button"
              onClick={() => exportProjectPlanToExcel(project.name, planData)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              title="Export complete plan to Excel"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">file_download</span>
              <span>Export Plan</span>
            </button>
          )}

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-blue-600">upload_file</span>
                <span>Import from Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSprint(null);
                  setIsSprintModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-600">calendar_add_on</span>
                <span>Add Sprint</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalDefaultSprintId(planData.sprints[0]?.id || '');
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-2xs transition active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmptyPlan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Sprint Plan Configured</h3>
            <p className="text-xs text-slate-500">
              This project currently has an empty sprint plan. You can import from the standardized Excel workbook, add sprints manually, or download the template.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Import from Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSprint(null);
                    setIsSprintModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">add</span>
                  <span>Add First Sprint</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={downloadBlankPlanTemplate}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
              <span>Download Blank Template</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Summary Metric Cards (6 KPI Tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Overall Completion */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Progress</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{metrics.overallCompletion}%</span>
                <span className="material-symbols-outlined text-blue-600 text-[20px]">trending_up</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.overallCompletion))}%` }}
                />
              </div>
            </div>

            {/* Tasks Overdue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tasks Overdue</div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${metrics.tasksOverdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {metrics.tasksOverdue}
                </span>
                <span className="material-symbols-outlined text-rose-500 text-[20px]">warning</span>
              </div>
              <p className="text-[10px] text-slate-400">Target date elapsed</p>
            </div>

            {/* High-Risk Tasks */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">High-Risk Tasks</div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${metrics.highRiskTasks > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {metrics.highRiskTasks}
                </span>
                <span className="material-symbols-outlined text-amber-500 text-[20px]">flag</span>
              </div>
              <p className="text-[10px] text-slate-400">Overdue or due soon</p>
            </div>

            {/* Gates Approved */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gates Approved</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">
                  {metrics.gatesApproved} / {planData.gates.length}
                </span>
                <span className="material-symbols-outlined text-emerald-500 text-[20px]">verified</span>
              </div>
              <p className="text-[10px] text-slate-400">Formal sign-off recorded</p>
            </div>

            {/* Gates Past Target */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gates Past Target</div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${metrics.gatesPastTarget > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {metrics.gatesPastTarget}
                </span>
                <span className="material-symbols-outlined text-rose-400 text-[20px]">event_busy</span>
              </div>
              <p className="text-[10px] text-slate-400">Approval unconfirmed</p>
            </div>

            {/* Planned Go-Live */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planned Go-Live</div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-slate-900 truncate">
                  {metrics.plannedGoLive || 'TBD'}
                </span>
                <span className="material-symbols-outlined text-indigo-500 text-[20px]">rocket_launch</span>
              </div>
              <p className="text-[10px] text-slate-400">Target milestone</p>
            </div>
          </div>

          {/* 3. Progress by Sprint Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-900 tracking-wide uppercase">Progress by Sprint</h3>
              <span className="text-xs text-slate-500 font-semibold">{metrics.sprintProgress.length} Sprints</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Sprint</th>
                    <th className="py-2.5 px-3">Phase</th>
                    <th className="py-2.5 px-3">Window</th>
                    <th className="py-2.5 px-3 text-center">Tasks</th>
                    <th className="py-2.5 px-3 w-44">Weighted Completion</th>
                    <th className="py-2.5 px-3 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-center">Due Soon</th>
                    <th className="py-2.5 px-3 text-center">High Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {metrics.sprintProgress.map(sp => (
                    <tr key={sp.sprintId} className="hover:bg-blue-50/20 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {sp.code} {sp.name && sp.name !== sp.code ? <span className="text-slate-500 font-normal">({sp.name})</span> : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{sp.phase || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {sp.startDate && sp.endDate ? `${sp.startDate} → ${sp.endDate}` : 'TBD'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{sp.taskCount}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, sp.weightedCompletion))}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-10 text-right">{sp.weightedCompletion}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sp.overdueCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[11px]">
                            {sp.overdueCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sp.dueSoonCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                            {sp.dueSoonCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sp.highRiskCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[11px]">
                            {sp.highRiskCount}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search task code, title, owner, workstream..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Sprint Filter */}
              <select
                value={sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Sprints</option>
                {planData.sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>

              {/* Workstream Filter */}
              <select
                value={workstreamFilter}
                onChange={(e) => setWorkstreamFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Workstreams</option>
                {workstreams.map(ws => (
                  <option key={ws} value={ws}>{ws}</option>
                ))}
              </select>

              {/* Gate Filter */}
              <select
                value={gateFilter}
                onChange={(e) => setGateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Gates</option>
                {gateOptions.map(g => (
                  <option key={g.id} value={g.id}>{g.code} — {g.name}</option>
                ))}
              </select>

              {/* Schedule Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="Overdue">Overdue</option>
                <option value="Due soon">Due soon</option>
                <option value="On track">On track</option>
                <option value="Completed">Completed</option>
                <option value="Complete – date missing">Complete – date missing</option>
              </select>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              {(searchQuery || sprintFilter !== 'ALL' || workstreamFilter !== 'ALL' || gateFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSprintFilter('ALL');
                    setWorkstreamFilter('ALL');
                    setGateFilter('ALL');
                    setStatusFilter('ALL');
                    setRiskFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* 5. Sprint Grouped Tasks Tables */}
          <div className="space-y-4">
            {planData.sprints.map(s => {
              const sprintTasks = tasksBySprint.get(String(s.id)) || [];
              const isCollapsed = collapsedSprints.has(String(s.id));
              const sprintCompletedTasks = sprintTasks.filter(t => (t.percentComplete ?? 0) >= 100).length;

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Sprint Collapsible Header */}
                  <div
                    onClick={() => toggleSprintCollapse(String(s.id))}
                    className="px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer border-b border-slate-200/80 flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] text-slate-500 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                        expand_more
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{s.code}</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
                            {s.phase}
                          </span>
                          {s.name && s.name !== s.code && (
                            <span className="text-xs text-slate-500">— {s.name}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {s.startDate && s.endDate ? `Window: ${s.startDate} → ${s.endDate}` : 'Dates TBD'}
                          {s.goal ? ` • Goal: ${s.goal}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-800">{sprintCompletedTasks} / {sprintTasks.length}</span>
                        <span className="text-slate-400 text-[11px] ml-1">tasks</span>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(null);
                              setTaskModalDefaultSprintId(s.id);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-blue-600 transition"
                            title="Add task to this sprint"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSprint(s);
                              setIsSprintModalOpen(true);
                            }}
                            className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition"
                            title="Edit sprint details"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSprint(s.id, s.code)}
                            className="p-1 hover:bg-white rounded-lg text-slate-500 hover:text-rose-600 transition"
                            title="Delete sprint"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks Table for this sprint */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      {sprintTasks.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No tasks match the active filters in this sprint.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-2 px-3 w-16">ID</th>
                              <th className="py-2 px-3 w-28">Workstream</th>
                              <th className="py-2 px-3 min-w-[220px]">Task / Deliverable</th>
                              <th className="py-2 px-2.5 w-24">Start</th>
                              <th className="py-2 px-2.5 w-24">Finish</th>
                              <th className="py-2 px-3 w-36">Owner</th>
                              <th className="py-2 px-3 w-32">Dependency</th>
                              <th className="py-2 px-2.5 w-20">Gate</th>
                              <th className="py-2 px-2 w-14 text-center">Wt</th>
                              <th className="py-2 px-3 w-28">% Done</th>
                              <th className="py-2 px-2.5 w-28">Actual Date</th>
                              <th className="py-2 px-2 w-16 text-center">Variance</th>
                              <th className="py-2 px-2.5 w-24">Status</th>
                              <th className="py-2 px-2 w-16 text-center">Risk</th>
                              {canEdit && <th className="py-2 px-2 w-16 text-center">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {sprintTasks.map(t => {
                              const schedStatus = calculateTaskScheduleStatus(t, today);
                              const riskFlag = calculateTaskRiskFlag(t, today);
                              const variance = calculateDaysVariance(t, today);
                              const linkedGate = t.gateId ? planData.gates.find(g => String(g.id) === String(t.gateId)) : null;

                              return (
                                <tr key={t.id} className="hover:bg-blue-50/20 transition group">
                                  {/* Task Code */}
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-[11px]">
                                    {t.taskCode}
                                  </td>

                                  {/* Workstream */}
                                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]" title={t.workstream}>
                                    {t.workstream || '—'}
                                  </td>

                                  {/* Title */}
                                  <td className="py-2.5 px-3 text-slate-900 font-semibold" title={t.title}>
                                    <div>{t.title}</div>
                                    {t.planningBasis && (
                                      <div className="text-[10px] text-slate-400 font-normal italic truncate max-w-[320px]">
                                        {t.planningBasis}
                                      </div>
                                    )}
                                  </td>

                                  {/* Planned Start */}
                                  <td className="py-2.5 px-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                                    {t.plannedStart || '—'}
                                  </td>

                                  {/* Planned Finish */}
                                  <td className="py-2.5 px-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                                    {t.plannedFinish || '—'}
                                  </td>

                                  {/* Owner */}
                                  <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[140px]" title={t.owner}>
                                    {t.owner || '—'}
                                  </td>

                                  {/* Dependency */}
                                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[130px]" title={t.dependency}>
                                    {t.dependency || '—'}
                                  </td>

                                  {/* Gate Badge */}
                                  <td className="py-2.5 px-2.5">
                                    {linkedGate ? (
                                      <span
                                        className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 truncate inline-block max-w-[70px]"
                                        title={`${linkedGate.code}: ${linkedGate.name}`}
                                      >
                                        {linkedGate.code}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 text-[11px]">—</span>
                                    )}
                                  </td>

                                  {/* Weight */}
                                  <td className="py-2.5 px-2 text-center text-slate-600 text-[11px]">
                                    {t.weight}
                                  </td>

                                  {/* % Complete (Inline Editable) */}
                                  <td className="py-2.5 px-3">
                                    {canEdit ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          defaultValue={t.percentComplete ?? 0}
                                          onBlur={(e) => {
                                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                            if (val !== Number(t.percentComplete)) {
                                              const newActualDate = (val >= 100 && !t.actualCompletionDate)
                                                ? today
                                                : t.actualCompletionDate;
                                              handleInlineTaskUpdate(t.id, {
                                                percentComplete: val,
                                                actualCompletionDate: newActualDate
                                              });
                                            }
                                          }}
                                          className="w-14 px-1.5 py-0.5 text-xs text-right border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-bold"
                                        />
                                        <span className="text-[11px] text-slate-400 font-semibold">%</span>
                                      </div>
                                    ) : (
                                      <span className="font-bold text-slate-800">{t.percentComplete ?? 0}%</span>
                                    )}
                                  </td>

                                  {/* Actual Completion Date (Inline Editable) */}
                                  <td className="py-2.5 px-2.5">
                                    {canEdit ? (
                                      <input
                                        type="date"
                                        defaultValue={t.actualCompletionDate || ''}
                                        onBlur={(e) => {
                                          if (e.target.value !== (t.actualCompletionDate || '')) {
                                            handleInlineTaskUpdate(t.id, { actualCompletionDate: e.target.value });
                                          }
                                        }}
                                        className="w-28 px-1 py-0.5 text-[11px] border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700"
                                      />
                                    ) : (
                                      <span className="text-[11px] text-slate-600">{t.actualCompletionDate || '—'}</span>
                                    )}
                                  </td>

                                  {/* Days Variance */}
                                  <td className="py-2.5 px-2 text-center text-[11px] font-bold">
                                    {variance > 0 ? (
                                      <span className="text-rose-600">+{variance}d</span>
                                    ) : variance < 0 ? (
                                      <span className="text-emerald-600">{variance}d</span>
                                    ) : (
                                      <span className="text-slate-400">0d</span>
                                    )}
                                  </td>

                                  {/* Status Chip */}
                                  <td className="py-2.5 px-2.5">
                                    {schedStatus === 'Overdue' && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold whitespace-nowrap">
                                        Overdue
                                      </span>
                                    )}
                                    {schedStatus === 'Due soon' && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold whitespace-nowrap">
                                        Due soon
                                      </span>
                                    )}
                                    {schedStatus === 'On track' && (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold whitespace-nowrap">
                                        On track
                                      </span>
                                    )}
                                    {schedStatus === 'Completed' && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold whitespace-nowrap">
                                        Completed
                                      </span>
                                    )}
                                    {schedStatus === 'Complete – date missing' && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold whitespace-nowrap" title="Complete but actual date missing">
                                        Date missing
                                      </span>
                                    )}
                                  </td>

                                  {/* Risk Chip */}
                                  <td className="py-2.5 px-2 text-center">
                                    {riskFlag === 'HIGH' && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                                        HIGH
                                      </span>
                                    )}
                                    {riskFlag === 'MEDIUM' && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                        MED
                                      </span>
                                    )}
                                    {riskFlag === 'LOW' && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                        LOW
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  {canEdit && (
                                    <td className="py-2.5 px-2 text-center">
                                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingTask(t);
                                            setIsTaskModalOpen(true);
                                          }}
                                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-blue-600 transition"
                                          title="Edit task"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTask(t.id, t.taskCode)}
                                          className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-rose-600 transition"
                                          title="Delete task"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {isImportModalOpen && (
        <PlanImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          projectId={projectId}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {isTaskModalOpen && (
        <AddEditTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          projectId={projectId}
          task={editingTask}
          sprints={planData.sprints}
          gates={planData.gates}
          defaultSprintId={taskModalDefaultSprintId}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {isSprintModalOpen && (
        <AddEditSprintModal
          isOpen={isSprintModalOpen}
          onClose={() => {
            setIsSprintModalOpen(false);
            setEditingSprint(null);
          }}
          projectId={projectId}
          sprint={editingSprint}
          onSuccess={() => loadPlan(true)}
        />
      )}
    </div>
  );
}

export default SprintPlanTab;

