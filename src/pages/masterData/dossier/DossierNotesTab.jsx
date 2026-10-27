import React from 'react';

export default function DossierNotesTab({
  company,
  overviewNotes,
  setOverviewNotes,
  isSavingOverview,
  onSaveOverviewNotes,
  notesList,
  newNoteInput,
  setNewNoteInput,
  onAddNote,
  onDeleteNote,
  customFields,
  isAddingField,
  setIsAddingField,
  newFieldLabel,
  setNewFieldLabel,
  newFieldValue,
  setNewFieldValue,
  onAddCustomField,
  onDeleteCustomField,
  isAdmin
}) {
  return (
    <div id="company-notes-section" className="space-y-6">
      {/* Section A: Long-form Company Overview & Instructions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">feed</span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 font-display">Company Overview & Operational Instructions</h2>
              <p className="text-xs text-gray-400">Keep general background, relationship history, delivery procedures, and account rules</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSaveOverviewNotes}
            disabled={isSavingOverview}
            className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isSavingOverview ? 'Saving...' : 'Save Overview Text'}</span>
          </button>
        </div>

        <textarea
          rows={4}
          value={overviewNotes}
          onChange={(e) => setOverviewNotes(e.target.value)}
          placeholder={`Write text information for ${company.name} here... (e.g. key vendor agreements, escalation matrix, custom invoicing terms, branch addresses)`}
          className="w-full text-xs p-3.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed bg-gray-50/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section B: Team Notes & Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">sticky_note_2</span>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-display">Team Notes & Activity Log</h2>
                  <p className="text-[11px] text-gray-400">Chronological timestamped notes and operational memos</p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {notesList.length} Notes
              </span>
            </div>

            {/* Add New Note Box */}
            <form onSubmit={onAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                placeholder="Type an internal note or update for this company..."
                className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteInput.trim()}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {notesList.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{note.author}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[10px]">{note.date}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                          title="Admin only: Delete note"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section C: Custom Key-Value Text Fields */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">tune</span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 font-display">Custom Metadata & Text Fields</h2>
                <p className="text-[11px] text-gray-400">Keep specific company properties, tags, and key-value info</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingField(true)}
              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Add Field</span>
            </button>
          </div>

          {/* Add Field Inline Form */}
          {isAddingField && (
            <form onSubmit={onAddCustomField} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-[11px]">Field Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Account Manager"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-[11px]">Field Text Value</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins (HQ)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingField(false)}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                  className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Save Field
                </button>
              </div>
            </form>
          )}

          {/* Fields List */}
          <div className="space-y-2">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs group"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase text-gray-400">{field.label}</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{field.value}</div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomField(field.id)}
                    className="p-1 rounded-md text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Admin only: Remove field"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
