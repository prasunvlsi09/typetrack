import React, { useState, useEffect } from 'react';
import { Mail, Plus, X, Send, Trash2, Inbox, Send as SendIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';

interface MailMessage {
  id: string;
  senderUid: string;
  senderEmail: string;
  recipientEmail: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface LocalMailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocalMailModal({ isOpen, onClose }: LocalMailModalProps) {
  const { user, settings } = useAppContext();
  const isLight = settings.theme === 'light';
  
  const [inboxMessages, setInboxMessages] = useState<MailMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<MailMessage[]>([]);
  const [view, setView] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [composeTo, setComposeTo] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'mail'),
      where('recipientEmail', '==', user.email)
    );

    const unsubscribeInbox = onSnapshot(q, (snapshot) => {
      const msgs: MailMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({ ...data, id: doc.id } as MailMessage);
      });
      msgs.sort((a, b) => b.timestamp - a.timestamp);
      setInboxMessages(msgs);
    }, (err) => {
      console.error("Error fetching inbox:", err);
    });

    const qSent = query(
      collection(db, 'mail'),
      where('senderUid', '==', user.uid)
    );

    const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
      const msgs: MailMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({ ...data, id: doc.id } as MailMessage);
      });
      msgs.sort((a, b) => b.timestamp - a.timestamp);
      setSentMessages(msgs);
    }, (err) => {
      console.error("Error fetching sent mail:", err);
    });

    return () => {
      unsubscribeInbox();
      unsubscribeSent();
    };
  }, [user, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    setError('');
    setSuccess('');
    
    if (!composeTo.trim() || !composeMessage.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Basic validation for local mail format
    let recipient = composeTo.trim().toLowerCase();
    if (!recipient.includes('@')) {
      recipient = `${recipient}@typetrack.local`;
    }

    setIsSending(true);
    try {
      const newDocRef = doc(collection(db, 'mail'));
      const newMail = {
        id: newDocRef.id,
        senderUid: user.uid,
        senderEmail: user.email,
        recipientEmail: recipient,
        message: composeMessage.trim(),
        timestamp: Date.now(),
        read: false
      };
      
      await setDoc(newDocRef, newMail);
      
      setSuccess('Message sent successfully!');
      setComposeTo('');
      setComposeMessage('');
      setTimeout(() => {
        setView('inbox');
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error("Error sending mail:", err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (msg: MailMessage) => {
    if (msg.recipientEmail === user?.email && !msg.read) {
      try {
        await updateDoc(doc(db, 'mail', msg.id), { read: true });
      } catch (err) {
        console.error("Error marking as read:", err);
      }
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'mail', msgId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  if (!isOpen) return null;

  const displayMessages = view === 'inbox' ? inboxMessages : sentMessages;
  const unreadCount = inboxMessages.filter(m => !m.read).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[80vh] backdrop-blur-3xl backdrop-saturate-200 border ${
          isLight ? 'bg-white/60 text-black border-white/50' : 'bg-black/60 text-white border-white/10'
        }`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${isLight ? 'border-black/10' : 'border-white/10'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Local Mail</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-48 flex flex-col p-4 border-r ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <button
              onClick={() => setView('compose')}
              className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors mb-6 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Compose</span>
            </button>
            
            <nav className="space-y-2">
              <button
                onClick={() => setView('inbox')}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-colors ${
                  view === 'inbox' 
                    ? (isLight ? 'bg-black/5 font-semibold' : 'bg-white/10 font-semibold') 
                    : (isLight ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/5 text-white/70')
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setView('sent')}
                className={`flex items-center space-x-2 w-full px-4 py-2.5 rounded-xl transition-colors ${
                  view === 'sent' 
                    ? (isLight ? 'bg-black/5 font-semibold' : 'bg-white/10 font-semibold') 
                    : (isLight ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/5 text-white/70')
                }`}
              >
                <SendIcon className="w-4 h-4" />
                <span>Sent</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {view === 'compose' ? (
              <form onSubmit={handleSend} className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">New Message</h3>
                
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">{error}</div>}
                {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm">{success}</div>}
                
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                    To (TypeTrack Mail or Username)
                  </label>
                  <input
                    type="text"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="username or user@typetrack.local"
                    className={`w-full px-4 py-2.5 rounded-xl outline-none transition-all ${
                      isLight 
                        ? 'bg-black/5 focus:bg-white border border-black/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                        : 'bg-white/5 focus:bg-gray-800 border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                    Message
                  </label>
                  <textarea
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all resize-none ${
                      isLight 
                        ? 'bg-black/5 focus:bg-white border border-black/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                        : 'bg-white/5 focus:bg-gray-800 border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {displayMessages.length > 0 && (
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold capitalize">{view}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        displayMessages.forEach(msg => deleteMessage(msg.id));
                      }}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                        isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All</span>
                    </button>
                  </div>
                )}
                {displayMessages.length === 0 ? (
                  <div className={`text-center py-12 ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No messages found.</p>
                  </div>
                ) : (
                  displayMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      onClick={() => markAsRead(msg)}
                      className={`p-4 rounded-xl border transition-all ${
                        !msg.read && view === 'inbox'
                          ? (isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30')
                          : (isLight ? 'bg-black/5 border-black/5 hover:bg-black/10' : 'bg-white/5 border-white/5 hover:bg-white/10')
                      } ${view === 'inbox' && !msg.read ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {view === 'inbox' ? `From: ${msg.senderEmail}` : `To: ${msg.recipientEmail}`}
                          </p>
                          <p className={`text-xs ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(msg.id);
                          }}
                          className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                            isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/20'
                          }`}
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <p className={`text-sm whitespace-pre-wrap ${isLight ? 'text-black/80' : 'text-white/80'}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
