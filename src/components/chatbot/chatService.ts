export const chatService = {
  async sendMessage(message: string, _cartItems: any[]) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';


      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return { 
        content: data.reply || "في مشكلة بسيطة 😅 جرب تاني", 
        product: data.product,
        whatsapp: data.whatsapp
      };
    } catch (error) {
      console.error('Chat Service Error:', error);
      return { 
        content: "عذراً، الخدمة غير متاحة حالياً بسبب خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.",
        product: null,
        whatsapp: null
      };
    }
  }
};
