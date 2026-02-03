'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { User } from '@/types';
import Navbar from '@/components/Navbar';

export default function AdminUserEditPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.replace('/login');
      } else if (!currentUser.is_admin) {
        router.replace('/board');
      }
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser?.is_admin && userId) {
      fetchUser();
    }
  }, [currentUser, userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<User>(`/admin/users/${userId}`);
      setUser(data);
      setEmail(data.email);
      setFullName(data.full_name || '');
      setIsActive(data.is_active);
      setIsAdmin(data.is_admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          email,
          full_name: fullName || null,
          is_active: isActive,
          is_admin: isAdmin,
        }),
      });
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser || !currentUser.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/admin" className="hover:text-indigo-600">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/users" className="hover:text-indigo-600">
                Users
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Edit</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit User</h1>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : user ? (
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User ID (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={user.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active Account
                </label>
              </div>

              {/* Admin Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  disabled={user.id === currentUser?.id}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label
                  htmlFor="isAdmin"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Administrator
                </label>
                {user.id === currentUser?.id && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Cannot change your own admin status)
                  </span>
                )}
              </div>

              {/* Joined Date (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined
                </label>
                <input
                  type="text"
                  value={new Date(user.created_at).toLocaleString('ko-KR')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Link
                  href="/admin/users"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>User not found.</p>
            <Link
              href="/admin/users"
              className="mt-2 inline-block text-sm text-red-600 hover:text-red-800 underline"
            >
              Back to user list
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
