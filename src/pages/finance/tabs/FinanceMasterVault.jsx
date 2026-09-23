import React, { useState } from 'react';

const FinanceMasterVault = ({
  masterDirectory,
  vaultDocs,
  exchangeRates
}) => {
  const [activeSubTab, setActiveSubTab] = useState('DIRECTORY'); // 'DIRECTORY' | 'VAULT' | 'FX'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDirectory = masterDirectory.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Sub-tab Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold text-xs">
          <button
            onClick={() => setActiveSubTab('DIRECTORY')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'DIRECTORY' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Master Entities Directory ({masterDirectory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('VAULT')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'VAULT' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Document Vault & Policies ({vaultDocs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('FX')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'FX' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sovereign Entities & FX Desk
          </button>
        </div>

        {activeSubTab === 'DIRECTORY' && (
          <div className="relative max-w-xs w-full">
            <span className="material-symbols-outlined absolute left-3 top-2 text-gray-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search clients or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {activeSubTab === 'DIRECTORY' && (
        /* Master Directory Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Institutional Master Data Directory</h3>
              <p className="text-xs text-gray-400 mt-0.5">Authoritative tax IDs, payment credit limits, primary contacts, and compliance standing</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Verified Partners
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Entity & ID</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Tax ID / TRN / Registration</th>
                  <th className="py-3 px-5">Primary Contact</th>
                  <th className="py-3 px-5">Credit Terms & Limit</th>
                  <th className="py-3 px-5">Active PO Volume</th>
                  <th className="py-3 px-5 text-center">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredDirectory.map((ent) => (
                  <tr key={ent.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-gray-900 block">{ent.name}</span>
                      <span className="font-mono text-gray-400 text-[11px] block">{ent.id} · {ent.country}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        ent.category === 'Client'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {ent.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-700 font-mono text-[11px]">
                      {ent.taxId}
                    </td>
                    <td className="py-3.5 px-5 text-gray-700">
                      {ent.contact}
                    </td>
                    <td className="py-3.5 px-5 text-gray-700">
                      <span className="font-semibold text-gray-900 block">{ent.creditTerms}</span>
                      <span className="text-[11px] text-gray-400 block font-normal">Cap: {ent.creditLimit}</span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-900 font-bold">
                      {ent.activePoVolume}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ent.compliance === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ent.compliance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'VAULT' && (
        /* Document Vault & Compliance Grid */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Document Vault & Compliance Repository</h3>
              <p className="text-xs text-gray-400 mt-0.5">Corporate agreements, statutory tax filings, SLAs, and organizational standard operating procedures</p>
            </div>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              AES-256 Encrypted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between bg-white text-left group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{doc.fileType} · {doc.size}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug">
                    {doc.title}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {doc.tags.map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Updated {doc.updatedDate}</span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Access Doc</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'FX' && (
        /* Sovereign Entities & FX Desk */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Sovereign Treasury Desk & Exchange Rates</h3>
              <p className="text-xs text-gray-400 mt-0.5">Base currency conversion pegs and operating banking entities</p>
            </div>
            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Live Central Bank Pegs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-gray-500">Base Currency</span>
              <div className="text-2xl font-black text-gray-900 font-display mt-1">USD ($)</div>
              <p className="text-[11px] text-gray-400 mt-0.5">United States Dollar (Anchor)</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-emerald-600">UAE Central Bank Peg</span>
              <div className="text-2xl font-black text-gray-900 font-display mt-1">3.6725 AED</div>
              <p className="text-[11px] text-gray-400 mt-0.5">1 USD = 3.6725 AED (Fixed)</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-emerald-600">Saudi SAMA Peg</span>
              <div className="text-2xl font-black text-gray-900 font-display mt-1">3.7500 SAR</div>
              <p className="text-[11px] text-gray-400 mt-0.5">1 USD = 3.7500 SAR (Fixed)</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-blue-600">India RBI Reference</span>
              <div className="text-2xl font-black text-gray-900 font-display mt-1">₹ 83.20 INR</div>
              <p className="text-[11px] text-gray-400 mt-0.5">1 USD = 83.20 INR (Floating)</p>
            </div>
          </div>

          {/* Operating Entities Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Entity Legal Name</th>
                  <th className="py-2.5 px-4">Jurisdiction</th>
                  <th className="py-2.5 px-4">Operating Bank</th>
                  <th className="py-2.5 px-4">Primary Settlement Currency</th>
                  <th className="py-2.5 px-4">Tax / Corporate Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Volvitech Tech FZ-LLC</td>
                  <td className="py-3 px-4">Dubai, UAE 🇦🇪</td>
                  <td className="py-3 px-4">Emirates NBD PJSC</td>
                  <td className="py-3 px-4 font-bold text-blue-600">AED / USD (SWIFT)</td>
                  <td className="py-3 px-4 font-mono text-[11px]">TRN: 10028941200003</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Volvitech India Pvt Ltd</td>
                  <td className="py-3 px-4">Bengaluru, India 🇮🇳</td>
                  <td className="py-3 px-4">HDFC Bank Ltd</td>
                  <td className="py-3 px-4 font-bold text-blue-600">INR (NEFT/RTGS)</td>
                  <td className="py-3 px-4 font-mono text-[11px]">GSTIN: 29AAACV8901K1Z3</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Volvitech US Corp</td>
                  <td className="py-3 px-4">Delaware, USA 🇺🇸</td>
                  <td className="py-3 px-4">JPMorgan Chase N.A.</td>
                  <td className="py-3 px-4 font-bold text-blue-600">USD (Fedwire / ACH)</td>
                  <td className="py-3 px-4 font-mono text-[11px]">EIN: 88-2910419</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Volvitech KSA Branch</td>
                  <td className="py-3 px-4">Riyadh, KSA 🇸🇦</td>
                  <td className="py-3 px-4">Al-Rajhi Bank</td>
                  <td className="py-3 px-4 font-bold text-blue-600">SAR (SADAD / Local)</td>
                  <td className="py-3 px-4 font-mono text-[11px]">CR: 1010892019</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceMasterVault;
