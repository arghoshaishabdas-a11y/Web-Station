import React, { useState } from 'react';
import { LayoutDashboard, Search, Menu, Archive, Zap, FolderLock, StickyNote, Plus, Grid, Star, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { signInWithGoogle, logout } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  onAddClick: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
}

export default function Layout({ children, onAddClick, activeTab, onTabChange, onSearchChange }: LayoutProps) {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (id: string) => {
    onTabChange(id);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Grid, label: 'All Apps', id: 'apps' },
    { icon: Star, label: 'Favorites', id: 'favorites' },
    { icon: Archive, label: 'Archive', id: 'archive' },
    { icon: FolderLock, label: 'Vault', id: 'vault' },
    { icon: StickyNote, label: 'Notes', id: 'notes' },
  ];

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen md:flex text-slate-200 overflow-x-hidden">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>

      <motion.aside initial={false} animate={{ x: isSidebarOpen ? 0 : -256 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} className="w-64 glass-dark border-r border-white/5 h-screen z-50 flex flex-col fixed md:sticky top-0 left-0 shadow-2xl md:shadow-none">
        <div className="w-64 flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Web Station</h1>
          </div>
          <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <button onClick={onAddClick} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 group font-medium">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />Add Web App
              </button>
            </div>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <item.icon className="w-5 h-5" /><span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            {user ? (
              <div className="flex items-center gap-3 px-2 py-3">
                <img src={profile?.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white/10" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">{profile?.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                </div>
                <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><LogOut className="w-5 h-5" /></button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />Sign In
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
        <header className="h-16 glass sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-white/5 rounded-lg"><Menu className="w-6 h-6" /></button>
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
              <input type="text" placeholder="Search apps..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); onSearchChange(e.target.value); }} className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600" />
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-white leading-none mb-1">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 leading-none">Pro Member</p>
              </div>
              <div className="relative group">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 ring-2 ring-blue-500/20" />
                <div className="absolute top-full right-0 mt-2 w-48 glass-dark border border-white/10 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                  <div className="p-3 border-b border-white/5"><p className="text-xs font-bold text-white truncate">{user.displayName}</p><p className="text-[10px] text-slate-500 truncate">{user.email}</p></div>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"><LogOut className="w-3 h-3" /> Sign Out</button>
                </div>
              </div>
            </div>
          )}
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-full">{children}</div>
      </main>
    </div>
  );
}
