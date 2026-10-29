'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/cua-hang/bo-cuc/DauTrang';
import Footer from '@/components/cua-hang/bo-cuc/ChanTrang';
import CartDrawer from '@/components/cua-hang/gio-hang/NganKeGioHang';
import { useCart } from '@/lib/ngu-canh-gio-hang';
import { formatVND } from '@/lib/tien-ich';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import YeuCauDangNhapModal from '@/components/cua-hang/YeuCauDangNhapModal';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, cartSubtotal, cartCount, clearCart } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleCheckoutClick = async (e) => {
    e.preventDefault();
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        router.push('/thanh-toan');
      } else {
        setShowLoginModal(true);
      }
    } catch {
      setShowLoginModal(true);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const freeShippingThreshold = 1000000;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <CartDrawer />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl md:text-3xl font-black text-[#10243A] mb-2">Giỏ Hàng Của Bạn</h1>
        <p className="text-xs text-slate-500 mb-8">
          Bạn đang có <strong>{cartCount}</strong> sản phẩm trong giỏ hàng
        </p>

        {cartItems.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-16 text-center max-w-md mx-auto my-10 border border-slate-100">
            <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4 stroke-1" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Giỏ hàng của bạn đang trống</h2>
            <p className="text-xs text-slate-400 mb-6">Hãy tham khảo các mẫu giày thể thao nam bán chạy nhất hôm nay.</p>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 bg-[#10243A] text-white text-xs font-bold px-8 py-3.5 rounded-xl hover:bg-[#F97316] transition-colors"
            >
              Khám Phá Sản Phẩm <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Sản phẩm</span>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Xóa tất cả
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.sku}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#F97316] font-bold uppercase">{item.brandName}</span>
                      <Link href={`/san-pham/${item.slug}`} className="block">
                        <h3 className="text-sm font-bold text-[#10243A] hover:underline line-clamp-1">
                          {item.productName}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Màu: <strong>{item.color}</strong> | Size: <strong>{item.size}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-extrabold text-[#10243A] block">
                        {formatVND(item.price * item.quantity)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatVND(item.price)} / đôi
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                      <button
                        onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.sku)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-4">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 sticky top-28 space-y-6">
                <h3 className="text-lg font-black text-[#10243A] pb-3 border-b border-slate-200">
                  Tổng Đơn Hàng
                </h3>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <strong className="text-slate-800 font-bold">{formatVND(cartSubtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí giao hàng:</span>
                    <strong className={isFreeShipping ? 'text-emerald-600 font-bold' : 'text-slate-800'}>
                      {isFreeShipping ? 'MIỄN PHÍ' : 'Tính khi thanh toán'}
                    </strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#10243A]">Tổng thanh toán:</span>
                  <span className="text-xl font-black text-[#F97316]">{formatVND(cartSubtotal)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={isCheckingAuth}
                  className="w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isCheckingAuth ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      Tiến Hành Thanh Toán <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-[11px] text-slate-400 space-y-2">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Thanh toán COD nhận hàng trực tiếp
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#F97316] shrink-0" />
                    Miễn phí vận chuyển cho đơn từ 1.000.000₫
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />

      {/* Modal Cảnh báo yêu cầu đăng nhập */}
      <YeuCauDangNhapModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectUrl="/thanh-toan"
      />
    </div>
  );
}
