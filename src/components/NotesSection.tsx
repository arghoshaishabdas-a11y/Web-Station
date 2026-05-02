import React, { useEffect, useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note } from '../types';
import { useAuth } from '../lib/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

export default function NotesSection() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (s) => setNotes(s.docs.map(d => ({ id: d.id, ...d.data() })) as Note[]), (e) => handleFirestoreError(e, OperationType.LIST, 'notes'));
  }, [user]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;
    await addDoc(collection(db, 'notes'), { userId: user.uid, content: newNote, title: 'Quick Note', createdAt: serverTimestamp() });
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddNote} className="relative">
        <textarea
          placeholder="Jot down a reminder..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 text-white min-h-[100px] outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-slate-600"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button type="submit" className="absolute bottom-4 right-4 p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors">
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {notes.map(note => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="glass p-5 rounded-2xl border border-white/5 relative group">
              <button onClick={() => deleteDoc(doc(db, 'notes', note.id))} className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
              <p className="text-slate-300 text-sm whitespace-pre-wrap pr-8">{note.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
