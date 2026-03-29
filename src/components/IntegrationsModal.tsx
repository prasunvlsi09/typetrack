import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Blocks, CheckCircle2, Github, Music, Slack, MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const { settings } = useAppContext();
  const isLight = settings.theme === 'light';
  
  const [integrations, setIntegrations] = useState([
    { id: 'github', name: 'GitHub', description: 'Access repos and issues', icon: Github, connected: false, color: 'text-gray-500' },
    { id: 'spotify', name: 'Spotify', description: 'Control your music', icon: Music, connected: false, color: 'text-green-500' },
    { id: 'slack', name: 'Slack', description: 'Workspace integration', icon: Slack, connected: false, color: 'text-rose-500' },
    { id: 'whatsapp', name: 'WhatsApp', description: 'Chat with Tope AI via WhatsApp', icon: MessageCircle, connected: false, color: 'text-green-500' }
  ]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setIntegrations(prev => prev.map(int => 
          int.id === 'github' ? { ...int, connected: true } : int
        ));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleIntegration = async (id: string) => {
    if (id === 'github') {
      const isConnected = integrations.find(i => i.id === 'github')?.connected;
      if (isConnected) {
        setIntegrations(prev => prev.map(int => 
          int.id === 'github' ? { ...int, connected: false } : int
        ));
        return;
      }

      try {
        const response = await fetch('/api/auth/github/url');
        if (!response.ok) {
          throw new Error('Failed to get auth URL');
        }
        const { url } = await response.json();

        const authWindow = window.open(
          url,
          'oauth_popup',
          'width=600,height=700'
        );

        if (!authWindow) {
          alert('Please allow popups for this site to connect your account.');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        alert('Failed to start GitHub authentication. Ensure GITHUB_CLIENT_ID is set in the environment variables.');
      }
    } else {
      setIntegrations(prev => prev.map(int => 
        int.id === id ? { ...int, connected: !int.connected } : int
      ));
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
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${isLight ? 'bg-white text-black' : 'bg-[#111] text-white border border-white/10'}`}
        >
          <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-black/10' : 'border-white/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLight ? 'bg-black/5' : 'bg-white/10'}`}>
                <Blocks className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Integrations</h2>
                <p className={`text-sm ${isLight ? 'text-black/50' : 'text-white/50'}`}>Connect Tope AI to your favorite apps</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div 
                    key={integration.id}
                    className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-black/5 border-black/10 hover:border-black/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${isLight ? 'bg-white shadow-sm' : 'bg-black/40'} ${integration.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <button
                        onClick={() => toggleIntegration(integration.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                          integration.connected 
                            ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' 
                            : isLight ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-white/80'
                        }`}
                      >
                        {integration.connected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Connected
                          </>
                        ) : 'Connect'}
                      </button>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{integration.name}</h3>
                    <p className={`text-sm ${isLight ? 'text-black/60' : 'text-white/60'}`}>{integration.description}</p>
                  </div>
                );
              })}
            </div>
            
            <div className={`mt-6 p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-blue-900/20 border-blue-800/50 text-blue-200'}`}>
              <p className="text-sm">
                <strong>Note:</strong> The GitHub integration uses a real OAuth flow. Other integrations are currently in prototype mode.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
