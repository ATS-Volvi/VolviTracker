import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];

export const MeetingForm = ({ isOpen, open, onClose, initial = null, defaultDate = '', defaultAttendeeId = '' }) => {
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const { employees, addMeeting, updateMeeting, removeMeeting } = useData();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '', attendeeIds: [], dateTime: '', status: 'Not started', url: ''
  });

  const handleDelete = () => {
    if (initial && window.confirm(`Delete meeting reservation "${form.name}"?`)) {
      removeMeeting(initial.id);
      addToast(`Deleted meeting "${form.name}"`, 'info');
      onClose();
    }
  };

  const toLocalDatetime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (initial) {
      let initialAttendeeIds = [];
      if (Array.isArray(initial.attendeeIds)) {
        initialAttendeeIds = initial.attendeeIds;
      } else if (initial.attendeeId) {
        initialAttendeeIds = [initial.attendeeId];
      }

      setForm({
        name: initial.name || '',
        attendeeIds: initialAttendeeIds,
        dateTime: toLocalDatetime(initial.dateTime),
        status: initial.status || 'Not started',
        url: initial.url || ''
      });
    } else {
      setForm({
        name: '',
        attendeeIds: defaultAttendeeId ? [defaultAttendeeId] : [],
        dateTime: defaultDate ? toLocalDatetime(defaultDate) : '',
        status: 'Not started',
        url: ''
      });
    }
  }, [initial, isModalOpen, defaultDate, defaultAttendeeId]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAttendee = (empId) => {
    setForm(prev => {
      const exists = prev.attendeeIds.includes(empId);
      const newIds = exists
        ? prev.attendeeIds.filter(id => id !== empId)
        : [...prev.attendeeIds, empId];
      return { ...prev, attendeeIds: newIds };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (form.attendeeIds.length === 0) {
      addToast('Please select at least one attendee', 'warning');
      return;
    }
    const payload = {
      ...form,
      attendeeIds: form.attendeeIds,
      attendeeId: form.attendeeIds[0] || '', // backward compatibility
      dateTime: form.dateTime ? new Date(form.dateTime).toISOString() : ''
    };
    if (initial) {
      updateMeeting(initial.id, payload);
      addToast(`Updated meeting "${form.name}"`, 'success');
    } else {
      addMeeting(payload);
      addToast(`Scheduled meeting "${form.name}"`, 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title={initial ? 'Edit meeting' : 'New meeting'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Meeting Name</label>
          <input className="input-field font-medium" value={form.name} onChange={set('name')} required placeholder="e.g. Design Review & Sync" />
        </div>

        {/* Multi-Attendee Picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-600">
              Attendees ({form.attendeeIds.length} selected)
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, attendeeIds: employees.map(e => e.id) }))}
                className="text-blue-600 hover:underline font-medium"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, attendeeIds: [] }))}
                className="text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/50">
            {employees.map(emp => {
              const isSelected = form.attendeeIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleAttendee(emp.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-3.5 w-3.5 accent-blue-600 rounded"
                  />
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.fullName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px]">
                      {emp.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="truncate flex-1">
                    <div className="font-semibold truncate">{emp.fullName}</div>
                    <div className="text-[10px] text-gray-400 truncate">{emp.role || emp.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Date & time</label>
          <input type="datetime-local" className="input-field" value={form.dateTime} onChange={set('dateTime')} required />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
          <select className="input-field" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Meeting Link (optional)</label>
          <input className="input-field" placeholder="https://meet.google.com/..." value={form.url} onChange={set('url')} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {initial ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
            >
              Delete meeting
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{initial ? 'Save Changes' : 'Create Meeting'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default MeetingForm;