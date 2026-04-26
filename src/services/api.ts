import type {
  Product, ProductFilters, ApiResponse,
  LoginCredentials, RegisterData, User, Order,
  CheckoutForm, Category,
} from '../types';
import { productService, orderService } from '../firebase';

function ok<T>(data: T, message = 'تم بنجاح'): ApiResponse<T> {
  return { data, message, success: true };
}

export const productApi = {
  getAll: async (_filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    // Note: To implement full filtering via Firebase, productService needs updates.
    // For now, we return all products. The store applies local filtering.
    const products = await productService.getAllProducts();
    return ok(products);
  },
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const product = await productService.getProductById(id);
    return ok(product);
  },
  getFeatured: async (): Promise<ApiResponse<Product[]>> => {
    const products = await productService.getAllProducts();
    return ok(products.filter(p => p.isFeatured));
  },
  getByCategory: async (category: string): Promise<ApiResponse<Product[]>> => {
    const products = await productService.getAllProducts();
    return ok(products.filter(p => p.category === category));
  },
  search: async (query: string): Promise<ApiResponse<Product[]>> => {
    const q = query.toLowerCase();
    const products = await productService.getAllProducts();
    const filtered = products.filter(p => p.nameAr.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    return ok(filtered, `تم العثور على ${filtered.length} نتيجة`);
  },
  getRelated: async (id: string, category: string): Promise<ApiResponse<Product[]>> => {
    const products = await productService.getAllProducts();
    const filtered = products.filter(p => p.category === category && p.id !== id).slice(0, 4);
    return ok(filtered);
  },
};

export const categoryApi = {
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    // Ideally these would be in Firestore as well. We can mock for now.
    return ok([
      { id: '1', name: 'Electrical Appliances', nameAr: 'الأجهزة الكهربائية', icon: '⚡', productCount: 67, slug: 'appliances' },
      { id: '2', name: 'Kitchen Supplies', nameAr: 'لوازم المطابخ', icon: '🍳', productCount: 45, slug: 'kitchen' },
      { id: '3', name: 'Furniture', nameAr: 'الأثاث', icon: '🪑', productCount: 42, slug: 'furniture' },
      { id: '4', name: 'Bedding', nameAr: 'المفروشات', icon: '🛏️', productCount: 55, slug: 'bedding' },
      { id: '5', name: 'Bridal Setup', nameAr: 'تجهيز العرائس', icon: '💍', productCount: 28, slug: 'bridal' },
    ]);
  },
};

export const authApi = {
  login: async (_credentials: LoginCredentials): Promise<ApiResponse<{ user: User }>> => {
    // This is handled by authStore directly now, but provided for compatibility
    throw new Error('Not implemented here, use authStore');
  },
  register: async (_data: RegisterData): Promise<ApiResponse<{ user: User }>> => {
    throw new Error('Not implemented here, use authStore');
  },
  logout: async (): Promise<ApiResponse<null>> => {
    return ok(null);
  },
  getProfile: async (): Promise<ApiResponse<User>> => {
    throw new Error('Not implemented here, use authStore');
  },
  updateProfile: async (_data: Partial<User>): Promise<ApiResponse<User>> => {
    throw new Error('Not implemented here, use authStore');
  },
  forgotPassword: async (_email: string): Promise<ApiResponse<null>> => {
    return ok(null);
  },
};

export const orderApi = {
  create: async (data: CheckoutForm & { items: { productId: string; name: string; price: number; quantity: number; image: string }[] }, userId: string): Promise<ApiResponse<Order>> => {
    const order = await orderService.createOrder({
      userId,
      items: data.items,
      totalPrice: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      shippingCost: 50, // Static or calculated
      paymentMethod: data.paymentMethod as 'cod' | 'vodafone_cash' | 'card',
      paymentStatus: 'unpaid',
      address: `${data.address}, ${data.city}, ${data.governorate}`,
      phone: data.phone,
      notes: data.notes
    });
    return ok(order);
  },
  getAll: async (userId: string): Promise<ApiResponse<Order[]>> => {
    const orders = await orderService.getUserOrders(userId);
    return ok(orders);
  },
  getById: async (_id: string): Promise<ApiResponse<Order>> => {
    throw new Error('Not implemented');
  },
  cancel: async (id: string): Promise<ApiResponse<Order>> => {
    await orderService.updateOrderStatus(id, 'cancelled');
    // Mock return of cancelled order
    return ok({} as Order);
  },
};

export default { productApi, categoryApi, authApi, orderApi };
