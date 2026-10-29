import React from 'react';
import Link from 'next/link';
import Header from '@/components/cua-hang/bo-cuc/DauTrang';
import Footer from '@/components/cua-hang/bo-cuc/ChanTrang';
import HeroBanner from '@/components/cua-hang/trang-chu/BannerChinh';
import ProductCard from '@/components/cua-hang/san-pham/TheSanPham';
import CartDrawer from '@/components/cua-hang/gio-hang/NganKeGioHang';
import NewsletterForm from '@/components/cua-hang/trang-chu/FormDangKyNhanTin';
import CategoryShowcase from '@/components/cua-hang/trang-chu/TrungBayDanhMuc';
import BrandShowcase from '@/components/cua-hang/trang-chu/TrungBayThuongHieu';
import { fetchBackend } from '@/lib/api-may-chu';
import { formatDate } from '@/lib/tien-ich';
import { ArrowRight, Flame, Sparkles, ChevronRight, Tag } from 'lucide-react';

export const revalidate = 60; // SSR cache 60 seconds

async function getHomepageData() {
  const [bannerResponse, topSellingResponse, hotDealsResponse, brandResponse, categoryResponse, postResponse] = await Promise.all([
    fetchBackend('/api/banners?active=true'),
    fetchBackend('/api/products?sort=best-selling&limit=8'),
    fetchBackend('/api/products?hotDeal=true&sort=discount-desc&limit=8'),
    fetchBackend('/api/brands?active=true&homepage=true'),
    fetchBackend('/api/categories?active=true'),
    fetchBackend('/api/posts?status=published&limit=3'),
  ]);

  return {
    banners: bannerResponse.data || [],
    topSelling: topSellingResponse.data || [],
    hotDeals: hotDealsResponse.data || [],
    brands: brandResponse.data || [],
    categories: categoryResponse.data || [],
    posts: postResponse.data || [],
  };
}

export default async function HomePage() {
  const { banners, topSelling, hotDeals, brands, categories, posts } = await getHomepageData();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <CartDrawer />

      <main className="flex-1">
        {/* Hero Slider */}
        <HeroBanner initialBanners={banners} />

        {/* Categories Showcase — tabs + carousel */}
        <CategoryShowcase categories={categories} />

        {/* Hot Deals Section */}
        {hotDeals.length > 0 && (
          <section className="py-14 bg-gradient-to-b from-[#10243A] to-[#0A1828] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-white">Hot Deals</h2>
                <Link
                  href="/san-pham"
                  className="inline-flex items-center gap-1 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  Xem thêm <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {hotDeals.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Top Selling Products */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold text-[#F97316] uppercase tracking-widest block mb-1">
                  PERY SPORT
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-[#10243A]">Sản Phẩm Đang Hot</h2>
              </div>
              <Link
                href="/san-pham?sort=best-selling"
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-[#10243A] hover:text-white text-slate-800 text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
              >
                Xem tất cả bán chạy <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {topSelling.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Brands Showcase — tabs + sản phẩm theo thương hiệu */}
        <BrandShowcase brands={brands} />

        {/* Latest Articles */}
        {posts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-[#10243A]">Tin Tức & Kính Nghiệm</h2>
                  <p className="text-xs text-slate-500 mt-1">Cập nhật xu hướng và bí quyết chọn giày chuẩn</p>
                </div>
                <Link href="/tin-tuc" className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1">
                  Tất cả bài viết <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <article key={post._id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all">
                    <Link href={`/tin-tuc/${post.slug}`} className="block aspect-16/9 bg-slate-100 overflow-hidden">
                      <img
                        src={post.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-2">
                          {formatDate(post.createdAt)}
                        </span>
                        <Link href={`/tin-tuc/${post.slug}`}>
                          <h3 className="text-base font-bold text-[#10243A] group-hover:text-[#F97316] transition-colors line-clamp-2 leading-snug mb-2">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {post.summary}
                        </p>
                      </div>
                      <Link href={`/tin-tuc/${post.slug}`} className="text-xs font-extrabold text-[#F97316] hover:underline inline-flex items-center gap-1">
                        Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter Section */}
        <section className="bg-[#10243A] text-white py-14">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
            <span className="bg-slate-800 text-[#F97316] text-xs font-bold px-3 py-1 rounded-full inline-block">
              ĐĂNG KÝ NHẬN TIN PROMO
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Nhận Ngay Voucher Giảm 100K Cho Đầu Tiên</h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto">
              Đăng ký email để không bỏ lỡ các đợt Hot Deals và bộ sưu tập giày thể thao mới nhất từ PERY SPORT.
            </p>

            <NewsletterForm />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
