'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/cua-hang/bo-cuc/DauTrang';
import Footer from '@/components/cua-hang/bo-cuc/ChanTrang';
import CartDrawer from '@/components/cua-hang/gio-hang/NganKeGioHang';
import { formatVND, formatDateTime } from '@/lib/tien-ich';
import { Search, AlertCircle } from 'lucide-react';
import { ORDER_STATUSES, getOrderStatus, normalizeOrderStatus } from '@/lib/trang-thai-don-hang';

function LookupContent() {
  const searchParams = useSearchParams();
  const paramCode = searchParams.get('orderCode') || '';
  const paramContact = searchParams.get('contact') || '';

  const [orderCode, setOrderCode] = useState(paramCode);
  const [contactInfo, setContactInfo] = useState(paramContact);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!orderCode.trim() || !contactInfo.trim()) {
      setError('Vui lòng nhập đầy đủ Mã đơn hàng và Số điện thoại hoặc Email');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode, contactInfo }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setOrder(null);
        setError(data.message || 'Không tìm thấy đơn hàng');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramCode && paramContact) {
      handleLookup();
    }
  }, [paramCode, paramContact]);

  const getStatusBadge = (status) => {
    const orderStatus = getOrderStatus(status);
    if (!orderStatus) return status;

    return (
      <span className={`${orderStatus.badgeClass} text-xs font-bold px-3 py-1 rounded-full`}>
        {orderStatus.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-2xl md:text-3xl font-black text-[#10243A] mb-2">Tra Cứu Đơn Hàng</h1>
        <p className="text-xs text-slate-500">
          Nhập mã đơn hàng và số điện thoại/email để kiểm tra tình trạng xử lý và vận chuyển.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleLookup} className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 mb-10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Mã Đơn Hàng (*)</label>
            <input
              type="text"
              required
              placeholder="VD: PS-20260926-1234"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-3 uppercase font-mono focus:outline-none focus:border-[#10243A]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Số Điện Thoại / Email (*)</label>
            <input
              type="text"
              required
              placeholder="Nhập SĐT hoặc Email lúc đặt..."
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#10243A]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#10243A] hover:bg-[#F97316] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" /> {loading ? 'Đang Tra Cứu...' : 'Tra Cứu Tiến Độ Đơn Hàng'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 mb-8">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Lookup Result */}
      {order && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-200 gap-3">
            <div>
              <span className="text-xs text-slate-400 font-bold">Mã Đơn Hàng</span>
              <h3 className="text-lg font-black text-[#10243A] font-mono">{order.orderCode}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Đặt lúc: {formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              {getStatusBadge(order.orderStatus)}
            </div>
          </div>

          {normalizeOrderStatus(order.orderStatus) === 'cancelled' ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" /> Đơn hàng đã bị hủy.
              </div>
              {order.cancelReason && (
                <div className="text-xs font-normal text-red-800 bg-white/70 p-2.5 rounded-xl border border-red-100 mt-2">
                  <span className="font-semibold text-red-900">Lý do hủy:</span> {order.cancelReason}
                </div>
              )}
            </div>
          ) : (
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {ORDER_STATUSES.filter(({ key }) => key !== 'cancelled').map((status, index, statuses) => {
                const currentIndex = statuses.findIndex(
                  ({ key }) => key === normalizeOrderStatus(order.orderStatus)
                );
                const isComplete = index <= currentIndex;

                return (
                  <li key={status.key} className="flex flex-col items-center gap-2 text-center">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      isComplete ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800 mb-1">Khách Hàng:</p>
              <p>Họ tên: <strong>{order.customerName}</strong></p>
              <p>SĐT: <strong>{order.customerPhone}</strong></p>
              <p>Email: <strong>{order.customerEmail}</strong></p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">Địa Chỉ Nhận Hàng:</p>
              <p>{order.shippingAddress}</p>
              <p className="mt-1">Hình thức: <strong>{order.paymentMethod}</strong></p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-3">Chi Tiết Sản Phẩm:</h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                    <div>
                      <span className="font-bold text-[#10243A] block">{item.productName}</span>
                      <span className="text-slate-500 text-[11px]">Màu: {item.color} | Size: {item.size} x{item.quantity}</span>
                    </div>
                  </div>
                  <strong className="text-[#10243A] font-extrabold">{formatVND(item.totalPrice)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-[#10243A]">Tổng Tiền Đơn Hàng:</span>
            <span className="text-xl font-black text-[#F97316]">{formatVND(order.totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <CartDrawer />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20">Đang tải trang tra cứu...</div>}>
          <LookupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
