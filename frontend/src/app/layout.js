import './globals.css';
import { CartProvider } from '@/lib/cart-context';

export const metadata = {
  title: 'PERY SPORT | Giày Thể Thao Nam Cao Cấp',
  description: 'Thương hiệu PERY SPORT chuyên bán lẻ giày thể thao nam chính hãng: giày chạy bộ, tập gym, đi bộ, bóng rổ, sneaker thời trang. Đặt hàng online, miễn phí giao hàng.',
  keywords: 'giày thể thao nam, pery sport, giày chạy bộ nam, giày tập gym, sneaker nam',
  openGraph: {
    title: 'PERY SPORT | Giày Thể Thao Nam Cao Cấp',
    description: 'Thương hiệu PERY SPORT chuyên bán lẻ giày thể thao nam chính hãng. Giao hàng toàn quốc, đổi trả 30 ngày.',
    url: 'https://perysport.vn',
    siteName: 'PERY SPORT',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col bg-white text-slate-900 selection:bg-[#F97316] selection:text-white">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
