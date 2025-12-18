
export type Category = 'הכל' | 'ערכות UI' | 'תבניות' | 'אייקונים' | 'סושיאל' | 'תלת מימד' | 'אלמנטור';

export interface Product {
  id: string;
  created_at?: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  sales: number;
  downloads: number;
  views?: number;
  image: string;
  gallery?: string[];
  description?: string;
  file_url?: string;
  category: Category;
  tags: string[];
  features?: string[];
  includes?: string[];
  formats?: string[];
}

export interface Comment {
  id: number;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string; // Who receives it
  actor_id: string; // Who caused it
  actor_name: string;
  actor_avatar: string;
  type: 'comment' | 'follow' | 'sale' | 'message';
  entity_id?: string; // product_id or null
  content?: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface SearchState {
  query: string;
  category: Category;
}

export interface AISuggestion {
  searchTerm: string;
  reason: string;
}

export type CreatorType = 'freelancer' | 'studio' | 'agency';

export interface CreatorProfile {
  type: CreatorType;
  displayName: string;
  bio: string;
  portfolioUrl: string;
  categories: Category[];
  payoutMethod: 'bank' | 'paypal';
}

export interface HubVideo {
  id: number;
  created_at?: string;
  title: string;
  thumbnail: string;
  video_url: string; // YouTube/Vimeo/MP4 link
  duration: string;
  views: number;
  likes?: number;
  author: string;
  category: string;
  description: string;
  tags: string[];
}
