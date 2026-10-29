import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/co-so-du-lieu';
import Order from '@/lib/models/DonHang';
import User from '@/lib/models/NguoiDung';
import Product from '@/lib/models/SanPham';
import { getUserSession } from '@/lib/xac-thuc';

// GET /api/auth/orders — lịch sử đơn hàng của chính user đang đăng nhập
export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.id).select('email isActive').lean();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Tài khoản không hợp lệ' }, { status: 403 });
    }

    const orders = await Order.find({ customerEmail: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      .select('orderCode totalAmount orderStatus paymentStatus createdAt items cancelReason')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('User orders error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PUT /api/auth/orders — Hủy đơn hàng đang chờ xác nhận
export async function PUT(req) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.id).select('email isActive').lean();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Tài khoản không hợp lệ' }, { status: 403 });
    }

    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp lý do hủy đơn hàng' }, { status: 400 });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerEmail: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Chỉ cho phép hủy khi đơn ở trạng thái 'pending' (Chờ xác nhận)
    if (order.orderStatus !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ Xác Nhận' },
        { status: 400 }
      );
    }

    // Hoàn trả số lượng tồn kho và giảm soldCount an toàn
    if (!order.stockRestored) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants.sku': item.sku },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              soldCount: -item.quantity,
            },
          }
        );
      }
      order.stockRestored = true;
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason.trim();
    order.cancelledAt = new Date();

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi hủy đơn hàng' }, { status: 500 });
  }
}
