# Post Detail + New Content Types Implementation - Completion Report

## ✅ Hoàn thành

### Frontend (Next.js)

#### 1. **strapi.ts - Types & Functions** ✅
- ✅ Thêm type `Tag` với `id, documentId, name, slug`
- ✅ Cập nhật type `Post` để bao gồm `tags?: Tag[]`
- ✅ Thêm types mới: `Homestay`, `Restaurant`, `SouvenirShop`, `TravelGuide`
- ✅ Thêm hàm `getTagsByPost(postSlug)` để lấy tags của bài viết
- ✅ Thêm `getHomestaysWithPagination()` - hỗ trợ category filter
- ✅ Thêm `getRestaurantsWithPagination()` - hỗ trợ category filter
- ✅ Thêm `getSouvenirShopsWithPagination()` - hỗ trợ category filter
- ✅ Thêm `getTravelGuidesWithPagination()` - hỗ trợ category filter + guideType
- ✅ Thêm `getToursByTags(tagSlugs, limit)` - suggest tours theo tags

#### 2. **Shared Card Components** ✅
- ✅ `compact-homestay-card.tsx` - render Homestay card với title, city, priceRange
- ✅ `compact-restaurant-card.tsx` - render Restaurant card với cuisineType, city, price
- ✅ `compact-shop-card.tsx` - render SouvenirShop card với shopType, city
- ✅ `compact-guide-card.tsx` - render TravelGuide card với guideType badge

#### 3. **Post Detail Page Redesign** ✅
- ✅ `post-detail-sidebar.tsx` - Sidebar component 
  - Fetch all entities: Hotels, Homestays, Restaurants, Shops, Guides, Tours (by tags)
  - Hiển thị 2-3 items của mỗi loại với "Xem thêm" link
  - Sticky position trên desktop
  - Responsive: full-width trên mobile
- ✅ `p/[id]/page.tsx` - Redesign post detail layout
  - ✅ Breadcrumb navigation
  - ✅ 2-column layout: main content (2/3) + sidebar (1/3)
  - ✅ Thêm tags display bên cạnh categories
  - ✅ Sidebar với sticky position (desktop)
  - ✅ Mobile responsive: sidebar xuống dưới

#### 4. **API Proxies** ✅
- ✅ `api/homestays-proxy/route.ts` - GET homestays với pagination & category filter
- ✅ `api/restaurants-proxy/route.ts` - GET restaurants với pagination & category filter
- ✅ `api/souvenir-shops-proxy/route.ts` - GET shops với pagination & category filter
- ✅ `api/travel-guides-proxy/route.ts` - GET guides với pagination, category, guideType filter
- ✅ `api/tags-proxy/route.ts` - GET tags cho post (postSlug filter)

#### 5. **Cleanup - Dark Mode Classes** ✅
- ✅ `post-actions.tsx` - Xóa tất cả `dark:` prefixed classes
- ✅ `post-card.tsx` - Xóa tất cả `dark:` prefixed classes

---

## ⏳ Cần làm trong Strapi

### Content Types tạo trong Strapi Admin Panel

#### 1. **Tag** (`api::tag.tag`)
```json
Schema:
{
  "kind": "collectionType",
  "collectionName": "tags",
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "posts": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::post.post",
      "mappedBy": "tags"
    },
    "tours": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tour.tour",
      "mappedBy": "tags"
    }
  }
}
```

#### 2. **Homestay** (`api::homestay.homestay`)
```json
Schema:
{
  "kind": "collectionType",
  "collectionName": "homestays",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "excerpt": { "type": "text" },
    "content": { "type": "richtext" },
    "address": { "type": "string" },
    "city": { "type": "string" },
    "priceRange": { "type": "string" },
    "thumbnail": { "type": "media", "multiple": false },
    "images": { "type": "media", "multiple": true },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "amenities": {
      "type": "component",
      "repeatable": true,
      "component": "hotel.amenity"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "publishedAt": { "type": "datetime" }
  }
}
```

#### 3. **Restaurant** (`api::restaurant.restaurant`)
```json
Schema:
{
  "kind": "collectionType",
  "collectionName": "restaurants",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "excerpt": { "type": "text" },
    "content": { "type": "richtext" },
    "address": { "type": "string" },
    "city": { "type": "string" },
    "cuisineType": { "type": "string" },
    "priceRange": { "type": "string" },
    "thumbnail": { "type": "media", "multiple": false },
    "images": { "type": "media", "multiple": true },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "publishedAt": { "type": "datetime" }
  }
}
```

#### 4. **SouvenirShop** (`api::souvenir-shop.souvenir-shop`)
```json
Schema:
{
  "kind": "collectionType",
  "collectionName": "souvenir_shops",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "excerpt": { "type": "text" },
    "content": { "type": "richtext" },
    "address": { "type": "string" },
    "city": { "type": "string" },
    "shopType": { "type": "string" },
    "thumbnail": { "type": "media", "multiple": false },
    "images": { "type": "media", "multiple": true },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "publishedAt": { "type": "datetime" }
  }
}
```

#### 5. **TravelGuide** (`api::travel-guide.travel-guide`)
```json
Schema:
{
  "kind": "collectionType",
  "collectionName": "travel_guides",
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "excerpt": { "type": "text" },
    "content": { "type": "richtext" },
    "guideType": {
      "type": "enumeration",
      "enum": ["cam-nang", "meo-du-lich", "lich-trinh-goi-y"]
    },
    "thumbnail": { "type": "media", "multiple": false },
    "categories": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::category.category"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "publishedAt": { "type": "datetime" }
  }
}
```

### Post & Tour Relations

#### Update **Post** schema:
Thêm field:
```json
"tags": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::tag.tag",
  "inversedBy": "posts"
}
```

#### Update **Tour** schema:
Thêm field:
```json
"tags": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::tag.tag",
  "inversedBy": "tours"
}
```

### Category Relations

#### Update **Category** schema:
Thêm fields:
```json
"homestays": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::homestay.homestay"
},
"restaurants": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::restaurant.restaurant"
},
"souvenirShops": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::souvenir-shop.souvenir-shop"
},
"travelGuides": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::travel-guide.travel-guide"
}
```

---

## 📝 Các endpoint Strapi cần có

Sau khi tạo content types, các endpoint sẽ tự động được tạo:

- `GET /api/tags` - Lấy danh sách tags
- `GET /api/homestays` - Lấy danh sách homestays
- `GET /api/restaurants` - Lấy danh sách restaurants
- `GET /api/souvenir-shops` - Lấy danh sách shops
- `GET /api/travel-guides` - Lấy danh sách guides

Tất cả endpoints hỗ trợ:
- `?pagination[page]=1&pagination[pageSize]=10`
- `?filters[categories][slug][$eq]=category-slug`
- `?populate=*` hoặc specify fields
- `?sort=publishedAt:desc`

---

## 🎯 Frontend Features đã triển khai

### Post Detail Page (2-column layout):
```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb                                              │
├─────────────────────────────────────────────────────────┤
│ Main Content (2/3)    │ Sidebar (1/3)                  │
│                       │                                 │
│ - Categories + Tags   │ - Cẩm nang du lịch (2-3)      │
│ - Title (Playfair)    │ - Tour liên quan (by tags)    │
│ - Excerpt             │ - Khách sạn gợi ý (2-3)       │
│ - Rich text content   │ - Nhà homestay (2)            │
│ - Post actions        │ - Nhà hàng & Quán ăn (2)      │
│ - Comments            │ - Shop lưu niệm (2)           │
│                       │                                 │
└─────────────────────────────────────────────────────────┘
```

### Tag-based Tour Suggestions:
- Khi user xem post "Khám phá Tràng An", hệ thống sẽ:
  1. Lấy tags của post (VD: ["Tràng An", "Ninh Bình"])
  2. Tìm tours có bất kỳ tag nào trùng
  3. Sắp xếp theo số lượng tag trùng (nhiều hơn = liên quan hơn)
  4. Hiển thị top 3 tours trong sidebar

### Responsive Design:
- **Desktop (≥1024px)**: 2-column layout, sidebar sticky
- **Tablet/Mobile (<1024px)**: Full-width layout, sidebar dưới content

---

## 🔧 Files Tạo/Sửa

### Created:
- ✅ [apps/web/src/components/compact-homestay-card.tsx](apps/web/src/components/compact-homestay-card.tsx)
- ✅ [apps/web/src/components/compact-restaurant-card.tsx](apps/web/src/components/compact-restaurant-card.tsx)
- ✅ [apps/web/src/components/compact-shop-card.tsx](apps/web/src/components/compact-shop-card.tsx)
- ✅ [apps/web/src/components/compact-guide-card.tsx](apps/web/src/components/compact-guide-card.tsx)
- ✅ [apps/web/src/components/post-detail-sidebar.tsx](apps/web/src/components/post-detail-sidebar.tsx)
- ✅ [apps/web/src/app/api/homestays-proxy/route.ts](apps/web/src/app/api/homestays-proxy/route.ts)
- ✅ [apps/web/src/app/api/restaurants-proxy/route.ts](apps/web/src/app/api/restaurants-proxy/route.ts)
- ✅ [apps/web/src/app/api/souvenir-shops-proxy/route.ts](apps/web/src/app/api/souvenir-shops-proxy/route.ts)
- ✅ [apps/web/src/app/api/travel-guides-proxy/route.ts](apps/web/src/app/api/travel-guides-proxy/route.ts)
- ✅ [apps/web/src/app/api/tags-proxy/route.ts](apps/web/src/app/api/tags-proxy/route.ts)

### Modified:
- ✅ [apps/web/src/lib/strapi.ts](apps/web/src/lib/strapi.ts) - Types & functions
- ✅ [apps/web/src/app/p/[id]/page.tsx](apps/web/src/app/p/[id]/page.tsx) - Post detail redesign
- ✅ [apps/web/src/components/post-actions.tsx](apps/web/src/components/post-actions.tsx) - Cleanup dark mode
- ✅ [apps/web/src/components/post-card.tsx](apps/web/src/components/post-card.tsx) - Cleanup dark mode

---

## Next Steps

1. Tạo content types trong Strapi Admin Panel (xem hướng dẫn trên)
2. Cập nhật Post & Tour relations với tags
3. Cập nhật Category relations với entities mới
4. Test API endpoints: đảm bảo công khai (public) hoặc thêm authorization
5. Tạo sample data trong Strapi
6. Deploy & test frontend

---

## Notes

- **Tag system** được thiết kế để matching chính xác giữa Post & Tour
- **Category** vẫn dùng để filter các entity khác (Hotel, Homestay, Restaurant, Shop, TravelGuide)
- Tất cả fetches sử dụng **Strapi API** qua proxy routes
- Layout post detail **100% responsive**
- **Playfair Display** font dùng cho headings
- **No dark mode** - clean, consistent light theme
