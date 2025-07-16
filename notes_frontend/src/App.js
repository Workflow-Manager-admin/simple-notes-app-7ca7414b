import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

/** Color palette from requirements */
const COLORS = {
  primary: "#1976d2",    // Blue
  secondary: "#424242",  // Deep Gray
  accent: "#ffc107",     // Amber
  bg: "#fff",
  text: "#222",
};

/**
 * Load notes from Supabase "notes" table.
 */
async function loadNotes(setNotes, setLoading) {
  setLoading(true);
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    // Possible logging or alert: error.message
    setNotes([]);
  } else {
    setNotes(data || []);
  }
  setLoading(false);
}

/**
 * Create a new note in Supabase and return the inserted note.
 */
async function createNote() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title: '', content: '', created_at: now, updated_at: now }])
    .select();
  if (error) {
    alert('Failed to create note: ' + error.message);
    return null;
  }
  return data && data[0];
}

/**
 * Update a note in Supabase by id.
 */
async function updateNote(note) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notes')
    .update({
      title: note.title,
      content: note.content,
      updated_at: now,
    })
    .eq('id', note.id)
    .select();
  if (error) {
    alert('Failed to update note: ' + error.message);
    return null;
  }
  return data && data[0];
}

/**
 * Delete a note in Supabase by id.
 */
async function deleteNote(id) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  if (error) {
    alert('Failed to delete note: ' + error.message);
    return false;
  }
  return true;
}

/**
 * Main Notes App – CRUD with Supabase persistence.
 * PUBLIC_INTERFACE
 */
function App() {
  // Notes state: [{id, title, content, created_at, updated_at}]
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get notes from Supabase on mount
  useEffect(() => {
    loadNotes(setNotes, setLoading);
  }, []);

  // Handle selecting (viewing) a note
  const handleSelect = (id) => {
    setSelectedId(id);
    const note = notes.find(n => n.id === id);
    setEditingNote(note ? { ...note } : null);
  };

  // Handle creating a new note in Supabase
  const handleCreate = async () => {
    setSaving(true);
    const note = await createNote();
    setSaving(false);
    if (note) {
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setEditingNote({ ...note });
    }
  };

  // Handle field changes for editing
  const handleChange = (e) => {
    setEditingNote({
      ...editingNote,
      [e.target.name]: e.target.value,
      updated_at: new Date().toISOString()
    });
  };

  // Handle saving the note to Supabase
  const handleSave = async () => {
    if (!editingNote) return;
    setSaving(true);
    const trimmed = {
      ...editingNote,
      title: editingNote.title.trim(),
      content: editingNote.content.trim(),
    };
    const updated = await updateNote(trimmed);
    setSaving(false);
    if (updated) {
      setNotes(notes => notes.map(n => n.id === trimmed.id ? updated : n));
      setEditingNote(updated);
    }
  };

  // Handle deleting the selected note from Supabase
  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    const ok = await deleteNote(selectedId);
    setSaving(false);
    if (ok) {
      setNotes(notes => notes.filter(n => n.id !== selectedId));
      setEditingNote(null);
      setSelectedId(null);
    }
  };

  // For responsive main split
  const isMobile = window.innerWidth <= 700;

  // For focus
  const titleInputRef = useRef(null);
  useEffect(() => {
    if (titleInputRef.current) titleInputRef.current.focus();
  }, [selectedId]);

  // Minimal navigation bar (not required, but can contain actions)
  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      background: COLORS.bg,
      color: COLORS.text,
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      transition: 'background .2s,color .2s'
    }}>
      {/* HEADER */}
      <header style={{
        padding: '0.5rem 0',
        background: COLORS.primary,
        color: '#fff',
        textAlign: 'center',
        fontWeight: 500,
        fontSize: '1.5rem',
        letterSpacing: '0.04em',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        📝 Minimal Notes
      </header>

      {/* NAVIGATION BAR (floating/create) */}
      <nav style={{
        display: 'flex',
        justifyContent: isMobile ? 'center' : 'flex-start',
        alignItems: 'center',
        borderBottom: `1px solid #e9ecef`,
        background: '#fafafd',
        gap: '.5rem',
        padding: isMobile ? '0.6rem' : '0.5rem 2vw'
      }}>
        <button
          className="kavia-btn"
          onClick={handleCreate}
          style={{
            background: COLORS.accent,
            color: COLORS.secondary,
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            padding: '.42em 1.4em',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}
        >
          + New Note
        </button>
        <div style={{ flex: 1 }}></div>
        <span style={{
          color: COLORS.secondary,
          fontSize: '0.95rem',
          opacity: .7
        }}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </nav>

      {/* MAIN SECTION: notes list + editor */}
      <main className="main-area"
            style={{
              display: isMobile ? 'block' : 'flex',
              maxWidth: 1100,
              margin: '1rem auto 0 auto',
              background: '#fff',
              borderRadius: 12,
              minHeight: '70vh',
              boxShadow: '0 4px 24px rgba(33,37,41,.04)',
              overflow: 'hidden',
              border: '1.5px solid #f2f2f5',
            }}>
        {/* LEFT COLUMN: Notes list */}
        <section
          className="notes-list"
          style={{
            flex: '0 0 320px',
            minWidth: isMobile ? '100%' : 220,
            borderRight: isMobile ? 'none' : '1px solid #f1f1f2',
            background: isMobile ? 'transparent' : '#f7fbfc',
            minHeight: '250px',
            maxHeight: isMobile ? '180px' : 'none',
            overflowY: 'auto'
          }}
        >
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {notes.length === 0 && (
              <li style={{ color: '#888', textAlign: 'center', padding: '2.5rem 0 2rem' }}>
                <span>No notes yet. Click <b>New Note</b>.</span>
              </li>
            )}
            {notes.map(note => (
              <li key={note.id}
                  tabIndex={0}
                  onClick={() => handleSelect(note.id)}
                  aria-selected={selectedId === note.id}
                  style={{
                    cursor: 'pointer',
                    background: selectedId === note.id ? COLORS.primary : 'transparent',
                    color: selectedId === note.id ? '#fff' : COLORS.secondary,
                    borderRadius: 6,
                    margin: '0.5rem 0.7rem',
                    padding: '0.45em 1em 0.41em 1em',
                    minHeight: 50,
                    transition: 'background 0.18s,color 0.18s',
                    outline: selectedId === note.id ? `2px solid ${COLORS.primary}` : 'none',
                    fontWeight: selectedId === note.id ? 700 : 400,
                    boxShadow: selectedId === note.id ? '0 2px 8px rgba(25,118,210,0.09)' : ''
                  }}
              >
                <span style={{ fontSize: '1.09em' }}>{note.title ? note.title : <span style={{ color: COLORS.text, opacity: .56 }}>Untitled</span>}</span>
                <div style={{
                  fontSize: '0.9em',
                  color: selectedId === note.id ? '#e5f0fc' : '#7a7a7a'
                }}>
                  {note.content ? note.content.split('\n')[0].slice(0, 33) : <i>[No content]</i>}
                </div>
              </li>
            ))}
          </ul>
        </section>
        {/* RIGHT COLUMN: Note editor/viewer */}
        <section
          className="note-editor"
          style={{
            flex: '1 1 600px',
            padding: isMobile ? '1rem 6vw' : '2.4rem 3vw',
            minWidth: '0',
            transition: 'background .2s',
          }}
        >
          {editingNote && selectedId ?
            (
              <form style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '.9rem',
                maxWidth: 700,
                margin: '0 auto',
              }}
              onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <input
                  type="text"
                  required
                  ref={titleInputRef}
                  name="title"
                  placeholder="Title..."
                  value={editingNote.title}
                  onChange={handleChange}
                  style={{
                    fontWeight: 600,
                    fontSize: '1.22rem',
                    padding: '.57em .9em',
                    border: `1.5px solid ${COLORS.primary}66`,
                    borderRadius: '6px',
                    outline: 'none',
                    background: '#fcfcfd',
                    marginBottom: '0.2em'
                  }}
                />
                <textarea
                  name="content"
                  placeholder="Write your note here..."
                  rows={isMobile ? 7 : 10}
                  value={editingNote.content}
                  onChange={handleChange}
                  style={{
                    resize: 'vertical',
                    minHeight: 90,
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    lineHeight: 1.4,
                    border: `1.5px solid ${COLORS.primary}33`,
                    borderRadius: '6px',
                    padding: '.8em .95em',
                    background: '#fafdff'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '.7em',
                  marginTop: '0.4em',
                  alignItems: 'center'
                }}>
                  <button
                    type="submit"
                    className="kavia-btn"
                    style={{
                      background: COLORS.primary,
                      color: '#fff',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '.46em 1.6em',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(25,118,210,.08)'
                    }}>Save</button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-label="Delete this note"
                    className="kavia-btn"
                    style={{
                      background: '#fff',
                      color: COLORS.primary,
                      fontWeight: 500,
                      border: `1.5px solid ${COLORS.primary}`,
                      borderRadius: '6px',
                      padding: '.45em 1.2em',
                      fontSize: '1.01rem',
                      cursor: 'pointer',
                      marginLeft: 6
                    }}>Delete</button>
                  <div style={{
                    marginLeft: 'auto',
                    color: '#777',
                    fontSize: '.9em'
                  }}>
                    {editingNote.updated && (
                      <span>
                        Last updated:{' '}
                        {new Date(editingNote.updated).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div style={{
                color: '#bbb',
                textAlign: 'center',
                padding: '5vh 1vw 1vh 1vw',
                fontSize: '1.2rem'
              }}>
                <p>Select a note from the list, or create a new note to begin.</p>
              </div>
            )}
        </section>
      </main>

      <footer style={{
        margin: '3rem auto 0 auto',
        padding: '1.2rem 0',
        textAlign: 'center',
        borderTop: '1px solid #ececec',
        fontSize: '.98em',
        color: '#9b9b9b'
      }}>
        Built with <span style={{color: COLORS.primary}}>React</span> & Kavia
      </footer>
    </div>
  );
}

export default App;
