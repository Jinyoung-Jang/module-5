'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          대시보드
        </h1>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-1">이메일</h2>
            <p className="text-gray-800">{user.email}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-1">이름</h2>
            <p className="text-gray-800">{user.full_name || '미설정'}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-1">가입일</h2>
            <p className="text-gray-800">
              {new Date(user.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-1">상태</h2>
            <p
              className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}
            >
              {user.is_active ? '활성' : '비활성'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
