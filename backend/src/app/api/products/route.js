import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/co-so-du-lieu';
import Product from '@/lib/models/SanPham';
import Brand from '@/lib/models/ThuongHieu';
import Category from '@/lib/models/DanhMuc';
import Promotion from '@/lib/models/KhuyenMai';
import { getAdminSession } from '@/lib/xac-thuc';
import { slugify, calculateDiscount } from '@/lib/tien-ich';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const brandParam = searchParams.get('brand');
    const categoryParam = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const color = searchParams.get('color');
    const size = searchParams.get('size');
    const inStock = searchParams.get('inStock');
    const hotDeal = searchParams.get('hotDeal');
    const featured = searchParams.get('featured');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const sortParam = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const filter = {};
    if (activeOnly) {
      filter.isActive = true;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (brandParam) {
      if (brandParam.match(/^[0-9a-fA-F]{24}$/)) {
        filter.brand = brandParam;
      } else {
        const foundBrand = await Brand.findOne({ slug: brandParam });
        if (foundBrand) {
          filter.brand = foundBrand._id;
        } else {
          // Slug not found → return empty result set
          return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
        }
      }
    }

    if (categoryParam) {
      if (categoryParam.match(/^[0-9a-fA-F]{24}$/)) {
        filter.categories = categoryParam;
      } else {
        const foundCat = await Category.findOne({ slug: categoryParam });
        if (foundCat) {
          filter.categories = foundCat._id;
        } else {
          // Slug not found → return empty result set
          return NextResponse.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
        }
      }
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { 'variants.sku': regex },
      ];
    }

    if (color) {
      filter['variants.color'] = color;
    }

    if (size) {
      filter['variants.size'] = size;
    }

    if (inStock === 'true') {
      filter['variants.stock'] = { $gt: 0 };
    }

    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.salePrice.$lte = parseFloat(maxPrice);
    }

    if (hotDeal === 'true') {
      const now = new Date();
      const activePromos = await Promotion.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      const promoIds = activePromos.map(p => p._id);
      filter.promotion = { $in: promoIds };
    }

    // Sort definition
    let sortObj = { createdAt: -1 };
    if (sortParam === 'price-asc')     sortObj = { salePrice: 1 };
    else if (sortParam === 'price-desc')  sortObj = { salePrice: -1 };
    else if (sortParam === 'best-selling') sortObj = { soldCount: -1 };
    else if (sortParam === 'featured')    sortObj = { isFeatured: -1, createdAt: -1 };
    // discount-desc: sắp xếp sau khi tính % (xử lý phía dưới)

    const total = await Product.countDocuments(filter);
    const skip = (page - 1) * limit;
    const sortByDiscount = hotDeal === 'true' || sortParam === 'discount-desc';

    let productsQuery = Product.find(filter)
      .populate('brand', 'name slug logo')
      .populate('categories', 'name slug')
      .populate('promotion')
      .sort(sortObj)
      .lean();

    if (!sortByDiscount) {
      productsQuery = productsQuery.skip(skip).limit(limit);
    }

    const rawProducts = await productsQuery;

    // Process price and hot deal calculation for each product
    const now = new Date();
    const products = rawProducts.map((p) => {
      let finalPrice = p.salePrice || p.originalPrice;
      let discountPercentage = 0;
      let isPromoActive = false;

      if (p.promotion && p.promotion.isActive) {
        const start = new Date(p.promotion.startDate);
        const end = new Date(p.promotion.endDate);
        if (start <= now && now <= end) {
          isPromoActive = true;
          const calc = calculateDiscount(p.originalPrice, p.promotion);
          finalPrice = calc.finalPrice;
          discountPercentage = calc.percentage;
        }
      }

      if (!isPromoActive && p.originalPrice > p.salePrice && p.salePrice > 0) {
        discountPercentage = Math.round(((p.originalPrice - p.salePrice) / p.originalPrice) * 100);
        finalPrice = p.salePrice;
      }

      const totalStock = p.variants ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;

      return {
        ...p,
        finalPrice,
        discountPercentage,
        isPromoActive,
        totalStock,
      };
    });

    // Nếu là hotDeal hoặc sort=discount-desc: sắp xếp lại theo % giảm giá từ CAO xuống THẤP
    if (sortByDiscount) {
      products.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }
    const paginatedProducts = sortByDiscount ? products.slice(skip, skip + limit) : products;

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.brand || !body.originalPrice) {
      return NextResponse.json({ success: false, message: 'Vui lòng điền đầy đủ Tên, Thương hiệu và Giá gốc' }, { status: 400 });
    }

    const slug = body.slug ? slugify(body.slug) : slugify(body.name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Slug sản phẩm đã tồn tại' }, { status: 400 });
    }

    const salePrice = body.salePrice || body.originalPrice;

    const product = await Product.create({
      name: body.name,
      slug,
      brand: body.brand,
      categories: body.categories || [],
      description: body.description || '',
      images: body.images || [],
      variants: body.variants || [],
      originalPrice: body.originalPrice,
      salePrice: salePrice,
      promotion: body.promotion || null,
      soldCount: body.soldCount || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isFeatured: body.isFeatured || false,
      seoTitle: body.seoTitle || '',
      seoDescription: body.seoDescription || '',
    });

    return NextResponse.json({ success: true, message: 'Tạo sản phẩm thành công', data: product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ khi tạo sản phẩm' }, { status: 500 });
  }
}
