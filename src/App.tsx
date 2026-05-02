import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import AppCard from './components/AppCard';
import AddAppModal from './components/AddAppModal';
import { useAuth, AuthProvider } from './lib/auth';
import { 
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from './lib/firebase';
import { WebApp } from './types';
import { motion, AnimatePresence } from 'motion/react';
import NotesSection from './components/NotesSection';
import { Zap, LayoutGrid, List, Lock, Plus } from 'lucide-react';

function WebStation() {
  const { user } = useAuth();
  const [apps, setApps] = useState<WebApp[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WebApp | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<WebApp | null>(null);

  const handleUnlockVault = () => {
    if (pinInput === '1234') { setVaultUnlocked(true); setPinInput(''); }
    else { alert('Incorrect PIN (Hint: 1234)'); setPinInput(''); }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'apps'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WebApp[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'apps'));
    return () => unsubscribe();
  }, [user]);

  const handleAddApp = async (appData: Partial<WebApp>) => {
    if (!user) return;
    try {
      if (editingApp?.id) {
        await updateDoc(doc(db, 'apps', editingApp.id), { ...appData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'apps'), { ...appData, userId: user.uid, usageCount: 0, isArchived: false, createdAt: serverTimestamp(), lastOpened: serverTimestamp() });
      }
      setIsAddModalOpen(false); setEditingApp(null);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, 'apps'); }
  };

  const handleLaunch = async (app: WebApp) => {
    window.open(app.url, '_blank');
    try { await updateDoc(doc(db, 'apps', app.id), { usageCount: (app.usageCount || 0) + 1, lastOpened: serverTimestamp() }); }
    catch (error) { handleFirestoreError(error, OperationType.UPDATE, `apps/${app.id}`); }
  };

  const toggleFavorite = async (app: WebApp) => {
    try { await updateDoc(doc(db, 'apps', app.id), { isFavorite: !app.isFavorite }); }
    catch (error) { handleFirestoreError(error, OperationType.UPDATE, `apps/${app.id}`); }
  };

  const confirmDelete = async () => {
    if (!isDeleting?.id) return;
    try { await deleteDoc(doc(db, 'apps', isDeleting.id)); setIsDeleting(null); }
    catch (error) { handleFirestoreError(error, OperationType.DELETE, `apps/${isDeleting.id}`); setIsDeleting(null); }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = searchQuery === '' ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === 'favorites') return app.isFavorite && !app.isArchived;
    if (activeTab === 'archive') return app.isArchived;
    if (activeTab === 'vault') return app.isLocked && !app.isArchived;
    if (app.isLocked && !vaultUnlocked && activeTab !== 'vault') return false;
    if (app.isArchived && activeTab !== 'archive') return false;
    if (filter === 'All') return true;
    if (filter === 'Favorites') return app.isFavorite;
    return app.category === filter;
  });

  const renderContent = () => {
    if (activeTab === 'vault' && !vaultUnlocked) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-[40px] border border-white/5 backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Private Vault</h2>
          <p className="text-slate-500 mb-8 max-w-sm text-center">Enter your PIN to continue.</p>
          <div className="flex gap-4">
            <input type="password" placeholder="Enter PIN" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-500/50 text-center tracking-widest text-white" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
            <button onClick={handleUnlockVault} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all">Unlock</button>
          </div>
        </div>
      );
    }
    if (activeTab === 'notes') return <NotesSection />;
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {['All', 'Favorites', 'Work', 'Social', 'Personal', 'AI Tools', 'Entertainment'].map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 self-end md:self-auto">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
        {filteredApps.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-3'}>
            <AnimatePresence>
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} onLaunch={handleLaunch} onEdit={(app: WebApp) => { setEditingApp(app); setIsAddModalOpen(true); }} onToggleFavorite={toggleFavorite} onDelete={setIsDeleting} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center glass rounded-[40px] border border-white/5">
            <div className="p-4 bg-slate-900 rounded-3xl mb-4 border border-white/10"><Zap className="w-8 h-8 text-slate-600" /></div>
            <p className="text-slate-500 font-medium">No apps found here.</p>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass p-10 rounded-[40px] text-center border border-white/10">
          <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto mb-8"><Zap className="text-white w-10 h-10" /></div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Web Station</h1>
          <p className="text-slate-400 mb-10 text-lg">Your all-in-one cloud workspace for the modern web.</p>
          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all text-lg active:scale-95">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />Get Started with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <Layout onAddClick={() => { setEditingApp(null); setIsAddModalOpen(true); }} activeTab={activeTab} onTabChange={setActiveTab} onCategoryChange={(cat) => { setFilter(cat); setActiveTab('apps'); }} onSearchChange={setSearchQuery}>
      {renderContent()}
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingApp(null); setIsAddModalOpen(true); }} className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 z-40 border-4 border-blue-500/20">
        <Plus className="w-8 h-8" />
      </motion.button>
      <AddAppModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditingApp(null); }} onSave={handleAddApp} editingApp={editingApp || undefined} />
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleting(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm glass-dark p-8 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Web App?</h3>
              <p className="text-slate-400 mb-8">This will permanently remove <span className="text-white font-semibold">"{isDeleting.name}"</span>. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleting(null)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold border border-white/5 active:scale-95">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold active:scale-95">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return <AuthProvider><WebStation /></AuthProvider>;
        }
