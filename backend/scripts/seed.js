require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pery_sport';

const AdminSchema = new mongoose.Schema({ username: String, password: String, name: String, email: String, role: String }, { timestamps: true });
const BrandSchema = new mongoose.Schema({ name: String, slug: String, logo: String, description: String, isActive: Boolean, showOnHomepage: Boolean, displayOrder: Number }, { timestamps: true });
const CategorySchema = new mongoose.Schema({ name: String, slug: String, description: String, image: String, isActive: Boolean, displayOrder: Number }, { timestamps: true });
const PromotionSchema = new mongoose.Schema({ name: String, type: String, value: Number, startDate: Date, endDate: Date, applicableProducts: [mongoose.Schema.Types.ObjectId], isActive: Boolean }, { timestamps: true });
const BannerSchema = new mongoose.Schema({ title: String, description: String, desktopImage: String, mobileImage: String, ctaText: String, ctaLink: String, displayOrder: Number, isActive: Boolean }, { timestamps: true });
const PostSchema = new mongoose.Schema({ title: String, slug: String, summary: String, content: String, image: String, status: String, seoTitle: String, seoDescription: String }, { timestamps: true });

const VariantSchema = new mongoose.Schema({
  color: String,
  colorCode: String,
  size: String,
  sku: String,
  price: Number,
  originalPrice: Number,
  stock: Number,
  image: String,
});

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  description: String,
  images: [String],
  variants: [VariantSchema],
  originalPrice: Number,
  salePrice: Number,
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  soldCount: Number,
  isActive: Boolean,
  isFeatured: Boolean,
  seoTitle: String,
  seoDescription: String,
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function seed() {
  let mongod = null;
  try {
    console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
    
    // Connect with 3 second timeout
    try {
      await mongoose.connect(MONGODB_URI, { dbName: 'pery_sport', serverSelectionTimeoutMS: 3000 });
      console.log('Connected to target MongoDB instance!');
    } catch (connErr) {
      console.log('Local/Target MongoDB not available on port 27017. Starting MongoDB Memory Server...');
      mongod = await MongoMemoryServer.create({ instance: { dbName: 'pery_sport' } });
      const uri = mongod.getUri();
      console.log('MongoDB Memory Server running at:', uri);
      await mongoose.connect(uri);
    }

    // Clear existing collections
    await Admin.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Promotion.deleteMany({});
    await Product.deleteMany({});
    await Banner.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing database data.');

    // 1. Seed Admin User
    const hashedPassword = await bcrypt.hash('123', 10);
    await Admin.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Quản trị viên Pery Sport',
      email: 'admin@perysport.vn',
      role: 'superadmin',
    });
    console.log('✔ Created Admin account: admin / 123');

    // 2. Seed Brands
    const brandsData = [
      { name: 'Pery Sport', slug: 'pery-sport', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', description: 'Thương hiệu thể thao nam cao cấp PERY SPORT Việt Nam', isActive: true, showOnHomepage: true, displayOrder: 1 },
      { name: 'Nike', slug: 'nike', logo: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80', description: 'Thương hiệu thể thao toàn cầu', isActive: true, showOnHomepage: true, displayOrder: 2 },
      { name: 'Adidas', slug: 'adidas', logo: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&q=80', description: 'Đỉnh cao phong cách thể thao Đức', isActive: true, showOnHomepage: true, displayOrder: 3 },
      { name: 'Puma', slug: 'puma', logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80', description: 'Tốc độ và sự bứt phá quyến rũ', isActive: true, showOnHomepage: true, displayOrder: 4 },
      { name: 'New Balance', slug: 'new-balance', logo: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&q=80', description: 'Sự êm ái hoàn hảo cho từng bước chân', isActive: true, showOnHomepage: true, displayOrder: 5 },
    ];
    const createdBrands = await Brand.insertMany(brandsData);
    console.log(`✔ Created ${createdBrands.length} brands.`);

    // 3. Seed Categories
    const categoriesData = [
      { name: 'Chạy bộ', slug: 'chay-bo', description: 'Giày chạy bộ chuyên dụng siêu nhẹ, giảm chấn tối đa', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', isActive: true, displayOrder: 1 },
      { name: 'Tập Gym', slug: 'tap-gym', description: 'Giày tập gym chắc chắn, bám sàn tốt, hỗ trợ nâng tạ', image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80', isActive: true, displayOrder: 2 },
      { name: 'Đi bộ', slug: 'di-bo', description: 'Giày đi bộ êm ái, thoáng khí cho hoạt động hàng ngày', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80', isActive: true, displayOrder: 3 },
      { name: 'Bóng rổ', slug: 'bong-ro', description: 'Giày bóng rổ cổ cao bảo vệ cổ chân, bật nhảy mạnh mẽ', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80', isActive: true, displayOrder: 4 },
      { name: 'Thời trang thể thao', slug: 'thoi-trang-the-thao', description: 'Sneaker phong cách hiện đại, phối đồ cực đỉnh', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80', isActive: true, displayOrder: 5 },
    ];
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✔ Created ${createdCategories.length} categories.`);

    // 4. Seed Promotions
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const promoHotDeal = await Promotion.create({
      name: 'Siêu Sale Mùa Hè 30%',
      type: 'percentage',
      value: 30,
      startDate: startDate,
      endDate: endDate,
      isActive: true,
    });

    const promoFlashSale = await Promotion.create({
      name: 'Flash Sale Giảm 200K',
      type: 'fixed',
      value: 200000,
      startDate: startDate,
      endDate: endDate,
      isActive: true,
    });
    console.log('✔ Created promotions.');

    // 5. Seed 20 Products
    const peryBrand = createdBrands.find(b => b.slug === 'pery-sport');
    const nikeBrand = createdBrands.find(b => b.slug === 'nike');
    const adidasBrand = createdBrands.find(b => b.slug === 'adidas');
    const pumaBrand = createdBrands.find(b => b.slug === 'puma');
    const nbBrand = createdBrands.find(b => b.slug === 'new-balance');

    const catChayBo = createdCategories.find(c => c.slug === 'chay-bo');
    const catGym = createdCategories.find(c => c.slug === 'tap-gym');
    const catDiBo = createdCategories.find(c => c.slug === 'di-bo');
    const catBongRo = createdCategories.find(c => c.slug === 'bong-ro');
    const catThoiTrang = createdCategories.find(c => c.slug === 'thoi-trang-the-thao');

    const sampleImages = [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
      'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
    ];

    const productImages = {
      'nike-air-zoom-pegasus-40': '/Nike Air Zoom Pegasus 40.jpg',
      'nike-metcon-9-training': '/Nike Metcon 9 Training.jpg',
      'nike-jordan-stay-loyal-2': '/Nike Jordan Stay Loyal 2.jpg',
      'nike-revolution-6-next-nature': '/Nike Revolution 6 Next Nature.jpg',
      'adidas-ultraboost-light': '/Adidas Ultraboost Light.jpg',
      'adidas-dropset-2-trainer': '/Adidas Dropset 2 Trainer.jpg',
      'adidas-forum-low-classic': '/Adidas Forum Low Classic.jpg',
      'adidas-ownthegame-2-0': '/Adidas OwnTheGame 2.0.jpg',
      'puma-deviate-nitro-2': '/Puma Deviate Nitro 2.jpg',
      'puma-fuse-2-0-gym': '/Puma Fuse 2.0 Gym.jpg',
      'puma-rebound-v6-high': '/Puma Rebound V6 High.jpg',
      'new-balance-fresh-foam-x-1080v12': '/New Balance Fresh Foam X 1080v12.jpg',
      'new-balance-574-core-classic': '/123.jpg',
      'new-balance-minimus-tr': '/New Balance Minimus TR.jpg',
    };

    const productsConfig = [
      { name: 'Pery Runner Pro X1', slug: 'pery-runner-pro-x1', brand: peryBrand._id, categories: [catChayBo._id, catThoiTrang._id], basePrice: 1850000, promo: promoHotDeal._id, sold: 142, isFeatured: true, imgIdx: 0 },
      { name: 'Pery Speed Ultra 2', slug: 'pery-speed-ultra-2', brand: peryBrand._id, categories: [catChayBo._id], basePrice: 1650000, promo: null, sold: 98, isFeatured: true, imgIdx: 1 },
      { name: 'Pery Flex Gym Pro', slug: 'pery-flex-gym-pro', brand: peryBrand._id, categories: [catGym._id], basePrice: 1450000, promo: promoFlashSale._id, sold: 210, isFeatured: true, imgIdx: 2 },
      { name: 'Pery Urban Walk Max', slug: 'pery-urban-walk-max', brand: peryBrand._id, categories: [catDiBo._id, catThoiTrang._id], basePrice: 1290000, promo: null, sold: 85, isFeatured: false, imgIdx: 3 },
      { name: 'Pery Court Beast Dunk', slug: 'pery-court-beast-dunk', brand: peryBrand._id, categories: [catBongRo._id], basePrice: 2190000, promo: promoHotDeal._id, sold: 175, isFeatured: true, imgIdx: 4 },

      { name: 'Nike Air Zoom Pegasus 40', slug: 'nike-air-zoom-pegasus-40', brand: nikeBrand._id, categories: [catChayBo._id], basePrice: 3490000, promo: null, sold: 320, isFeatured: true, imgIdx: 5 },
      { name: 'Nike Metcon 9 Training', slug: 'nike-metcon-9-training', brand: nikeBrand._id, categories: [catGym._id], basePrice: 3890000, promo: promoFlashSale._id, sold: 156, isFeatured: false, imgIdx: 6 },
      { name: 'Nike Jordan Stay Loyal 2', slug: 'nike-jordan-stay-loyal-2', brand: nikeBrand._id, categories: [catBongRo._id, catThoiTrang._id], basePrice: 3290000, promo: promoHotDeal._id, sold: 280, isFeatured: true, imgIdx: 7 },
      { name: 'Nike Revolution 6 Next Nature', slug: 'nike-revolution-6-next-nature', brand: nikeBrand._id, categories: [catChayBo._id, catDiBo._id], basePrice: 1990000, promo: null, sold: 64, isFeatured: false, imgIdx: 8 },

      { name: 'Adidas Ultraboost Light', slug: 'adidas-ultraboost-light', brand: adidasBrand._id, categories: [catChayBo._id, catThoiTrang._id], basePrice: 4500000, promo: promoHotDeal._id, sold: 410, isFeatured: true, imgIdx: 9 },
      { name: 'Adidas Dropset 2 Trainer', slug: 'adidas-dropset-2-trainer', brand: adidasBrand._id, categories: [catGym._id], basePrice: 3100000, promo: null, sold: 89, isFeatured: false, imgIdx: 0 },
      { name: 'Adidas Forum Low Classic', slug: 'adidas-forum-low-classic', brand: adidasBrand._id, categories: [catThoiTrang._id], basePrice: 2800000, promo: promoFlashSale._id, sold: 340, isFeatured: true, imgIdx: 1 },
      { name: 'Adidas OwnTheGame 2.0', slug: 'adidas-ownthegame-2-0', brand: adidasBrand._id, categories: [catBongRo._id], basePrice: 2100000, promo: null, sold: 112, isFeatured: false, imgIdx: 2 },

      { name: 'Puma Deviate Nitro 2', slug: 'puma-deviate-nitro-2', brand: pumaBrand._id, categories: [catChayBo._id], basePrice: 3990000, promo: promoHotDeal._id, sold: 130, isFeatured: false, imgIdx: 3 },
      { name: 'Puma Fuse 2.0 Gym', slug: 'puma-fuse-2-0-gym', brand: pumaBrand._id, categories: [catGym._id], basePrice: 2690000, promo: null, sold: 77, isFeatured: false, imgIdx: 4 },
      { name: 'Puma Rebound V6 High', slug: 'puma-rebound-v6-high', brand: pumaBrand._id, categories: [catBongRo._id, catThoiTrang._id], basePrice: 2290000, promo: promoFlashSale._id, sold: 190, isFeatured: true, imgIdx: 5 },

      { name: 'New Balance Fresh Foam X 1080v12', slug: 'new-balance-fresh-foam-x-1080v12', brand: nbBrand._id, categories: [catChayBo._id, catDiBo._id], basePrice: 4190000, promo: promoHotDeal._id, sold: 260, isFeatured: true, imgIdx: 6 },
      { name: 'New Balance 574 Core Classic', slug: 'new-balance-574-core-classic', brand: nbBrand._id, categories: [catThoiTrang._id, catDiBo._id], basePrice: 2590000, promo: null, sold: 510, isFeatured: true, imgIdx: 7 },
      { name: 'New Balance Minimus TR', slug: 'new-balance-minimus-tr', brand: nbBrand._id, categories: [catGym._id], basePrice: 2990000, promo: promoFlashSale._id, sold: 94, isFeatured: false, imgIdx: 8 },
      { name: 'Pery Aero Strike Nitro', slug: 'pery-aero-strike-nitro', brand: peryBrand._id, categories: [catChayBo._id, catGym._id], basePrice: 1790000, promo: promoHotDeal._id, sold: 305, isFeatured: true, imgIdx: 9 },
    ];

    const colors = [
      { name: 'Đen Navy', code: '#10243A' },
      { name: 'Cam Pery', code: '#F97316' },
      { name: 'Trắng Xám', code: '#E2E8F0' },
    ];
    const sizes = ['39', '40', '41', '42', '43'];

    const productsToInsert = [];

    for (const p of productsConfig) {
      const variants = [];
      const imgMain = productImages[p.slug] || sampleImages[p.imgIdx];
      const imgAlt1 = sampleImages[(p.imgIdx + 1) % sampleImages.length];
      const imgAlt2 = sampleImages[(p.imgIdx + 2) % sampleImages.length];
      const images = productImages[p.slug] ? [imgMain] : [imgMain, imgAlt1, imgAlt2];

      for (let cIdx = 0; cIdx < colors.length; cIdx++) {
        const c = colors[cIdx];
        for (let sIdx = 0; sIdx < sizes.length; sIdx++) {
          const s = sizes[sIdx];
          const skuCode = `${p.slug.toUpperCase().substring(0, 8)}-${c.name.substring(0, 2).toUpperCase()}-${s}`;
          const stockVal = Math.floor(Math.random() * 25) + 5;
          
          variants.push({
            color: c.name,
            colorCode: c.code,
            size: s,
            sku: skuCode,
            price: p.basePrice,
            originalPrice: Math.round(p.basePrice * 1.15),
            stock: stockVal,
            image: productImages[p.slug] || (cIdx === 0 ? imgMain : (cIdx === 1 ? imgAlt1 : imgAlt2)),
          });
        }
      }

      let calculatedSalePrice = p.basePrice;
      if (p.promo) {
        if (p.promo.toString() === promoHotDeal._id.toString()) {
          calculatedSalePrice = Math.round(p.basePrice * 0.7);
        } else if (p.promo.toString() === promoFlashSale._id.toString()) {
          calculatedSalePrice = Math.max(0, p.basePrice - 200000);
        }
      }

      productsToInsert.push({
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        categories: p.categories,
        description: `Giày thể thao nam ${p.name} thuộc thương hiệu uy tín. Thiết kế tối giản, công nghệ đệm êm ái, hỗ trợ vận động tối đa và mang lại phong cách sang trọng, trẻ trung cho quý ông.`,
        images,
        variants: variants,
        originalPrice: Math.round(p.basePrice * 1.15),
        salePrice: calculatedSalePrice,
        promotion: p.promo,
        soldCount: p.sold,
        isActive: true,
        isFeatured: p.isFeatured,
        seoTitle: `${p.name} | Giày Thể Thao Nam PERY SPORT`,
        seoDescription: `Mua giày thể thao nam ${p.name} chính hãng tại PERY SPORT. Giá tốt nhất, giao hàng toàn quốc, đổi trả dễ dàng.`,
      });
    }

    const createdProducts = await Product.insertMany(productsToInsert);
    console.log(`✔ Created ${createdProducts.length} products with multi-color/size variants.`);

    // 6. Seed Hero Banners
    const bannersData = [
      {
        title: 'PERY SPORT - ĐỈNH CAO THỂ THAO NAM',
        description: 'Bứt phá giới hạn với bộ sưu tập giày chạy bộ và tập luyện cao cấp 2026',
        desktopImage: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
        ctaText: 'Khám Phá Sưu Tập',
        ctaLink: '/san-pham',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'SIÊU SALE MÙA HÈ - GIẢM ĐẾN 30%',
        description: 'Ưu đãi cực sốc cho tất cả mẫu giày hot nhất mùa giải năm nay',
        desktopImage: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&q=80',
        ctaText: 'Săn Deal Ngay',
        ctaLink: '/san-pham?onSale=true',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'PHONG CÁCH SNEAKER THỜI TRANG',
        description: 'Thiết kế tối giản, tinh tế - Tự tin trong từng bước chuyển động',
        desktopImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80',
        mobileImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        ctaText: 'Xem Sản Phẩm',
        ctaLink: '/san-pham?category=thoi-trang-the-thao',
        displayOrder: 3,
        isActive: true,
      },
    ];
    await Banner.insertMany(bannersData);
    console.log('✔ Created Hero Banners.');

    // 7. Seed Posts
    const postsData = [
      {
        title: 'Cách chọn giày chạy bộ chuẩn xác cho nam giới mới bắt đầu',
        slug: 'cach-chon-giay-chay-bo-chuan-xac-cho-nam-gioi',
        summary: 'Hướng dẫn chọn size, chất liệu và công nghệ đệm phù hợp với từng kiểu bàn chân.',
        content: `Chạy bộ là một trong những môn thể thao đơn giản nhưng đem lại hiệu quả sức khỏe tuyệt vời nhất. Tuy nhiên, việc lựa chọn đúng một đôi giày chạy bộ phù hợp lại đóng vai trò quyết định đến hiệu suất tập luyện và phòng tránh chấn thương.\n\n1. Xác định kiểu bàn chân của bạn\nBàn chân phẳng, bàn chân bình thường hay lòng bàn chân cao đều cần loại giày có độ trợ lực khác nhau.\n\n2. Chọn đệm giày (Cushioning)\nNếu bạn chạy quãng đường dài, một đôi giày có đế giữa êm ái như Pery Runner Pro X1 sẽ giúp giảm áp lực đáng kể lên khớp gối.\n\n3. Trọng lượng và độ thoáng khí\nGiày chạy bộ chuyên dụng nên nhẹ và có phần thân vải dệt dẻo dai thoáng khí.`,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        status: 'published',
        seoTitle: 'Cách chọn giày chạy bộ nam chuẩn nhất 2026',
        seoDescription: 'Bí quyết chọn giày chạy bộ nam hợp kiểu chân, thoáng khí và êm ái.',
      },
      {
        title: 'Top 5 mẫu giày tập Gym và nâng tạ bám sàn cực tốt năm 2026',
        slug: 'top-5-mau-giay-tap-gym-va-nang-ta-bam-san-tot-nam-2026',
        summary: 'Khám phá các mẫu giày tập Gym giúp tăng sự ổn định và hỗ trợ tư thế Squat, Deadlift chuẩn.',
        content: `Khi tập Gym và nâng tạ nặng, độ bằng phẳng và khả năng bám sàn của đế giày quan trọng hơn độ êm mềm. Dưới đây là 5 mẫu giày tập Gym đáng mua nhất năm 2026 từ PERY SPORT và các hãng thể thao danh tiếng...`,
        image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&q=80',
        status: 'published',
        seoTitle: 'Top 5 giày tập Gym nam bám sàn tốt nhất',
        seoDescription: 'Tổng hợp 5 mẫu giày tập Gym chuyên dụng tốt nhất cho nam giới.',
      },
      {
        title: 'Bí quyết bảo quản giày thể thao luôn mới và không bị hôi chân',
        slug: 'bi-quyet-bao-quan-giay-the-thao-luon-moi-va-khong-bi-hoi',
        summary: 'Mẹo vệ sinh giày đúng cách, khử mùi hiệu quả và giữ phom dáng bền lâu.',
        content: `Giày thể thao cần được chăm sóc đúng cách để giữ được độ đàn hồi của đế và vẻ ngoài như mới. Đừng ngâm giày quá lâu trong nước tẩy rửa mạnh, nên sử dụng dung dịch chuyên dụng và phơi ở nơi thoáng mát...`,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
        status: 'published',
        seoTitle: 'Mẹo bảo quản và vệ sinh giày thể thao nam',
        seoDescription: 'Hướng dẫn giặt giày và khử mùi hôi giày thể thao đơn giản tại nhà.',
      },
      {
        title: 'Xu hướng Sneaker thể thao nam phong cách Minimalist nâng tầm vẻ lịch lãm',
        slug: 'xu-huong-sneaker-the-thao-nam-phong-cach-minimalist',
        summary: 'Tối giản trong phối màu nhưng tinh tế trong đường nét, khẳng định gout thời trang quý ông.',
        content: `Phong cách Minimalist luôn giữ vị thế độc tôn trong làng thời trang nam. Một đôi sneaker màu Đen Navy hay Trắng Tinh với phom dáng chuẩn mực có thể phối hài hòa cùng quần Jogger, quần Jean hay cả quần Kaki...`,
        image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
        status: 'published',
        seoTitle: 'Xu hướng Sneaker nam tối giản Minimalist 2026',
        seoDescription: 'Khám phá phong cách sneaker nam tối giản thời thượng.',
      },
      {
        title: 'PERY SPORT ra mắt dòng sản phẩm giày chạy bộ công nghệ đệm Nitro Max mới',
        slug: 'pery-sport-ra-mat-dong-san-pham-dem-nitro-max',
        summary: 'Trải nghiệm sự đột phá với siêu phẩm đệm khí hoàn năng lượng đến 85%.',
        content: `PERY SPORT tự hào giới thiệu thế hệ giày thể thao mới ứng dụng đệm Nitro Max siêu nhẹ, giảm tối đa tác động trọng lực lên cột sống và đem lại phản hồi lực vượt trội trong từng bước chạy...`,
        image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
        status: 'published',
        seoTitle: 'PERY SPORT ra mắt dòng giày Nitro Max',
        seoDescription: 'Sự kiện ra mắt sản phẩm mới của PERY SPORT.',
      },
    ];
    await Post.insertMany(postsData);
    console.log('✔ Created Blog Posts.');

    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    if (mongod) {
      // keep alive for 1s then exit
      setTimeout(() => process.exit(0), 1000);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
