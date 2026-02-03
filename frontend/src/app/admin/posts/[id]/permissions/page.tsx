'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Post } from '@/types';
import Navbar from '@/components/Navbar';
import PermissionManager from '@/components/PermissionManager';

export default function PostPermissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Check if user has permission (admin or author)
      if (!user?.is_admin && data.author_id !== user?.id) {
        router.replace('/board');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {user.is_admin && (
              <>
                <li>
                  <Link href="/admin" className="hover:text-indigo-600">
                    Admin
                  </Link>
                </li>
                <li>/</li>
                <li>
                  <Link href="/admin/posts" className="hover:text-indigo-600">
                    Posts
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-gray-900 font-medium">Permissions</li>
          </ol>
        </nav>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
            <Link
              href={user.is_admin ? '/admin/posts' : '/board'}
              className="mt-2 inline-block text-sm text-red-600 hover:text-red-800 underline"
            >
              Go back
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : post ? (
          <>
            {/* Post Info Card */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Manage Permissions
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Post:</span> {post.title}
                </div>
                <div>
                  <span className="font-medium">Author:</span>{' '}
                  {post.author.email}
                </div>
                <div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      post.is_public
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            {/* Permission Manager */}
            <PermissionManager postId={parseInt(postId)} />

            {/* Back Link */}
            <div className="mt-6">
              <Link
                href={user.is_admin ? '/admin/posts' : `/board/${postId}`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Back to {user.is_admin ? 'Post Management' : 'Post'}
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>Post not found or you do not have permission to manage it.</p>
            <Link
              href={user.is_admin ? '/admin/posts' : '/board'}
              className="mt-2 inline-block text-sm text-red-600 hover:text-red-800 underline"
            >
              Go back
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
