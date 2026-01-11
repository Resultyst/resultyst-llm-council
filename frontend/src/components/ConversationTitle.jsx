import { useState } from 'react';
import { api } from '../api';
import './ConversationTitle.css';

export default function ConversationTitle({
  conversationId,
  currentTitle,
  onTitleUpdated,
  onCancel,
}) {
  const [title, setTitle] = useState(currentTitle || '');
  const [isEditing, setIsEditing] = useState(!currentTitle || currentTitle === 'New Conversation');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await api.updateConversationTitle(conversationId, title.trim());
      setIsEditing(false);
      onTitleUpdated?.(title.trim());
    } catch (error) {
      console.error('Failed to update title:', error);
      alert('Failed to update title. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await api.generateAITitle(conversationId);
      if (response.title) {
        setTitle(response.title);
      }
    } catch (error) {
      console.error('Failed to generate AI title:', error);
      alert('Failed to generate AI title. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setIsEditing(false);
      setTitle(currentTitle || '');
    }
  };

  if (!isEditing) {
    return (
      <div className="conversation-title-display">
        <h2 className="conversation-title-text">{currentTitle}</h2>
        <button
          className="edit-title-btn"
          onClick={() => setIsEditing(true)}
          title="Edit title"
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="conversation-title-editor">
      <div className="title-input-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter conversation title..."
          className="title-input"
          disabled={isLoading}
          autoFocus
        />
        <div className="title-actions">
          <button
            className="title-btn save-btn"
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
          <button
            className="title-btn ai-btn"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            title="Generate AI title"
          >
            {isGeneratingAI ? '🤖...' : '🤖 AI'}
          </button>
          <button
            className="title-btn cancel-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
      <p className="title-hint">
        Press Enter to save, or use AI button to generate a title based on conversation content
      </p>
    </div>
  );
}