import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const FinanceNavTabs = ({ activeTab = 'projects' }) => {
  const location = useLocation();

  const tabs = [
    {
      id: 'projects',
      label: 'Projects (Central Hub)',
      icon: 'account_tree',
      to: '/finance',
      isActive: activeTab === 'projects' || (location.pathname === '/finance' && (!location.search || location.search.includes('tab=projects')))
    },
    {
      id: 'relationships',
      label: 'Key Data Relationships',
      icon: 'hub',
      to: '/finance?tab=relationships',
      isActive: activeTab === 'relationships' || (location.pathname === '/finance' && location.search.includes('tab=relationships'))
    },
    {
      id: 'overview',
      label: 'Executive Rollup',
      icon: 'dashboard',
      to: '/finance?tab=overview',
      isActive: activeTab === 'overview' || (location.pathname === '/finance' && location.search.includes('tab=overview'))
    },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto pb-px scrollbar-none">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          to={tab.to}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            tab.isActive
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl shadow-2xs'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 rounded-t-xl'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default FinanceNavTabs;
