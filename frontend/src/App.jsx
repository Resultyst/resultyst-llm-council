import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { api } from './api';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  // Toast state
  const [toasts, setToasts] = useState([]);
  
  // Sidebar visibility state
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Load sidebar preference from localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarVisible');
    if (savedSidebarState !== null) {
      setIsSidebarVisible(JSON.parse(savedSidebarState));
    }
  }, []);

  // Save sidebar preference to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarVisible', JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

    // Keyboard shortcut for toggling sidebar
    useEffect(() => {
      const handleKeyDown = (e) => {
        // Ctrl+B or Cmd+B to toggle sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
          e.preventDefault();
          toggleSidebar();
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarVisible]);
  // Toast function
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showToast('Failed to load conversations', 'error');
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      showToast('Failed to load conversation', 'error');
    }
  };

  const handleNewConversation = async () => {
    try {
      setIsCreatingConversation(true);
      const newConv = await api.createConversation();
      
      setConversations([
        { 
          id: newConv.id, 
          created_at: newConv.created_at, 
          title: newConv.title || 'New Conversation',
          message_count: 0 
        },
        ...conversations,
      ]);
      
      setCurrentConversationId(newConv.id);
      
      showToast('New conversation created', 'success');
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      showToast('Failed to create conversation', 'error');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      const result = await api.deleteConversation(conversationId);
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setCurrentConversation(null);
      }
      
      showToast('Conversation deleted successfully', 'success');
      
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      showToast(`Failed to delete conversation: ${error.message}`, 'error');
      throw error;
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId) {
      await handleNewConversation();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!currentConversationId) {
      console.error('Failed to create or get conversation');
      showToast('Failed to create conversation', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (!currentConversation) {
        setCurrentConversation({
          id: currentConversationId,
          title: 'New Conversation',
          messages: [],
          created_at: new Date().toISOString(),
        });
      }

      const userMessage = { role: 'user', content };
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), userMessage],
      }));

      const assistantMessage = {
        role: 'assistant',
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: { stage1: false, stage2: false, stage3: false },
      };

      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), assistantMessage],
      }));

      await api.sendMessageStream(currentConversationId, content, async (eventType, event) => {
        switch (eventType) {
          case 'stage1_start':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading.stage1 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage1 = event.data;
                lastMsg.loading.stage1 = false;
              }
              return { ...prev, messages };
            });
            break;

          case 'stage2_start':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading.stage2 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage2 = event.data;
                lastMsg.metadata = event.metadata;
                lastMsg.loading.stage2 = false;
              }
              return { ...prev, messages };
            });
            break;

          case 'stage3_start':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) lastMsg.loading.stage3 = true;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              const messages = [...(prev?.messages || [])];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg) {
                lastMsg.stage3 = event.data;
                lastMsg.loading.stage3 = false;
              }
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            if (event.data?.title) {
              setCurrentConversation(prev => ({
                ...prev,
                title: event.data.title
              }));
              setConversations(prev => prev.map(conv => 
                conv.id === currentConversationId 
                  ? { ...conv, title: event.data.title }
                  : conv
              ));
              showToast('Conversation title updated', 'success');
            }
            break;

          case 'complete':
            setConversations(prev => prev.map(conv => 
              conv.id === currentConversationId 
                ? { ...conv, message_count: (conv.message_count || 0) + 1 }
                : conv
            ));
            setIsLoading(false);
            showToast('Response received', 'success');
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setIsLoading(false);
            showToast(`Error: ${event.message}`, 'error');
            break;

          default:
            console.log('Unknown event type:', eventType);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setCurrentConversation((prev) => ({
        ...prev,
        messages: (prev?.messages || []).slice(0, -2),
      }));
      setIsLoading(false);
      showToast('Failed to send message', 'error');
    }
  };

  const handleTitleUpdated = async (conversationId, newTitle) => {
    console.log('Title updated:', conversationId, newTitle);
    
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, title: newTitle }
        : conv
    ));
    
    if (currentConversationId === conversationId) {
      setCurrentConversation(prev => ({
        ...prev,
        title: newTitle
      }));
    }
    
    showToast('Title updated successfully', 'success');
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Auto-select the first conversation if none selected and conversations exist
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  return (
    <div className="app">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => {
          const icons = {
            success: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ),
            error: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ),
            info: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="8" />
              </svg>
            ),
          };

          const titles = {
            success: 'Success',
            error: 'Error',
            info: 'Info',
          };

          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <div className="toast-header">
                <div className="toast-icon">{icons[toast.type]}</div>
                <div className="toast-title">{titles[toast.type]}</div>
                <button 
                  className="toast-close"
                  onClick={() => removeToast(toast.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="toast-body">
                {toast.message}
              </div>
              <div className="toast-progress">
                <div 
                  className="toast-progress-bar" 
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Toggle Button - Always visible */}
      <button 
        className={`sidebar-toggle ${isSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}
        onClick={toggleSidebar}
        title={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      >
        {isSidebarVisible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
        <span className="toggle-text">
          
        </span>
      </button>

      {/* Sidebar - Conditionally rendered */}
      {isSidebarVisible && (
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onConversationDeleted={handleDeleteConversation}
          onCloseSidebar={toggleSidebar}
          isLoading={isCreatingConversation}
        />
      )}
      
      <div className={`main-content ${!isSidebarVisible ? 'full-width' : ''}`}>
        {currentConversationId ? (
          <ChatInterface
            conversation={currentConversation}
            onSendMessage={handleSendMessage}
            onTitleUpdated={handleTitleUpdated}
            onDeleteConversation={handleDeleteConversation}
            isLoading={isLoading}
          />
        ) : (
          <div className="empty-chat-view">
            <div className="empty-chat-content">
              <h1>Welcome to LLM Council</h1>
              <p>Start a conversation with multiple AI models working together</p>
              
              {/* Show conversations button when sidebar is hidden */}
              {!isSidebarVisible && conversations.length > 0 && (
                <button 
                  className="show-conversations-btn"
                  onClick={toggleSidebar}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Show Conversations ({conversations.length})
                </button>
              )}
              
              <button 
                onClick={handleNewConversation} 
                className="new-conversation-btn"
                disabled={isCreatingConversation}
              >
                {isCreatingConversation ? 'Creating...' : '+ Start New Conversation'}
              </button>
              
              {isSidebarVisible && conversations.length > 0 && (
                <p className="hint">
                  Or select a conversation from the sidebar
                </p>
              )}
              
              {!isSidebarVisible && conversations.length > 0 && (
                <p className="hint">
                  Click "Show Conversations" to view your existing conversations
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;