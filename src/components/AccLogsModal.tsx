import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Users, Calendar, Mail, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';

interface AccLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserLog {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export function AccLogsModal({ isOpen, onClose }: AccLogsModalProps) {
  const { settings, user, userRole } = useAppContext();
  const [users, setUsers] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLight = settings.theme === 'light';

  useEffect(() => {
    const isAdmin = 
      userRole === 'admin' ||
      (user?.displayName?.endsWith('.admin') && user?.email?.endsWith('@typetrack.local')) || 
      user?.email === 'rajarin@typetrack.local' || 
      user?.email === 'pratyus@typetrack.local' || 
      user?.email === 'pratyusalt@typetrack.local' ||
      user?.email === 'prasun.ece07@gmail.com';

    if (isOpen && isAdmin) {
      fetchUsers();
    }
  }, [isOpen, user, userRole]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: UserLog[] = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
        });
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load user logs. You might not have permission.");
    } finally {
      setLoading(false);
    }
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
          className={`relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${
            isLight ? 'bg-white text-black' : 'bg-gray-900 text-white border border-white/10'
          }`}
        >
          <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold">Account Logs</h2>
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

          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/20 text-red-500 rounded-xl text-center font-medium">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 opacity-50">
                No users found.
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div 
                    key={u.uid} 
                    className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isLight ? 'bg-black/5' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                          {u.displayName?.charAt(0) || u.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {u.displayName || 'No Display Name'}
                          {((u.displayName?.endsWith('.admin') && u.email?.endsWith('@typetrack.local')) || u.email === 'rajarin@typetrack.local' || u.email === 'pratyus@typetrack.local' || u.email === 'pratyusalt@typetrack.local' || u.email === 'prasun.ece07@gmail.com') && (
                            <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2 opacity-70 text-sm mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`text-sm opacity-50 font-mono bg-black/10 dark:bg-white/10 px-3 py-1.5 rounded-lg`}>
                      UID: {u.uid}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
