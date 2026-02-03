'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { User } from '@/types';
import Navbar from '@/components/Navbar';
import UserTable from '@/components/UserTable';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!user.is_admin) {
        router.replace('/board');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<User[]>('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userToEdit: User) => {
    router.push(`/admin/users/${userToEdit.id}`);
  };

  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.id === user?.id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user "${userToDelete.email}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/admin" className="hover:text-indigo-600">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Users</li>
          </ol>
        </nav>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Error loading users</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>
    </div>
  );
}
