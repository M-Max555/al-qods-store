import { useState, useRef, useEffect } from 'react';
import { Send, X, User, Image as ImageIcon, ShoppingCart, ExternalLink } from 'lucide-react';
import { chatService } from './chatService';
import { useCartStore } from '../../store/cartStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { orderService } from '../../firebase/services/orderService';
import { formatPrice } from '../../utils/format';

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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { items: cartItems, addItem } = useCartStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.id) {
        try {
          const orders = await orderService.getUserOrders(user.id);
          setUserOrders(orders);
        } catch (error) {
          console.error("Error fetching user orders for chat:", error);
        }
      }
    };
    fetchOrders();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
    
    // Auto-redirect for WhatsApp
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.whatsapp) {
      window.open(lastMessage.whatsapp, '_blank');
    }
  }, [messages, isLoading]);

  const processMessage = async (text: string, imageBase64?: string) => {
    const finalImage = imageBase64 || pendingImage;
    if (!text.trim() && !finalImage) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text.trim(),
      imageUrl: finalImage || undefined
    };

    addMessage(userMessage);
    setInput('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(text.trim(), cartItems, finalImage || undefined, userOrders);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.content,
        product: response.product,
        products: response.products,
        whatsapp: response.whatsapp
      };

      
      addMessage(assistantMessage);
    } catch (error) {
      console.error(error);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة لاحقاً.'
      });
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
      setPendingImage(base64String);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed bottom-[20px] right-[20px] w-[90vw] sm:w-[400px] h-[600px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden z-[999] animate-fade-in border border-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-zinc-900 text-white p-5 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-inner border border-white/20">
            <img src="/assets/salesman.png" alt="محمد" className="w-full h-full object-cover" />

          </div>
          <div>
            <h3 className="font-black text-xl leading-tight">محمد مساعدك الشخصي</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">متصل الآن لمساعدتك</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/30 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} gap-3 animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 mt-1 shadow-sm">
                <img src="/assets/salesman.png" alt="محمد" className="w-full h-full object-cover" />

              </div>
            )}
            
            <div className="max-w-[85%] space-y-2">
              <div 
                className={`px-5 py-3.5 rounded-3xl whitespace-pre-wrap text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-tr-none' 
                    : 'bg-white text-zinc-800 border border-gray-100 rounded-tl-none font-medium'
                }`}
              >
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto rounded-2xl mb-3 object-cover max-h-52 shadow-md" />
                )}
                {msg.content}
                
                {/* Products List Display (Req #10) */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-4 space-y-3 animate-slide-up">
                    {msg.products.map((p: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex gap-4 items-center">
                        <img src={p.image || 'https://via.placeholder.com/80'} alt={p.name} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-white" />
                        <div className="flex-1 min-w-0 text-right">
                          <h4 className="text-sm font-black text-gray-900 truncate">{p.name}</h4>
                          <p className="text-red-600 font-black text-sm mt-0.5">{formatPrice(p.price || 0)}</p>
                          <button 
                            onClick={() => {
                              addItem({ 
                                id: p.id || Date.now().toString() + i, 
                                nameAr: p.name, 
                                finalPrice: p.price, 
                                images: [p.image],
                                stock: 10
                              } as any);
                              toast.success('تمت الإضافة للسلة');
                            }}
                            className="mt-1 text-zinc-900 text-[10px] font-bold hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <ShoppingCart size={12} />
                            <span>أضف للسلة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy single product support */}
                {msg.product && (!msg.products || msg.products.length === 0) && (
                  <div className="mt-4 bg-gray-50 rounded-2xl p-3 border border-gray-100 flex gap-4 items-center animate-slide-up">
                    <img src={msg.product?.image || 'https://via.placeholder.com/80'} alt={msg.product?.name} className="w-20 h-20 rounded-xl object-cover shadow-sm bg-white" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 truncate">{msg.product?.name}</h4>
                      <p className="text-red-600 font-black text-lg mt-0.5">{formatPrice(msg.product?.price || 0)}</p>
                      <button 
                        onClick={() => {
                          if (msg.product) {
                            addItem({ 
                              id: Date.now().toString(), 
                              nameAr: msg.product.name, 
                              finalPrice: msg.product.price, 
                              images: [msg.product.image],
                              stock: 10
                            } as any);
                            toast.success('تمت الإضافة للسلة');
                          }
                        }}
                        className="mt-2 w-full bg-zinc-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={14} />
                        <span>أضف للسلة</span>
                      </button>
                    </div>
                  </div>
                )}


                {/* WhatsApp Redirect Button (Manual Trigger) */}
                {msg.whatsapp && (
                  <a 
                    href={msg.whatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                  >
                    <span>تأكيد الطلب عبر واتساب</span>
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <User size={20} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-end gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 mt-1 shadow-sm">
              <img src="/assets/salesman.png" alt="محمد" className="w-full h-full object-cover" />

            </div>
            <div className="px-5 py-3.5 rounded-3xl bg-white border border-gray-100 shadow-sm rounded-tl-none flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <p className="text-zinc-500 text-sm font-bold">محمد بيفكر...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {messages.length < 3 && !isLoading && (
        <div className="px-5 py-3 bg-white flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-50">
          {QUICK_REPLIES.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => processMessage(reply)}
              className="whitespace-nowrap px-5 py-2.5 bg-gray-50 text-zinc-700 hover:bg-zinc-900 hover:text-white rounded-2xl text-xs font-black transition-all border border-gray-100 shadow-sm active:scale-95"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-50">
        {pendingImage && (
          <div className="mb-3 relative inline-block animate-scale-in">
            <img src={pendingImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-zinc-100 shadow-md" />
            <button 
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-700 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-3 items-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${pendingImage ? 'text-red-600 bg-red-50' : 'text-zinc-400 hover:text-zinc-900 hover:bg-gray-50'}`}
            title="إرفاق صورة"
          >
            <ImageIcon size={26} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل محمد أو ارفع صورة..."
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all text-sm font-medium placeholder:text-gray-400 shadow-inner"
            />
          </div>
          
          <button
            type="submit"
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all disabled:opacity-50 flex-shrink-0 shadow-xl active:scale-95"
          >
            <Send size={24} className="rtl-flip" />
          </button>
        </form>
      </div>
    </div>
  );
}
