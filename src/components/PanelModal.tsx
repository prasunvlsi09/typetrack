import React, { useState, useEffect } from 'react';
import { X, Shield, Code, Users, Activity, Search, Check, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

const SCRIPTS = [
  { cmd: '/history', action: 'history' as const, color: 'text-teal-500', bg: 'bg-teal-500', hover: 'hover:bg-teal-600', desc: 'Pulls up the history for an account (sessions, records, stats).', placeholder: 'User Email or ID' },
  { cmd: '/delete', action: 'delete' as const, color: 'text-red-600', bg: 'bg-red-600', hover: 'hover:bg-red-700', desc: 'Permanently deletes an account (hides from logs/panel and prevents login).', placeholder: 'User Email, ID, or Username' },
  { cmd: '/disable', action: 'disable' as const, color: 'text-red-500', bg: 'bg-red-500', hover: 'hover:bg-red-600', desc: 'Disables someone\'s account (practically banning them until you click /enable).', placeholder: 'User Email or ID' },
  { cmd: '/enable', action: 'enable' as const, color: 'text-emerald-500', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', desc: 'Enables a disabled account. Only works if they have been disabled.', placeholder: 'User Email or ID' },
  { cmd: '/message', action: 'message' as const, color: 'text-blue-500', bg: 'bg-blue-500', hover: 'hover:bg-blue-600', desc: 'Pops up a message for whatever you type in to everybody.', placeholder: 'Type message here...' },
  { cmd: '/admin', action: 'admin' as const, color: 'text-purple-500', bg: 'bg-purple-500', hover: 'hover:bg-purple-600', desc: 'Make someone an admin (adds .admin suffix and gives admin powers).', placeholder: 'User Email or ID' },
  { cmd: '/unadmin', action: 'unadmin' as const, color: 'text-orange-500', bg: 'bg-orange-500', hover: 'hover:bg-orange-600', desc: 'Remove someone\'s admin powers.', placeholder: 'User Email or ID' },
  { cmd: '/dev', action: 'dev' as const, color: 'text-indigo-500', bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', desc: 'Give someone dev powers (e.g., change theme).', placeholder: 'User Email or ID' },
  { cmd: '/undev', action: 'undev' as const, color: 'text-pink-500', bg: 'bg-pink-500', hover: 'hover:bg-pink-600', desc: 'Remove someone\'s dev powers.', placeholder: 'User Email or ID' },
  { cmd: '/maintenance', action: 'maintenance' as const, color: 'text-yellow-500', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', desc: 'Puts user(s) into maintenance mode. Type /everybody to apply to all except owners.', placeholder: 'User Email, ID, or /everybody' },
  { cmd: '/unmaintenance', action: 'unmaintenance' as const, color: 'text-lime-500', bg: 'bg-lime-500', hover: 'hover:bg-lime-600', desc: 'Removes user(s) from maintenance mode. Type /everybody to apply to all except owners.', placeholder: 'User Email, ID, or /everybody' },
];

interface PanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'scripts' | 'accounts' | 'status';

export function PanelModal({ isOpen, onClose }: PanelModalProps) {
  const { settings, user, systemStatus, updateSystemStatus } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('scripts');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [historyData, setHistoryData] = useState<{user: any, sessions: any[], records: any[]} | null>(null);
  const [commandInput, setCommandInput] = useState('');

  const isLight = settings.theme === 'light';

  useEffect(() => {
    if (isOpen && activeTab === 'accounts') {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => !user.deleted);
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const executeAction = async (action: 'disable' | 'enable' | 'admin' | 'unadmin' | 'dev' | 'undev' | 'delete' | 'history' | 'message' | 'maintenance' | 'unmaintenance', input: string, clearCallback?: () => void) => {
    input = input?.trim();
    
    if (!input && selectedUsers.length === 0) {
      showMessage('error', 'Please enter an argument or select users.');
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'message') {
        if (!input) {
          throw new Error('Message cannot be empty.');
        }
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, 'system', 'broadcast'), {
          message: input,
          timestamp: Date.now(),
          senderEmail: user?.email || ''
        });
        showMessage('success', `Message sent to everybody: ${input}`);
        if (clearCallback) clearCallback();
        return;
      }

      const protectedEmails = ['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'];
      
      let targetUsers: { id: string, data: any }[] = [];
      
      if (input.toLowerCase() === '/everybody' || input.toLowerCase() === 'everybody') {
        if (action === 'history') {
          throw new Error('Cannot fetch history for everybody at once.');
        }
        const snapshot = await getDocs(collection(db, 'users'));
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!protectedEmails.includes(data.email)) {
            targetUsers.push({ id: doc.id, data });
          }
        });
      } else if (input) {
        const inputs = input.split(',').map(s => s.trim()).filter(Boolean);
        for (const val of inputs) {
          let snapshot;
          if (val.includes('@')) {
            snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', val)));
          } else {
            snapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', val)));
            if (snapshot.empty) {
              const dummyEmail = `${val.toLowerCase()}@typetrack.local`;
              snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', dummyEmail)));
            }
          }
          
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (protectedEmails.includes(data.email)) {
              if (inputs.length === 1) {
                throw new Error('Cannot modify this protected account.');
              }
            } else {
              targetUsers.push({ id: snapshot.docs[0].id, data });
            }
          } else if (inputs.length === 1) {
             throw new Error(`User not found: ${val}`);
          }
        }
      } else if (selectedUsers.length > 0) {
        for (const userId of selectedUsers) {
          const userDoc = allUsers.find(u => u.id === userId);
          if (userDoc) {
            if (!protectedEmails.includes(userDoc.email)) {
              targetUsers.push({ id: userId, data: userDoc });
            }
          }
        }
      }

      if (targetUsers.length === 0) {
        throw new Error('No valid users found to apply the action.');
      }

      if (action === 'history') {
        if (targetUsers.length > 1) {
          throw new Error('Can only view history for one user at a time.');
        }
        const targetUserId = targetUsers[0].id;
        const targetUserDoc = targetUsers[0].data;

        const sessionsSnapshot = await getDocs(collection(db, 'users', targetUserId, 'sessions'));
        const sessions = sessionsSnapshot.docs.map(d => d.data() as any);
        
        const recordsSnapshot = await getDocs(collection(db, 'users', targetUserId, 'records'));
        const records = recordsSnapshot.docs.map(d => d.data() as any);

        setHistoryData({
          user: targetUserDoc,
          sessions,
          records
        });
        
        if (clearCallback) clearCallback();
        return;
      }

      const batch = writeBatch(db);

      for (const target of targetUsers) {
        const userRef = doc(db, 'users', target.id);
        const targetUserDoc = target.data;
        let updates: any = {};
        
        switch (action) {
          case 'disable':
            updates = { disabled: true };
            break;
          case 'enable':
            updates = { disabled: false };
            break;
          case 'maintenance':
            updates = { maintenance: true };
            break;
          case 'unmaintenance':
            updates = { maintenance: false };
            break;
          case 'admin':
            updates = { role: 'admin' };
            if (targetUserDoc?.displayName && !targetUserDoc.displayName.endsWith('.admin')) {
              updates.displayName = `${targetUserDoc.displayName}.admin`;
            }
            break;
          case 'unadmin':
            updates = { role: 'casual' };
            if (targetUserDoc?.displayName && targetUserDoc.displayName.endsWith('.admin')) {
              updates.displayName = targetUserDoc.displayName.replace(/\.admin$/, '');
            }
            break;
          case 'dev':
            updates = { role: 'dev' };
            if (targetUserDoc?.displayName && !targetUserDoc.displayName.endsWith('.dev')) {
              updates.displayName = `${targetUserDoc.displayName}.dev`;
            }
            break;
          case 'undev':
            updates = { role: 'casual' };
            if (targetUserDoc?.displayName && targetUserDoc.displayName.endsWith('.dev')) {
              updates.displayName = targetUserDoc.displayName.replace(/\.dev$/, '');
            }
            break;
          case 'delete':
            updates = { disabled: true, deleted: true };
            break;
        }

        batch.update(userRef, updates);
      }

      await batch.commit();
      
      showMessage('success', `Successfully executed /${action} on ${targetUsers.length} user(s)`);
      if (clearCallback) clearCallback();
      setSelectedUsers([]);
      
      if (activeTab === 'accounts') {
        fetchUsers();
      }
    } catch (error: any) {
      console.error(`Error executing ${action}:`, error);
      showMessage('error', error.message || 'An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="panel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="panel-content"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-4xl h-[80vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col backdrop-blur-3xl backdrop-saturate-200 border ${
              isLight ? 'bg-white/60 text-black border-white/50' : 'bg-white/5 text-white border-white/10'
            }`}
          >
          <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold">Admin Panel</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={`flex border-b ${isLight ? 'border-black/10' : 'border-white/10'} px-6 pt-4 gap-6`}>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`pb-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'scripts' 
                  ? 'border-red-500 text-red-500' 
                  : `border-transparent ${isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`
              }`}
            >
              <Code className="w-4 h-4" />
              Scripts
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`pb-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'accounts' 
                  ? 'border-red-500 text-red-500' 
                  : `border-transparent ${isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`
              }`}
            >
              <Users className="w-4 h-4" />
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`pb-4 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'status' 
                  ? 'border-red-500 text-red-500' 
                  : `border-transparent ${isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`
              }`}
            >
              <Activity className="w-4 h-4" />
              Status
            </button>
          </div>

          {/* Action Message Toast */}
          <AnimatePresence>
            {actionMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 ${
                  actionMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {actionMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="font-medium text-sm">{actionMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 overflow-y-auto flex-1">
            {historyData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setHistoryData(null)} className={`p-2 rounded-lg border ${isLight ? 'hover:bg-black/5 border-black/10' : 'hover:bg-white/5 border-white/10'}`}>
                    &larr; Back
                  </button>
                  <h3 className="text-xl font-bold">History for {historyData.user.email || historyData.user.uid}</h3>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Sign Up Date</div>
                    <div className="text-xl font-bold">
                      {historyData.user.createdAt ? new Date(historyData.user.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Total Sessions</div>
                    <div className="text-2xl font-bold">{historyData.sessions.length}</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Avg WPM</div>
                    <div className="text-2xl font-bold">
                      {historyData.sessions.length > 0 
                        ? Math.round(historyData.sessions.reduce((acc, s) => acc + s.wpm, 0) / historyData.sessions.length) 
                        : 0}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Best WPM</div>
                    <div className="text-2xl font-bold">
                      {historyData.sessions.length > 0 
                        ? Math.max(...historyData.sessions.map(s => s.wpm)) 
                        : 0}
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Avg Accuracy</div>
                    <div className="text-2xl font-bold">
                      {historyData.sessions.length > 0 
                        ? Math.round(historyData.sessions.reduce((acc, s) => acc + s.accuracy, 0) / historyData.sessions.length) 
                        : 0}%
                    </div>
                  </div>
                </div>

                {/* Records */}
                <div>
                  <h4 className="text-lg font-bold mb-3">Records</h4>
                  {historyData.records.length > 0 ? (
                    <div className="space-y-2">
                      {historyData.records.map((r, i) => (
                        <div key={i} className={`p-3 rounded-lg border flex justify-between items-center ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                          <div>
                            <div className="font-bold">{r.title}</div>
                            <div className={`text-xs ${isLight ? 'text-black/50' : 'text-white/50'}`}>{new Date(r.date).toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-500">{r.wpm} WPM</div>
                            <div className={`text-sm ${isLight ? 'text-black/70' : 'text-white/70'}`}>{r.accuracy}% Acc</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>No records found.</div>
                  )}
                </div>

                {/* Sessions */}
                <div>
                  <h4 className="text-lg font-bold mb-3">All Sessions</h4>
                  {historyData.sessions.length > 0 ? (
                    <div className="space-y-2">
                      {historyData.sessions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((s, i) => (
                        <div key={i} className={`p-3 rounded-lg border flex justify-between items-center ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                          <div className={`text-sm ${isLight ? 'text-black/70' : 'text-white/70'}`}>{new Date(s.date).toLocaleString()}</div>
                          <div className="flex gap-4">
                            <div className="font-bold">{s.wpm} WPM</div>
                            <div className="font-bold">{s.accuracy}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>No sessions found.</div>
                  )}
                </div>
              </div>
            ) : activeTab === 'scripts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Scripts Management</h3>
                  <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                    Execute system scripts and automated tasks here. Type a command to quickly execute it.
                  </p>
                </div>
                
                {/* Unified Command Bar */}
                <div className={`p-4 rounded-xl border shadow-sm ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const parts = commandInput.trim().split(' ');
                    const cmdPart = parts[0].toLowerCase();
                    const argPart = parts.slice(1).join(' ');
                    
                    const match = SCRIPTS.find(s => s.cmd.startsWith(cmdPart));
                    if (match) {
                      executeAction(match.action, argPart, () => setCommandInput(''));
                    } else {
                      showMessage('error', 'Unknown command.');
                    }
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-lg text-emerald-500">&gt;</div>
                      <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        placeholder="Type a command (e.g., /delete user@email.com)..."
                        className={`flex-1 bg-transparent outline-none font-mono text-sm ${isLight ? 'text-black placeholder:text-black/40' : 'text-white placeholder:text-white/40'}`}
                        autoFocus
                      />
                      <button 
                        type="submit"
                        disabled={actionLoading || !commandInput.trim()}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors"
                      >
                        Execute
                      </button>
                    </div>
                  </form>
                  {commandInput && (
                    <div className={`mt-3 pt-3 border-t ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Closest Matches</div>
                      <div className="space-y-1">
                        {SCRIPTS.filter(s => s.cmd.startsWith(commandInput.trim().split(' ')[0].toLowerCase())).map(s => (
                          <div key={s.cmd} className="flex items-center gap-2 text-sm font-mono">
                            <span className={`font-bold ${s.color}`}>{s.cmd}</span>
                            <span className={isLight ? 'text-black/50' : 'text-white/50'}>[{s.placeholder}]</span>
                            <span className={`ml-2 hidden sm:inline ${isLight ? 'text-black/70' : 'text-white/70'}`}>- {s.desc}</span>
                          </div>
                        ))}
                        {SCRIPTS.filter(s => s.cmd.startsWith(commandInput.trim().split(' ')[0].toLowerCase())).length === 0 && (
                          <div className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>No matching commands found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {SCRIPTS.map((script) => (
                    <div key={script.cmd} className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className={`font-mono font-bold text-lg ${script.color}`}>{script.cmd}</div>
                          <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                            {script.desc}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input 
                            type="text" 
                            id={`input-${script.action}`}
                            placeholder={script.placeholder} 
                            className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border transition-colors ${
                              isLight ? 'bg-white border-black/20 text-black focus:border-black/40' : 'bg-black/50 border-white/20 text-white focus:border-white/40'
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                executeAction(script.action, val, () => { (e.target as HTMLInputElement).value = ''; });
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              const inputEl = document.getElementById(`input-${script.action}`) as HTMLInputElement;
                              executeAction(script.action, inputEl.value, () => { inputEl.value = ''; });
                            }}
                            disabled={actionLoading}
                            className={`px-4 py-2 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:opacity-50 ${script.bg} ${script.hover}`}
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'accounts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Accounts Management</h3>
                    <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                      Manage user accounts, permissions, and roles.
                    </p>
                  </div>
                  <button 
                    onClick={fetchUsers}
                    disabled={loadingUsers}
                    className={`p-2 rounded-lg border transition-colors ${
                      isLight ? 'bg-white border-black/10 hover:bg-black/5 text-black' : 'bg-black/50 border-white/10 hover:bg-white/5 text-white'
                    }`}
                  >
                    <Activity className={`w-5 h-5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {selectedUsers.length > 0 && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLight ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                    <div className={`text-sm font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {selectedUsers.length} user(s) selected
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        id="bulk-action-select"
                        className={`px-3 py-2 rounded-lg text-sm outline-none border transition-colors ${
                          isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                        }`}
                      >
                        <option value="">Select Action...</option>
                        {SCRIPTS.filter(s => !['history', 'message'].includes(s.action)).map(s => (
                          <option key={s.action} value={s.action}>{s.cmd}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const action = (document.getElementById('bulk-action-select') as HTMLSelectElement).value as any;
                          if (action) executeAction(action, '');
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
                
                <div className={`rounded-2xl border overflow-hidden ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                  {loadingUsers ? (
                    <div className="p-8 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : allUsers.length === 0 ? (
                    <div className={`p-8 text-center ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                      No users found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className={`text-xs uppercase ${isLight ? 'bg-black/5 text-black/60' : 'bg-white/5 text-white/60'}`}>
                          <tr>
                            <th className="px-6 py-3">
                              <input 
                                type="checkbox" 
                                checked={selectedUsers.length === allUsers.length && allUsers.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers(allUsers.map(u => u.id));
                                  } else {
                                    setSelectedUsers([]);
                                  }
                                }}
                                className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                              />
                            </th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((u) => (
                            <tr key={u.id} className={`border-b last:border-0 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  checked={selectedUsers.includes(u.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers([...selectedUsers, u.id]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-6 py-4 font-medium flex items-center gap-3">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
                                    {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                                  </div>
                                )}
                                <span>{u.displayName || 'Unknown'}</span>
                              </td>
                              <td className="px-6 py-4">{u.email}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {u.disabled ? (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs font-bold">Disabled</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded text-xs font-bold">Active</span>
                                  )}
                                  
                                  {u.role === 'owner' || ['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'].includes(u.email) ? (
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-xs font-bold">Owner</span>
                                  ) : (
                                    <>
                                      {u.role === 'admin' && (
                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs font-bold">Admin</span>
                                      )}
                                      {u.role === 'dev' && (
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-500 rounded text-xs font-bold">Dev</span>
                                      )}
                                      {(!u.role || u.role === 'casual') && (
                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded text-xs font-bold">Casual</span>
                                      )}
                                    </>
                                  )}
                                  {u.maintenance && (
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs font-bold">Maintenance</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {!['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'].includes(u.email) ? (
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.email);
                                        setActionMessage({ type: 'success', text: 'Email copied to clipboard!' });
                                        setTimeout(() => setActionMessage(null), 3000);
                                      }}
                                      className={`p-1.5 rounded hover:bg-black/10 transition-colors ${isLight ? 'text-black/60' : 'text-white/60 hover:bg-white/10'}`}
                                      title="Copy Email"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className={`text-xs font-medium ${isLight ? 'text-black/40' : 'text-white/40'}`}>Protected</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'status' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">System Status</h3>
                <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                  View real-time system metrics and health status.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Server Status</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        systemStatus.server === 'Online' ? 'bg-emerald-500' :
                        systemStatus.server === 'Updating' ? 'bg-orange-500' : 'bg-red-500'
                      }`} />
                      <select
                        value={systemStatus.server}
                        onChange={(e) => updateSystemStatus({ server: e.target.value as any })}
                        className={`font-bold bg-transparent outline-none cursor-pointer appearance-none ${
                          systemStatus.server === 'Online' ? 'text-emerald-500' :
                          systemStatus.server === 'Updating' ? 'text-orange-500' : 'text-red-500'
                        }`}
                      >
                        <option value="Online" className="text-black">Online</option>
                        <option value="Updating" className="text-black">Updating</option>
                        <option value="Offline" className="text-black">Offline</option>
                      </select>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Database</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        systemStatus.database === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <select
                        value={systemStatus.database}
                        onChange={(e) => updateSystemStatus({ database: e.target.value as any })}
                        className={`font-bold bg-transparent outline-none cursor-pointer appearance-none ${
                          systemStatus.database === 'Connected' ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        <option value="Connected" className="text-black">Connected</option>
                        <option value="Disconnected" className="text-black">Disconnected</option>
                      </select>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
                    <div className={`text-sm mb-1 ${isLight ? 'text-black/50' : 'text-white/50'}`}>Total Accounts</div>
                    <div className="font-bold">{allUsers.length || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
