import React, { useState } from 'react';
import { X, Globe, Type, Palette, Star, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebApp } from '../types';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Partial<WebApp>) => void;
  editingApp?: WebApp;
}

export default function AddAppModal({ isOpen, onClose, onSave, editingApp }: AddAppModalProps) {
  const defaultForm: Partial<WebApp> = { name: '', url: '', category: 'Work', description: '', isFavorite: false, isLocked: false, cardColor: '#3b82f6', tags: [] };
  const [formData, setFormData] = useState<Partial<WebApp>>(defaultForm);

  React.useEffect(() => {
    setFormData(editingApp ? { name: editingApp.name, url: editingApp.url, category: editingApp.category, description: editingApp.description || '', isFavorite: editingApp.isFavorite, isLocked: editingApp.isLocked, cardColor: editingApp.cardColor || '#3b82f6', tags: editingApp.tags || [] } : defaultForm);
  }, [editingApp, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;
    let finalUrl = formData.url.trim();
    if (finalUrl && !finalUrl.includes('://')) finalUrl = 'https://' + finalUrl;
    onSave({ ...formData, url: finalUrl });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg glass border border-white/10 rounded-[32px] shadow-2xl p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{editingApp ? 'Edit Web App' : 'Add New App'}</h2>
                <p className="text-slate-500 text-sm">{editingApp ? 'Update your website details' : 'Save a website to your workspace'}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" required placeholder="Website URL (e.g., google.com)" className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
              </div>
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" required placeholder="App Name" className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none transition-all" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2">Category</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none appearance-none" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {['Work', 'Social', 'Personal', 'AI Tools', 'Shopping', 'Entertainment', 'Banking'].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-2">Card Color</label>
                  <div className="flex items-center gap-2 h-12 bg-white/5 border border-white/10 rounded-2xl px-4">
                    <Palette className="w-4 h-4 text-slate-500" />
                    <input type="color" className="w-full h-8 bg-transparent cursor-pointer rounded-lg border-0" value={formData.cardColor} onChange={(e) => setFormData({ ...formData, cardColor: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })} className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${formData.isFavorite ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  <Star className={`w-4 h-4 ${formData.isFavorite ? 'fill-current' : ''}`} />Favorite
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, isLocked: !formData.isLocked })} className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${formData.isLocked ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                  <ShieldCheck className="w-4 h-4" />Vault Lock
                </button>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-lg">
                {editingApp ? 'Update App' : 'Create Web Station Entry'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
