import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Loader2, Plus, Search, Pin, Trash2, Edit2, ChevronLeft, ChevronRight, MessageSquare, Monitor, MonitorOff, ChevronDown, ChevronUp, Globe, Brain, Blocks } from 'lucide-react';
import { TopeLogo, TopeModel } from './TopeLogo';
import { useAppContext, ChatSession, Message } from '../context/AppContext';
import { IntegrationsModal } from './IntegrationsModal';

function ThoughtProcess({ thought, isLight }: { thought: string, isLight: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`mb-4 rounded-xl overflow-hidden border ${isLight ? 'border-black/10 bg-black/5' : 'border-white/10 bg-white/5'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 text-sm font-medium ${isLight ? 'text-black/70 hover:bg-black/5' : 'text-white/70 hover:bg-white/5'} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>Thinking Process</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="thought-process"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 pt-0 text-sm whitespace-pre-wrap ${isLight ? 'text-black/60' : 'text-white/60'}`}>
              {thought}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopeAI() {
  const { settings, sharedStream, setSharedStream, chats, setChats, currentChatId, setCurrentChatId, user, isWebSearchEnabled, setIsWebSearchEnabled, isDeepThinkingEnabled, setIsDeepThinkingEnabled } = useAppContext();
  const isLight = settings.theme === 'light';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('Tope is thinking...');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const thinkingPhases = [
    'Analyzing request...',
    'Searching knowledge...',
    'Accessing TypeTrack context...',
    'Consulting Gemini...',
    'Synthesizing data...',
    'Refining thoughts...',
    'Finalizing response...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && isDeepThinkingEnabled) {
      setThinkingStatus(thinkingPhases[0]);
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % thinkingPhases.length;
        setThinkingStatus(thinkingPhases[i]);
      }, 3000);
    } else {
      setThinkingStatus(isDeepThinkingEnabled ? 'Tope is analyzing deeply...' : 'Tope is thinking...');
    }
    return () => clearInterval(interval);
  }, [isLoading, isDeepThinkingEnabled]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId) || chats[0];
  const activeModel = (!user && currentChat?.model === 'tt2') ? 'tt' : (currentChat?.model || 'pro');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Initialize video element for screen capture (hidden)
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRef.current = video;
    }
    
    // If we already have a stream from context, attach it
    if (sharedStream && videoRef.current) {
      videoRef.current.srcObject = sharedStream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, [sharedStream]);

  const toggleScreenShare = async () => {
    if (sharedStream) {
      sharedStream.getTracks().forEach(t => t.stop());
      setSharedStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setSharedStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setSharedStream(null);
          if (videoRef.current) videoRef.current.srcObject = null;
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  const captureScreen = (): string | null => {
    if (!sharedStream || !videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      isPinned: false,
      updatedAt: Date.now(),
      messages: [{ id: '1', role: 'assistant', content: "Hi! I'm Tope, your AI assistant. How can I help you today?" }],
      model: 'pro'
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = chats.filter(c => c.id !== id);
    if (filtered.length === 0) {
      const newChat: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        isPinned: false,
        updatedAt: Date.now(),
        messages: [{ id: '1', role: 'assistant', content: "Hi! I'm Tope, your AI assistant. How can I help you today?" }],
        model: 'pro'
      };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    } else {
      setChats(filtered);
      if (currentChatId === id) {
        setCurrentChatId(filtered[0].id);
      }
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
  };

  const startRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditTitle(title || 'New Chat');
  };

  const saveRename = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (editTitle.trim()) {
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
    }
    setEditingChatId(null);
  };

  const generateTitle = async (chatId: string, firstMessage: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Summarize this message into a short phrase of 1 to 7 words to use as a chat title. Do not include quotes or extra text. Message: "${firstMessage}"` }],
          model: 'turbo'
        })
      });
      if (response.ok) {
        const data = await response.json();
        const newTitle = (data.message || '').replace(/["']/g, '').trim();
        if (newTitle) {
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
        }
      }
    } catch (e) {
      console.error('Failed to generate title', e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    const isFirstUserMessage = (currentChat.messages || []).filter(m => m.role === 'user').length === 0;

    setChats(prev => prev.map(c => {
      if (c.id === currentChatId) {
        return { ...c, messages: [...(c.messages || []), userMessage], updatedAt: Date.now() };
      }
      return c;
    }));
    
    setInput('');
    setIsLoading(true);

    if (isFirstUserMessage) {
      generateTitle(currentChatId, userMessage.content);
    }

    try {
      const apiMessages = (currentChat.messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })).concat({ role: 'user', content: userMessage.content });

      let imageBase64 = null;
      if (user && sharedStream && currentChat.model === 'tt2') {
        imageBase64 = captureScreen();
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          model: activeModel,
          image: imageBase64,
          useDeepThinking: isDeepThinkingEnabled
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to fetch response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I could not generate a response.',
        thought: data.thought
      };

      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...(c.messages || []), assistantMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } catch (error: any) {
      console.error('Error generating response:', error);
      let errorText = error.message && !error.message.includes('Failed to fetch') && !error.message.includes('Failed to generate')
        ? error.message
        : 'Sorry, I encountered an error while processing your request.';
      if (error.message === 'GROQ_API_KEY is not set') {
        errorText = 'It looks like the GROQ_API_KEY is missing. Please add it to your environment secrets to continue.';
      } else if (error.message.includes('TOPE_API_KEY is not set')) {
        errorText = 'It looks like the TOPE_API_KEY is missing. Please add it to your environment secrets to continue.';
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText
      };
      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...(c.messages || []), errorMessage], updatedAt: Date.now() };
        }
        return c;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats
    .filter(c => (c.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`max-w-6xl mx-auto h-[calc(100vh-12rem)] flex border rounded-3xl overflow-hidden backdrop-blur-3xl backdrop-saturate-200 shadow-2xl relative ${isLight ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10'}`}
    >
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            key="tope-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`flex-shrink-0 border-r flex flex-col h-full overflow-hidden ${isLight ? 'bg-white/60 border-black/10' : 'bg-white/5 border-white/10'}`}
          >
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
              <h3 className={`font-semibold ${isLight ? 'text-black/90' : 'text-white/90'}`}>Chats</h3>
              <button
                onClick={createNewChat}
                className={`p-2 rounded-lg transition-colors ${isLight ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className={`p-4 border-b shrink-0 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-black/40' : 'text-white/40'}`} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none transition-colors ${isLight ? 'bg-black/5 border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500/50' : 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50'}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => setCurrentChatId(chat.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    currentChatId === chat.id 
                      ? (isLight ? 'bg-black/10 border border-black/10' : 'bg-white/15 border border-white/10') 
                      : (isLight ? 'hover:bg-black/5 border border-transparent' : 'hover:bg-white/5 border border-transparent')
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-black/40' : 'text-white/40')}`} />
                      {editingChatId === chat.id ? (
                        <form 
                          onSubmit={(e) => saveRename(chat.id, e)}
                          className="flex items-center flex-1 min-w-0"
                        >
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(chat.id)}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full border rounded px-2 py-0.5 text-sm focus:outline-none ${isLight ? 'bg-white/50 border-emerald-500/50 text-black' : 'bg-black/50 border-emerald-500/50 text-white'}`}
                          />
                        </form>
                      ) : (
                        <span className={`text-sm font-medium truncate ${isLight ? 'text-black/90' : 'text-white/90'}`}>
                          {chat.title || 'New Chat'}
                        </span>
                      )}
                    </div>
                    {chat.isPinned && <Pin className={`w-3 h-3 shrink-0 ml-2 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                      {new Date(chat.updatedAt || Date.now()).toLocaleDateString()}
                    </span>
                    
                    <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${currentChatId === chat.id ? 'opacity-100' : ''}`}>
                      <button
                        onClick={(e) => togglePin(chat.id, e)}
                        className={`p-1.5 rounded-md transition-colors ${chat.isPinned ? (isLight ? 'text-emerald-600 hover:bg-emerald-600/20' : 'text-emerald-400 hover:bg-emerald-400/20') : (isLight ? 'text-black/60 hover:text-black hover:bg-black/10' : 'text-white/60 hover:text-white hover:bg-white/20')}`}
                        title={chat.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => startRename(chat.id, chat.title, e)}
                        className={`p-1.5 rounded-md transition-colors ${isLight ? 'text-black/60 hover:text-black hover:bg-black/10' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className={`p-1.5 rounded-md transition-colors ${isLight ? 'text-black/60 hover:text-red-600 hover:bg-red-500/10' : 'text-white/60 hover:text-red-400 hover:bg-red-500/20'}`}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && (
                <div className={`text-center py-8 text-sm ${isLight ? 'text-black/40' : 'text-white/40'}`}>
                  No chats found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="relative z-20 flex items-center">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute -left-4 w-8 h-8 border rounded-lg flex items-center justify-center transition-colors shadow-xl ${isLight ? 'bg-white border-black/20 hover:bg-gray-50 text-black/70 hover:text-black' : 'bg-gray-800 border-white/20 hover:bg-gray-700 text-white/70 hover:text-white'}`}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {currentChat ? (
          <>
            <div className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center space-x-4 pl-6">
                <div className={`w-12 h-12 border rounded-xl flex items-center justify-center shadow-lg shrink-0 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/10 border-white/20'}`}>
                  <TopeLogo className="w-8 h-8" variant={activeModel} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>Tope AI</h2>
                  <p className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>Your personal typing assistant</p>
                </div>
              </div>
              
              <div className="relative w-full sm:w-auto flex items-center gap-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsIntegrationsOpen(true)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center ${isLight ? 'bg-white border-black/10 hover:bg-black/5 text-black/70 hover:text-black' : 'bg-black/50 border-white/10 hover:bg-white/5 text-white/70 hover:text-white'}`}
                  title="Integrations"
                >
                  <Blocks className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className={`flex items-center justify-between w-full sm:w-64 px-4 py-3 rounded-xl border transition-all ${isLight ? 'bg-white border-black/10 hover:bg-black/5' : 'bg-black/50 border-white/10 hover:bg-white/5'}`}
                >
                  <span className="font-medium text-sm">
                    {activeModel === 'turbo' ? (
                      <span>Tope Nano <span className="text-emerald-500">2</span><span className="text-lime-500">.</span><span className="text-yellow-500">6</span></span>
                    ) : activeModel === 'pro' ? (
                      <span>Tope Kai <span className="text-blue-500">2</span><span className="text-purple-500">.</span><span className="text-rose-500">7</span></span>
                    ) : activeModel === 'apex' ? (
                      <span>Tope Apex <span className="text-orange-500">1</span><span className="text-red-500">.</span><span className="text-rose-500">5</span></span>
                    ) : activeModel === 'tt' ? (
                      <span>Tope Limn <span className="text-blue-900">1</span><span className="text-blue-600">.</span><span className="text-blue-400">4</span></span>
                    ) : (
                      <span>Tope Limn <span className="text-cyan-600">2</span><span className="text-indigo-500">.</span><span className="text-fuchsia-500">0</span></span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''} ${isLight ? 'text-black/50' : 'text-white/50'}`} />
                </button>

                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <motion.div
                      key="model-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute top-full right-0 mt-2 w-full sm:w-64 rounded-xl border shadow-xl overflow-hidden z-50 ${isLight ? 'bg-white border-black/10' : 'bg-[#1a1a1a] border-white/10'}`}
                    >
                      <div className="max-h-60 overflow-y-auto p-1">
                        {(['turbo', 'pro', 'apex', 'tt', ...(user ? ['tt2'] : [])] as TopeModel[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, model: m } : c));
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                              activeModel === m 
                                ? (isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white') 
                                : (isLight ? 'text-black/70 hover:bg-black/5 hover:text-black' : 'text-white/70 hover:bg-white/5 hover:text-white')
                            }`}
                          >
                            {m === 'turbo' ? (
                              <span>Tope Nano <span className="text-emerald-500">2</span><span className="text-lime-500">.</span><span className="text-yellow-500">6</span></span>
                            ) : m === 'pro' ? (
                              <div className="flex items-center gap-2">
                                <span>Tope Kai <span className="text-blue-500">2</span><span className="text-purple-500">.</span><span className="text-rose-500">7</span></span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">Deep Thinking</span>
                              </div>
                            ) : m === 'apex' ? (
                              <div className="flex items-center gap-2">
                                <span>Tope Apex <span className="text-orange-500">1</span><span className="text-red-500">.</span><span className="text-rose-500">5</span></span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30">Deep Thinking</span>
                              </div>
                            ) : m === 'tt' ? (
                              <span>Tope Limn <span className="text-blue-900">1</span><span className="text-blue-600">.</span><span className="text-blue-400">4</span></span>
                            ) : (
                              <span>Tope Limn <span className="text-cyan-600">2</span><span className="text-indigo-500">.</span><span className="text-fuchsia-500">0</span></span>
                            )}
                            {activeModel === m && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(currentChat.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? (isLight ? 'bg-black/5' : 'bg-white/10') : (isLight ? 'bg-black/5 shadow-sm' : 'bg-white/10 shadow-md')
                    }`}>
                      {msg.role === 'user' ? <User className={`w-4 h-4 ${isLight ? 'text-black' : 'text-white'}`} /> : <TopeLogo className="w-5 h-5" variant={activeModel} />}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? (isLight ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-black rounded-tr-sm') 
                        : (isLight ? 'bg-black/5 text-black rounded-tl-sm' : 'bg-white/10 text-white rounded-tl-sm')
                    }`}>
                      {msg.thought && <ThoughtProcess thought={msg.thought} isLight={isLight} />}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLight ? 'bg-black/5 shadow-sm' : 'bg-white/10 shadow-md'}`}>
                      <TopeLogo className="w-5 h-5" variant={activeModel} />
                    </div>
                    <div className={`p-4 rounded-2xl rounded-tl-sm flex items-center space-x-3 ${isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white'}`}>
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                      </div>
                      <span className={`text-sm font-medium ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                        {thinkingStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 border-t shrink-0 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
              <form onSubmit={handleSend} className="relative flex items-center space-x-2">
                {user && currentChat.model === 'tt2' && (
                  <button
                    type="button"
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                      sharedStream 
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                        : (isLight ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white')
                    }`}
                    title={sharedStream ? "Stop sharing screen" : "Share screen with Tope Limn 2.0"}
                  >
                    {sharedStream ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                  </button>
                )}
                {(activeModel === 'pro' || activeModel === 'apex') && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                      className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
                        isDeepThinkingEnabled 
                          ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                          : (isLight ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white')
                      }`}
                      title={isDeepThinkingEnabled ? "Deep Thinking Enabled" : "Enable Deep Thinking"}
                    >
                      <Brain className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={sharedStream ? "Ask Tope about your screen..." : "Ask Tope anything..."}
                    className={`w-full border rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-1 transition-all ${isLight ? 'bg-white/50 border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500/50 focus:ring-emerald-500/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/50'}`}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors disabled:opacity-50 ${isLight ? 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-400 disabled:hover:bg-emerald-500'}`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : null}
      </div>
      <IntegrationsModal isOpen={isIntegrationsOpen} onClose={() => setIsIntegrationsOpen(false)} />
    </motion.div>
  );
}
