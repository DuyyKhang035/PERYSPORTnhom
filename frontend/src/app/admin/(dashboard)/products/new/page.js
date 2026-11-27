'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Upload, Check, RefreshCw } from 'lucide-react';
import { slugify } from '@/lib/utils';

export default function NewProductPage() {
  const router = useRouter();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    brand: '',
    categories: [],
    description: '',
    images: [''],
    originalPrice: 1500000,
    salePrice: 1500000,
    promotion: '',
    soldCount: 0,
    isActive: true,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    variants: [],
  });

  // Variant generator helpers
  const [newColor, setNewColor] = useState('Đen Navy');
  const [newColorCode, setNewColorCode] = useState('#10243A');
  const [selectedSizes, setSelectedSizes] = useState(['39', '40', '41', '42', '43']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes, pRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/categories'),
          fetch('/api/promotions'),
        ]);
        const bData = await bRes.json();
        const cData = await cRes.json();
        const pData = await pRes.json();

        if (bData.success) {
          setBrands(bData.data);
          if (bData.data.length > 0) setForm((prev) => ({ ...prev, brand: bData.data[0]._id }));
        }
        if (cData.success) setCategories(cData.data);
        if (pData.success) setPromotions(pData.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: slugify(val),
      seoTitle: `${val} | PERY SPORT`,
    }));
  };

  const handleGenerateVariants = () => {
    if (!newColor.trim()) {
      alert('Vui lòng nhập tên màu sắc');
      return;
    }
    if (selectedSizes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 size');
      return;
    }

    const baseSlug = form.slug || slugify(form.name) || 'product';
    const newVariants = selectedSizes.map((size) => {
      const colorShort = newColor.substring(0, 3).toUpperCase();
      const sku = `${baseSlug.substring(0, 8).toUpperCase()}-${colorShort}-${size}`;
      return {
        color: newColor,
        colorCode: newColorCode,
        size: String(size),
        sku: sku,
        price: form.salePrice || form.originalPrice,
        originalPrice: form.originalPrice,
        stock: 15,
        image: '',
      };
    });

    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));
  };

  const handleRemoveVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateVariant = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleAddImageInput = () => {
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleRemoveImageInput = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleImageUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setForm((prev) => {
          const imgs = [...prev.images];
          imgs[idx] = data.url;
          return { ...prev, images: imgs };
        });
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Lỗi tải ảnh');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand) {
      alert('Vui lòng điền Tên sản phẩm và chọn Thương hiệu');
      return;
    }
    if (form.variants.length === 0) {
      alert('Vui lòng tạo ít nhất 1 biến thể (Màu - Size)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
      } else {
        alert(data.message || 'Lỗi khi tạo sản phẩm');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) return <div className="py-20 text-center text-xs font-bold text-slate-400">Đang tải form...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 text-slate-500 hover:text-slate-800 bg-white rounded-xl border border-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-black text-[#10243A]">Thêm Sản Phẩm Mới</h1>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#10243A] hover:bg-[#F97316] text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors shadow-md disabled:opacity-50"
        >
          {submitting ? 'Đang Tạo Sản Phẩm...' : 'Lưu & Xuất Bản Sản Phẩm'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 text-xs">
        <h2 className="text-base font-black text-[#10243A] pb-3 border-b border-slate-100">1. Thông Tin Cơ Bản</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tên Sản Phẩm (*)</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={handleNameChange}
              placeholder="VD: Pery Runner Pro X1"
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
              <option value="">Không áp dụng chương trình đặc biệt</option>
              {promotions.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.type === 'percentage' ? `Giảm ${p.value}%` : `Giảm ${p.value}₫`})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Số Lượng Đã Bán (soldCount - Điều chỉnh thủ công)</label>
            <input
              type="number"
              value={form.soldCount}
              onChange={(e) => setForm({ ...form, soldCount: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Danh Mục (Chọn nhiều)</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((c) => {
              const checked = form.categories.includes(c._id);
              return (
                <label
                  key={c._id}
                  className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                    checked ? 'bg-[#10243A] text-white border-[#10243A]' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, categories: [...form.categories, c._id] });
                      } else {
                        setForm({ ...form, categories: form.categories.filter((id) => id !== c._id) });
                      }
                    }}
                    className="hidden"
                  />
                  {c.name}
                </label>
              );
            })}
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

      {/* Images Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-[#10243A]">2. Thư Viện Hình Ảnh</h2>
          <button
            type="button"
            onClick={handleAddImageInput}
            className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Thêm đường dẫn ảnh
          </button>
        </div>

        <div className="space-y-3">
          {form.images.map((imgUrl, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={imgUrl}
                onChange={(e) => {
                  const imgs = [...form.images];
                  imgs[idx] = e.target.value;
                  setForm({ ...form, images: imgs });
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none"
              />
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-3 rounded-xl cursor-pointer font-bold shrink-0">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, idx)} className="hidden" />
              </label>
              {form.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveImageInput(idx)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Variants Generator & Matrix */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-6 text-xs">
        <h2 className="text-base font-black text-[#10243A] pb-3 border-b border-slate-100">
          3. Biến Thể Sản Phẩm (Màu Sắc & Size)
        </h2>

        {/* Builder controls */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
          <span className="font-bold text-slate-800 block">Bộ Tạo Biến Thể Nhanh:</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tên Màu Sắc</label>
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="VD: Đen Navy"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mã Màu (Color Code Hex)</label>
              <input
                type="text"
                value={newColorCode}
                onChange={(e) => setNewColorCode(e.target.value)}
                placeholder="#10243A"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Các Size Giày Áp Dụng</label>
            <div className="flex gap-2">
              {['38', '39', '40', '41', '42', '43', '44'].map((s) => {
                const checked = selectedSizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (checked) setSelectedSizes(selectedSizes.filter((item) => item !== s));
                      else setSelectedSizes([...selectedSizes, s]);
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-bold ${
                      checked ? 'bg-[#10243A] text-white border-[#10243A]' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateVariants}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Thêm Các Biến Thể Này Vào Danh Sách
          </button>
        </div>

        {/* Variants Matrix Table */}
        {form.variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="p-3">Màu</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Ảnh biến thể (URL)</th>
                  <th className="p-3">Mã SKU Unique</th>
                  <th className="p-3">Giá Bán (₫)</th>
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
        )}
      </div>

      {/* Controls & SEO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 text-xs">
        <h2 className="text-base font-black text-[#10243A] pb-3 border-b border-slate-100">4. Trạng Thái & SEO</h2>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-[#F97316] w-4 h-4"
            />
            Đang Kinh Doanh (Hiển thị website)
          </label>
          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="accent-[#F97316] w-4 h-4"
            />
            Đánh Dấu Nổi Bật
          </label>
        </div>
      </div>
    </form>
  );
}
