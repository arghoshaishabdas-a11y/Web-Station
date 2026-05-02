import React, { useState } from 'react';
import { ExternalLink, MoreVertical, Star, Trash2, Lock, Layout, Pencil } from 'lucide-react';
import { WebApp } from '../types';
import { motion } from 'motion/react';

interface AppCardProps {
  app: WebApp;
  onLaunch: (app: WebApp) => void;
  onEdit: (app: WebApp) => void;
  onToggleFavorite: (app: WebApp) => void;
  onDelete: (app: WebApp) => void;
}

export default function AppCard({ app, onLaunch, onEdit, onToggleFavorite, onDelete }: AppCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} whileHover={{ y: -5 }} className="glass-card rounded-3xl p-5 flex flex-col gap-4 relative">
      <div className="flex items-start justify-between">
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
          {app.icon ? <img src={app.icon} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Layout className="w-8 h-8 text-slate-500" />}
          {app.isLocked && <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>}
        </div>
        <div className="flex items-center gap-1 relative">
          <button onClick={() => onToggleFavorite(app)} className={`p-2 rounded-lg transition-colors ${app.isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Star className={`w-4 h-4 ${app.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 glass-dark border border-white/10 rounded-xl py-1 z-50 w-36 shadow-2xl">
                <button onClick={() => { onEdit(app); setShowMenu(false); }} className="w-full px-4 py-2 text-sm flex items-center gap-2 text-slate-300 hover:bg-white/5 transition-colors"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => { onDelete(app); setShowMenu(false); }} className="w-full px-4 py-2 text-sm text-red-400 flex items-center gap-2 hover:bg-white/5 transition-colors"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-white truncate">{app.name}</h3>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">{app.url}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-400">{app.category}</span>
          {app.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">{tag}</span>
          ))}
        </div>
      </div>
      <button onClick={() => onLaunch(app)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-blue-600 transition-all text-slate-300 hover:text-white font-medium text-sm">
        Launch <ExternalLink className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
