'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and navigation links */}
          <div className="flex items-center space-x-8">
            <Link href="/board" className="text-xl font-bold text-indigo-600">
              Module 5
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/board"
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Board
              </Link>
              <Link
                href="/upload"
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Upload
              </Link>
              {user?.is_admin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  {user.full_name || user.email}
                  {user.is_admin && (
                    <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t">
        <div className="flex justify-around py-2">
          <Link
            href="/board"
            className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
          >
            Board
          </Link>
          <Link
            href="/upload"
            className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
          >
            Upload
          </Link>
          {user?.is_admin && (
            <Link
              href="/admin"
              className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
