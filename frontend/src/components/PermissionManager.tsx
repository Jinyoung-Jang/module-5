'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { PostPermission } from '@/types';

interface PermissionManagerProps {
  postId: number;
}

export default function PermissionManager({ postId }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<PostPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [permissionType, setPermissionType] = useState('read');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [postId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<PostPermission[]>(
        `/posts/${postId}/permissions`
      );
      setPermissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier.trim()) return;

    try {
      setAdding(true);
      setError(null);
      await apiRequest(`/posts/${postId}/permissions`, {
        method: 'POST',
        body: JSON.stringify({
          user_identifier: userIdentifier.trim(),
          permission_type: permissionType,
        }),
      });
      setUserIdentifier('');
      await fetchPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add permission');
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Are you sure you want to remove this permission?')) return;

    try {
      setError(null);
      await apiRequest(`/posts/${postId}/permissions/${permissionId}`, {
        method: 'DELETE',
      });
      await fetchPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete permission');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Add Permission Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Permission</h3>
        <form onSubmit={handleAddPermission} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="userIdentifier"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                User Email or ID
              </label>
              <input
                type="text"
                id="userIdentifier"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                placeholder="Enter email or user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="sm:w-40">
              <label
                htmlFor="permissionType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Permission Type
              </label>
              <select
                id="permissionType"
                value={permissionType}
                onChange={(e) => setPermissionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={adding || !userIdentifier.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {adding ? 'Adding...' : 'Add Permission'}
          </button>
        </form>
      </div>

      {/* Permissions List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Current Permissions ({permissions.length})
        </h3>

        {permissions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No permissions granted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Granted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {permission.user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {permission.user.full_name || `User #${permission.user.id}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          permission.permission_type === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : permission.permission_type === 'write'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {permission.permission_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(permission.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeletePermission(permission.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {permission.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {permission.user.full_name || `User #${permission.user.id}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        permission.permission_type === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : permission.permission_type === 'write'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {permission.permission_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Granted: {formatDate(permission.created_at)}
                    </span>
                    <button
                      onClick={() => handleDeletePermission(permission.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
