import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { chatService } from './chatService';
import { useCartStore } from '../../store/cartStore';
import { useChatStore } from '../../store/chatStore';

interface ChatWindowProps {
  onClose: () => void;
}

const QUICK_REPLIES = [
  "عاوز عرض",
  "أرخص حاجة",
  "في تقسيط؟"
];

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { items: cartItems, addItem } = useCartStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const processMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text.trim(),
      imageUrl: imageBase64
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    // Format messages for OpenAI
    const apiMessages = [...messages, userMessage].map(m => {
      if (m.imageUrl) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "صورة مرفقة" },
            { type: "image_url", image_url: { url: m.imageUrl } }
          ]
        };
      }
      return {
        role: m.role,
        content: m.content
      };
    });

    try {
      // Pass cart items to the service so AI knows what's in the cart
      const response = await chatService.sendMessage(apiMessages as any, cartItems);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.content,
        products: response.products
      };
      
      addMessage(assistantMessage);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة لاحقاً.'
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;
    processMessage(input);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      processMessage("شوفيلي حاجة شبه الصورة دي", base64String);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed bottom-[20px] right-[20px] w-[90vw] sm:w-[400px] h-[550px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden z-[999] animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="bg-zinc-900 text-white p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shadow-inner">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">محمد - خدمة العملاء</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-zinc-300 text-xs font-medium">متصل الآن 🟢</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} gap-2 animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot size={16} />
              </div>
            )}
            
            <div 
              className={`px-4 py-2.5 rounded-2xl max-w-[80%] whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-white rounded-tr-none' 
                  : 'bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-tl-none'
              }`}
            >
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto rounded-lg mb-2 object-cover max-h-40" />
              )}
              {msg.content}
              
              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.products.map((p, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex gap-3 items-center">
                      <img src={p.images?.[0] || p.image || 'https://via.placeholder.com/80'} alt={p.nameAr || p.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">{p.nameAr || p.name}</h4>
                        <p className="text-red-600 font-bold text-sm mt-0.5">{p.finalPrice || p.price} جنيه</p>
                      </div>
                      <button 
                        onClick={() => addItem(p)}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                        title="أضف للسلة"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-end gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm rounded-tl-none flex items-center gap-2">
              <p className="text-zinc-600 text-sm font-medium animate-pulse">محمد بيكتب...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length < 3 && !isLoading && (
        <div className="px-4 pb-2 bg-white flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-100 pt-3">
          {QUICK_REPLIES.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => processMessage(reply)}
              className="whitespace-nowrap px-4 py-2 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-full text-sm font-medium transition-colors border border-zinc-200"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-zinc-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
            title="إرفاق صورة"
          >
            <ImageIcon size={22} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-5 py-3 bg-zinc-100 border-none rounded-full focus:ring-2 focus:ring-zinc-800 outline-none transition-all text-sm shadow-inner"
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 flex-shrink-0 shadow-md"
          >
            <Send size={20} className="rtl-flip" />
          </button>
        </form>
      </div>
    </div>
  );
}
