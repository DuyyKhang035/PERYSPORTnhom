'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Clock, Truck, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { formatVND, formatDateTime } from '@/lib/tien-ich';
import { ORDER_STATUSES, getNextOrderStatusKeys, getOrderStatus, normalizeOrderStatus } from '@/lib/trang-thai-don-hang';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, search, page]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data);
        }
        fetchOrders();
        showToast('Cập nhật trạng thái đơn hàng thành công');
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        fetchOrders();
        showToast('Cập nhật trạng thái thanh toán thành công');
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Lỗi khi cập nhật trạng thái thanh toán');
    }
  };

  const getStatusBadge = (status) => {
    const orderStatus = getOrderStatus(status);
    if (!orderStatus) return status;

    return (
      <span className={`${orderStatus.badgeClass} text-[10px] font-bold px-2.5 py-1 rounded-full`}>
        {orderStatus.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10243A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Search — căn giữa, trên tiêu đề */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 w-full max-w-md bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Tên KH, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-black text-[#10243A]">Quản Lý Đơn Hàng</h1>
        <p className="text-xs text-slate-500 mt-1">Danh sách đơn hàng, cập nhật tiến độ giao hàng và tra cứu snapshot</p>
      </div>

      {/* Filter row: Trạng thái đơn + Trạng thái thanh toán */}
      <div className="flex flex-col lg:flex-row gap-3 text-xs">

        {/* Trạng thái đơn hàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-2 flex-wrap overflow-x-auto flex-1">
          <span className="font-bold text-slate-500 shrink-0">Trạng thái đơn:</span>
          {['all', ...ORDER_STATUSES.map(({ key }) => key)].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-[#10243A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Tất cả' : getOrderStatus(st).label}
            </button>
          ))}
        </div>

        {/* Trạng thái thanh toán */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-2 flex-wrap shrink-0">
          <span className="font-bold text-slate-500 shrink-0">Thanh toán:</span>
          {['all', 'paid', 'unpaid'].map((pt) => (
            <button
              key={pt}
              onClick={() => { setPaymentFilter(pt); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 ${
                paymentFilter === pt
                  ? pt === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : pt === 'unpaid'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#10243A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {{ all: 'Tất cả', paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán' }[pt]}
            </button>
          ))}
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">Đang tải đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Chưa có đơn hàng nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="p-4">Ngày Đặt</th>
                  <th className="p-4">Mã Đơn</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Số Điện Thoại</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Phương Thức</th>
                  <th className="p-4">Thanh Toán</th>
                  <th className="p-4">Trạng Thái Đơn</th>
                  <th className="p-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-400">{formatDateTime(o.createdAt)}</td>
                    <td className="p-4 font-mono font-bold text-[#10243A]">{o.orderCode}</td>
                    <td className="p-4 font-bold text-slate-800">{o.customerName}</td>
                    <td className="p-4 font-mono text-slate-600">{o.customerPhone}</td>
                    <td className="p-4 font-extrabold text-[#F97316]">{formatVND(o.totalAmount)}</td>
                    <td className="p-4 text-slate-600 font-bold">{o.paymentMethod}</td>
                    <td className="p-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        o.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(o.orderStatus)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-2 text-[#10243A] hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1 text-[11px] ml-auto"
                      >
                        <Eye className="w-4 h-4" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Chi Tiết Đơn Hàng</span>
                <h3 className="text-lg font-black text-[#10243A] font-mono">{selectedOrder.orderCode}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Updater */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Cập Nhật Trạng Thái Đơn Hàng:</label>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((st) => {
                  const isCurrent = normalizeOrderStatus(selectedOrder.orderStatus) === st.key;
                  const canAdvance = getNextOrderStatusKeys(selectedOrder.orderStatus).includes(st.key);

                  return (
                    <button
                      key={st.key}
                      onClick={() => handleUpdateStatus(selectedOrder._id, st.key)}
                      disabled={!canAdvance}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                        isCurrent
                          ? 'bg-[#10243A] text-white border-[#10243A]'
                          : canAdvance
                          ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                          : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Trạng Thái Thanh Toán:</label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'pending', label: 'Chưa Thanh Toán', activeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
                  { key: 'paid', label: 'Đã Thanh Toán', activeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                ].map((status) => {
                  const isCurrent = selectedOrder.paymentStatus === status.key;

                  return (
                    <button
                      key={status.key}
                      onClick={() => handleUpdatePaymentStatus(selectedOrder._id, status.key)}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                        isCurrent
                          ? status.activeClass
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      } ${isCurrent ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {status.label}
                    </button>
                  );
                })}
                {!['pending', 'paid'].includes(selectedOrder.paymentStatus) && (
                  <span className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600">
                    {selectedOrder.paymentStatus === 'refunded' ? 'Đã Hoàn Tiền' : 'Thanh Toán Thất Bại'}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 mb-1">Thông Tin Khách Hàng:</p>
                <p>Họ tên: <strong>{selectedOrder.customerName}</strong></p>
                <p>SĐT: <strong>{selectedOrder.customerPhone}</strong></p>
                <p>Email: {selectedOrder.customerEmail}</p>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">Địa Chỉ Nhận Hàng:</p>
                <p>{selectedOrder.shippingAddress}</p>
                <p className="mt-1">Ghi chú: <em>{selectedOrder.note || 'Không có'}</em></p>
              </div>
            </div>

            {/* Hiển thị lý do hủy đơn nếu có */}
            {selectedOrder.cancelReason && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-xs text-red-700">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-red-800">
                  <XCircle className="w-4 h-4 text-red-600" /> Lý do hủy đơn hàng:
                </p>
                <p className="bg-white/80 p-2.5 rounded-xl border border-red-100 font-medium text-red-900">
                  {selectedOrder.cancelReason}
                </p>
              </div>
            )}

            {/* Order items snapshot */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Sản Phẩm Đã Đặt:</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <div>
                        <span className="font-bold text-[#10243A] block">{item.productName}</span>
                        <span className="text-slate-500 text-[11px]">Màu: {item.color} | Size: {item.size} | SKU: {item.sku} x{item.quantity}</span>
                      </div>
                    </div>
                    <strong className="text-[#10243A] font-extrabold">{formatVND(item.totalPrice)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-800">Tổng Tiền Đơn Hàng:</span>
              <span className="text-xl font-black text-[#F97316]">{formatVND(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
