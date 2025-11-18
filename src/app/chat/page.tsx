'use client';

import { useState } from 'react';
import ModernNavbar from '@/components/ModernNavbar';
import ChatSidebar from '@/components/ChatSidebar';
import ModernChatWindow from '@/components/ModernChatWindow';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Navbar */}
      <ModernNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <ChatSidebar 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col relative">
          {/* Toggle Button for Sidebar (Mobile/Desktop) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 left-4 z-10 p-2 bg-white hover:bg-gray-50 rounded-lg shadow-md border border-gray-200 transition-all"
              aria-label="Open sidebar"
            >
              <svg 
                className="h-6 w-6 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              </svg>
            </button>
          )}

          <ModernChatWindow />
        </div>
      </div>
    </div>
  );
}
