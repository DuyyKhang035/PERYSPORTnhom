import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getAdminSession } from '@/lib/auth';

const ORDER_STATUSES = ['pending', 'ready_to_ship', 'shipping', 'delivered', 'completed', 'cancelled'];
const NEXT_ORDER_STATUSES = {
  pending: ['ready_to_ship', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  ready_to_ship: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

export async function GET(req, { params }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    if (body.orderStatus && !ORDER_STATUSES.includes(body.orderStatus)) {
      return NextResponse.json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' }, { status: 400 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Check if status changes to 'cancelled'
    if (body.orderStatus === 'cancelled' && order.orderStatus !== 'cancelled' && !order.stockRestored) {
      // Restore stock and decrement soldCount
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
    } else if (body.orderStatus && body.orderStatus !== 'cancelled' && order.orderStatus === 'cancelled' && order.stockRestored) {
      // Re-deduct stock and increment soldCount if un-cancelled
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants.sku': item.sku },
          {
            $inc: {
              'variants.$.stock': -item.quantity,
              soldCount: item.quantity,
            },
          }
        );
      }
      order.stockRestored = false;
      order.cancelReason = '';
    }

    if (body.orderStatus) order.orderStatus = body.orderStatus;
    if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
    if (body.note !== undefined) order.note = body.note;

    // Đơn đã thanh toán trước (không phải COD) khi giao xong thì tự hoàn tất
    const isPrepaid = order.paymentMethod !== 'COD' || order.paymentStatus === 'paid';
    if (order.orderStatus === 'delivered' && isPrepaid) {
      order.orderStatus = 'completed';
    }

    await order.save();
    return NextResponse.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi khi cập nhật đơn hàng' }, { status: 500 });
  }
}
