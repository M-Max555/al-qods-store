import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useChatStore } from '../../store/chatStore';

export default function ChatBot() {
  const { isOpen, setIsOpen, unreadCount, updateActivity } = useChatStore();

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          updateActivity();
        }}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 hover:scale-105 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        aria-label="مساعد القدس الذكي"
      >
        <MessageCircle size={28} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
