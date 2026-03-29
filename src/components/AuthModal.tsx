import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Keyboard } from 'lucide-react';
import { signUpWithUsername, logInWithUsername, signInWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup' | 'devlog' | 'devsignup' | 'dev_select';
}

export function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'devlog' | 'devsignup' | 'dev_select'>(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [numericalLogin, setNumericalLogin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or mode changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setNumericalLogin('');
      setRememberMe(true);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'devlog' || mode === 'devsignup') {
      if (!username.trim() || !password.trim() || !numericalLogin.trim() || (mode === 'devsignup' && !displayName.trim())) {
        setError('Please fill in all fields.');
        return;
      }
      
      if (numericalLogin !== 'p2r98h') { // Simple hardcoded check for the dev
        setError('Invalid alphanumeric code.');
        return;
      }
    } else {
      if (!username.trim() || !password.trim() || (mode === 'signup' && !displayName.trim())) {
        setError('Please fill in all fields.');
        return;
      }
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup' || mode === 'devsignup') {
        const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@typetrack.local`;
        const isAdminEmail = email === 'rajarin@typetrack.local' || email === 'pratyus@typetrack.local' || email === 'pratyusalt@typetrack.local' || email === 'prasun.ece07@gmail.com';
        const suffix = isAdminEmail ? '.admin' : '.dev';
        
        // Strip any manually added .admin or .dev to prevent spoofing
        const cleanDisplayName = displayName.trim().replace(/\.admin$/i, '').replace(/\.dev$/i, '');
        const finalDisplayName = mode === 'devsignup' ? `${cleanDisplayName}${suffix}` : cleanDisplayName;
        
        const result = await signUpWithUsername(username, finalDisplayName, password, rememberMe);
        if (result.error) {
          setError(result.error);
        } else {
          window.location.reload();
        }
      } else {
        const result = await logInWithUsername(username, password, rememberMe);
        if (result.error) {
          setError(result.error);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle(rememberMe);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="auth-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70] p-6"
          >
            <div className={`${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'bg-white/60 text-black border-white/50' : 'bg-white/5 text-white border-white/10'} backdrop-blur-3xl backdrop-saturate-200 border rounded-3xl shadow-2xl overflow-y-auto max-h-[85vh] relative`}>
              {/* Close Button */}
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 ${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'text-black/50 hover:text-black hover:bg-black/10' : 'text-white/50 hover:text-white hover:bg-white/10'} rounded-full transition-colors z-10`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className={`w-12 h-12 ${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'bg-black/5 border-black/10' : 'bg-white/10 border-white/20'} rounded-xl flex items-center justify-center border`}>
                    <Keyboard className={`w-6 h-6 ${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'text-black' : 'text-emerald-400'}`} />
                  </div>
                </div>

                <h2 className={`text-2xl font-bold text-center mb-2 ${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'text-black' : 'text-white'}`}>
                  {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : mode === 'dev_select' ? 'Developer Portal' : mode === 'devlog' ? 'Dev Log In' : 'Dev Sign'}
                </h2>
                <p className={`text-center mb-6 text-sm ${mode === 'devlog' || mode === 'devsignup' || mode === 'dev_select' ? 'text-black/50' : 'text-white/50'}`}>
                  {mode === 'login'
                    ? 'Enter your credentials to access your account'
                    : mode === 'signup'
                    ? 'Sign up to track your typing progress'
                    : mode === 'dev_select'
                    ? 'Choose a developer authentication method'
                    : mode === 'devlog'
                    ? 'Developer authentication portal'
                    : 'Create a developer account'}
                </p>

                {mode === 'dev_select' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={() => setMode('devlog')}
                      className="w-full py-3 sm:py-4 bg-black text-white hover:bg-black/80 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Dev Log In</span>
                    </button>
                    <button
                      onClick={() => setMode('devsignup')}
                      className="w-full py-3 sm:py-4 bg-black/5 text-black hover:bg-black/10 border border-black/10 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Dev Sign</span>
                    </button>
                  </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className={`text-xs font-medium ml-1 ${mode === 'devlog' || mode === 'devsignup' ? 'text-black/70' : 'text-white/70'}`}>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. typemaster99"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${mode === 'devlog' || mode === 'devsignup' ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                      disabled={loading}
                    />
                  </div>

                  {(mode === 'signup' || mode === 'devsignup') && (
                    <div className="space-y-1">
                      <label className={`text-xs font-medium ml-1 ${mode === 'devlog' || mode === 'devsignup' ? 'text-black/70' : 'text-white/70'}`}>Display Name</label>
                      {mode === 'devsignup' ? (
                        <div className="flex items-center w-full px-4 py-3 border rounded-xl focus-within:ring-1 transition-all bg-black/5 border-black/10 text-black focus-within:border-black/50 focus-within:ring-black/50">
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. John"
                            className="bg-transparent outline-none flex-1 placeholder:text-black/30"
                            disabled={loading}
                          />
                          <span className="text-black/50 font-medium select-none">
                            {username && ['rajarin', 'pratyus', 'pratyusalt'].includes(username.toLowerCase().replace(/[^a-z0-9]/g, '')) ? '.admin' : '.dev'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-all bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                          disabled={loading}
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className={`text-xs font-medium ml-1 ${mode === 'devlog' || mode === 'devsignup' ? 'text-black/70' : 'text-white/70'}`}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all ${mode === 'devlog' || mode === 'devsignup' ? 'bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-black/50 focus:ring-1 focus:ring-black/50' : 'bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50'}`}
                      disabled={loading}
                    />
                  </div>

                  {(mode === 'devlog' || mode === 'devsignup') && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-black/70 ml-1">Alphanumeric Code (Dev Only)</label>
                      <input
                        type="password"
                        value={numericalLogin}
                        onChange={(e) => setNumericalLogin(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-xl focus:outline-none focus:border-black/50 focus:ring-1 focus:ring-black/50 transition-all text-black placeholder:text-black/30"
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2 ml-1 mt-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`w-4 h-4 rounded focus:ring-offset-0 ${mode === 'devlog' || mode === 'devsignup' ? 'border-black/20 bg-black/5 text-black focus:ring-black/50' : 'border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/50'}`}
                      disabled={loading}
                    />
                    <label htmlFor="rememberMe" className={`text-sm cursor-pointer select-none ${mode === 'devlog' || mode === 'devsignup' ? 'text-black/70' : 'text-white/70'}`}>
                      Keep me signed in
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 mt-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'devlog' || mode === 'devsignup' ? 'bg-black text-white hover:bg-black/80' : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>{mode === 'login' ? 'Log In' : mode === 'signup' ? 'Sign Up' : mode === 'devlog' ? 'Dev Log In' : 'Dev Sign Up'}</span>
                    )}
                  </button>
                </form>
                )}

                {mode !== 'devlog' && mode !== 'devsignup' && mode !== 'dev_select' && (
                  <>
                    <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-4">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-xs text-white/30 uppercase font-medium tracking-wider">Or continue with</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full mt-4 sm:mt-6 py-3 bg-white text-black hover:bg-white/90 font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Google</span>
                    </button>
                  </>
                )}

                {mode !== 'dev_select' && (
                  <div className={`mt-4 sm:mt-6 text-center text-sm ${mode === 'devlog' || mode === 'devsignup' ? 'text-black/50' : 'text-white/50'}`}>
                    {mode === 'login' ? "Don't have an account? " : 
                     mode === 'signup' ? "Already have an account? " : 
                     mode === 'devlog' ? "Don't have a dev account? " : 
                     "Have a dev account? "}
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'login') setMode('signup');
                        else if (mode === 'signup') setMode('login');
                        else if (mode === 'devlog') setMode('devsignup');
                        else if (mode === 'devsignup') setMode('devlog');
                        setError(null);
                      }}
                      className={`${mode === 'devlog' || mode === 'devsignup' ? 'text-black hover:text-black/70' : 'text-emerald-400 hover:text-emerald-300'} font-medium transition-colors`}
                    >
                      {mode === 'login' ? 'Sign Up' : 
                       mode === 'signup' ? 'Log In' : 
                       mode === 'devlog' ? 'Dev Sign' : 
                       'Dev Log In'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
