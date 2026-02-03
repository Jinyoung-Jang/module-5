'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Post } from '@/types';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';

export default function PostDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && postId) {
      fetchPost();
    }
  }, [user, postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<Post>(`/posts/${postId}`);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      setDeleting(true);
      await apiRequest(`/posts/${postId}`, { method: 'DELETE' });
      router.push('/board');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      setDeleting(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!post) return;

    const newIsPublic = !post.is_public;
    const action = newIsPublic ? 'public' : 'private';

    if (!confirm(`Are you sure you want to make this post ${action}?`)) {
      return;
    }

    try {
      setToggling(true);
      const updatedPost = await apiRequest<Post>(`/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_public: newIsPublic }),
      });
      setPost(updatedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isOwnerOrAdmin = post && user && (post.author_id === user.id || user.is_admin);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/board')}
          className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Board
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error loading post</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchPost}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : post ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Video Player */}
            <div className="bg-black">
              <VideoPlayer postId={post.id} />
            </div>

            {/* Post Info */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-800">
                      {post.title}
                    </h1>
                    {!post.is_public && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Private
                      </span>
                    )}
                  </div>

                  {post.description && (
                    <p className="mt-4 text-gray-600 whitespace-pre-wrap">
                      {post.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                  <div>
                    <span className="font-medium text-gray-700">Author: </span>
                    {post.author.full_name || post.author.email}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Uploaded: </span>
                    {formatDate(post.created_at)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">File: </span>
                    {post.video_original_name} ({formatFileSize(post.video_size)})
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnerOrAdmin && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                  <button
                    onClick={handleToggleVisibility}
                    disabled={toggling}
                    className={`font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${
                      post.is_public
                        ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {toggling
                      ? 'Updating...'
                      : post.is_public
                      ? 'Make Private'
                      : 'Make Public'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                  <button
                    onClick={() => router.push(`/admin/posts/${post.id}/permissions`)}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Manage Permissions
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
