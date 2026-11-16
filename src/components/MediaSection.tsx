import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Download, X, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem } from '../types';
import { newId, put, remove, useLiveList } from '../lib/db';

type Filter = 'all' | 'image' | 'video';

function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) { setUrl(undefined); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

const formatSize = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB`
  : b < 1024 ** 3 ? `${(b / 1024 / 1024).toFixed(1)} MB`
  : `${(b / 1024 ** 3).toFixed(2)} GB`;

async function makeThumb(file: File, max = 480): Promise<Blob | undefined> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return await new Promise<Blob | undefined>((res) => canvas.toBlob((b) => res(b ?? undefined), 'image/jpeg', 0.8));
  } catch { return undefined; }
}

function Thumb({ item, onOpen, onDelete }: { item: MediaItem; onOpen: () => void; onDelete: () => void }) {
  const url = useObjectUrl(item.kind === 'image' ? (item.thumb ?? item.blob) : item.blob);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10">
      <button onClick={onOpen} className="absolute inset-0 w-full h-full">
        {url && (item.kind === 'image'
          ? <img src={url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
          : <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="w-full h-full object-cover" />)}
        {item.kind === 'video' && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center"><Play className="w-5 h-5 text-white fill-current ml-0.5" /></span>
          </span>
        )}
      </button>
      <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/70 to-transparent pointer-events-none">
        <p className="text-[11px] text-white truncate">{item.name}</p>
        <p className="text-[10px] text-slate-300">{formatSize(item.size)}</p>
      </div>
      <button onClick={onDelete} aria-label="Delete" className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 max-md:opacity-100 transition-opacity">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function Viewer({ items, index, onIndex, onClose, onDelete }: { items: MediaItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; onDelete: (m: MediaItem) => void }) {
  const item = items[index];
  const url = useObjectUrl(item?.blob);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length]);

  if (!item) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center">
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
        <p className="text-sm text-slate-300 truncate pr-4">{item.name} · {formatSize(item.size)}</p>
        <div className="flex items-center gap-2">
          {url && <a href={url} download={item.name} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><Download className="w-5 h-5" /></a>}
          <button onClick={() => onDelete(item)} className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white"><Trash2 className="w-5 h-5" /></button>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
        </div>
      </div>
      {index > 0 && <button onClick={() => onIndex(index - 1)} className="absolute left-3 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"><ChevronLeft className="w-6 h-6" /></button>}
      {index < items.length - 1 && <button onClick={() => onIndex(index + 1)} className="absolute right-3 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"><ChevronRight className="w-6 h-6" /></button>}
      {url && (item.kind === 'image'
        ? <img src={url} alt={item.name} className="max-w-full max-h-full object-contain" />
        : <video key={item.id} src={url} controls autoPlay playsInline className="max-w-full max-h-full" />)}
    </div>
  );
}

export default function MediaSection() {
  const { items, loading } = useLiveList<MediaItem>('media', { stable: true });
  const [filter, setFilter] = useState<Filter>('all');
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = items.filter((m) => filter === 'all' || m.kind === filter);
  const photoCount = items.filter((m) => m.kind === 'image').length;
  const videoCount = items.length - photoCount;

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage({ used: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => {});
  }, [items.length]);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (list.length === 0) { setError('Only photos and videos can be added.'); return; }
    setError(null);
    navigator.storage?.persist?.().catch(() => {}); // ask the browser not to auto-delete our data
    setProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        const kind = file.type.startsWith('video/') ? 'video' : 'image';
        const thumb = kind === 'image' ? await makeThumb(file) : undefined;
        await put<MediaItem>('media', { id: newId(), name: file.name, kind, mime: file.type, size: file.size, blob: file, thumb, createdAt: Date.now() + i });
      } catch (e) {
        console.error(e);
        setError(`"${file.name}" could not be saved. Your device storage may be full.`);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async (m: MediaItem) => {
    if (!window.confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    await remove('media', m.id);
    setViewIndex(null);
  };

  const tabs: { id: Filter; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all', label: 'All', icon: Upload, count: items.length },
    { id: 'image', label: 'Photos', icon: ImageIcon, count: photoCount },
    { id: 'video', label: 'Videos', icon: Film, count: videoCount },
  ];

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center text-center gap-3 py-10 px-6 rounded-[32px] border-2 border-dashed transition-all ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'}`}
      >
        <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20"><Upload className="w-7 h-7 text-blue-400" /></div>
        <p className="text-white font-bold">Save photos & videos</p>
        <p className="text-slate-500 text-sm max-w-sm">Drag files here or pick them from your device. Stored privately in this browser only.</p>
        <button onClick={() => inputRef.current?.click()} disabled={!!progress} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl font-bold active:scale-95 transition-all">
          {progress ? `Saving ${progress.done}/${progress.total}…` : 'Choose files'}
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setFilter(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              <t.icon className="w-4 h-4" />{t.label} <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        {usage && usage.quota > 0 && <p className="text-xs text-slate-500">Browser storage used: {formatSize(usage.used)} of {formatSize(usage.quota)}</p>}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {shown.map((m, i) => <Thumb key={m.id} item={m} onOpen={() => setViewIndex(i)} onDelete={() => handleDelete(m)} />)}
          </AnimatePresence>
        </div>
      ) : (
        !loading && <div className="h-48 flex items-center justify-center glass rounded-[32px]"><p className="text-slate-500 font-medium">Nothing saved yet.</p></div>
      )}

      {viewIndex !== null && (
        <Viewer items={shown} index={Math.min(viewIndex, shown.length - 1)} onIndex={setViewIndex} onClose={() => setViewIndex(null)} onDelete={handleDelete} />
      )}
    </div>
  );
}
