'use client';

import React from 'react';
import Link from 'next/link';
import { X, LogIn, AlertCircle, UserPlus } from 'lucide-react';

export default function YeuCauDangNhapModal({ isOpen, onClose, redirectUrl = '/thanh-toan' }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Tiêu đề */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F97316] mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8 text-[#F97316]" />
          </div>

          <h3 className="text-xl font-black text-[#10243A] mb-2">
            Yêu Cầu Đăng Nhập
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Quý khách cần <strong>đăng nhập tài khoản</strong> để tiến hành thanh toán đơn hàng. Vui lòng đăng nhập hoặc tạo tài khoản mới nếu chưa có!
          </p>

          {/* Các nút hành động */}
          <div className="w-full space-y-2.5">
            <Link
              href={`/dang-nhap?redirect=${encodeURIComponent(redirectUrl)}`}
              onClick={onClose}
              className="w-full py-3.5 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              Đăng Nhập Ngay
            </Link>

            <Link
              href={`/dang-ky?redirect=${encodeURIComponent(redirectUrl)}`}
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-slate-600" />
              Chưa có tài khoản? Đăng ký ngay
            </Link>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Để sau, tôi muốn tiếp tục xem hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
