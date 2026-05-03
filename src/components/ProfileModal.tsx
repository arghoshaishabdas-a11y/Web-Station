import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Shield, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { logout } from '../lib/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/20 rounded-full text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex justify-center">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-3xl border-4 border-[#0f172a] shadow-xl object-cover"
                />
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-1">{user.displayName}</h2>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Pro Member</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-medium text-white break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member Since</p>
                    <p className="text-sm font-medium text-white">May 2026</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
