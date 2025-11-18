'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function ModernNavbar() {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/chat" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Obrolin</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/chat"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/documents"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Documents
            </Link>
            <Link
              href="/history"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              History
            </Link>
          </div>

          {/* User Menu */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {session.user.name}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
