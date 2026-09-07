import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../widgets/Avatar';

export const EmployeesGrid = () => {
  const { employees } = useData();
  const empList = Array.isArray(employees) ? employees : [];
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // If not admin, do not render employee directory
  if (!isAdmin) return null;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-gray-900">Employees Directory</h2>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            Admin Access
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{empList.length} team members</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {empList.map(e => {
          const isUserAdmin = (e.role || '').toLowerCase() === 'admin';
          return (
            <button
              key={e.id}
              onClick={() => navigate(`/employee/${e.id}`)}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-left hover:bg-slate-50 hover:border-purple-200 transition shadow-2xs group"
            >
              <Avatar src={e.avatar} alt={e.fullName} className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-semibold text-sm text-gray-800 group-hover:text-purple-700 transition">
                    {e.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block truncate text-[11px] font-medium px-1.5 py-0.2 rounded ${
                      isUserAdmin
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {e.role || 'Member'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default EmployeesGrid;