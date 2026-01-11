import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import TitleEditor from './TitleEditor';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import { api } from '../api';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
  onTitleUpdated,
}) {
  const [input, setInput] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Focus textarea when input changes (especially from example clicks)
  useEffect(() => {
    if (textareaRef.current && input) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = input.length;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (exampleText) => {
    console.log('Example clicked:', exampleText);
    setInput(exampleText);
    
    // Focus the textarea after a small delay to ensure state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleSaveTitle = async (newTitle) => {
    if (!conversation?.id) return;
    
    setIsSavingTitle(true);
    try {
      await api.updateConversationTitle(conversation.id, newTitle);
      
      // Notify parent component about title update
      if (onTitleUpdated) {
        onTitleUpdated(conversation.id, newTitle);
      }
      
      console.log('Title updated successfully:', newTitle);
    } catch (error) {
      console.error('Failed to update title:', error);
      throw error;
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    console.log('Title edit cancelled');
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Select or create a conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      {/* Conversation header with editable title */}
      <div className="conversation-header">
        <TitleEditor
          title={conversation.title}
          onSave={handleSaveTitle}
          onCancel={handleTitleCancel}
          isEditing={isSavingTitle ? false : undefined}
        />
        <div className="conversation-info">
          <span>{conversation.messages.length} messages</span>
          <span className="dot">•</span>
          <span>Started {new Date(conversation.created_at).toLocaleDateString()}</span>
          {conversation.messages.length > 0 && (
            <>
              <span className="dot">•</span>
              <span>Last: {new Date(conversation.updated_at || conversation.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </>
          )}
        </div>
      </div>

      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h3>Start the conversation</h3>
            <p>Ask your first question to consult the LLM Council</p>
            <div className="example-questions">
              <p>Try asking:</p>
              <ul>
                <li onClick={() => handleExampleClick("Explain quantum computing in simple terms")}>
                  "Explain quantum computing in simple terms"
                </li>
                <li onClick={() => handleExampleClick("What are the benefits of renewable energy?")}>
                  "What are the benefits of renewable energy?"
                </li>
                <li onClick={() => handleExampleClick("How can I improve my productivity?")}>
                  "How can I improve my productivity?"
                </li>
                <li onClick={() => handleExampleClick("Write a Python function to calculate factorial")}>
                  "Write a Python function to calculate factorial"
                </li>
                <li onClick={() => handleExampleClick("What is machine learning and how does it work?")}>
                  "What is machine learning and how does it work?"
                </li>
              </ul>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">LLM Council</div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ALWAYS SHOW THE INPUT FORM */}
      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder={
              conversation.messages.length === 0 
                ? "Ask your first question... (Shift+Enter for new line, Enter to send)"
                : "Ask a follow-up question... (Shift+Enter for new line, Enter to send)"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSavingTitle}
            rows={3}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || isLoading || isSavingTitle}
          >
            {isLoading ? (
              <>
                <div className="button-spinner"></div>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <div className="input-hint">
          <small>
            {conversation.messages.length > 0 
              ? `Continue "${conversation.title}" conversation`
              : "Start a new conversation with multiple AI models"}
            {isSavingTitle && ' • Saving title...'}
            {conversation.messages.length === 0 && ' • Click examples above to try them!'}
          </small>
        </div>
      </form>
    </div>
  );
}