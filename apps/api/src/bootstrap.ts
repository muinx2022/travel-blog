import type { Core } from '@strapi/strapi';
import seedData from './seedData';

// 34 tỉnh thành Việt Nam (sau cải cách hành chính 2025)
const VIETNAM_PROVINCES = [
  // Miền Bắc
  { name: 'Hà Nội',     slug: 'ha-noi',      sortOrder: 1  },
  { name: 'Hải Phòng',  slug: 'hai-phong',   sortOrder: 2  },
  { name: 'Quảng Ninh', slug: 'quang-ninh',  sortOrder: 3  },
  { name: 'Bắc Giang',  slug: 'bac-giang',   sortOrder: 4  },
  { name: 'Thái Nguyên',slug: 'thai-nguyen', sortOrder: 5  },
  { name: 'Cao Bằng',   slug: 'cao-bang',    sortOrder: 6  },
  { name: 'Tuyên Quang',slug: 'tuyen-quang', sortOrder: 7  },
  { name: 'Yên Bái',    slug: 'yen-bai',     sortOrder: 8  },
  { name: 'Sơn La',     slug: 'son-la',      sortOrder: 9  },
  // Bắc Trung Bộ
  { name: 'Thanh Hóa',  slug: 'thanh-hoa',   sortOrder: 10 },
  { name: 'Nghệ An',    slug: 'nghe-an',     sortOrder: 11 },
  { name: 'Quảng Bình', slug: 'quang-binh',  sortOrder: 12 },
  { name: 'Huế',        slug: 'hue',         sortOrder: 13 },
  // Nam Trung Bộ
  { name: 'Đà Nẵng',    slug: 'da-nang',     sortOrder: 14 },
  { name: 'Quảng Ngãi', slug: 'quang-ngai',  sortOrder: 15 },
  { name: 'Bình Định',  slug: 'binh-dinh',   sortOrder: 16 },
  { name: 'Khánh Hòa',  slug: 'khanh-hoa',   sortOrder: 17 },
  { name: 'Bình Thuận', slug: 'binh-thuan',  sortOrder: 18 },
  // Tây Nguyên
  { name: 'Kon Tum',    slug: 'kon-tum',     sortOrder: 19 },
  { name: 'Đắk Lắk',   slug: 'dak-lak',     sortOrder: 20 },
  { name: 'Lâm Đồng',   slug: 'lam-dong',    sortOrder: 21 },
  // Đông Nam Bộ
  { name: 'Hồ Chí Minh',slug: 'ho-chi-minh', sortOrder: 22 },
  { name: 'Đồng Nai',   slug: 'dong-nai',    sortOrder: 23 },
  { name: 'Bình Phước', slug: 'binh-phuoc',  sortOrder: 24 },
  { name: 'Tây Ninh',   slug: 'tay-ninh',    sortOrder: 25 },
  { name: 'Bà Rịa - Vũng Tàu', slug: 'ba-ria-vung-tau', sortOrder: 26 },
  // Đồng Bằng Sông Cửu Long
  { name: 'Cần Thơ',    slug: 'can-tho',     sortOrder: 27 },
  { name: 'Long An',    slug: 'long-an',     sortOrder: 28 },
  { name: 'Tiền Giang', slug: 'tien-giang',  sortOrder: 29 },
  { name: 'An Giang',   slug: 'an-giang',    sortOrder: 30 },
  { name: 'Đồng Tháp',  slug: 'dong-thap',   sortOrder: 31 },
  { name: 'Vĩnh Long',  slug: 'vinh-long',   sortOrder: 32 },
  { name: 'Kiên Giang', slug: 'kien-giang',  sortOrder: 33 },
  { name: 'Cà Mau',     slug: 'ca-mau',      sortOrder: 34 },
];

export async function seedCategories(strapi: Core.Strapi) {
  if (process.env.SEED_CATEGORIES !== 'true') return;

  console.log('[seed] Deleting all existing categories...');
  const existing = await strapi.query('api::category.category').findMany({ select: ['id'] });
  for (const cat of existing) {
    await strapi.query('api::category.category').delete({ where: { id: cat.id } });
  }
  console.log(`[seed] Deleted ${existing.length} categories.`);

  console.log('[seed] Seeding 34 Vietnamese provinces...');
  for (const province of VIETNAM_PROVINCES) {
    await strapi.query('api::category.category').create({ data: province });
    console.log(`[seed] Created: ${province.name}`);
  }
  console.log('[seed] Category seeding complete!');
}

export async function seedInitialData(strapi: Core.Strapi) {
  const shouldSeed = process.env.SEED_DATA === 'true';
  
  if (!shouldSeed) {
    return;
  }

  console.log('[seed] Starting initial data seeding...');

  try {
    // Seed Tags
    for (const tag of seedData.tags) {
      const existing = await strapi.query('api::tag.tag').findOne({
        where: { slug: tag.slug },
      });

      if (!existing) {
        await strapi.query('api::tag.tag').create({
          data: {
            ...tag,
            publishedAt: new Date(),
          },
        });
        console.log(`[seed] Created tag: ${tag.name}`);
      }
    }

    // Seed Homestays
    for (const homestay of seedData.homestays) {
      const existing = await strapi.query('api::homestay.homestay').findOne({
        where: { slug: homestay.slug },
      });

      if (!existing) {
        await strapi.query('api::homestay.homestay').create({
          data: {
            ...homestay,
            publishedAt: new Date(),
          },
        });
        console.log(`[seed] Created homestay: ${homestay.title}`);
      }
    }

    // Seed Restaurants
    for (const restaurant of seedData.restaurants) {
      const existing = await strapi.query('api::restaurant.restaurant').findOne({
        where: { slug: restaurant.slug },
      });

      if (!existing) {
        await strapi.query('api::restaurant.restaurant').create({
          data: {
            ...restaurant,
            publishedAt: new Date(),
          },
        });
        console.log(`[seed] Created restaurant: ${restaurant.title}`);
      }
    }

    // Seed Souvenir Shops
    for (const shop of seedData.shops) {
      const existing = await strapi.query('api::souvenir-shop.souvenir-shop').findOne({
        where: { slug: shop.slug },
      });

      if (!existing) {
        await strapi.query('api::souvenir-shop.souvenir-shop').create({
          data: {
            ...shop,
            publishedAt: new Date(),
          },
        });
        console.log(`[seed] Created souvenir shop: ${shop.title}`);
      }
    }

    // Seed Travel Guides
    for (const guide of seedData.guides) {
      const existing = await strapi.query('api::travel-guide.travel-guide').findOne({
        where: { slug: guide.slug },
      });

      if (!existing) {
        await strapi.query('api::travel-guide.travel-guide').create({
          data: {
            ...guide,
            publishedAt: new Date(),
          },
        });
        console.log(`[seed] Created travel guide: ${guide.title}`);
      }
    }

    // Update public role permissions to access new entities
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
        const newPermissions = [
          'api::tag.tag.find',
          'api::tag.tag.findOne',
          'api::homestay.homestay.find',
          'api::homestay.homestay.findOne',
          'api::restaurant.restaurant.find',
          'api::restaurant.restaurant.findOne',
          'api::souvenir-shop.souvenir-shop.find',
          'api::souvenir-shop.souvenir-shop.findOne',
          'api::travel-guide.travel-guide.find',
          'api::travel-guide.travel-guide.findOne',
        ];

        const existingPermissions = await strapi
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: publicRole.id,
            },
          });

        const existingActionSet = new Set(
          (existingPermissions as any[]).map((p) => p.action)
        );

        for (const action of newPermissions) {
          if (!existingActionSet.has(action)) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: publicRole.id,
              },
            });
            console.log(`[seed] Granted public permission: ${action}`);
          }
        }
      }
    } catch (err) {
      console.warn('[seed] Warning while updating permissions:', err);
    }

    console.log('[seed] Initial data seeding completed!');
  } catch (error) {
    console.error('[seed] Error during seeding:', error);
  }
}
