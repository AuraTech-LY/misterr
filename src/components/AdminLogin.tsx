import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        onLogin();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError('بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#781220] via-[#8B1538] to-[#781220] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className={`max-w-sm w-full bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/20 transition-all duration-700 transform ${
        isAnimated ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
      }`}>
        <div className="bg-gradient-to-r from-[#781220] to-[#8B1538] text-white p-8 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/30 transform hover:scale-105 transition-transform duration-300">
              <Lock className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-black mb-3 drop-shadow-lg">لوحة التحكم</h1>
            <p className="text-lg opacity-90 font-medium">مطعم المستر - إدارة القائمة</p>
            <div className="mt-4 w-16 h-1 bg-white/50 rounded-full mx-auto"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#781220]" />
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pr-4 pl-12 border-2 border-gray-200 rounded-2xl focus:border-[#781220] focus:ring-4 focus:ring-[#781220]/20 text-right transition-all duration-300 bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="أدخل البريد الإلكتروني"
                required
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#781220]" />
              كلمة المرور
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-12 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-[#781220] transition-colors duration-200 z-10"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pr-4 pl-20 border-2 border-gray-200 rounded-2xl focus:border-[#781220] focus:ring-4 focus:ring-[#781220]/20 text-right transition-all duration-300 bg-gray-50 focus:bg-white hover:border-gray-300"
                placeholder="أدخل كلمة المرور"
                required
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center animate-fadeInUp shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden group ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#781220] to-[#8B1538] hover:from-[#8B1538] hover:to-[#781220] text-white shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95'
            } shadow-[#781220]/25`}
          >
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </span>
          </button>
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              مرحباً بك في نظام إدارة المطعم
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};