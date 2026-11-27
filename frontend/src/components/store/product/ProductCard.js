'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Eye, Star } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const brandName = product.brand?.name || 'PERY SPORT';
  const imgUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
  
  const hasDiscount = product.discountPercentage > 0;
  const originalPrice = product.originalPrice;
  const finalPrice = product.finalPrice || product.salePrice || originalPrice;

  const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

  const handleQuickBuy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstVariant) {
      try {
        addToCart(product, firstVariant.color, firstVariant.size, 1);
      } catch (err) {
        alert(err.message);
      }
    } else {
      window.location.href = `/products/${product.slug}`;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      
      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-[#F97316] text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-sm">
          -{product.discountPercentage}%
        </div>
      )}

      {/* Featured Badge */}
      {product.isFeatured && !hasDiscount && (
        <div className="absolute top-3 left-3 z-10 bg-[#10243A] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Star className="w-3 h-3 text-[#F97316] fill-[#F97316]" /> Nổi bật
        </div>
      )}

      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-4/3 bg-[#F5F7FA] overflow-hidden">
        <img
          src={imgUrl}
          alt={product.name}
          className="w-full h-full object-contain object-center"
          loading="lazy"
        />
      </Link>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
            {brandName}
          </span>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-bold text-[#10243A] group-hover:text-[#F97316] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-3">
          {/* Price Area */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-extrabold text-[#10243A]">
              {formatVND(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>

          {/* Sold count preview */}
          {product.soldCount > 0 && (
            <p className="text-[11px] text-slate-500 mt-1">
              Đã bán: <strong className="text-slate-700">{product.soldCount}</strong> đôi
            </p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" /> Chi tiết
            </Link>
            <button
              onClick={handleQuickBuy}
              className="flex items-center justify-center gap-1 py-2 px-2 bg-[#10243A] hover:bg-[#F97316] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" /> Thêm giỏ hàng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
