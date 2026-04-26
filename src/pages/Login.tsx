import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const ok = await login({ email, password });
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-surface-container p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-on-surface">تسجيل الدخول</h1>
          <p className="text-secondary text-sm mt-1">أهلاً بك في القدس للأجهزة المنزلية</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">البريد الإلكتروني أو رقم الهاتف</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="text-red-600 hover:underline font-semibold">إنشاء حساب جديد</Link>
        </div>
      </div>
    </div>
  );
}
