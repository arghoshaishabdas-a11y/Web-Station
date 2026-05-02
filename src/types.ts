export interface WebApp {
  id: string;
  userId: string;
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
  lastOpened?: any;
  createdAt: any;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  title: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}
