import React, { useState } from 'react';

const STATUS_STYLES = {
  'Not started': 'bg-gray-100 text-gray-600',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700'
};

const STATUSES = ['Not started', 'In progress', 'Done'];

export const StatusSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`badge ${STATUS_STYLES[value] || 'bg-gray-100 text-gray-600'}`}
      >
        {value}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-36 rounded-md bg-white shadow-lg border border-gray-200 py-1">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50"
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
};