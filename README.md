# LLM Council

![llmcouncil](header.jpg)

# Resultyst LLM Council

Resultyst LLM Council is an enhanced and extended version of the original **LLM Council** (https://github.com/karpathy/llm-council) project.
It preserves the original multi-LLM “council” idea while adding essential features required for
continuous conversations, real-world usability, and a cleaner user experience.

This project focuses on **context-aware multi-LLM reasoning**, **conversation management**,
and **practical UI improvements** rather than being a one-off experiment.

---

## What Is LLM Council?

Instead of asking a question to a single LLM, LLM Council allows you to ask **multiple LLMs at the same time**.

The flow works as follows:

### Stage 1 – First Opinions
The user query is sent to multiple LLMs independently.
Each model generates its own response.

### Stage 2 – Review
Each LLM reviews and ranks the responses from the other LLMs.
Model identities are anonymized to reduce bias.

### Stage 3 – Chairman Synthesis
A designated **Chairman LLM** combines all model responses
into a single final answer.

---

## Enhancements Added in This Version

This repository significantly extends the original implementation with the following changes:

### 1. Groq API Integration
- Migrated from OpenRouter to **Groq**
- Added a dedicated Groq client
- Updated model configuration to Groq-hosted models
- Improved request validation and error handling

### 2. Conversation Context Awareness
- Follow-up questions now use previous conversation history
- Context is passed to all council stages
- Configurable context window (recent messages only)
- Chairman response considers full conversation context

### 3. Persistent Conversations
- Conversations are saved and restored
- Users can continue conversations without losing history
- Clean backend storage improvements for reliability

### 4. Conversation Title Management
- AI-generated conversation titles
- Manual title editing support
- Titles update instantly in the sidebar
- Conversations are easier to manage at scale

### 5. Improved Chat Experience
- Input box remains visible throughout the conversation
- Removed first-message-only input restriction
- Cleaner, more intuitive chat flow

### 6. Sidebar & Navigation Improvements
- Collapsible sidebar
- Keyboard shortcut support
- Conversation search
- Clear conversation timestamps

### 7. Example Questions
- Default starter prompts for new chats
- Click-to-insert behavior
- Faster onboarding for first-time users

### 8. Toast Notifications
- Success, error, and info notifications
- Visual feedback for user actions
- Non-intrusive auto-dismiss behavior

### 9. Backend Stability Fixes
- Storage path corrections
- Route ordering fixes
- DELETE endpoint fixes
- Improved error handling across the backend

---

## Tech Stack

**Backend**
- Python
- FastAPI
- Groq API
- File-based conversation storage

**Frontend**
- React
- Vite
- Component-based UI
- Modern CSS

---

## Project Structure
├── backend/
│ ├── main.py
│ ├── council.py
│ ├── storage.py
│ ├── groq_client.py
│ └── config.py
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── App.jsx
│ │ └── api.js
└── README.md

This project is based on the original **LLM Council** repository.
The core idea and initial implementation belong to the original author.

This version is an **independent extension** that focuses on:
- Multi-turn conversations
- Context-aware reasoning
- Usability and UI improvements
- Practical multi-LLM orchestration

## Disclaimer

This repository is **not officially affiliated** with the original LLM Council maintainers.
It is provided as an experimental and educational extension.
