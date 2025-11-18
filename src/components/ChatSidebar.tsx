'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ChatHistoryItem {
  Chat_id: number;
  Category: string;
  Question: string;
  Answer: string;
  created_at: string;
}

interface ChatSidebarProps {
  onSelectChat?: (chat: ChatHistoryItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatSidebar({ onSelectChat, isOpen, onToggle }: ChatSidebarProps) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'Capstone', name: 'Capstone' },
    { id: 'KP', name: 'Internship' },
    { id: 'MBKM', name: 'MBKM' },
    { id: 'Registrasi MK', name: 'Registration' },
  ];

  useEffect(() => {
    if (session?.user) {
      loadHistory();
    }
  }, [session]);

  useEffect(() => {
    filterHistory();
  }, [searchQuery, selectedCategory, history]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(chat => chat.Category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.Question.toLowerCase().includes(query) ||
        chat.Answer.toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  };

  const groupChatsByDate = (chats: ChatHistoryItem[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { [key: string]: ChatHistoryItem[] } = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    chats.forEach(chat => {
      const chatDate = new Date(chat.created_at);
      
      if (chatDate.toDateString() === today.toDateString()) {
        groups.today.push(chat);
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(chat);
      } else if (chatDate >= weekAgo) {
        groups.week.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChatsByDate(filteredHistory);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Chat History</h2>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            title="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="w-full mt-3 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No chats found</p>
          </div>
        ) : (
          <>
            {groupedChats.today.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Today</h3>
                <div className="space-y-2">
                  {groupedChats.today.map(chat => (
                    <ChatItem key={chat.Chat_id} chat={chat} onSelect={onSelectChat} />
                  ))}
                </div>
              </div>
            )}

            {groupedChats.yesterday.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Yesterday</h3>
                <div className="space-y-2">
                  {groupedChats.yesterday.map(chat => (
                    <ChatItem key={chat.Chat_id} chat={chat} onSelect={onSelectChat} />
                  ))}
                </div>
              </div>
            )}

            {groupedChats.week.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">This Week</h3>
                <div className="space-y-2">
                  {groupedChats.week.map(chat => (
                    <ChatItem key={chat.Chat_id} chat={chat} onSelect={onSelectChat} />
                  ))}
                </div>
              </div>
            )}

            {groupedChats.older.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Older</h3>
                <div className="space-y-2">
                  {groupedChats.older.map(chat => (
                    <ChatItem key={chat.Chat_id} chat={chat} onSelect={onSelectChat} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {filteredHistory.length} {filteredHistory.length === 1 ? 'chat' : 'chats'}
        </div>
      </div>
    </div>
  );
}

function ChatItem({ chat, onSelect }: { chat: ChatHistoryItem; onSelect?: (chat: ChatHistoryItem) => void }) {
  return (
    <button
      onClick={() => onSelect?.(chat)}
      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {chat.Question}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {chat.Answer}
          </p>
        </div>
        <span className="text-xs font-medium text-cyan-600 shrink-0">
          {chat.Category}
        </span>
      </div>
      <div className="mt-2">
        <span className="text-xs text-gray-400">
          {new Date(chat.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </button>
  );
}
