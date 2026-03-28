import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Pin, Trash2, Edit2, FileText, Check, X } from 'lucide-react';
import { Note } from '../types';

export function Notes() {
  const { notes, addNote, updateNote, deleteNote, settings, user } = useAppContext();
  const isLight = settings.theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [localContent, setLocalContent] = useState('');

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId),
  [notes, selectedNoteId]);

  useEffect(() => {
    if (selectedNote) {
      setLocalContent(selectedNote.content);
    } else {
      setLocalContent('');
    }
  }, [selectedNote?.id]); // Only update local content when selected note changes

  // Auto-select first note if none selected
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query)
      );
    }
    // Sort pinned first, then by updatedAt
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, searchQuery]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      userId: user?.uid || 'anonymous',
      title: 'Untitled Note',
      content: '',
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addNote(newNote);
    setSelectedNoteId(newNote.id);
    setIsEditingTitle(true);
    setEditTitleValue('Untitled Note');
  };

  const handleUpdateContent = (content: string) => {
    setLocalContent(content);
  };

  useEffect(() => {
    if (selectedNote && localContent !== selectedNote.content) {
      const timeoutId = setTimeout(() => {
        updateNote({
          ...selectedNote,
          content: localContent,
          updatedAt: Date.now()
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [localContent, selectedNote, updateNote]);

  const handleSaveTitle = () => {
    if (selectedNote && editTitleValue.trim()) {
      updateNote({
        ...selectedNote,
        title: editTitleValue.trim(),
        updatedAt: Date.now()
      });
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditTitleValue(selectedNote?.title || '');
    }
  };

  const togglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote({
      ...note,
      pinned: !note.pinned,
      updatedAt: Date.now()
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex gap-6"
    >
      {/* Sidebar */}
      <div className={`w-80 flex flex-col rounded-3xl border backdrop-blur-3xl backdrop-saturate-200 shadow-xl overflow-hidden ${isLight ? 'bg-white/60 border-white/50' : 'bg-black/60 border-white/10'}`}>
        <div className="p-4 border-b border-black/10 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>Notes</h2>
            <button
              onClick={handleCreateNote}
              className={`p-2 rounded-xl transition-colors ${isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-black/40' : 'text-white/40'}`} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-colors ${
                isLight 
                  ? 'bg-black/5 focus:bg-black/10 text-black placeholder:text-black/40' 
                  : 'bg-white/5 focus:bg-white/10 text-white placeholder:text-white/40'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence>
            {filteredNotes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-center py-8 text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}
              >
                {searchQuery ? 'No notes found.' : 'No notes yet. Create one!'}
              </motion.div>
            ) : (
              filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    setIsEditingTitle(false);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNoteId(note.id);
                      setIsEditingTitle(false);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all group flex items-start gap-3 cursor-pointer ${
                    selectedNoteId === note.id
                      ? (isLight ? 'bg-black/10' : 'bg-white/10')
                      : (isLight ? 'hover:bg-black/5' : 'hover:bg-white/5')
                  }`}
                >
                  <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? 'text-black/40' : 'text-white/40'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold truncate ${isLight ? 'text-black' : 'text-white'}`}>
                        {note.title}
                      </h3>
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedNoteId === note.id ? 'opacity-100' : ''}`}>
                        <button
                          onClick={(e) => togglePin(note, e)}
                          className={`p-1 rounded-md transition-colors ${note.pinned ? 'text-emerald-500' : (isLight ? 'text-black/40 hover:bg-black/10' : 'text-white/40 hover:bg-white/10')}`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(note.id, e)}
                          className={`p-1 rounded-md transition-colors ${isLight ? 'text-black/40 hover:bg-red-500/20 hover:text-red-600' : 'text-white/40 hover:bg-red-500/20 hover:text-red-400'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs truncate mt-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                      {note.content || 'No content'}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 rounded-3xl border backdrop-blur-3xl backdrop-saturate-200 shadow-xl overflow-hidden flex flex-col ${isLight ? 'bg-white/60 border-white/50' : 'bg-black/60 border-white/10'}`}>
        {selectedNote ? (
          <>
            <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className={`flex-1 text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 ${isLight ? 'text-black' : 'text-white'}`}
                  />
                  <button onClick={handleSaveTitle} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className={`p-2 rounded-xl transition-colors ${isLight ? 'text-black/50 hover:bg-black/10' : 'text-white/50 hover:bg-white/10'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 flex-1 group">
                  <h2 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                    {selectedNote.title}
                  </h2>
                  <button
                    onClick={() => {
                      setEditTitleValue(selectedNote.title);
                      setIsEditingTitle(true);
                    }}
                    className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${isLight ? 'text-black/50 hover:bg-black/10' : 'text-white/50 hover:bg-white/10'}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className={`text-xs ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                Last edited: {new Date(selectedNote.updatedAt).toLocaleString()}
              </div>
            </div>
            <textarea
              value={localContent}
              onChange={(e) => handleUpdateContent(e.target.value)}
              placeholder="Start typing your note here..."
              className={`flex-1 w-full p-6 resize-none bg-transparent border-none focus:outline-none focus:ring-0 ${isLight ? 'text-black placeholder:text-black/30' : 'text-white placeholder:text-white/30'}`}
            />
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 ${isLight ? 'text-black/50' : 'text-white/50'}`}>
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Note Selected</h3>
            <p className="max-w-sm">Select a note from the sidebar or create a new one to start writing.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
