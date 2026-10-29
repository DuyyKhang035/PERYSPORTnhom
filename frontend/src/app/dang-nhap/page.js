'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/tai-khoan';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.role === 'admin') {
          window.location.href = '/quan-tri';
          return;
        }

        // Khách hàng đăng nhập thành công: chuyển qua trang thanh toán luôn
        const target = searchParams.get('redirect') || '/thanh-toan';
        window.location.href = target;
        return;
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: '#0C0F14' }}
      className="min-h-screen flex items-center justify-center px-4 font-sans"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logoThay2.png"
              alt="PERY SPORT"
              className="h-14 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">PERY SPORT</h1>
          <p style={{ color: '#AEAEAE' }} className="text-xs mt-1">Giày thể thao nam cao cấp</p>
        </div>

        {/* Form card */}
        <div
          style={{ backgroundColor: '#141921' }}
          className="rounded-2xl p-7 shadow-2xl border border-white/5"
        >
          <h2 className="text-white text-lg font-bold mb-5">Đăng nhập</h2>

          {/* Thông báo yêu cầu đăng nhập khi thanh toán */}
          {redirectTo.includes('thanh-toan') && (
            <div className="mb-4 flex items-center gap-2.5 bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-semibold px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Vui lòng đăng nhập tài khoản để tiến hành thanh toán đơn hàng.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label style={{ color: '#AEAEAE' }} className="text-xs font-semibold block mb-1.5">
                Email hoặc tên đăng nhập
              </label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập email hoặc username..."
                disabled={loading}
                className="w-full text-sm text-white placeholder:text-white/25 rounded-xl px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: '#0C0F14',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#D17842'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ color: '#AEAEAE' }} className="text-xs font-semibold block mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  disabled={loading}
                  className="w-full text-sm text-white placeholder:text-white/25 rounded-xl px-4 py-3 pr-11 focus:outline-none transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: '#0C0F14',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D17842'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#AEAEAE' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#D17842' }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#b8652e'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#D17842'; }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center mt-5 text-xs" style={{ color: '#AEAEAE' }}>
            Chưa có tài khoản?{' '}
            <a
              href={`/dang-ky?redirect=${encodeURIComponent(searchParams.get('redirect') || '/thanh-toan')}`}
              className="font-semibold hover:underline"
              style={{ color: '#D17842' }}
            >
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0C0F14] flex items-center justify-center text-white">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
