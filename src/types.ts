export interface WebApp {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  isLocked: boolean;
  isArchived?: boolean;
  usageCount?: number;
  cardColor?: string;
  lastOpened?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Note {
  id: string;
  content: string;
  title: string;
  createdAt: number;
}

export interface MediaItem {
  id: string;
  name: string;
  kind: 'image' | 'video';
  mime: string;
  size: number;
  blob: Blob;
  thumb?: Blob;
  createdAt: number;
}
