export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  description: string | null;
  video_filename: string;
  video_original_name: string;
  video_size: number;
  author_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author: User;
}

export interface PostPermission {
  id: number;
  post_id: number;
  user_id: number;
  permission_type: string;
  created_at: string;
  user: User;
}

export interface AdminStats {
  total_users: number;
  total_posts: number;
  active_users: number;
  public_posts: number;
}
