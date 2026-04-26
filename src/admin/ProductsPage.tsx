import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../firebase/services/productService';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';
import { PlusCircle, Search, Edit2, Trash2, Filter } from 'lucide-react';
import { CATEGORIES, getCategoryLabel } from '../constants/categories';

const CATEGORY_TABS = [
  { key: 'all', label: 'الكل' },
  ...Object.entries(CATEGORIES).map(([key, label]) => ({ key, label }))
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await productService.deleteProduct(id);
      toast.success('تم حذف المنتج بنجاح');
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nameAr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || p.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
            />
          </div>
          <Link
            to="/admin/products/add"
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <PlusCircle size={20} />
            <span>إضافة منتج</span>
          </Link>
        </div>
      </div>
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key 
                ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">المنتج</th>
                <th className="p-4 font-semibold text-gray-600">القسم</th>
                <th className="p-4 font-semibold text-gray-600">السعر</th>
                <th className="p-4 font-semibold text-gray-600">المخزون</th>
                <th className="p-4 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">لم يتم العثور على منتجات</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt={product.nameAr} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <span className="font-medium text-gray-900 line-clamp-2">{product.nameAr}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-medium">
                        {getCategoryLabel(product.category)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-red-600 font-bold">{formatPrice(product.finalPrice || product.price)}</span>
                      {product.discount > 0 && (
                        <span className="text-xs text-gray-400 line-through block">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                        {product.stock > 0 ? `${product.stock} حبة` : 'نفذت الكمية'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/edit/${product.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
