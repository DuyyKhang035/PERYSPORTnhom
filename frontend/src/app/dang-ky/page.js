'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/thanh-toan';
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/dang-nhap?redirect=${encodeURIComponent(redirectTarget)}`), 1500);
      } else {
        setError(data.message || 'Đăng ký thất bại');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0C0F14' }} className="min-h-screen flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logoThay2.png" alt="PERY SPORT" className="h-14 w-auto object-contain mx-auto mb-3"
            onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 className="text-white text-2xl font-black tracking-tight">PERY SPORT</h1>
          <p style={{ color: '#AEAEAE' }} className="text-xs mt-1">Tạo tài khoản mới</p>
        </div>

        <div style={{ backgroundColor: '#141921' }} className="rounded-2xl p-7 shadow-2xl border border-white/5">
          <h2 className="text-white text-lg font-bold mb-5">Đăng ký</h2>

          {success && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4" /> Đăng ký thành công! Đang chuyển về trang đăng nhập...
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { field: 'fullName', label: 'Họ và tên', type: 'text', placeholder: 'Nhập họ và tên...' },
              { field: 'email', label: 'Email', type: 'email', placeholder: 'Nhập email...' },
              { field: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: 'Nhập số điện thoại...' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label style={{ color: '#AEAEAE' }} className="text-xs font-semibold block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={placeholder}
                  disabled={loading}
                  className="w-full text-sm text-white placeholder:text-white/25 rounded-xl px-4 py-3 focus:outline-none"
                  style={{ backgroundColor: '#0C0F14', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}

            <div>
              <label style={{ color: '#AEAEAE' }} className="text-xs font-semibold block mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  disabled={loading}
                  className="w-full text-sm text-white placeholder:text-white/25 rounded-xl px-4 py-3 pr-11 focus:outline-none"
                  style={{ backgroundColor: '#0C0F14', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#AEAEAE' }} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || success}
              className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#D17842' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng ký...</> : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center mt-5 text-xs" style={{ color: '#AEAEAE' }}>
            Đã có tài khoản?{' '}
            <a 
              href={`/dang-nhap?redirect=${encodeURIComponent(redirectTarget)}`} 
              className="font-semibold hover:underline" 
              style={{ color: '#D17842' }}
            >
              Đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0F14] flex items-center justify-center text-white">Đang tải...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

