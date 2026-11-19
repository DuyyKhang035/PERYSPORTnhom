'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatVND, formatDateTime } from '@/lib/utils';
import { ORDER_STATUSES, getOrderStatus, normalizeOrderStatus, getNextOrderStatusKeys } from '@/lib/order-status';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempStatus, setTempStatus] = useState('');
  const [tempPayment, setTempPayment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setTempStatus(normalizeOrderStatus(order.orderStatus));
    setTempPayment(order.paymentStatus || 'pending');
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadOrders() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', '15');

        const res = await fetch(`/api/orders?${params.toString()}`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          setOrders(data.data);
          setPagination(data.pagination);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, paymentFilter, search, page, reloadKey]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: tempStatus,
          paymentStatus: tempPayment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
        setTempStatus(normalizeOrderStatus(data.data.orderStatus));
        setTempPayment(data.data.paymentStatus || 'pending');
        setReloadKey((k) => k + 1);
        showToast('Cập nhật đơn hàng thành công');
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (e) {
      alert('Lỗi khi cập nhật đơn hàng');
    } finally {
      setUpdating(false);
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
              onClick={() => { setStatusFilter(st); setPage(1); setLoading(true); }}
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
              onClick={() => { setPaymentFilter(pt); setPage(1); setLoading(true); }}
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
                  <th className="p-4">Sản Phẩm Đã Đặt</th>
                  <th className="p-4">Khách Hàng</th>
                  <th className="p-4">Tổng Tiền</th>
                  <th className="p-4">Thanh Toán</th>
                  <th className="p-4">Trạng Thái Đơn</th>
                  <th className="p-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    <td className="p-4 font-mono font-bold text-[#10243A] whitespace-nowrap">{o.orderCode}</td>
                    <td className="p-4 min-w-[200px] max-w-xs">
                      <div className="space-y-1.5">
                        {o.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.productName}
                                className="w-8 h-8 object-cover rounded-md border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-slate-100 rounded-md border border-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                PS
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#10243A] text-xs truncate" title={it.productName}>
                                {it.productName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {it.color} | Size {it.size} · <strong className="text-slate-800">x{it.quantity}</strong>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      <div>{o.customerName}</div>
                      <div className="font-mono text-slate-500 font-normal text-[11px]">{o.customerPhone}</div>
                    </td>
                    <td className="p-4 font-extrabold text-[#F97316] whitespace-nowrap">{formatVND(o.totalAmount)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        o.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">{getStatusBadge(o.orderStatus)}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOrderDetail(o)}
                        className="p-2 text-[#10243A] hover:bg-slate-100 rounded-lg font-bold flex items-center gap-1 text-[11px] ml-auto cursor-pointer"
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

            {/* Quick Status Updater: chỉ hiển thị trạng thái tiếp tục, ẩn các trạng thái đã qua */}
            {(() => {
              const currentStatus = normalizeOrderStatus(selectedOrder.orderStatus);
              const currentStatusObj = getOrderStatus(currentStatus);
              const nextStatusKeys = getNextOrderStatusKeys(currentStatus);
              const nextStatuses = nextStatusKeys.map((key) => getOrderStatus(key)).filter(Boolean);

              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="font-bold text-slate-800 text-xs">Cập Nhật Trạng Thái Đơn Hàng:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Trạng thái hiện tại:</span>
                      <span className={`${currentStatusObj?.badgeClass} px-3 py-1 rounded-full font-bold text-xs shadow-2xs`}>
                        {currentStatusObj?.label}
                      </span>
                    </div>
                  </div>

                  {nextStatuses.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] text-slate-500 font-semibold block">Trạng thái tiếp tục:</span>
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((st) => {
                          const isSelected = tempStatus === st.key;

                          return (
                            <button
                              key={st.key}
                              type="button"
                              onClick={() => setTempStatus(isSelected ? currentStatus : st.key)}
                              className={`px-4 py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#10243A] text-white border-[#10243A] shadow-md ring-2 ring-[#10243A]/20'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              <span>{st.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                      {currentStatus === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Đơn hàng đã hoàn tất thành công. Không còn trạng thái tiếp tục.</span>
                        </>
                      ) : currentStatus === 'cancelled' ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Đơn hàng đã bị hủy. Không thể chuyển trạng thái tiếp tục.</span>
                        </>
                      ) : (
                        <span>Không còn trạng thái tiếp tục.</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Trạng Thái Thanh Toán:</label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'pending', label: 'Chưa Thanh Toán', activeClass: 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30' },
                  { key: 'paid', label: 'Đã Thanh Toán', activeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-2 ring-emerald-400/30' },
                ].map((status) => {
                  const isSelected = tempPayment === status.key;

                  return (
                    <button
                      key={status.key}
                      type="button"
                      onClick={() => setTempPayment(status.key)}
                      className={`px-3.5 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? `${status.activeClass} shadow-xs font-black`
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {status.label}
                    </button>
                  );
                })}
                {!['pending', 'paid'].includes(tempPayment) && (
                  <span className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600">
                    {tempPayment === 'refunded' ? 'Đã Hoàn Tiền' : 'Thanh Toán Thất Bại'}
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

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-800 text-sm">Tổng Tiền Đơn Hàng:</span>
                <span className="text-xl font-black text-[#F97316]">{formatVND(selectedOrder.totalAmount)}</span>
              </div>

              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveOrder}
                  className="px-6 py-2.5 rounded-xl bg-[#10243A] hover:bg-[#F97316] text-white font-bold text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Cập Nhật...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Cập Nhật</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
