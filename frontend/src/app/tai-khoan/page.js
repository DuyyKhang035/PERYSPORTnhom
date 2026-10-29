'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Save, X,
  Lock, ShoppingBag, Store, LogOut, CheckCircle, AlertCircle, Loader2, Shield, Star, XCircle,
} from 'lucide-react';
import { ORDER_STATUSES, normalizeOrderStatus } from '@/lib/trang-thai-don-hang';

const GENDER_LABEL = { male: 'Nam', female: 'Nữ', other: 'Khác', '': 'Chưa cập nhật' };
const ORDER_STATUS = Object.fromEntries(ORDER_STATUSES.map(({ key, label }) => [key, label]));
const ORDER_TABS = ORDER_STATUSES.map(({ key }) => key);
const ROLE_LABEL = { user: 'Khách hàng', admin: 'Quản trị viên' };

const CARD = { backgroundColor: '#141921' };
const INPUT = { backgroundColor: '#0C0F14', border: '1px solid rgba(255,255,255,0.1)' };

function Avatar({ name, avatar, size = 96 }) {
  const initials = name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  if (avatar) {
    return <img src={avatar} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black"
      style={{ width: size, height: size, backgroundColor: '#D17842', fontSize: size / 3 }}
    >
      {initials}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} sao`}>
          <Star className="w-6 h-6" style={{ color: '#D17842', fill: n <= value ? '#D17842' : 'transparent' }} />
        </button>
      ))}
    </div>
  );
}

const formFromUser = (u) => ({
  fullName: u.fullName || '',
  phone: u.phone || '',
  address: u.address || '',
  dateOfBirth: u.dateOfBirth || '',
  gender: u.gender || '',
});

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('info'); // info | orders | password
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [form, setForm] = useState(formFromUser({}));

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');

  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderTab, setOrderTab] = useState('pending');
  const [reviewing, setReviewing] = useState(null); // { orderId, productId, productName }
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });

  // State cho việc Hủy đơn hàng
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('Muốn thay đổi địa chỉ nhận hàng');
  const [cancelReason, setCancelReason] = useState('Muốn thay đổi địa chỉ nhận hàng');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order);
    setSelectedReasonTemplate('Muốn thay đổi địa chỉ nhận hàng');
    setCancelReason('Muốn thay đổi địa chỉ nhận hàng');
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder || !cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn hàng', 'error');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch('/api/auth/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancellingOrder._id,
          reason: cancelReason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Hủy đơn hàng thành công! Đã chuyển sang mục Đã Hủy.');
        setOrders((prev) =>
          prev.map((ord) =>
            ord._id === cancellingOrder._id
              ? { ...ord, orderStatus: 'cancelled', cancelReason: cancelReason.trim() }
              : ord
          )
        );
        setCancellingOrder(null);
        setCancelReason('');
        setOrderTab('cancelled');
      } else {
        showToast(data.message || 'Hủy đơn hàng thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi hủy đơn hàng', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setForm(formFromUser(data.user));
        } else {
          router.push('/dang-nhap');
        }
      })
      .catch(() => router.push('/dang-nhap'))
      .finally(() => setLoading(false));
  }, [router]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const [oRes, rRes] = await Promise.all([fetch('/api/auth/orders'), fetch('/api/auth/reviews')]);
      const oData = await oRes.json();
      const rData = await rRes.json();
      if (oData.success) setOrders(oData.data);
      else if (oRes.status === 401 || oRes.status === 403) router.push('/dang-nhap');
      else showToast(oData.message || 'Không tải được đơn hàng', 'error');
      if (rData.success) setReviews(rData.data);
    } catch {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [router, showToast]);

  const openSection = (name) => {
    setSection(name);
    if (name === 'orders') loadOrders();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditing(false);
        showToast('Cập nhật thành công!');
      } else {
        showToast(data.message || 'Cập nhật thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Mật khẩu mới không khớp');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSection('info');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Đổi mật khẩu thành công!');
      } else {
        setPwError(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch {
      setPwError('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.rating) {
      showToast('Vui lòng chọn số sao', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: reviewing.orderId, productId: reviewing.productId, ...reviewForm }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => [...prev, data.data]);
        setReviewing(null);
        setReviewForm({ rating: 0, comment: '' });
        showToast(data.message || 'Đã gửi đánh giá');
      } else {
        showToast(data.message || 'Gửi đánh giá thất bại', 'error');
      }
    } catch {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const isReviewed = (orderId, productId) =>
    reviews.some((r) => String(r.order) === String(orderId) && String(r.product) === String(productId));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C0F14' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#D17842]" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { key: 'info', label: 'Cập nhật thông tin', icon: Edit3 },
    { key: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
    { key: 'password', label: 'Đổi mật khẩu', icon: Lock },
  ];
  const visibleOrders = orders.filter((o) => normalizeOrderStatus(o.orderStatus) === orderTab);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0C0F14' }}>
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/5" style={CARD}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-white text-base font-black tracking-tight">PERY SPORT · Trang cá nhân</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white"
            style={{ backgroundColor: '#D17842' }}
          >
            <Store className="w-4 h-4" /> Vào cửa hàng
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="rounded-2xl p-5 h-fit" style={CARD}>
          <div className="flex flex-col items-center text-center mb-5">
            <Avatar name={user.fullName || user.email} avatar={user.avatar} size={80} />
            <p className="text-white font-black mt-3">{user.fullName || 'Chưa cập nhật tên'}</p>
            <p className="text-xs mt-0.5 break-all" style={{ color: '#AEAEAE' }}>{user.email}</p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-2"
              style={{ backgroundColor: '#D1784220', color: '#D17842' }}
            >
              <Shield className="w-3 h-3" /> {ROLE_LABEL[user.role] || 'Khách hàng'}
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => openSection(key)}
                className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl text-left"
                style={{
                  backgroundColor: section === key ? '#D17842' : '#0C0F14',
                  color: section === key ? '#fff' : '#AEAEAE',
                }}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl text-left"
              style={{ backgroundColor: '#0C0F14', color: '#AEAEAE' }}
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {section === 'info' && (
            <div className="rounded-2xl p-6" style={CARD}>
              <h2 className="text-white font-bold text-sm mb-5">Thông tin cá nhân</h2>
              {!editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { icon: Mail, label: 'Email', value: user.email },
                    { icon: Phone, label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
                    { icon: MapPin, label: 'Địa chỉ giao hàng', value: user.address || 'Chưa cập nhật' },
                    { icon: Calendar, label: 'Ngày sinh', value: user.dateOfBirth || 'Chưa cập nhật' },
                    { icon: User, label: 'Giới tính', value: GENDER_LABEL[user.gender] || 'Chưa cập nhật' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#0C0F14' }}>
                        <Icon className="w-4 h-4" style={{ color: '#D17842' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase" style={{ color: '#AEAEAE' }}>{label}</p>
                        <p className="text-sm text-white mt-0.5 font-medium break-words">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {[
                    { field: 'fullName', label: 'Họ và tên', type: 'text', placeholder: 'Nhập họ và tên...' },
                    { field: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: 'Nhập số điện thoại...' },
                    { field: 'address', label: 'Địa chỉ giao hàng', type: 'text', placeholder: 'Nhập địa chỉ...' },
                    { field: 'dateOfBirth', label: 'Ngày sinh', type: 'date', placeholder: '' },
                  ].map(({ field, label, type, placeholder }) => (
                    <div key={field}>
                      <label className="text-[10px] font-semibold uppercase mb-1.5 block" style={{ color: '#AEAEAE' }}>{label}</label>
                      <input
                        type={type}
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none"
                        style={INPUT}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold uppercase mb-1.5 block" style={{ color: '#AEAEAE' }}>Giới tính</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none"
                      style={INPUT}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white"
                    style={{ backgroundColor: '#D17842' }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
                      style={{ backgroundColor: '#D17842' }}
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => { setForm(formFromUser(user)); setEditing(false); }}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#0C0F14', color: '#AEAEAE' }}
                    >
                      <X className="w-3.5 h-3.5" /> Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {section === 'password' && (
            <div className="rounded-2xl p-6 max-w-md" style={CARD}>
              <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: '#D17842' }} /> Đổi mật khẩu
              </h2>
              {pwError && (
                <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {pwError}
                </div>
              )}
              <div className="space-y-3 mb-4">
                {[
                  { key: 'currentPassword', label: 'Mật khẩu hiện tại', placeholder: '••••••••' },
                  { key: 'newPassword', label: 'Mật khẩu mới', placeholder: 'Tối thiểu 6 ký tự' },
                  { key: 'confirmPassword', label: 'Xác nhận mật khẩu mới', placeholder: '••••••••' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-semibold uppercase mb-1 block" style={{ color: '#AEAEAE' }}>{label}</label>
                    <input
                      type="password"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none"
                      style={INPUT}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
                  style={{ backgroundColor: '#D17842' }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Lưu mật khẩu
                </button>
                <button
                  onClick={() => { setSection('info'); setPwError(''); }}
                  className="text-xs font-bold px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#0C0F14', color: '#AEAEAE' }}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {section === 'orders' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-3 flex gap-2 overflow-x-auto" style={CARD}>
                {ORDER_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setOrderTab(t); setReviewing(null); }}
                    className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: orderTab === t ? '#D17842' : '#0C0F14',
                      color: orderTab === t ? '#fff' : '#AEAEAE',
                    }}
                  >
                    {ORDER_STATUS[t]}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-5" style={CARD}>
                {ordersLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#D17842]" />
                ) : visibleOrders.length === 0 ? (
                  <p className="text-xs" style={{ color: '#AEAEAE' }}>Không có đơn hàng nào.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleOrders.map((o) => (
                      <div key={o._id} className="rounded-xl p-4" style={{ backgroundColor: '#0C0F14' }}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm text-white font-bold">{o.orderCode}</p>
                            <p className="text-[11px]" style={{ color: '#AEAEAE' }}>
                              {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: '#D17842' }}>
                              {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                            </p>
                            <span
                              className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={
                                o.paymentStatus === 'paid'
                                  ? { backgroundColor: '#10B98120', color: '#10B981' }
                                  : { backgroundColor: '#EF444420', color: '#F87171' }
                              }
                            >
                              {o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {o.items.map((it) => {
                            const done = isReviewed(o._id, it.product);
                            return (
                              <div key={`${it.product}-${it.sku}`} className="flex items-center justify-between gap-3">
                                <p className="text-xs text-white min-w-0 truncate">
                                  {it.productName} <span style={{ color: '#AEAEAE' }}>· {it.color}/{it.size} · x{it.quantity}</span>
                                </p>
                                {o.orderStatus === 'completed' && (
                                  done ? (
                                    <span className="text-[11px] font-semibold shrink-0" style={{ color: '#AEAEAE' }}>Đã đánh giá</span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setReviewing({ orderId: o._id, productId: it.product, productName: it.productName });
                                        setReviewForm({ rating: 0, comment: '' });
                                      }}
                                      className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                                      style={{ backgroundColor: '#D17842' }}
                                    >
                                      Đánh giá
                                    </button>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Hiển thị lý do hủy nếu đơn đã hủy */}
                        {o.orderStatus === 'cancelled' && o.cancelReason && (
                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span><strong>Lý do hủy:</strong> {o.cancelReason}</span>
                          </div>
                        )}

                        {/* Nút Hủy Đơn Hàng đối với đơn hàng đang Chờ xác nhận */}
                        {normalizeOrderStatus(o.orderStatus) === 'pending' && (
                          <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-end">
                            <button
                              onClick={() => handleOpenCancelModal(o)}
                              className="text-xs font-bold px-3.5 py-1.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/15 hover:border-red-500 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Hủy Đơn Hàng
                            </button>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reviewing && (
                <div className="rounded-2xl p-5" style={CARD}>
                  <h3 className="text-white font-bold text-sm mb-3">Đánh giá: {reviewing.productName}</h3>
                  <StarPicker value={reviewForm.rating} onChange={(rating) => setReviewForm({ ...reviewForm, rating })} />
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    maxLength={1000}
                    rows={4}
                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    className="w-full mt-3 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none"
                    style={INPUT}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleReviewSubmit}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
                      style={{ backgroundColor: '#D17842' }}
                    >
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Gửi đánh giá
                    </button>
                    <button
                      onClick={() => setReviewing(null)}
                      className="text-xs font-bold px-4 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#0C0F14', color: '#AEAEAE' }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Hủy Đơn Hàng */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141921] border border-white/10 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Hủy Đơn Hàng: {cancellingOrder.orderCode}</span>
              </div>
              <button
                onClick={() => { setCancellingOrder(null); setCancelReason(''); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Vui lòng chọn hoặc nhập lý do bạn muốn hủy đơn hàng này:
            </p>

            {/* Danh sách lý do mẫu chuẩn Shopee */}
            <div className="space-y-2 mb-4">
              {[
                'Muốn thay đổi địa chỉ nhận hàng',
                'Muốn thay đổi sản phẩm (màu sắc, kích cỡ, số lượng...)',
                'Tìm thấy giá tốt hơn ở nơi khác',
                'Thay đổi ý định, không còn nhu cầu mua',
                'Lý do khác',
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReasonTemplate === r
                      ? 'border-[#D17842] bg-[#D17842]/10 text-white font-semibold'
                      : 'border-white/5 bg-[#0C0F14] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReasonTemplate"
                    checked={selectedReasonTemplate === r}
                    onChange={() => {
                      setSelectedReasonTemplate(r);
                      if (r !== 'Lý do khác') {
                        setCancelReason(r);
                      } else {
                        setCancelReason('');
                      }
                    }}
                    className="accent-[#D17842]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {/* Ô nhập chi tiết lý do */}
            <div className="mb-4">
              <label className="text-[11px] text-slate-400 block mb-1">
                Chi tiết lý do hủy <span className="text-red-400">*</span>:
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập chi tiết lý do hủy đơn của bạn..."
                className="w-full text-xs text-white rounded-xl p-3 bg-[#0C0F14] border border-white/10 focus:outline-none focus:border-[#D17842]"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setCancellingOrder(null); setCancelReason(''); }}
                className="flex-1 py-2.5 bg-[#0C0F14] hover:bg-white/5 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Không Hủy
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim() || isCancelling}
                onClick={handleConfirmCancelOrder}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Xác Nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
