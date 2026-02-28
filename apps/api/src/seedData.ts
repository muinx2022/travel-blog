/**
 * Seed script to populate initial data for Tags, Homestays, Restaurants, Souvenir Shops, Travel Guides
 * Run with: npm run develop (Strapi will execute this on startup if SEED_DATA=true)
 * Or manually: node scripts/seed.js
 */

interface SeedData {
  tags: any[];
  homestays: any[];
  restaurants: any[];
  shops: any[];
  guides: any[];
}

const seedData: SeedData = {
  tags: [
    {
      name: "Tràng An",
      slug: "trang-an",
    },
    {
      name: "Ninh Bình",
      slug: "ninh-binh",
    },
    {
      name: "Hạ Long",
      slug: "ha-long",
    },
    {
      name: "Đà Nẵng",
      slug: "da-nang",
    },
    {
      name: "Đà Lạt",
      slug: "da-lat",
    },
    {
      name: "Phú Quốc",
      slug: "phu-quoc",
    },
    {
      name: "Hà Nội",
      slug: "ha-noi",
    },
    {
      name: "Hạ Long Bay",
      slug: "ha-long-bay",
    },
    {
      name: "Mekong Delta",
      slug: "mekong-delta",
    },
    {
      name: "Sapa",
      slug: "sapa",
    },
  ],

  homestays: [
    {
      title: "Tràng An Riverside Homestay",
      slug: "trang-an-riverside-homestay",
      excerpt: "Nhà homestay yên tĩnh bên bờ sông Bình Điềm",
      content: "<p>Tràng An Riverside Homestay là một nơi lý tưởng để thư giãn và khám phá vẻ đẹp tự nhiên của Tràng An.</p>",
      address: "Xã Ninh Á, Hoa Lư, Ninh Bình",
      city: "Ninh Bình",
      priceRange: "500.000 - 1.500.000 VND/đêm",
    },
    {
      title: "Hạ Long Garden Home",
      slug: "ha-long-garden-home",
      excerpt: "Nhà homestay có vườn xanh mát với tầm nhìn ra vịnh",
      content: "<p>Hạ Long Garden Home mang đến trải nghiệm độc đáo giữa thiên nhiên.</p>",
      address: "Phường Bạch Đằng, Hạ Long, Quảng Ninh",
      city: "Hạ Long",
      priceRange: "600.000 - 1.800.000 VND/đêm",
    },
    {
      title: "Đà Nẵng Beachfront Homestay",
      slug: "da-nang-beachfront-homestay",
      excerpt: "Nằm ngay bãi biển, thoáng mát và gần gũi",
      content: "<p>Đà Nẵng Beachfront Homestay là điểm đến tuyệt vời cho những ai yêu thích biển.</p>",
      address: "Phường Mỹ Khê, Quận Ngũ Hành Sơn, Đà Nẵng",
      city: "Đà Nẵng",
      priceRange: "700.000 - 2.000.000 VND/đêm",
    },
  ],

  restaurants: [
    {
      title: "Tràng An Restaurant",
      slug: "trang-an-restaurant",
      excerpt: "Nhà hàng ẩm thực truyền thống Việt Nam",
      content: "<p>Tràng An Restaurant phục vụ các mon ăn truyền thống của vùng Ninh Bình.</p>",
      address: "Xã Ninh Á, Hoa Lư, Ninh Bình",
      city: "Ninh Bình",
      cuisineType: "Việt Nam",
      priceRange: "100.000 - 300.000 VND/người",
    },
    {
      title: "Seaside Grille",
      slug: "seaside-grille",
      excerpt: "Nhà hàng hải sản tươi ngon",
      content: "<p>Seaside Grille nổi tiếng với những mon hải sản tươi sống được chế biến chuyên nghiệp.</p>",
      address: "Bãi Cháy, Hạ Long, Quảng Ninh",
      city: "Hạ Long",
      cuisineType: "Hải sản",
      priceRange: "200.000 - 500.000 VND/người",
    },
    {
      title: "Da Nang Style",
      slug: "da-nang-style",
      excerpt: "Ẩm thực đặc sắc Đà Nẵng",
      content: "<p>Da Nang Style là địa chỉ không thể bỏ qua khi tới thành phố đáng sống.</p>",
      address: "Phường Hải Châu, Quận Hải Châu, Đà Nẵng",
      city: "Đà Nẵng",
      cuisineType: "Đặc sản Việt",
      priceRange: "80.000 - 250.000 VND/người",
    },
  ],

  shops: [
    {
      title: "Ninh Bình Handicraft Shop",
      slug: "ninh-binh-handicraft-shop",
      excerpt: "Cửa hàng đồ thủ công mỹ nghệ truyền thống",
      content: "<p>Tìm kiếm những sản phẩm thủ công tuyệt đẹp từ các nghệ nhân Ninh Bình.</p>",
      address: "Phố cổ Hoa Lư, Hoa Lư, Ninh Bình",
      city: "Ninh Bình",
      shopType: "Đồ thủ công",
    },
    {
      title: "Ha Long Souvenir Corner",
      slug: "ha-long-souvenir-corner",
      excerpt: "Cửa hàng bán đồ lưu niệm du lịch",
      content: "<p>Ha Long Souvenir Corner cung cấp các sản phẩm quà tặng độc đáo.</p>",
      address: "Trung tâm thương mại, Bãi Cháy, Hạ Long",
      city: "Hạ Long",
      shopType: "Lưu niệm",
    },
    {
      title: "Da Nang Silk Shop",
      slug: "da-nang-silk-shop",
      excerpt: "Cửa hàng bán lụa tơ tằm chất lượng cao",
      content: "<p>Da Nang Silk Shop - Điểm đến hoàn hảo cho những ai tìm kiếm sản phẩm lụa nguyên chất.</p>",
      address: "Phố cổ Hội An, Hội An, Quảng Nam",
      city: "Hội An",
      shopType: "Lụa",
    },
  ],

  guides: [
    {
      title: "Cẩm nang du lịch Tràng An cho người mới",
      slug: "guide-trang-an-beginner",
      excerpt: "Hướng dẫn chi tiết du lịch Tràng An dành cho lần đầu",
      content: "<p>Tràng An có gì đặc biệt? Làm sao để thăm nom hết? Bài viết này sẽ giúp bạn.</p>",
      guideType: "cam-nang",
    },
    {
      title: "Mẹo tiết kiệm chi phí khi du lịch Hạ Long",
      slug: "guide-ha-long-tips",
      excerpt: "Những mẹo hữu ích để du lịch Hạ Long một cách thông minh",
      content: "<p>Du lịch Hạ Long không nhất thiết phải tốn kém. Dưới đây là những mẹo giúp bạn tiết kiệm.</p>",
      guideType: "meo-du-lich",
    },
    {
      title: "Lịch trình 3 ngày 2 đêm khám phá Đà Nẵng",
      slug: "guide-da-nang-itinerary",
      excerpt: "Lịch trình hoàn hảo để khám phá thành phố đáng sống",
      content: "<p>Ngày 1: Bãi biển Mỹ Khê... Ngày 2: Du lịch nội thành... Ngày 3: Cầu Vàng...</p>",
      guideType: "lich-trinh-goi-y",
    },
    {
      title: "Cẩm nang du lịch Đà Lạt 2024",
      slug: "guide-da-lat-2024",
      excerpt: "Tất cả những gì bạn cần biết về Đà Lạt",
      content: "<p>Đà Lạt - thành phố ngàn hoa, mệnh danh 'thành phố lãng mạn'...</p>",
      guideType: "cam-nang",
    },
  ],
};

export default seedData;
