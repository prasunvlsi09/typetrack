import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Loader2, X, Monitor, MonitorOff, Globe, Brain } from 'lucide-react';
import { TopeLogo } from './TopeLogo';
import { useAppContext, Message, ChatSession } from '../context/AppContext';

export function TopeSidebar() {
  const { 
    settings, 
    isTopeSidebarOpen, 
    setIsTopeSidebarOpen, 
    sharedStream, 
    setSharedStream,
    chats,
    setChats,
    currentChatId,
    setCurrentChatId,
    isWebSearchEnabled,
    setIsWebSearchEnabled,
    isDeepThinkingEnabled,
    setIsDeepThinkingEnabled
  } = useAppContext();
  
  const isLight = settings.theme === 'light';
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-switch to Tope Limn 2.0 model when opening sidebar if current chat isn't using it
  useEffect(() => {
    if (isTopeSidebarOpen) {
      const currentChat = chats.find(c => c.id === currentChatId);
      if (currentChat && currentChat.model !== 'tt2') {
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, model: 'tt2' } : c));
      }
    }
  }, [isTopeSidebarOpen, currentChatId, chats, setChats]);

  const currentChat = chats.find(c => c.id === currentChatId) || chats[0];

  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRef.current = video;
    }
    
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
    if (isTopeSidebarOpen) {
      scrollToBottom();
    }
  }, [currentChat?.messages, isTopeSidebarOpen]);

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
      if (sharedStream && currentChat.model === 'tt2') {
        imageBase64 = captureScreen();
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          model: currentChat.model || 'tt2',
          image: imageBase64,
          useWebSearch: isWebSearchEnabled,
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
        content: data.message || 'Sorry, I could not generate a response.'
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

  return (
    <AnimatePresence>
      {isTopeSidebarOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className={`fixed bottom-24 right-6 w-96 max-h-[85vh] z-50 flex flex-col shadow-2xl rounded-3xl border backdrop-blur-3xl backdrop-saturate-200 overflow-hidden ${isLight ? 'bg-white/60 border-white/50' : 'bg-white/5 border-white/10'}`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                <TopeLogo className="w-5 h-5" variant="tt2" />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isLight ? 'text-black' : 'text-white'}`}>Tope Limn 2.0</h3>
                <p className={`text-xs ${isLight ? 'text-black/50' : 'text-white/50'}`}>Screen Analysis</p>
              </div>
            </div>
            <button
              onClick={() => setIsTopeSidebarOpen(false)}
              className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-black/5 text-black/60' : 'hover:bg-white/10 text-white/60'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(currentChat?.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    msg.role === 'user' ? (isLight ? 'bg-black/5' : 'bg-white/10') : (isLight ? 'bg-black/5 shadow-sm' : 'bg-white/10 shadow-md')
                  }`}>
                    {msg.role === 'user' ? <User className={`w-3 h-3 ${isLight ? 'text-black' : 'text-white'}`} /> : <TopeLogo className="w-4 h-4" variant="tt2" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? (isLight ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-black rounded-tr-sm') 
                      : (isLight ? 'bg-black/5 text-black rounded-tl-sm' : 'bg-white/10 text-white rounded-tl-sm')
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${isLight ? 'bg-black/5 shadow-sm' : 'bg-white/10 shadow-md'}`}>
                    <TopeLogo className="w-4 h-4" variant="tt2" />
                  </div>
                  <div className={`p-3 rounded-2xl rounded-tl-sm flex items-center space-x-2 text-sm ${isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white'}`}>
                    <Loader2 className={`w-3 h-3 animate-spin ${isLight ? 'text-black/50' : 'text-white/50'}`} />
                    <span className={`text-xs ${isLight ? 'text-black/50' : 'text-white/50'}`}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-4 border-t shrink-0 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
            <form onSubmit={handleSend} className="relative flex items-center space-x-2">
              {currentChat.model === 'tt2' && (
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                    sharedStream 
                      ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : (isLight ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white')
                  }`}
                  title={sharedStream ? "Stop sharing screen" : "Share screen with Tope Limn"}
                >
                  {sharedStream ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
                </button>
              )}
              {(currentChat.model === 'pro' || currentChat.model === 'apex') && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                    className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                      isWebSearchEnabled 
                        ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                        : (isLight ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white')
                    }`}
                    title={isWebSearchEnabled ? "Web Search Enabled" : "Enable Web Search"}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                    className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                      isDeepThinkingEnabled 
                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                        : (isLight ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white')
                    }`}
                    title={isDeepThinkingEnabled ? "Deep Thinking Enabled" : "Enable Deep Thinking"}
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                </>
              )}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={sharedStream ? "Ask about screen..." : "Ask Tope..."}
                  className={`w-full border rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 transition-all ${isLight ? 'bg-white/50 border-black/10 text-black placeholder:text-black/40 focus:border-emerald-500/50 focus:ring-emerald-500/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-emerald-500/50'}`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isLight ? 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-400 disabled:hover:bg-emerald-500'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
