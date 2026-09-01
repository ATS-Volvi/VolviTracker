import React from 'react';

const STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700'
};

export const PriorityPill = ({ priority }) => (
  <span className={`badge ${STYLES[priority] || 'bg-gray-100 text-gray-600'}`}>{priority}</span>
);
