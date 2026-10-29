'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Edit2, Trash2, X, Building2, Home, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DiaChiShopeeModal({
  user,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onSaveAddresses,
  isOpen,
  onClose,
}) {
  // Modal states: 'list' (Danh sách địa chỉ) | 'form' (Thêm/Sửa địa chỉ)
  const [viewMode, setViewMode] = useState('list');
  const [editingAddress, setEditingAddress] = useState(null); // null = thêm mới, object = chỉnh sửa
  const [tempSelectedId, setTempSelectedId] = useState(selectedAddressId);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    detail: '',
    label: 'Nhà riêng', // 'Nhà riêng' | 'Văn phòng'
    isDefault: false,
  });

  useEffect(() => {
    setTempSelectedId(selectedAddressId);
  }, [selectedAddressId, isOpen]);

  if (!isOpen) return null;

  // Mở form thêm mới
  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      city: 'TP. Hồ Chí Minh',
      district: '',
      ward: '',
      detail: '',
      label: 'Nhà riêng',
      isDefault: addresses.length === 0, // Nếu chưa có địa chỉ nào thì mặc định luôn
    });
    setErrorMsg('');
    setViewMode('form');
  };

  // Mở form chỉnh sửa
  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      city: addr.city || 'TP. Hồ Chí Minh',
      district: addr.district || '',
      ward: addr.ward || '',
      detail: addr.detail || '',
      label: addr.label || 'Nhà riêng',
      isDefault: !!addr.isDefault,
    });
    setErrorMsg('');
    setViewMode('form');
  };

  // Xóa địa chỉ
  const handleDeleteAddress = (idToDelete) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      const updated = addresses.filter((a) => (a._id || a.id) !== idToDelete);
      onSaveAddresses(updated);
      if (tempSelectedId === idToDelete) {
        setTempSelectedId(updated[0]?._id || updated[0]?.id || null);
      }
    }
  };

  // Đặt làm mặc định trực tiếp
  const handleSetDefault = (idToDefault) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: (a._id || a.id) === idToDefault,
    }));
    onSaveAddresses(updated);
  };

  // Lưu form (Thêm mới hoặc Cập nhật)
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.detail.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ chi tiết');
      return;
    }

    // Ghép địa chỉ đầy đủ
    const addressParts = [
      formData.detail.trim(),
      formData.ward.trim(),
      formData.district.trim(),
      formData.city.trim(),
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    let updatedList = [...addresses];

    if (editingAddress) {
      // Đang chỉnh sửa
      const editId = editingAddress._id || editingAddress.id;
      updatedList = updatedList.map((item) => {
        const itemId = item._id || item.id;
        if (itemId === editId) {
          return {
            ...item,
            ...formData,
            fullAddress,
          };
        }
        // Nếu đặt làm mặc định thì bỏ mặc định của các địa chỉ khác
        if (formData.isDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      });
      setTempSelectedId(editId);
    } else {
      // Đang thêm mới
      const newId = 'addr_' + Date.now();
      const newAddr = {
        _id: newId,
        id: newId,
        ...formData,
        fullAddress,
      };

      if (formData.isDefault || updatedList.length === 0) {
        newAddr.isDefault = true;
        updatedList = updatedList.map((item) => ({ ...item, isDefault: false }));
      }

      updatedList.push(newAddr);
      setTempSelectedId(newId);
    }

    onSaveAddresses(updatedList);
    setViewMode('list');
  };

  // Xác nhận chọn địa chỉ
  const handleConfirmSelect = () => {
    const selected = addresses.find((a) => (a._id || a.id) === tempSelectedId) || addresses[0];
    if (selected) {
      onSelectAddress(selected);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-[#10243A]">
              {viewMode === 'list' ? 'Địa Chỉ Nhận Hàng Của Tôi' : editingAddress ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách hoặc Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {viewMode === 'list' ? (
            <>
              {/* Nút dấu cộng (+) để thêm địa chỉ chuẩn Shopee */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="w-full py-3.5 px-4 border-2 border-dashed border-[#F97316] hover:bg-orange-50/60 text-[#F97316] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm hover:shadow"
              >
                <div className="w-6 h-6 rounded-full bg-[#F97316] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <span>Thêm Địa Chỉ Nhận Hàng Mới</span>
              </button>

              {/* Danh sách địa chỉ đã lưu */}
              {addresses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <MapPin className="w-12 h-12 mx-auto text-slate-200" />
                  <p className="text-sm font-semibold">Chưa có địa chỉ giao hàng nào được lưu</p>
                  <p className="text-xs">Bấm nút trên để thêm địa chỉ nhận hàng đầu tiên của bạn</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {addresses.map((addr) => {
                    const addrId = addr._id || addr.id;
                    const isChecked = tempSelectedId === addrId;

                    return (
                      <div
                        key={addrId}
                        onClick={() => setTempSelectedId(addrId)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3.5 ${
                          isChecked
                            ? 'border-[#F97316] bg-orange-50/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {/* Radio selector */}
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="addressSelector"
                            checked={isChecked}
                            onChange={() => setTempSelectedId(addrId)}
                            className="w-4 h-4 text-[#F97316] focus:ring-[#F97316] accent-[#F97316] cursor-pointer"
                          />
                        </div>

                        {/* Thông tin địa chỉ */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-600 font-medium">{addr.phone}</span>
                            
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold text-[#F97316] bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md">
                                Mặc định
                              </span>
                            )}

                            {addr.label && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                {addr.label === 'Văn phòng' ? (
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                ) : (
                                  <Home className="w-3 h-3 text-slate-500" />
                                )}
                                {addr.label}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed break-words">
                            {addr.fullAddress || `${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                          </p>

                          {/* Action links */}
                          <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(addr);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Sửa
                            </button>

                            {addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(addrId);
                                }}
                                className="text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            )}

                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(addrId);
                                }}
                                className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                              >
                                Đặt làm mặc định
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Form Thêm/Chỉnh sửa địa chỉ */
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Họ và tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    placeholder="TP. Hồ Chí Minh"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    placeholder="Quận / Huyện"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    placeholder="Phường / Xã"
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="VD: Số 123 Đường Nguyễn Trãi, Tòa nhà Landmark..."
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
                />
              </div>

              {/* Loại địa chỉ */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Loại địa chỉ</label>
                <div className="flex gap-3">
                  {['Nhà riêng', 'Văn phòng'].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFormData({ ...formData, label: type })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        formData.label === type
                          ? 'border-[#F97316] bg-orange-50 text-[#F97316]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'Nhà riêng' ? <Home className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Đặt làm mặc định */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F97316] focus:ring-[#F97316] accent-[#F97316]"
                />
                <span className="text-xs font-semibold text-slate-700">Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>

              {/* Nút hành động trong Form */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Trở lại danh sách
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {editingAddress ? 'Cập Nhật Địa Chỉ' : 'Hoàn Thành & Lưu'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Modal khi ở chế độ xem danh sách */}
        {viewMode === 'list' && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={addresses.length === 0}
              onClick={handleConfirmSelect}
              className="px-6 py-2.5 bg-[#10243A] hover:bg-[#F97316] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Xác Nhận Chọn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
