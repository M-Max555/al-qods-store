/**
 * Format price in Egyptian Pounds
 */
export function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} ج.م`;
}

/**
 * Format date in Arabic
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate discount percentage
 */
export function calcDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

/**
 * Format number with Arabic numerals
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate order ID
 */
export function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Validate Egyptian phone number
 */
export function validateEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(01)[0-9]{9}$/.test(cleaned);
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
