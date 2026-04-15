export interface Post {
  id: number;
  creator: string;
  imageUrl: string;
  caption: string;
  likes: number;
  totalEarned: bigint;
  timestamp: number;
}

export interface UserPost extends Post {
  hasLiked: boolean;
}

export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';