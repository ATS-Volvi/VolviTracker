import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];

export const MeetingForm = ({ isOpen, open, onClose, initial = null, defaultDate = '' }) => {
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const { employees, addMeeting, updateMeeting } = useData();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '', attendeeId: '', dateTime: '', status: 'Not started', url: ''
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        attendeeId: initial.attendeeId || '',
        dateTime: initial.dateTime || '',
        status: initial.status || 'Not started',
        url: initial.url || ''
      });
    } else {
      setForm({ name: '', attendeeId: '', dateTime: defaultDate || '', status: 'Not started', url: '' });
    }
  }, [initial, isModalOpen, defaultDate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (initial) {
      const payload = {
        ...form,
        dateTime: form.dateTime ? form.dateTime : form.dateTime
      };
      updateMeeting(initial.id, payload);
      addToast(`Updated meeting "${form.name}"`, 'success');
    } else {
      const payload = { ...form, dateTime: form.dateTime ? new Date(form.dateTime).toISOString() : '' };
      addMeeting(payload);
      addToast(`Scheduled meeting "${form.name}"`, 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title={initial ? 'Edit meeting' : 'New meeting'}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
          <input className="input-field" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Attendee</label>
          <select className="input-field" value={form.attendeeId} onChange={set('attendeeId')} required>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Date & time</label>
          <input type="datetime-local" className="input-field" value={form.dateTime} onChange={set('dateTime')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
          <select className="input-field" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">URL (optional)</label>
          <input className="input-field" placeholder="https://..." value={form.url} onChange={set('url')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{initial ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default MeetingForm;