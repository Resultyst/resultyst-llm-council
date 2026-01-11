import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading,
  onConversationDeleted,
  onCloseSidebar,          // <-- added this prop
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const filteredConversations = conversations.filter(conv =>
    (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (conversationId, e) => {
    e.stopPropagation(); // Prevent selecting the conversation
    setShowConfirmDelete(conversationId);
  };

  const handleConfirmDelete = async (conversationId) => {
    setDeletingId(conversationId);
    try {
      if (onConversationDeleted) {
        await onConversationDeleted(conversationId);
      }
      setShowConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert(`Failed to delete conversation: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(null);
  };

  const getConversationAge = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <h2>LLM Council</h2>
          <span className="conversation-count">({conversations.length})</span>
        </div>
        <div className="sidebar-header-right">
          <button 
            onClick={onNewConversation} 
            className="new-conversation-sidebar-btn"
            disabled={isLoading}
            title="New conversation"
          >
            {isLoading ? '...' : '+ New'}
          </button>
          <button 
            className="close-sidebar-btn"
            onClick={() => onCloseSidebar && onCloseSidebar()}
            title="Hide sidebar (Ctrl+B)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* left arrow style toggle */}
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          disabled={deletingId !== null}
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="conversations-list">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {searchTerm ? 'No conversations found' : 'No conversations yet'}
            {!searchTerm && (
              <button 
                onClick={onNewConversation}
                className="start-conversation-btn"
                disabled={isLoading}
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                currentConversationId === conv.id ? 'active' : ''
              } ${deletingId === conv.id ? 'deleting' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              {showConfirmDelete === conv.id ? (
                <div className="delete-confirmation" onClick={(e) => e.stopPropagation()}>
                  <p className="delete-confirm-text">Delete "{conv.title}"?</p>
                  <div className="delete-confirm-actions">
                    <button
                      className="confirm-delete-btn"
                      onClick={() => handleConfirmDelete(conv.id)}
                      disabled={deletingId === conv.id}
                    >
                      {deletingId === conv.id ? (
                        <>
                          <span className="spinner-small"></span>
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                    <button
                      className="cancel-delete-btn"
                      onClick={handleCancelDelete}
                      disabled={deletingId === conv.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="conversation-content">
                    <div className="conversation-title">
                      {conv.title || 'Untitled Conversation'}
                    </div>
                    <div className="conversation-meta">
                      <span className="message-count">
                        <span role="img" aria-label="messages">💬</span>{' '}
                        {conv.message_count || 0}
                      </span>
                      <span className="date">
                        {getConversationAge(conv.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="delete-conversation-btn"
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    title="Delete conversation"
                    disabled={deletingId !== null}
                  >
                    {deletingId === conv.id ? (
                      <span className="spinner-small"></span>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {conversations.length > 0 && (
        <div className="sidebar-footer">
          <div className="conversation-stats">
            <span>{conversations.length} conversations</span>
            <span className="dot">•</span>
            <span>
              {conversations.reduce(
                (sum, conv) => sum + (conv.message_count || 0),
                0
              )}{' '}
              total messages
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
