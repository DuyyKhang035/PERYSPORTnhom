import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { getAdminSession } from '@/lib/auth';
import { generateOrderCode, calculateDiscount } from '@/lib/utils';

export async function GET(req) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status === 'ready_to_ship'
        ? { $in: ['ready_to_ship', 'confirmed'] }
        : status;
    }

    if (paymentStatus === 'paid') {
      filter.paymentStatus = 'paid';
    } else if (paymentStatus === 'unpaid') {
      filter.paymentStatus = { $ne: 'paid' };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderCode: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex },
      ];
    }

    const total = await Order.countDocuments(filter);
    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { customerName, customerPhone, customerEmail, shippingAddress, note, paymentMethod, items } = body;

    if (!customerName || !customerPhone || !customerEmail || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng và sản phẩm' }, { status: 400 });
    }

    const now = new Date();
    const orderItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    const reservedItems = [];

    // Step 1: Validate stock & reserve atomically
    for (const item of items) {
      const product = await Product.findById(item.productId).populate('promotion');
      if (!product || !product.isActive) {
        // Rollback previous reserved stock if any
        for (const res of reservedItems) {
          await Product.updateOne(
            { _id: res.productId, 'variants.sku': res.sku },
            { $inc: { 'variants.$.stock': res.quantity, soldCount: -res.quantity } }
          );
        }
        return NextResponse.json({ success: false, message: `Sản phẩm "${item.productName || 'này'}" đã ngưng kinh doanh` }, { status: 400 });
      }

      const variant = product.variants.find(
        (v) => v.color === item.color && v.size === String(item.size)
      );

      if (!variant) {
        for (const res of reservedItems) {
          await Product.updateOne(
            { _id: res.productId, 'variants.sku': res.sku },
            { $inc: { 'variants.$.stock': res.quantity, soldCount: -res.quantity } }
          );
        }
        return NextResponse.json({ success: false, message: `Phiên bản (${item.color} - Size ${item.size}) của ${product.name} không tồn tại` }, { status: 400 });
      }

      // Atomic stock check and update
      const stockRes = await Product.updateOne(
        {
          _id: product._id,
          'variants.sku': variant.sku,
          'variants.stock': { $gte: item.quantity },
        },
        {
          $inc: { 'variants.$.stock': -item.quantity, soldCount: item.quantity },
        }
      );

      if (stockRes.modifiedCount === 0) {
        // Rollback previous reserved items
        for (const res of reservedItems) {
          await Product.updateOne(
            { _id: res.productId, 'variants.sku': res.sku },
            { $inc: { 'variants.$.stock': res.quantity, soldCount: -res.quantity } }
          );
        }
        return NextResponse.json({
          success: false,
          message: `Sản phẩm "${product.name}" (${variant.color} - Size ${variant.size}) đã hết hàng hoặc không đủ tồn kho!`,
        }, { status: 400 });
      }

      reservedItems.push({
        productId: product._id,
        sku: variant.sku,
        quantity: item.quantity,
      });

      const originalUnitPrice = variant.price || product.originalPrice;
      let unitPrice = variant.price || product.salePrice || product.originalPrice;
      let promotionName = '';

      if (product.promotion && product.promotion.isActive) {
        const start = new Date(product.promotion.startDate);
        const end = new Date(product.promotion.endDate);
        if (start <= now && now <= end) {
          const calc = calculateDiscount(originalUnitPrice, product.promotion);
          unitPrice = calc.finalPrice;
          promotionName = product.promotion.name;
        }
      }

      const itemTotalPrice = unitPrice * item.quantity;
      subtotal += originalUnitPrice * item.quantity;
      totalDiscount += (originalUnitPrice - unitPrice) * item.quantity;

      orderItems.push({
        product: product._id,
        productName: product.name,
        sku: variant.sku,
        color: variant.color,
        size: String(variant.size),
        image: variant.image || product.images[0] || '',
        unitPrice: unitPrice,
        originalUnitPrice: originalUnitPrice,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
        promotionName: promotionName,
      });
    }

    // Tạo mã đơn hàng gồm: Tên sản phẩm + Số thứ tự đặt hàng + Ngày tháng đặt hàng
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });
    let sequence = todayOrdersCount + 1;
    const mainProductName = orderItems[0]?.productName || 'PERY';
    let orderCode = generateOrderCode(mainProductName, sequence, now);

    // Đảm bảo mã đơn hàng là duy nhất
    let exists = await Order.findOne({ orderCode });
    while (exists) {
      sequence += 1;
      orderCode = generateOrderCode(mainProductName, sequence, now);
      exists = await Order.findOne({ orderCode });
    }
    const shippingFee = 0;
    const totalAmount = subtotal - totalDiscount + shippingFee;

    const order = await Order.create({
      orderCode,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      note: note || '',
      items: orderItems,
      subtotal,
      discountAmount: totalDiscount,
      shippingFee,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      soldCountUpdated: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order,
    }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi khi tạo đơn hàng' }, { status: 500 });
  }
}
