'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Upload, Check } from 'lucide-react';

export default function EditProductPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, cRes, pRes, prodRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/categories'),
          fetch('/api/promotions'),
          fetch(`/api/products/${id}`),
        ]);
        const bData = await bRes.json();
        const cData = await cRes.json();
        const pData = await pRes.json();
        const prodData = await prodRes.json();

        if (bData.success) setBrands(bData.data);
        if (cData.success) setCategories(cData.data);
        if (pData.success) setPromotions(pData.data);

        if (prodData.success && prodData.data) {
          const p = prodData.data;
          setForm({
            name: p.name,
            slug: p.slug,
            brand: p.brand?._id || p.brand || '',
            categories: p.categories ? p.categories.map((c) => c._id || c) : [],
            description: p.description || '',
            images: p.images && p.images.length > 0 ? p.images : [''],
            originalPrice: p.originalPrice || 0,
            salePrice: p.salePrice || 0,
            promotion: p.promotion?._id || p.promotion || '',
            soldCount: p.soldCount || 0,
            isActive: p.isActive,
            isFeatured: p.isFeatured,
            seoTitle: p.seoTitle || '',
            seoDescription: p.seoDescription || '',
            variants: p.variants || [],
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handleUpdateVariant = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        alert(data.message || 'Lỗi cập nhật sản phẩm');
      }
    } catch (err) {
      alert('Lỗi máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !form) return <div className="py-20 text-center text-xs font-bold text-slate-400">Đang tải sản phẩm...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 text-slate-500 hover:text-slate-800 bg-white rounded-xl border border-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-black text-[#10243A]">Chỉnh Sửa Sản Phẩm</h1>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#10243A] hover:bg-[#F97316] text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-md disabled:opacity-50"
        >
          {submitting ? 'Đang Cập Nhật...' : 'Lưu Thay Đổi Sản Phẩm'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 text-xs">
        <h2 className="text-base font-black text-[#10243A] pb-3 border-b border-slate-100">Thông Tin Chi Tiết</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tên Sản Phẩm (*)</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#10243A]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Slug URL</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Thương Hiệu (*)</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Giá Gốc Niêm Yết (₫)</label>
            <input
              type="number"
              required
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Giá Bán Thực Tế (₫)</label>
            <input
              type="number"
              required
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Chương Trình Khuyến Mãi (Hot Deal)</label>
            <select
              value={form.promotion}
              onChange={(e) => setForm({ ...form, promotion: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            >
              <option value="">Không áp dụng khuyến mãi</option>
              {promotions.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Số Lượng Đã Bán (soldCount)</label>
            <input
              type="number"
              value={form.soldCount}
              onChange={(e) => setForm({ ...form, soldCount: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Mô Tả Sản Phẩm</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
          />
        </div>
      </div>

      {/* Variants Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 text-xs">
        <h2 className="text-base font-black text-[#10243A] pb-3 border-b border-slate-100">
          Danh Sách Biến Thể ({form.variants.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <th className="p-3">Màu</th>
                <th className="p-3">Size</th>
                <th className="p-3">Ảnh biến thể (URL)</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Giá Bán</th>
                <th className="p-3">Tồn Kho</th>
                <th className="p-3 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {form.variants.map((v, i) => (
                <tr key={i}>
                  <td className="p-3 font-bold text-[#10243A]">{v.color}</td>
                  <td className="p-3 font-bold">{v.size}</td>
                  <td className="p-3">
                    <input
                      type="url"
                      value={v.image || ''}
                      onChange={(e) => handleUpdateVariant(i, 'image', e.target.value)}
                      placeholder={`Ảnh đúng màu ${v.color}`}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-1.5 w-56"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-1.5 font-mono w-40"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleUpdateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-1.5 w-28"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(i, 'stock', parseInt(e.target.value, 10) || 0)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-lg p-1.5 w-20"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
