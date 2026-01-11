import { useState, useEffect } from 'react';
import './TitleEditor.css';

export default function TitleEditor({
  title,
  onSave,
  onCancel,
  isEditing: initialEditing = false,
}) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editedTitle, setEditedTitle] = useState(title || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update edited title when prop changes
  useEffect(() => {
    setEditedTitle(title || '');
  }, [title]);

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    if (editedTitle.trim() === title) {
      setIsEditing(false);
      if (onCancel) onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save title:', error);
      alert(`Failed to save title: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(title || '');
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className="title-display">
        <h2 className="conversation-title">{title || 'Untitled Conversation'}</h2>
        <button
          className="edit-title-button"
          onClick={() => setIsEditing(true)}
          title="Edit title"
          aria-label="Edit conversation title"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="title-editor">
      <div className="editor-input-group">
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter conversation title..."
          className="title-input"
          disabled={isSaving}
          autoFocus
          maxLength={100}
        />
        <div className="editor-actions">
          <button
            className="editor-button save-button"
            onClick={handleSave}
            disabled={!editedTitle.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner-small"></span>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
          <button
            className="editor-button cancel-button"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="editor-hint">
        <small>Press Enter to save, Escape to cancel • Max 100 characters</small>
      </div>
    </div>
  );
}