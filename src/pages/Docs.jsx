import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/widgets/Avatar';
import DocReaderModal from '../components/docs/DocReaderModal';
import DocFormModal from '../components/docs/DocFormModal';

export const Docs = () => {
  const { user, isAdmin } = useAuth();
  const { docs: rawDocs, addDoc, updateDoc, removeDoc, togglePinDoc } = useData();
  const allDocs = Array.isArray(rawDocs) ? rawDocs : [];
  const { addToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'newest' | 'title'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals state
  const [activeReadingDoc, setActiveReadingDoc] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Check URL params for direct link to doc (?id=...)
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId) {
      const found = allDocs.find(d => String(d.id) === String(docId));
      if (found) {
        setActiveReadingDoc(found);
      }
    }
  }, [searchParams, allDocs]);

  // Extract unique categories & counts
  const categoriesWithCounts = useMemo(() => {
    const counts = { all: allDocs.length, pinned: allDocs.filter(d => d.isPinned).length };
    allDocs.forEach(d => {
      const cat = d.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allDocs]);

  // Extract top tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set();
    allDocs.forEach(d => {
      if (Array.isArray(d.tags)) {
        d.tags.forEach(t => tagsSet.add(t.toLowerCase()));
      }
    });
    return Array.from(tagsSet).sort();
  }, [allDocs]);

  // Filter & search docs
  const filteredDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allDocs.filter(doc => {
      // Category filter
      if (selectedCategory === 'pinned' && !doc.isPinned) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'pinned' && doc.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag) {
        const hasTag = Array.isArray(doc.tags) && doc.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        if (!hasTag) return false;
      }

      // Query search: searches title, content, summary, tags, author
      if (query) {
        const inTitle = doc.title?.toLowerCase().includes(query);
        const inSummary = doc.summary?.toLowerCase().includes(query);
        const inContent = doc.content?.toLowerCase().includes(query);
        const inAuthor = doc.authorName?.toLowerCase().includes(query);
        const inCategory = doc.category?.toLowerCase().includes(query);
        const inTags = Array.isArray(doc.tags) && doc.tags.some(t => t.toLowerCase().includes(query));
        const inAttachment = doc.attachment?.name?.toLowerCase().includes(query);

        if (!inTitle && !inSummary && !inContent && !inAuthor && !inCategory && !inTags && !inAttachment) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Always put pinned docs first if sorting by updated or newest
      if (sortBy !== 'title') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      // default: updated
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  }, [allDocs, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Handle saving new or updated doc
  const handleSaveDoc = async (docData) => {
    if (editingDoc) {
      updateDoc(editingDoc.id, docData);
      addToast(`Updated "${docData.title}"`, 'success');
      if (activeReadingDoc && activeReadingDoc.id === editingDoc.id) {
        setActiveReadingDoc({ ...activeReadingDoc, ...docData });
      }
      setEditingDoc(null);
    } else {
      const created = addDoc(docData);
      addToast(`Published "${docData.title}"`, 'success');
      setActiveReadingDoc(created);
    }
  };

  const handleOpenDoc = (doc) => {
    setActiveReadingDoc(doc);
    setSearchParams({ id: doc.id });
  };

  const handleCloseReader = () => {
    setActiveReadingDoc(null);
    setSearchParams({});
  };

  const handleEditClick = (doc) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };

  const categoryBadgeColor = (cat) => {
    switch (cat) {
      case 'Engineering':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'HR & Policies':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'Product':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Design':
        return 'bg-pink-50 text-pink-700 border-pink-200/80';
      case 'Operations & SOP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDateShort = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getWordCountMin = (content) => {
    const count = content ? content.trim().split(/\s+/).length : 0;
    return Math.max(1, Math.ceil(count / 180));
  };

  return (
    <div className="w-full px-4 sm:px-8 py-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Documentation & Knowledge Base
            </h1>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
              {allDocs.length} {allDocs.length === 1 ? 'doc' : 'docs'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Searchable company guides, engineering standards, onboarding manuals, and team policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDoc(null);
            setIsFormOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 shadow-sm hover:shadow active:scale-95 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Post Document</span>
        </button>
      </div>

      {/* Search & Controls Section */}
      <div className="card p-4 sm:p-5 bg-white border border-gray-200/80 shadow-xs space-y-4">
        {/* Main Search Bar & View/Sort Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Real-time Instant Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search documents by title, keyword, author, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1 rounded-md"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-semibold text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="newest">Newest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedTag('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === 'all' && !selectedTag
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <span>All Docs</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'all' && !selectedTag ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {categoriesWithCounts.all || 0}
            </span>
          </button>

          {categoriesWithCounts.pinned > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('pinned');
                setSelectedTag('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'pinned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span>📌 Pinned</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'pinned' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {categoriesWithCounts.pinned}
              </span>
            </button>
          )}

          {Object.entries(categoriesWithCounts)
            .filter(([cat]) => cat !== 'all' && cat !== 'pinned')
            .map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTag('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            ))}
        </div>

        {/* Active Tag Filter Indicator */}
        {(selectedTag || searchQuery) && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 text-xs text-gray-500">
            <span>Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                query: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-600">×</button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                tag: #{selectedTag}
                <button type="button" onClick={() => setSelectedTag('')} className="hover:text-rose-600">×</button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
                setSelectedCategory('all');
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Docs Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const readTime = getWordCountMin(doc.content);
            return (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                className="card bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  {/* Category Badge & Pin indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryBadgeColor(doc.category)}`}>
                      {doc.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {doc.attachment && (
                        <span
                          title={`Attached file: ${doc.attachment.name}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full"
                        >
                          <span>📎</span>
                          <span className="uppercase">{doc.attachment.name?.split('.').pop() || 'FILE'}</span>
                        </span>
                      )}
                      {doc.isPinned && (
                        <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          📌 Pinned
                        </span>
                      )}
                      <button
                        type="button"
                        title={doc.isPinned ? 'Unpin document' : 'Pin to top'}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinDoc(doc.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-amber-600 transition"
                      >
                        📌
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {doc.title}
                  </h3>

                  {/* Excerpt / Summary */}
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {doc.summary || doc.content?.replace(/^[#\s\-*`]+/gm, '').slice(0, 140)}
                  </p>

                  {/* Tags */}
                  {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className="text-[10px] font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-2 py-0.5 rounded-md transition"
                        >
                          #{tag}
                        </button>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Author, Read Time, & Date */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={doc.authorAvatar}
                      alt={doc.authorName}
                      className="h-6 w-6 object-cover"
                    />
                    <span className="font-semibold text-gray-700 truncate max-w-[110px]">
                      {doc.authorName || 'Team'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    <span>{formatDateShort(doc.updatedAt || doc.createdAt)}</span>
                    <span>•</span>
                    <span>{readTime}m read</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Docs List / Table View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden bg-white border border-gray-200/80 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Document Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => handleOpenDoc(doc)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {doc.isPinned && <span title="Pinned">📌</span>}
                        {doc.attachment && (
                          <span
                            title={`Attached file: ${doc.attachment.name}`}
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded"
                          >
                            📎 {doc.attachment.name?.split('.').pop()?.toUpperCase() || 'FILE'}
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{doc.title}</span>
                          </div>
                          {doc.summary && (
                            <div className="text-xs text-gray-400 truncate max-w-md">
                              {doc.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${categoryBadgeColor(doc.category)}`}>
                        {doc.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={doc.authorAvatar}
                          alt={doc.authorName}
                          className="h-6 w-6 object-cover"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {doc.authorName || 'Team'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {formatDateShort(doc.updatedAt || doc.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDoc(doc);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition"
                      >
                        Read →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="card p-12 text-center bg-white border border-dashed border-gray-300 rounded-2xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl shadow-xs">
            🔍
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No documents found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedTag
                ? `No documents match your query "${searchQuery || selectedTag}". Try adjusting your keywords or clearing filters.`
                : 'No documents found in this category yet. Be the first to share one!'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || selectedTag || selectedCategory !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingDoc(null);
                  setIsFormOpen(true);
                }}
                className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-2"
              >
                <span>+ Post New Document</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reader Modal */}
      <DocReaderModal
        isOpen={Boolean(activeReadingDoc)}
        onClose={handleCloseReader}
        doc={activeReadingDoc}
        onEdit={handleEditClick}
        onDelete={removeDoc}
        onTogglePin={togglePinDoc}
      />

      {/* Form Modal (Create or Edit) */}
      <DocFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoc(null);
        }}
        initialDoc={editingDoc}
        onSave={handleSaveDoc}
      />
    </div>
  );
};

export default Docs;
