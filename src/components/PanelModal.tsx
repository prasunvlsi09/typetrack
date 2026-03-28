import React, { useState, useEffect } from 'react';
import { X, Shield, Code, Users, Activity, Search, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

interface PanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'scripts' | 'accounts' | 'status';

export function PanelModal({ isOpen, onClose }: PanelModalProps) {
  const { settings, user, systemStatus, updateSystemStatus } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('scripts');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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

  const executeAction = async (action: 'disable' | 'enable' | 'admin' | 'unadmin' | 'dev' | 'undev' | 'delete', inputId: string) => {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    const input = inputElement?.value?.trim();
    
    if (!input) {
      showMessage('error', 'Please enter an email or ID.');
      return;
    }

    setActionLoading(true);
    try {
      // Find user by email or ID
      let targetUserId = input;
      let targetUserDoc = null;
      
      // If it looks like an email, query by email
      if (input.includes('@')) {
        const q = query(collection(db, 'users'), where('email', '==', input));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          targetUserId = snapshot.docs[0].id;
          targetUserDoc = snapshot.docs[0].data();
        } else {
          throw new Error('User not found with that email.');
        }
      } else {
        // Try fetching by ID first
        let snapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', input)));
        
        // If not found by ID, try fetching by username (dummy email)
        if (snapshot.empty) {
          const dummyEmail = `${input.toLowerCase()}@typetrack.local`;
          snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', dummyEmail)));
        }

        if (!snapshot.empty) {
          targetUserId = snapshot.docs[0].id;
          targetUserDoc = snapshot.docs[0].data();
        } else {
          throw new Error('User not found with that ID or Username.');
        }
      }

      const protectedEmails = ['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'];
      if (targetUserDoc?.email && protectedEmails.includes(targetUserDoc.email)) {
        throw new Error('Cannot modify this protected account.');
      }

      const userRef = doc(db, 'users', targetUserId);
      
      let updates: any = {};
      switch (action) {
        case 'disable':
          updates = { disabled: true };
          break;
        case 'enable':
          updates = { disabled: false };
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
          break;
        case 'undev':
          updates = { role: 'casual' };
          break;
        case 'delete':
          updates = { disabled: true, deleted: true };
          break;
      }

      await updateDoc(userRef, updates);
      showMessage('success', `Successfully executed /${action} on ${input}`);
      if (inputElement) inputElement.value = '';
      
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-4xl h-[80vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col backdrop-blur-3xl backdrop-saturate-200 border ${
            isLight ? 'bg-white/60 text-black border-white/50' : 'bg-black/60 text-white border-white/10'
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
            {activeTab === 'scripts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold">Scripts Management</h3>
                  <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                    Execute system scripts and automated tasks here.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* /delete */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-red-600 text-lg">/delete</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Permanently deletes an account (hides from logs/panel and prevents login).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="delete-input"
                          placeholder="User Email, ID, or Username" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-red-600 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('delete', 'delete-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /disable */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-red-500 text-lg">/disable</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Disables someone's account (practically banning them until you click /enable).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="disable-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-red-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('disable', 'disable-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /enable */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-emerald-500 text-lg">/enable</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Enables a disabled account. Only works if they have been disabled.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="enable-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-emerald-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('enable', 'enable-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /message */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-blue-500 text-lg">/message</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Pops up a message for whatever you type in to everybody.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="message-input"
                          placeholder="Type message here..." 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-blue-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={async () => {
                            const inputElement = document.getElementById('message-input') as HTMLInputElement;
                            const input = inputElement.value.trim();
                            if (!input) {
                              showMessage('error', 'Please enter a message.');
                              return;
                            }
                            setActionLoading(true);
                            try {
                              const { setDoc, doc } = await import('firebase/firestore');
                              await setDoc(doc(db, 'system', 'broadcast'), {
                                message: input,
                                timestamp: Date.now(),
                                senderEmail: user?.email || ''
                              });
                              showMessage('success', `Message sent to everybody: ${input}`);
                              inputElement.value = '';
                            } catch (e: any) {
                              showMessage('error', e.message || 'Failed to send message');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /admin */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-purple-500 text-lg">/admin</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Make someone an admin (adds .admin suffix and gives admin powers).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="admin-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-purple-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('admin', 'admin-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /unadmin */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-orange-500 text-lg">/unadmin</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Remove someone's admin powers.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="unadmin-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-orange-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('unadmin', 'unadmin-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /dev */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-indigo-500 text-lg">/dev</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Give someone dev powers (e.g., change theme).
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="dev-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-indigo-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('dev', 'dev-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* /undev */}
                  <div className={`p-4 rounded-xl border ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-mono font-bold text-pink-500 text-lg">/undev</div>
                        <div className={`text-sm mt-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                          Remove someone's dev powers.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          id="undev-input"
                          placeholder="User Email or ID" 
                          className={`px-3 py-2 rounded-lg text-sm flex-1 sm:w-48 outline-none border focus:border-pink-500 transition-colors ${
                            isLight ? 'bg-white border-black/20 text-black' : 'bg-black/50 border-white/20 text-white'
                          }`}
                        />
                        <button 
                          onClick={() => executeAction('undev', 'undev-input')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                        >
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>
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
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((u) => (
                            <tr key={u.id} className={`border-b last:border-0 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                              <td className="px-6 py-4 font-medium flex items-center gap-3">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
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
                                  
                                  {['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'].includes(u.email) ? (
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
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {!['eptoflprat@typetrack.local', 'rajarin@typetrack.local', 'pratyusalt@typetrack.local', 'pratyus@typetrack.local', 'prasun.ece07@gmail.com'].includes(u.email) ? (
                                    <button 
                                      onClick={() => {
                                        const input = document.getElementById('disable-input') as HTMLInputElement;
                                        if (input) input.value = u.email;
                                        setActiveTab('scripts');
                                      }}
                                      className={`p-1.5 rounded hover:bg-black/10 transition-colors ${isLight ? 'text-black/60' : 'text-white/60 hover:bg-white/10'}`}
                                      title="Manage in Scripts"
                                    >
                                      <Code className="w-4 h-4" />
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
      </div>
    </AnimatePresence>
  );
}
