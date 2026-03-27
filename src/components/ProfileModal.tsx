import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../context/AppContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, settings } = useAppContext();
  const [step, setStep] = useState<'code' | 'action_select' | 'password' | 'username' | 'display_name'>('code');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLight = settings.theme === 'light';
  
  // Check if the user signed in with email/password (username) or Google
  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setStep('code');
      setResetCode('');
      setNewPassword('');
      setNewUsername('');
      setNewDisplayName('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode === '2078') {
      setError(null);
      setStep('action_select');
    } else {
      setError('Invalid reset code.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resetCode,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      
      setSuccessMessage('Password reset successfully!');
      setNewPassword('');
      setStep('code');
      setResetCode('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!newUsername || newUsername.length < 3) {
      setError('New username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/reset-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resetCode,
          newUsername
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username');
      }
      
      setSuccessMessage('Username updated! Reloading...');
      setNewUsername('');
      setStep('code');
      setResetCode('');

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Error changing username:', err);
      setError(err.message || 'Failed to update username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!newDisplayName || newDisplayName.trim().length < 1) {
      setError('Please enter a new display name.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/reset-display-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resetCode,
          newDisplayName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update display name');
      }
      
      setSuccessMessage('Display name updated! Reloading...');
      setNewDisplayName('');
      setStep('code');
      setResetCode('');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Error changing display name:', err);
      setError(err.message || 'Failed to update display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

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
          className={`relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl flex flex-col ${
            isLight ? 'bg-white text-black' : 'bg-gray-900 text-white border border-white/10'
          }`}
        >
          <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <h2 className="text-xl font-bold">Your Profile</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-4 mb-8">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{user.displayName || 'No Display Name'}</h3>
                <p className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>
                  {user.email?.replace('@typetrack.local', '')}
                </p>
              </div>
            </div>

            {isPasswordUser ? (
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-emerald-500" />
                  Reset
                </h4>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {step === 'code' ? (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ml-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>Master Reset Code</label>
                      <input
                        type="password"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter reset code"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 mt-2 bg-emerald-500 text-white hover:bg-emerald-400 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : step === 'action_select' ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setStep('password')}
                      className="w-full py-3 bg-emerald-500 text-white hover:bg-emerald-400 font-bold rounded-xl transition-all duration-300"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => setStep('username')}
                      className="w-full py-3 bg-blue-500 text-white hover:bg-blue-400 font-bold rounded-xl transition-all duration-300"
                    >
                      Reset Username
                    </button>
                    <button
                      onClick={() => setStep('display_name')}
                      className="w-full py-3 bg-purple-500 text-white hover:bg-purple-400 font-bold rounded-xl transition-all duration-300"
                    >
                      Reset Display Name
                    </button>
                  </div>
                ) : step === 'password' ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ml-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStep('action_select')}
                        disabled={loading}
                        className="px-4 py-3 bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 font-bold rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-emerald-500 text-white hover:bg-emerald-400 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span>Reset Password</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : step === 'username' ? (
                  <form onSubmit={handleChangeUsername} className="space-y-4">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ml-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>New Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter new username"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStep('action_select')}
                        disabled={loading}
                        className="px-4 py-3 bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 font-bold rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-500 text-white hover:bg-blue-400 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span>Reset Username</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : step === 'display_name' ? (
                  <form onSubmit={handleChangeDisplayName} className="space-y-4">
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ml-1 ${isLight ? 'text-black/70' : 'text-white/70'}`}>New Display Name</label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Enter new display name"
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStep('action_select')}
                        disabled={loading}
                        className="px-4 py-3 bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 font-bold rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-purple-500 text-white hover:bg-purple-400 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span>Reset Display Name</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-sm text-center ${isLight ? 'bg-black/5 text-black/70' : 'bg-white/5 text-white/70'}`}>
                You signed in with Google. Please manage your password through your Google account settings.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
