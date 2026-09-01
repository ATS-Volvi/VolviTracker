import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Avatar } from '../widgets/Avatar';

export const EmployeesGrid = () => {
  const { employees } = useData();
  const navigate = useNavigate();

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Employees</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {employees.map(e => (
          <button
            key={e.id}
            onClick={() => navigate(`/employee/${e.id}`)}
            className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-left hover:bg-slate-50 hover:border-indigo-200 transition"
          >
            <Avatar src={e.avatar} alt={e.fullName} className="h-11 w-11" />
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-800">{e.fullName}</div>
              <div className="truncate text-xs text-gray-500">{e.role || e.email}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default EmployeesGrid;