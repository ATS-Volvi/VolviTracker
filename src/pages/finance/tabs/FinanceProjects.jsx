import React, { useState, useMemo } from 'react';

const FinanceProjects = ({ projects, exchangeRates }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchUnit = unitFilter === 'ALL' || p.unit === unitFilter;
      return matchSearch && matchStatus && matchUnit;
    });
  }, [projects, searchTerm, statusFilter, unitFilter]);

  const totalContractUsd = useMemo(() => projects.reduce((acc, p) => acc + p.contractValue, 0), [projects]);
  const totalInvoicedUsd = useMemo(() => projects.reduce((acc, p) => acc + p.invoicedAmount, 0), [projects]);
  const totalCostsUsd = useMemo(() => projects.reduce((acc, p) => acc + p.supplierCosts + p.laborCosts, 0), [projects]);
  const totalMarginUsd = useMemo(() => projects.reduce((acc, p) => acc + p.grossMargin, 0), [projects]);
  const avgMarginPercent = totalInvoicedUsd > 0 ? ((totalMarginUsd / totalInvoicedUsd) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 text-left">
      {/* Top Rollup Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Total Contract Value</span>
            <span className="material-symbols-outlined text-blue-600 text-[18px]">contract</span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1 font-display">
            ${totalContractUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">{projects.length} Contracted Projects</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Invoiced to Date</span>
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">receipt_long</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-display">
            ${totalInvoicedUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {((totalInvoicedUsd / totalContractUsd) * 100).toFixed(1)}% Billed of Contract
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Direct Project Costs</span>
            <span className="material-symbols-outlined text-amber-600 text-[18px]">engineering</span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1 font-display">
            ${totalCostsUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Subcontractor + Labor Burn</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
            <span>Realized Gross Margin</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-display">
            ${totalMarginUsd.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
            {avgMarginPercent}% Realized Margin
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search projects, clients, or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold">
            {['ALL', 'Healthy', 'Margin Risk', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden"
          >
            <option value="ALL">All Business Units</option>
            <option value="Fintech Core">Fintech Core</option>
            <option value="Enterprise IoT">Enterprise IoT</option>
            <option value="Cloud Infra">Cloud Infra</option>
            <option value="Enterprise Solutions">Enterprise Solutions</option>
          </select>
        </div>
      </div>

      {/* Projects Financials Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-5">Project & Code</th>
                <th className="py-3 px-5">Client & Flag</th>
                <th className="py-3 px-5">Business Unit</th>
                <th className="py-3 px-5 text-right">Contract Value</th>
                <th className="py-3 px-5 text-right">Invoiced (% Billed)</th>
                <th className="py-3 px-5 text-right">Supplier Costs</th>
                <th className="py-3 px-5 text-right">Labor Costs</th>
                <th className="py-3 px-5 text-right">Gross Margin (%)</th>
                <th className="py-3 px-5 text-center">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-gray-900 block">{p.projectName}</span>
                    <span className="font-mono text-gray-400 text-[11px]">{p.id} · Ref: {p.poNumber}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-gray-900">{p.clientName}</span>
                    <span className="text-gray-400 text-[11px] block">{p.country}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-block px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-semibold">
                      {p.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                    ${p.contractValue.toLocaleString()}
                    {p.currency !== 'USD' && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        {p.currency} {p.contractValueNative.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-bold text-blue-600">${p.invoicedAmount.toLocaleString()}</span>
                    <div className="w-20 ml-auto bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, p.invoicedPercent)}%` }}></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right text-gray-700">
                    ${p.supplierCosts.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right text-gray-700">
                    ${p.laborCosts.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-bold text-emerald-600">${p.grossMargin.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 block">{p.grossMarginPercent}%</span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.status === 'Healthy'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : p.status === 'Completed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceProjects;
