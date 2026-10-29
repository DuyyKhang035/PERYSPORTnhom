'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/cua-hang/bo-cuc/DauTrang';
import Footer from '@/components/cua-hang/bo-cuc/ChanTrang';
import CartDrawer from '@/components/cua-hang/gio-hang/NganKeGioHang';
import ProductCard from '@/components/cua-hang/san-pham/TheSanPham';
import { useCart } from '@/lib/ngu-canh-gio-hang';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Flame, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import YeuCauDangNhapModal from '@/components/cua-hang/YeuCauDangNhapModal';

export default function ProductDetailPage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Variant selection state
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();

        if (data.success && data.data) {
          const prod = data.data;
          setProduct(prod);

          if (prod.images && prod.images.length > 0) {
            setSelectedImage(prod.images[0]);
          }

          if (prod.variants && prod.variants.length > 0) {
            // Find first available variant
            const firstAvailable = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
            setSelectedColor(firstAvailable.color);
            setSelectedSize(String(firstAvailable.size));
            if (firstAvailable.image) setSelectedImage(firstAvailable.image);
          }

          // Load related products from same brand or category
          if (prod.brand?._id) {
            const relRes = await fetch(`/api/products?brand=${prod.brand.slug}&limit=4`);
            const relData = await relRes.json();
            if (relData.success) {
              setRelatedProducts(relData.data.filter((p) => p._id !== prod._id));
            }
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
          Đang tải thông tin sản phẩm...
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Không tìm thấy sản phẩm</h2>
          <Link href="/san-pham" className="bg-[#10243A] text-white px-6 py-3 rounded-xl font-bold text-xs">
            Quay lại cửa hàng
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract unique colors and sizes from variants
  const colorsList = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizesList = Array.from(new Set(product.variants.map((v) => String(v.size))));

  // Get selected variant object
  const currentVariant = product.variants.find(
    (v) => v.color === selectedColor && String(v.size) === String(selectedSize)
  );

  const currentStock = currentVariant ? currentVariant.stock : 0;
  const isOutOfStock = currentStock === 0;

  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    setErrorMsg('');
    // Switch image if variant has custom image
    const matchingVariant = product.variants.find((v) => v.color === colorName && String(v.size) === selectedSize) ||
                           product.variants.find((v) => v.color === colorName);
    if (matchingVariant && matchingVariant.image) {
      setSelectedImage(matchingVariant.image);
    }
  };

  const handleAddToCart = async (isBuyNow = false) => {
    if (!currentVariant) {
      setErrorMsg('Vui lòng chọn Màu sắc và Size hợp lệ');
      return;
    }
    if (isOutOfStock) {
      setErrorMsg('Phiên bản màu và size này đã hết hàng!');
      return;
    }
    if (quantity > currentStock) {
      setErrorMsg(`Kho chỉ còn ${currentStock} sản phẩm`);
      return;
    }

    try {
      addToCart(product, selectedColor, selectedSize, quantity);
      setErrorMsg('');
      if (isBuyNow) {
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
        }
      }
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <CartDrawer />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumbs */}
        <nav className="text-xs text-slate-400 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-slate-700">Trang chủ</Link> /
          <Link href="/san-pham" className="hover:text-slate-700">Sản phẩm</Link> /
          <span className="text-[#10243A] font-bold truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Gallery Area */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-4/3 bg-[#F5F7FA] rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
              <img
                src={selectedImage || product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {product.discountPercentage > 0 && (
                <span className="absolute top-4 left-4 bg-[#F97316] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  GIẢM {product.discountPercentage}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === img ? 'border-[#F97316] shadow-md scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Buy Action */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#F97316]">
                {product.brand?.name || 'PERY SPORT'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-[#10243A] mt-1 leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-slate-500 mt-2">
                Đã bán: <strong className="text-slate-800">{product.soldCount}</strong> sản phẩm
              </p>
            </div>

            {/* Price section */}
            <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-[#10243A]">
                  {formatVND(product.finalPrice)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-xs text-slate-400 line-through ml-3 font-semibold">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.isPromoActive && product.promotion && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#F97316] bg-orange-100 px-2 py-0.5 rounded-md block">
                    {product.promotion.name}
                  </span>
                </div>
              )}
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            {/* Color Picker */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">
                Chọn Màu Sắc: <span className="text-[#F97316] font-black">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colorsList.map((colorName) => {
                  const isSelected = selectedColor === colorName;
                  return (
                    <button
                      key={colorName}
                      onClick={() => handleColorChange(colorName)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[#10243A] bg-[#10243A] text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#F97316]" />}
                      {colorName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Chọn Size (EU): <span className="text-[#F97316] font-black">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-slate-400 font-semibold cursor-pointer hover:underline">
                  Bảng hướng dẫn chọn size
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {sizesList.map((sizeVal) => {
                  const isSelected = selectedSize === sizeVal;
                  const matchingVar = product.variants.find(
                    (v) => v.color === selectedColor && String(v.size) === sizeVal
                  );
                  const isAvailable = matchingVar && matchingVar.stock > 0;

                  return (
                    <button
                      key={sizeVal}
                      disabled={!isAvailable}
                      onClick={() => { setSelectedSize(sizeVal); setErrorMsg(''); }}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#F97316] bg-[#F97316] text-white shadow-md'
                          : !isAvailable
                          ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {sizeVal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="text-xs font-bold flex items-center gap-2">
              Tình trạng tồn kho:
              {isOutOfStock ? (
                <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md">Hết hàng</span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Còn hàng ({currentStock} sản phẩm sẵn có)
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-slate-800">Số lượng:</label>
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock || 1, q + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(false)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-[#10243A] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Thêm Vào Giỏ Hàng
              </button>
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(true)}
                className="w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Mua Ngay Thanh Toán <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Guarantees Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Giao hàng tận nơi toàn quốc từ 1-3 ngày làm việc</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Bảo hành chính hãng 12 tháng về keo và đế</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Đổi size miễn phí trong 30 ngày nếu không vừa</span>
              </div>
            </div>

          </div>
        </div>

        {/* Product Description Section */}
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-xl font-black text-[#10243A] mb-4">Mô Tả Chi Tiết Sản Phẩm</h2>
          <div className="prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-100">
            {product.description}
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200">
            <h2 className="text-xl font-black text-[#10243A] mb-8">Sản Phẩm Cùng Thương Hiệu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd._id} product={relProd} />
              ))}
            </div>
          </section>
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
