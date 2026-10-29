'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Pencil, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/ngu-canh-gio-hang';
import { formatVND } from '@/lib/tien-ich';
import YeuCauDangNhapModal from '../YeuCauDangNhapModal';

/* ─────────────────────────────────────────
   Modal chỉnh sửa biến thể
───────────────────────────────────────── */
function VariantEditModal({ item, onClose, onUpdate }) {
  // item.variants là mảng variants đầy đủ của sản phẩm được truyền vào
  const variants = item._variants || [];

  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  // Luôn hiển thị đủ dải size 37–43; size nào không có variant sẽ bị disable
  const ALL_SIZES = ['37', '38', '39', '40', '41', '42', '43'];

  const [selectedColor, setSelectedColor] = useState(item.color);
  const [selectedSize,  setSelectedSize]  = useState(String(item.size));
  const [error, setError] = useState('');

  // Kiểm tra variant có tồn tại và còn hàng không
  const getVariant = (color, size) =>
    variants.find((v) => v.color === color && String(v.size) === String(size));

  // Size có thể chọn:
  // - Nếu đã chọn màu: variant màu+size phải tồn tại và stock > 0
  // - Nếu chưa chọn màu: size tồn tại trong ít nhất 1 variant còn hàng
  const isSizeAvailable = (size) => {
    if (selectedColor) {
      const v = getVariant(selectedColor, size);
      return !!(v && v.stock > 0);
    }
    return variants.some((v) => String(v.size) === String(size) && v.stock > 0);
  };

  // Size có tồn tại trong sản phẩm (dù hết hàng) — để phân biệt "không có" vs "hết hàng"
  const sizeExistsInProduct = (size) => {
    if (selectedColor) {
      return variants.some((v) => v.color === selectedColor && String(v.size) === String(size));
    }
    return variants.some((v) => String(v.size) === String(size));
  };

  const handleUpdate = () => {
    if (!selectedColor) { setError('Vui lòng chọn màu sắc'); return; }
    if (!selectedSize)  { setError('Vui lòng chọn kích cỡ');  return; }

    const v = getVariant(selectedColor, selectedSize);
    if (!v) {
      setError(`Biến thể ${selectedColor} / Size ${selectedSize} không tồn tại.`);
      return;
    }
    if (v.stock <= 0) {
      setError('Biến thể này đã hết hàng.');
      return;
    }
    onUpdate(selectedColor, selectedSize);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="text-sm font-black text-[#10243A]">Chỉnh sửa biến thể</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product preview */}
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#10243A] line-clamp-1">{item.productName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Hiện tại: <strong className="text-slate-600">{item.color}</strong> | Size <strong className="text-slate-600">{item.size}</strong>
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Chọn màu */}
          {colors.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">
                Màu sắc
                {selectedColor && <span className="text-[#F97316] ml-1">— {selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setError(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedColor === color
                        ? 'bg-[#10243A] text-white border-[#10243A]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#10243A]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chọn size — luôn hiển thị 37→43 */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">
              Kích cỡ
              {selectedSize && <span className="text-[#F97316] ml-1">— {selectedSize}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => {
                const available = isSizeAvailable(size); // có variant còn hàng
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setError(''); }}
                    title={!available ? 'Có thể không còn hàng hoặc không có cho màu này' : ''}
                    className={`w-12 h-10 rounded-lg text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-[#10243A] text-white border-[#10243A]'
                        : !available
                        ? 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#10243A]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
              </div>
            </div>


          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 font-semibold bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              className="flex-1 py-2.5 bg-[#10243A] hover:bg-[#F97316] text-white text-xs font-bold rounded-xl transition-colors"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CartDrawer chính
───────────────────────────────────────── */
export default function CartDrawer() {
  const router = useRouter();
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, changeVariant, cartSubtotal, cartCount } = useCart();

  // State cho modal: lưu item đang được chỉnh sửa (kèm _variants từ API)
  const [editingItem, setEditingItem] = useState(null);
  const [editError,   setEditError]   = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleCheckoutClick = async (e) => {
    e.preventDefault();
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setIsCartOpen(false);
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

  if (!isCartOpen) return null;

  const freeShippingThreshold = 1000000;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  // Lấy variants của sản phẩm từ API rồi mở modal
  const handleOpenEdit = async (item) => {
    setEditError('');
    try {
      const res = await fetch(`/api/products/${item.slug}`);
      if (!res.ok) throw new Error('Không lấy được thông tin sản phẩm');
      const json = await res.json();

      // API trả về { success: true, data: { variants: [...], ... } }
      const productData = json.data || json;
      const variants = productData.variants || [];

      setEditingItem({ ...item, _variants: variants });
    } catch (err) {
      console.error('handleOpenEdit error:', err);
      // Fallback: mở modal với variants rỗng (sẽ hiện thông báo không có dữ liệu)
      setEditingItem({ ...item, _variants: [] });
    }
  };

  const handleVariantUpdate = (newColor, newSize) => {
    if (!editingItem) return;
    try {
      changeVariant(editingItem.sku, editingItem._variants, newColor, newSize);
      setEditingItem(null);
    } catch (err) {
      setEditError(err.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 bg-[#10243A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#F97316]" />
                <h2 className="text-lg font-bold">Giỏ Hàng Của Bạn</h2>
                <span className="bg-[#F97316] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {cartCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Free shipping banner */}
            <div className="bg-[#F5F7FA] p-4 border-b border-slate-100">
              {remainingForFreeShipping > 0 ? (
                <p className="text-xs text-slate-600 mb-1.5">
                  Mua thêm <strong className="text-[#F97316]">{formatVND(remainingForFreeShipping)}</strong> để nhận <strong>Miễn Phí Giao Hàng</strong>!
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                  🎉 Bạn đã đủ điều kiện nhận MIỄN PHÍ GIAO HÀNG!
                </p>
              )}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F97316] h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                  <ShoppingBag className="w-16 h-16 text-slate-300 mb-4 stroke-1" />
                  <p className="text-base font-semibold text-slate-700 mb-1">Giỏ hàng đang trống</p>
                  <p className="text-xs text-slate-400 mb-6">Hãy chọn cho mình đôi giày yêu thích ngay!</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-[#10243A] text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#F97316] transition-colors"
                  >
                    Khám Phá Sản Phẩm
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.sku}
                    className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 relative group"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-200">
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#10243A] line-clamp-1">{item.productName}</h4>

                        {/* Màu | Size + icon bút */}
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                          Màu: <strong>{item.color}</strong> | Size: <strong>{item.size}</strong>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            aria-label="Chỉnh sửa màu và size"
                            className="inline-flex items-center text-slate-400 hover:text-[#F97316] transition-colors cursor-pointer ml-0.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </p>

                        <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-extrabold text-[#10243A]">
                          {formatVND(item.price)}
                        </span>

                        {/* Quantity buttons */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            className="p-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.sku)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors self-start"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Checkout CTA */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-white border-t border-slate-100 shadow-lg space-y-4">
                <div className="flex items-center justify-between text-slate-600 text-sm">
                  <span>Tạm tính ({cartCount} sản phẩm):</span>
                  <span className="text-lg font-black text-[#10243A]">{formatVND(cartSubtotal)}</span>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/gio-hang"
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    Xem Giỏ Hàng
                  </Link>
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    disabled={isCheckingAuth}
                    className="flex-2 text-center py-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isCheckingAuth ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        Thanh Toán Ngay <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Thanh toán COD an toàn khi nhận hàng
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa biến thể */}
      {editingItem && (
        <VariantEditModal
          item={editingItem}
          onClose={() => { setEditingItem(null); setEditError(''); }}
          onUpdate={handleVariantUpdate}
        />
      )}

      {/* Lỗi khi update variant (hiển thị dạng toast nhỏ) */}
      {editError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-red-600 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl">
          {editError}
        </div>
      )}
      {/* Modal Cảnh báo yêu cầu đăng nhập */}
      <YeuCauDangNhapModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        redirectUrl="/thanh-toan"
      />
    </>
  );
}
