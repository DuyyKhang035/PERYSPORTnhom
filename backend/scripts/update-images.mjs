import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pery_sport';

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: String,
  images: [String],
  variants: [{
    color: String,
    size: String,
    sku: String,
    image: String,
    price: Number,
    originalPrice: Number,
    stock: Number,
    colorCode: String,
  }],
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');

// Mapping slug sản phẩm → đường dẫn ảnh mới (public folder của frontend)
const IMAGE_MAP = {
  'nike-air-zoom-pegasus-40':       '/Nike Air Zoom Pegasus 40.jpg',
  'nike-metcon-9-training':         '/Nike Metcon 9 Training.jpg',
  'nike-jordan-stay-loyal-2':       '/Nike Jordan Stay Loyal 2.jpg',
  'nike-revolution-6-next-nature':  '/Nike Revolution 6 Next Nature.jpg',

  'adidas-ultraboost-light':        '/Adidas Ultraboost Light.jpg',
  'adidas-dropset-2-trainer':       '/Adidas Dropset 2 Trainer.jpg',
  'adidas-forum-low-classic':       '/Adidas Forum Low Classic.jpg',
  'adidas-ownthegame-2-0':          '/Adidas OwnTheGame 2.0.jpg',

  'puma-deviate-nitro-2':           '/Puma Deviate Nitro 2.jpg',
  'puma-fuse-2-0-gym':              '/Puma Fuse 2.0 Gym.jpg',
  'puma-rebound-v6-high':           '/Puma Rebound V6 High.jpg',

  'new-balance-fresh-foam-x-1080v12': '/New Balance Fresh Foam X 1080v12.jpg',
  'new-balance-574-core-classic':   '/123.jpg',
  'new-balance-minimus-tr':         '/New Balance Minimus TR.jpg',
};

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: 'pery_sport' });
  console.log(`✅ Đã kết nối MongoDB: ${mongoose.connection.name}\n`);

  let updated = 0;
  let skipped = 0;

  for (const [slug, imgPath] of Object.entries(IMAGE_MAP)) {
    const product = await Product.findOne({ slug });
    if (!product) {
      console.log(`⚠️  Không tìm thấy sản phẩm: ${slug}`);
      skipped++;
      continue;
    }

    // Cập nhật mảng images chính
    product.images = [imgPath];

    // Cập nhật ảnh trong tất cả variants
    for (const v of product.variants) {
      v.image = imgPath;
    }

    await product.save();
    console.log(`✔ Đã cập nhật: ${product.name}`);
    updated++;
  }

  if (updated === 0) {
    const products = await Product.find({}, { name: 1, slug: 1 }).limit(30).lean();
    console.error(`\n❌ Không cập nhật được sản phẩm nào trong database "${mongoose.connection.name}".`);
    if (products.length === 0) {
      console.error('Collection products đang trống. Kiểm tra đúng database/cluster và dữ liệu sản phẩm đã được seed chưa.');
    } else {
      console.error('Tên và slug sản phẩm hiện có (tối đa 30):');
      for (const product of products) {
        console.error(`- ${product.name} (${product.slug || 'không có slug'})`);
      }
      console.error('\nHãy đối chiếu slug thực tế với IMAGE_MAP trong scripts/update-images.mjs.');
    }
    throw new Error('Không tìm thấy sản phẩm nào khớp với danh sách ảnh.');
  }

  console.log(`\n🎉 Hoàn tất! Đã cập nhật ${updated} sản phẩm, bỏ qua ${skipped}.`);
}

run()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
