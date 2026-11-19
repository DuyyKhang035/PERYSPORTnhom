export const ORDER_STATUSES = [
  { key: 'pending', label: 'Chờ Xác Nhận', badgeClass: 'bg-amber-100 text-amber-800' },
  { key: 'ready_to_ship', label: 'Chờ Lấy Hàng', badgeClass: 'bg-blue-100 text-blue-800' },
  { key: 'shipping', label: 'Đang Vận Chuyển', badgeClass: 'bg-orange-100 text-orange-800' },
  { key: 'delivered', label: 'Đã Giao', badgeClass: 'bg-teal-100 text-teal-800' },
  { key: 'completed', label: 'Hoàn Tất', badgeClass: 'bg-emerald-100 text-emerald-800' },
  { key: 'cancelled', label: 'Đã Hủy', badgeClass: 'bg-red-100 text-red-800' },
];

export function normalizeOrderStatus(status) {
  return status === 'confirmed' ? 'ready_to_ship' : status;
}

export function getNextOrderStatusKeys(status) {
  const currentStatus = normalizeOrderStatus(status);
  const nextStatuses = {
    pending: ['ready_to_ship', 'cancelled'],
    ready_to_ship: ['shipping', 'cancelled'],
    shipping: ['delivered', 'cancelled'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
  };

  return nextStatuses[currentStatus] || [];
}

export function getOrderStatus(status) {
  const key = normalizeOrderStatus(status);
  return ORDER_STATUSES.find((item) => item.key === key);
}
