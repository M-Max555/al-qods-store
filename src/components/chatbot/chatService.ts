import { productService } from '../../firebase/services/productService';
import { useCartStore } from '../../store/cartStore';
import { useChatStore, type ConvState } from '../../store/chatStore';
import { orderService } from '../../firebase/services/orderService';
import { auth } from '../../firebase';

export const chatService = {
  async sendMessage(messages: { role: 'user' | 'assistant' | 'system', content: string | any[] }[], cartItems: any[]) {
    try {
      const products = await productService.getAllProducts();
      const productsInfo = JSON.stringify(products.map(p => ({
        id: p.id,
        name: p.nameAr,
        price: p.finalPrice || p.price,
        category: p.categoryAr,
        stock: p.stock,
        rating: p.ratingAverage || 0,
        reviewsNum: p.ratingCount || 0,
        shipping: p.shippingDetails,
        warranty: p.warranty,
        return: p.returnPolicy,
        topReview: p.reviews && p.reviews.length > 0 ? p.reviews[0].comment : ''
      })));

      const cartInfo = cartItems.length > 0 
        ? cartItems.map(i => `- ${i.product.nameAr} (كمية: ${i.quantity})`).join('\n')
        : 'السلة فارغة حالياً.';
        
      const cartStore = useCartStore.getState();
      const chatStore = useChatStore.getState();
      const authStore = (await import('../../store/authStore')).useAuthStore.getState();
      const user = authStore.user;
      
      const totalPrice = cartStore.getTotal();
      const conversationState = chatStore.conversationState;
      
      const couponInfo = user?.coupon && !user?.hasUsedCoupon 
        ? `العميل يمتلك كوبون خصم: ${user.coupon} (خصم 5%). ذكره باستخدامه إذا كان لم يقم بذلك بعد.` 
        : 'لا يوجد كوبونات نشطة حالياً لهذا العميل.';

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          context: {
            productsInfo,
            cartInfo,
            totalPrice,
            couponInfo,
            conversationState
          }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.state) {
        chatStore.setConversationState(data.state as ConvState);
      }

      const richProducts = (data.products || []).map((aiProduct: any) => 
        products.find(p => p.id === aiProduct.id)
      ).filter(Boolean);

      if (data.type === 'message_with_action') {
        if (data.action.type === 'create_order') {
          const { name, phone, address } = data.action.payload;
          
          if (cartItems.length === 0) {
             return { content: data.content + "\\n\\nبس لاحظت إن سلتك فاضية! ضيف منتجات الأول عشان نقدر نأكد الطلب.", products: richProducts };
          }

          const user = auth.currentUser;
          const orderItems = cartItems.map(i => ({
            productId: i.product.id,
            name: i.product.nameAr,
            price: i.product.finalPrice || i.product.price,
            quantity: i.quantity,
            image: i.product.images[0] || ''
          }));

          try {
            await orderService.createOrder({
              userId: user ? user.uid : 'guest_user',
              items: orderItems,
              totalPrice: cartStore.getTotal(),
              shippingCost: cartStore.getShippingCost(),
              paymentMethod: 'cod',
              paymentStatus: 'unpaid',
              address: address,
              phone: phone,
              notes: `طلب عبر المساعد الذكي. الاسم: ${name}`
            });

            await cartStore.clearCart();
            return { content: "تم تأكيد طلبك بنجاح 🎉\nهنكلمك قريب لتأكيد الطلب وشحنه بأسرع وقت!", products: [] };
          } catch (err) {
            console.error("Order creation failed:", err);
            return { content: "واجهتني مشكلة صغيرة وأنا بأسجل طلبك. ممكن تحاول تأكده من السلة مباشرة؟", products: [] };
          }
        }
      }

      return { content: data.content || "عذراً، حدث خطأ في النظام.", products: richProducts };
    } catch (error) {
      console.error('Chat Service Error:', error);
      return { content: "عذراً، الخدمة غير متاحة حالياً بسبب خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.", products: [] };
    }
  }
};
