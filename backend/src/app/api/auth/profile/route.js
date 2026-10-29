import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/co-so-du-lieu';
import User from '@/lib/models/NguoiDung';
import bcrypt from 'bcryptjs';
import { getUserSession } from '@/lib/xac-thuc';

// GET /api/auth/profile — lấy profile user hiện tại
export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PUT /api/auth/profile — cập nhật thông tin profile
export async function PUT(req) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    // Chỉ cho phép cập nhật các trường an toàn — không cho đổi role, email, password ở đây
    const allowedFields = ['fullName', 'phone', 'dateOfBirth', 'gender', 'address', 'avatar', 'addresses'];
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Đồng bộ địa chỉ mặc định nếu có mảng addresses
    if (Array.isArray(body.addresses) && body.addresses.length > 0) {
      const defaultAddr = body.addresses.find((a) => a.isDefault) || body.addresses[0];
      if (defaultAddr && defaultAddr.fullAddress) {
        updateData.address = defaultAddr.fullAddress;
      }
    }

    // Đổi mật khẩu riêng — cần currentPassword
    if (body.newPassword) {
      const user = await User.findById(session.id);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Tài khoản không tồn tại' }, { status: 404 });
      }
      if (!body.currentPassword) {
        return NextResponse.json(
          { success: false, message: 'Vui lòng nhập mật khẩu hiện tại' },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(body.currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: 'Mật khẩu hiện tại không đúng' },
          { status: 400 }
        );
      }
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await User.findByIdAndUpdate(
      session.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}
