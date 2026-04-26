import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  products?: any[];
}

export type ConvState = 'browsing' | 'interested' | 'asking_questions' | 'ready_to_buy' | 'order_completed';

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  unreadCount: number;
  lastActivity: number;
  conversationState: ConvState;
  addMessage: (msg: Message) => void;
  setIsOpen: (isOpen: boolean) => void;
  setConversationState: (state: ConvState) => void;
  clearMessages: () => void;
  updateActivity: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'أنا محمد 👋 من معرض القدس، أقدر أساعدك تختار أفضل حاجة ليك'
        }
      ],
      isOpen: false,
      unreadCount: 0,
      lastActivity: Date.now(),
      conversationState: 'browsing',
      addMessage: (msg) => set((state) => {
        const isAssistant = msg.role === 'assistant';
        const newUnread = !state.isOpen && isAssistant ? state.unreadCount + 1 : state.unreadCount;
        return {
          messages: [...state.messages, msg],
          unreadCount: newUnread,
          lastActivity: Date.now()
        };
      }),
      setIsOpen: (isOpen) => set((state) => ({ 
        isOpen, 
        unreadCount: isOpen ? 0 : state.unreadCount,
        lastActivity: Date.now()
      })),
      setConversationState: (state) => set({ conversationState: state }),
      clearMessages: () => set({ 
        messages: [{
          id: '1',
          role: 'assistant',
          content: 'أنا محمد 👋 من معرض القدس، أقدر أساعدك تختار أفضل حاجة ليك'
        }],
        unreadCount: 0,
        lastActivity: Date.now(),
        conversationState: 'browsing'
      }),
      updateActivity: () => set({ lastActivity: Date.now() })
    }),
    {
      name: 'chat-storage',
    }
  )
);
