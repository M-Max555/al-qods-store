export const chatService = {
  async sendMessage(messages: { role: 'user' | 'assistant' | 'system', content: string | any[] }[], _cartItems: any[]) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const lastMessage = messages[messages.length - 1];
      const messageText = typeof lastMessage.content === 'string' ? lastMessage.content : '';

      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return { content: data.reply || "تمام يا فندم 👌 قولّي محتاج إيه وأنا أظبطك", products: [] };
    } catch (error) {
      console.error('Chat Service Error:', error);
      return { content: "عذراً، الخدمة غير متاحة حالياً بسبب خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.", products: [] };
    }
  }
};
