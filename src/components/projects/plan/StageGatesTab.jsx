import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  fetchProjectPlan,
  toggleGateChecklistItem,
  deleteGate
} from '../../../services/projectPlanApi';
import {
  calculateGateStatus,
  calculateWeightedCompletion,
  getLocalDateString,
  PROJECT_PHASES,
  getGatePhase,
  getPhaseTheme
} from './planCalcs';
import { AddEditGateModal } from './AddEditGateModal';
import { ApproveGateModal } from './ApproveGateModal';
import { RevokeGateModal } from './RevokeGateModal';
import { PlanImportModal } from './PlanImportModal';

export function StageGatesTab({ project }) {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const projectId = String(project.id);
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState({ sprints: [], tasks: [], gates: [], checklistItems: [] });

  // Modals
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [editingGate, setEditingGate] = useState(null);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingGate, setApprovingGate] = useState(null);

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokingGate, setRevokingGate] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
        addToast(err.message || 'Failed to load stage gates', 'error');
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

  const [selectedPhase, setSelectedPhase] = useState('all');

  // Sort gates by sort_order
  const sortedGates = useMemo(() => {
    return [...planData.gates].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [planData.gates]);

  // Group checklist items by gateId
  const checklistByGate = useMemo(() => {
    const map = new Map();
    planData.checklistItems.forEach(ci => {
      const gId = String(ci.gateId);
      if (!map.has(gId)) map.set(gId, []);
      map.get(gId).push(ci);
    });
    return map;
  }, [planData.checklistItems]);

  // Group tasks by gateId
  const tasksByGate = useMemo(() => {
    const map = new Map();
    planData.tasks.forEach(t => {
      if (t.gateId) {
        const gId = String(t.gateId);
        if (!map.has(gId)) map.set(gId, []);
        map.get(gId).push(t);
      }
    });
    return map;
  }, [planData.tasks]);

  // Filter gates by selected project phase
  const filteredGates = useMemo(() => {
    if (selectedPhase === 'all') return sortedGates;
    return sortedGates.filter(g => {
      const linkedTasks = tasksByGate.get(String(g.id)) || [];
      return getGatePhase(g, linkedTasks, planData.sprints) === selectedPhase;
    });
  }, [sortedGates, selectedPhase, tasksByGate, planData.sprints]);

  // Toggle checklist item
  const handleToggleChecklist = async (gateId, itemId, currentDone) => {
    if (!canEdit) return;
    try {
      const res = await toggleGateChecklistItem(projectId, gateId, itemId, !currentDone);
      // Update state
      setPlanData(prev => ({
        ...prev,
        checklistItems: prev.checklistItems.map(ci => ci.id === itemId ? res.item : ci),
        gates: prev.gates.map(g => g.id === gateId ? res.gate : g)
      }));
      addToast('Checklist updated', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to toggle checklist item', 'error');
      loadPlan(true);
    }
  };

  // Delete gate (Admin only)
  const handleDeleteGate = async (gateId, gateCode) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete stage gate ${gateCode}?`)) return;
    try {
      await deleteGate(projectId, gateId);
      addToast(`Deleted gate ${gateCode}`, 'success');
      loadPlan(true);
    } catch (err) {
      addToast(err.message || 'Failed to delete gate', 'error');
    }
  };

  if (loading && planData.gates.length === 0) {
    return (
      <div className="w-full py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading stage gates and readiness checklist...</p>
      </div>
    );
  }

  const isEmpty = planData.gates.length === 0;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Stage Gate Register</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              {sortedGates.length} Gates
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal governance checkpoints, entry evidence checklists, and approval decisions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                  setEditingGate(null);
                  setIsGateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-2xs transition active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Gate</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phase Filter Tabs */}
      {!isEmpty && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Gates ({sortedGates.length})
          </button>
          {PROJECT_PHASES.map(phaseName => {
            const count = sortedGates.filter(g => {
              const linkedTasks = tasksByGate.get(String(g.id)) || [];
              return getGatePhase(g, linkedTasks, planData.sprints) === phaseName;
            }).length;
            if (count === 0) return null;
            const theme = getPhaseTheme(phaseName);
            const isSelected = selectedPhase === phaseName;

            return (
              <button
                key={phaseName}
                type="button"
                onClick={() => setSelectedPhase(phaseName)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? `${theme.badge} shadow-2xs font-extrabold ring-1 ring-inset ring-current`
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                <span>{phaseName}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {isEmpty ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-[36px]">rule</span>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Stage Gates Configured</h3>
            <p className="text-xs text-slate-500">
              Stage gates define mandatory entry criteria and formal sign-offs for project phases (e.g. SIT, Blueprint, Go-Live).
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Import Gates from Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingGate(null);
                  setIsGateModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Add First Gate</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredGates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
          <p className="text-sm font-bold text-slate-700">No stage gates found for phase &quot;{selectedPhase}&quot;.</p>
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
          >
            View all gates
          </button>
        </div>
      ) : (
        /* Gate Timeline / Cards ordered by sort_order */
        <div className="space-y-5">
          {filteredGates.map((g) => {
            const status = calculateGateStatus(g, today);
            const items = checklistByGate.get(String(g.id)) || [];
            const linkedTasks = tasksByGate.get(String(g.id)) || [];
            const linkedTasksCompletion = calculateWeightedCompletion(linkedTasks);
            const gatePhase = getGatePhase(g, linkedTasks, planData.sprints);
            const phaseTheme = getPhaseTheme(gatePhase);

            // Associated sprints for this stage gate
            const directSprintIds = new Set(linkedTasks.map(t => String(t.sprintId)).filter(Boolean));
            const associatedSprints = planData.sprints.filter(s => {
              if (directSprintIds.has(String(s.id))) return true;
              if (s.phase && gatePhase && s.phase.toLowerCase().trim() === gatePhase.toLowerCase().trim()) return true;
              return false;
            });

            const isApproved = status === 'Approved';
            const isOverdue = status === 'Date passed – approval unconfirmed';
            const isDueSoon = status === 'Due soon';

            const doneItemsCount = items.filter(ci => ci.isDone).length;
            const gatePct = items.length > 0
              ? Math.round((doneItemsCount / items.length) * 100)
              : Number(g.percentComplete ?? 0);

            return (
              <div
                key={g.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isApproved
                    ? 'border-emerald-200/90 hover:border-emerald-300'
                    : isOverdue
                    ? 'border-rose-200/90 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Gate Card Top Banner */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800 font-mono font-black text-xs border border-purple-200 shadow-2xs">
                        {g.code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 shadow-2xs ${phaseTheme.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${phaseTheme.dot}`} />
                        <span>Phase: {gatePhase}</span>
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {g.name}
                      </h3>

                      {/* Status Chip */}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          <span>Approved</span>
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event_busy</span>
                          <span>Date passed – approval unconfirmed</span>
                        </span>
                      )}
                      {isDueSoon && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                          <span>Due soon</span>
                        </span>
                      )}
                      {!isApproved && !isOverdue && !isDueSoon && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                          Not yet approved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                        <span>Target Date: <strong className="text-slate-800 font-semibold">{g.targetDate || 'TBD'}</strong></span>
                      </span>
                      {g.approvers && (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">verified_user</span>
                          <span>Approvers: <span className="text-slate-700">{g.approvers}</span></span>
                        </span>
                      )}
                      {isApproved && g.actualApprovalDate && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>Approved {g.actualApprovalDate} {g.approvedBy ? `by ${g.approvedBy}` : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Approve button for Admin or PM */}
                    {canEdit && !isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingGate(g);
                          setIsApproveModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Approve Gate</span>
                      </button>
                    )}

                    {/* Revoke button: Admin only */}
                    {isAdmin && isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          setRevokingGate(g);
                          setIsRevokeModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        title="Admin Action: Revoke formal gate approval"
                      >
                        <span className="material-symbols-outlined text-[16px]">undo</span>
                        <span>Revoke Approval</span>
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGate(g);
                          setIsGateModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer inline-flex items-center gap-1"
                        title="Edit gate"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500">edit</span>
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Delete Gate: Admin only */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGate(g.id, g.code)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-2xs transition cursor-pointer"
                        title="Delete gate (Admin only)"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Gate Body: Progress & Criteria & Linked Tasks */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Readiness Progress Bar & Linked Task Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">Checklist Readiness</span>
                        <span className="text-purple-700 font-mono">{gatePct}% ({doneItemsCount}/{items.length} items)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, gatePct))}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">Linked Deliverables</span>
                        <span className="text-blue-700 font-mono">
                          {linkedTasksCompletion}% ({linkedTasks.filter(t => (t.percentComplete ?? 0) >= 100).length}/{linkedTasks.length} tasks)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, linkedTasksCompletion))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Criteria & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {g.exitCriteria && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-purple-600 text-[16px]">task_alt</span>
                          Proposed Exit / Acceptance Criteria
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{g.exitCriteria}</p>
                      </div>
                    )}

                    {(g.notesRisk || g.decisionNotes) && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-500 text-[16px]">info</span>
                          Notes & Decisions
                        </div>
                        {g.notesRisk && (
                          <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Risk:</strong> {g.notesRisk}</p>
                        )}
                        {g.decisionNotes && (
                          <p className="text-slate-600 text-[11px]"><strong className="text-slate-700">Decisions:</strong> {g.decisionNotes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sprint Phases in this Stage Gate */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-purple-600">directions_run</span>
                          Sprint Phases in this Stage Gate
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${phaseTheme.badge}`}>
                          {gatePhase}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {associatedSprints.length} {associatedSprints.length === 1 ? 'sprint' : 'sprints'} in scope
                      </span>
                    </div>

                    {associatedSprints.length === 0 ? (
                      <div className="p-3 bg-slate-50/70 rounded-xl text-slate-400 text-xs italic text-center border border-dashed border-slate-200">
                        No sprints assigned to the {gatePhase} phase yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {associatedSprints.map(sp => {
                          const spTasks = (planData.tasks || []).filter(t => String(t.sprintId) === String(sp.id));
                          const spDone = spTasks.filter(t => (t.percentComplete ?? 0) >= 100).length;
                          const spWeighted = calculateWeightedCompletion(spTasks);
                          const spTheme = getPhaseTheme(sp.phase || gatePhase);

                          return (
                            <div
                              key={sp.id}
                              className={`p-3 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition space-y-2 ${spTheme.cardBorder}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-black text-slate-900 text-xs tracking-tight">
                                      {sp.code}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${spTheme.badge}`}>
                                      {sp.phase || gatePhase}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5" title={sp.name || sp.code}>
                                    {sp.name || 'Sprint Deliverables'}
                                  </p>
                                </div>
                                <span className="text-[11px] font-black text-slate-800 font-mono shrink-0">
                                  {spWeighted}%
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(0, spWeighted))}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                <span>
                                  {sp.startDate && sp.endDate
                                    ? `${sp.startDate.slice(5)} → ${sp.endDate.slice(5)}`
                                    : (sp.startDate || sp.endDate || 'Timeline TBD')}
                                </span>
                                <span className="font-medium text-slate-600">
                                  {spDone}/{spTasks.length} tasks
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Interactive Evidence Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-500">checklist</span>
                        Required Evidence / Entry Checklist
                      </span>
                      <span className="text-slate-400 text-[11px]">Tick items as evidence is verified</span>
                    </div>

                    {items.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-xs italic text-center">
                        No checklist items defined for this gate.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {items.map(ci => (
                          <label
                            key={ci.id}
                            className={`flex items-start gap-3 p-3 transition select-none ${
                              canEdit ? 'hover:bg-purple-50/20 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={ci.isDone}
                              disabled={!canEdit}
                              onChange={() => handleToggleChecklist(g.id, ci.id, ci.isDone)}
                              className="mt-0.5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex-1 text-xs">
                              <span className={`${ci.isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
                                {ci.label}
                              </span>
                              {ci.isDone && ci.doneBy && (
                                <span className="text-[10px] text-emerald-600 ml-2 font-medium">
                                  ✓ Done by {ci.doneBy}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isGateModalOpen && (
        <AddEditGateModal
          isOpen={isGateModalOpen}
          onClose={() => {
            setIsGateModalOpen(false);
            setEditingGate(null);
          }}
          projectId={projectId}
          gate={editingGate}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {isApproveModalOpen && approvingGate && (
        <ApproveGateModal
          isOpen={isApproveModalOpen}
          onClose={() => {
            setIsApproveModalOpen(false);
            setApprovingGate(null);
          }}
          projectId={projectId}
          gate={approvingGate}
          currentUser={user}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {isRevokeModalOpen && revokingGate && (
        <RevokeGateModal
          isOpen={isRevokeModalOpen}
          onClose={() => {
            setIsRevokeModalOpen(false);
            setRevokingGate(null);
          }}
          projectId={projectId}
          gate={revokingGate}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {isImportModalOpen && (
        <PlanImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          projectId={projectId}
          onSuccess={() => loadPlan(true)}
        />
      )}
    </div>
  );
}

export default StageGatesTab;

