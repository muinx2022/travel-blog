# Hướng dẫn thêm Resource mới vào hệ thống Permission

Tài liệu này hướng dẫn cách thêm một resource mới vào hệ thống permission của Admin Panel.

---

## 📋 Tổng quan

Khi thêm resource mới, bạn **KHÔNG** cần tạo role mới. Bạn chỉ cần:

1. Khai báo resource trong backend (`resources-manifest.ts`)
2. Tạo API endpoints cho resource
3. Cập nhật frontend components (nếu cần)
4. Grant permissions cho các role hiện có qua UI

---

## 🔧 Các bước thực hiện

### Bước 1: Khai báo Resource trong Backend

**File:** `apps/api/src/api/management/helpers/resources-manifest.ts`

Thêm resource mới vào `MANAGEMENT_RESOURCES`:

```typescript
export const MANAGEMENT_RESOURCES: Record<string, string[]> = {
  // ... existing resources
  event: ['list', 'find', 'create', 'update', 'delete', 'publish', 'unpublish'],
};
```

Thêm URL mapping vào `URL_PATH_TO_RESOURCE`:

```typescript
export const URL_PATH_TO_RESOURCE: Record<string, string> = {
  // ... existing mappings
  events: 'event',
};
```

> **Lưu ý:** 
> - Key trong `URL_PATH_TO_RESOURCE` là path segment sau `/management/` (dùng số nhiều, kebab-case)
> - Key trong `MANAGEMENT_RESOURCES` là tên resource (camelCase)

---

### Bước 2: Tạo API Endpoints

Tạo thư mục mới trong `apps/api/src/api/management/controllers/handlers/`:

```
apps/api/src/api/management/controllers/handlers/
├── event.ts          # Handler functions
└── index.ts          # Export handlers
```

**Ví dụ `event.ts`:**

```typescript
import type { Context } from '../../helpers/common';
import { handleList, handleFind, handleCreate, handleUpdate, handleDelete, handlePublish, handleUnpublish } from '../helpers/crud-handlers';

const RESOURCE = 'api::event.event';

export async function listEvents(ctx: Context) {
  return handleList(ctx, RESOURCE);
}

export async function findEvent(ctx: Context) {
  return handleFind(ctx, RESOURCE);
}

export async function createEvent(ctx: Context) {
  return handleCreate(ctx, RESOURCE);
}

export async function updateEvent(ctx: Context) {
  return handleUpdate(ctx, RESOURCE);
}

export async function deleteEvent(ctx: Context) {
  return handleDelete(ctx, RESOURCE);
}

export async function publishEvent(ctx: Context) {
  return handlePublish(ctx, RESOURCE);
}

export async function unpublishEvent(ctx: Context) {
  return handleUnpublish(ctx, RESOURCE);
}
```

**Export trong `index.ts`:**

```typescript
export * from './event';
```

---

### Bước 3: Đăng ký Routes

**File:** `apps/api/src/api/management/routes/management.ts`

Thêm routes cho resource mới:

```typescript
{
  method: 'GET',
  path: '/events',
  handler: 'management.listEvents',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'GET',
  path: '/events/:documentId',
  handler: 'management.findEvent',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'POST',
  path: '/events',
  handler: 'management.createEvent',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'PUT',
  path: '/events/:documentId',
  handler: 'management.updateEvent',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'DELETE',
  path: '/events/:documentId',
  handler: 'management.deleteEvent',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'POST',
  path: '/events/:documentId/publish',
  handler: 'management.publishEvent',
  config: { policies: ['is-admin-user'] },
},
{
  method: 'POST',
  path: '/events/:documentId/unpublish',
  handler: 'management.unpublishEvent',
  config: { policies: ['is-admin-user'] },
},
```

---

### Bước 4: Tạo Strapi Content Type (nếu chưa có)

Nếu resource chưa tồn tại trong Strapi, tạo content type:

```bash
cd apps/api
npm run strapi generate:api event
```

Hoặc tạo thủ công trong thư mục `src/api/event/`.

---

### Bước 5: Cập nhật Frontend (Tùy chọn)

Nếu cần UI cho resource mới trong Admin Panel:

#### 5.1. Thêm Types và API functions

**File:** `apps/admin/src/lib/admin-api.ts`

```typescript
export type EventItem = {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  // ... other fields
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

export type EventInput = {
  title?: string;
  slug?: string;
  // ... other fields
};

export async function listEvents(
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  filters?: { q?: string; status?: "all" | "draft" | "published" }
) {
  const query = new URLSearchParams({
    sort: "updatedAt:desc",
    "pagination[page]": String(page),
    "pagination[pageSize]": String(pageSize),
    ...(filters?.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters?.status && filters.status !== "all" ? { status: filters.status } : {}),
  });
  const payload = await request(`/api/management/events?${query.toString()}`);
  return toPaginated<EventItem>(payload, page, pageSize);
}

// ... other CRUD functions
```

#### 5.2. Thêm Menu Item

**File:** `apps/admin/src/components/admin-protected-layout.tsx`

```typescript
const menuItems = [
  // ... existing items
  { 
    href: "/events", 
    label: "Events", 
    icon: Calendar,  // import from lucide-react
    resource: "event", 
    action: "list" 
  },
];
```

#### 5.3. Tạo Manager Component

Tạo file `apps/admin/src/components/events-manager.tsx`:

```typescript
"use client";

import { can } from "@/lib/permissions";
// ... implement similar to posts-manager.tsx
```

---

### Bước 6: Grant Permissions cho Roles

Sau khi deploy code mới:

1. **Login vào Admin Panel** với tài khoản có quyền `user.update`
2. **Vào menu "Roles"**
3. **Chọn role cần cấp quyền** → Click "Edit permissions"
4. **Tìm resource mới** (ví dụ: "Event") trong danh sách permissions
5. **Tick chọn các actions** cần thiết:
   - `list` - Xem danh sách
   - `find` - Xem chi tiết
   - `create` - Tạo mới
   - `update` - Chỉnh sửa
   - `delete` - Xóa
   - `publish` - Publish
   - `unpublish` - Unpublish
6. **Click "Save Permissions"**

> **Lưu ý:** Các user thuộc role đó cần **logout và login lại** để nhận permissions mới.

---

## 🔄 Permission Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Login     │────▶│  API trả về      │────▶│  Lưu vào        │
│                 │     │  permissions     │     │  sessionStorage │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                            │
                                    ┌───────────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │  UI check       │
                           │  can(resource)  │
                           └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌─────────┐     ┌─────────┐      ┌─────────┐
              │ Hiện    │     │ Ẩn      │      │ Disable │
              │ button  │     │ button  │      │ + tooltip│
              └─────────┘     └─────────┘      └─────────┘
```

---

## ✅ Checklist

- [ ] Thêm resource vào `MANAGEMENT_RESOURCES`
- [ ] Thêm URL mapping vào `URL_PATH_TO_RESOURCE`
- [ ] Tạo API handlers trong `controllers/handlers/`
- [ ] Đăng ký routes trong `routes/management.ts`
- [ ] Tạo Strapi content type (nếu cần)
- [ ] Thêm API functions trong `admin-api.ts` (nếu cần UI)
- [ ] Thêm menu item trong `admin-protected-layout.tsx` (nếu cần UI)
- [ ] Tạo manager component (nếu cần UI)
- [ ] Grant permissions cho các role qua UI
- [ ] Test với user thuộc role đã cấp quyền

---

## 🐛 Troubleshooting

### Resource không hiện trong Role Permissions Editor

- Kiểm tra API `/api/management/available-actions` có trả về resource mới không
- Kiểm tra `resources-manifest.ts` đã được build/deploy chưa

### User không thể truy cập dù đã cấp quyền

- User cần **logout và login lại** để load permissions mới
- Kiểm tra role của user có trong `ADMIN_PANEL_ROLES` env không
- Kiểm tra policy `is-admin-user.ts` có log lỗi gì không

### API trả về 403 Forbidden

- Kiểm tra action string đúng format: `api::management.{resource}.{action}`
- Kiểm tra permissions đã được lưu đúng trong database chưa

---

## 📚 Tham khảo

- **Backend Policy:** `apps/api/src/policies/is-admin-user.ts`
- **Resources Manifest:** `apps/api/src/api/management/helpers/resources-manifest.ts`
- **Permission Check:** `apps/admin/src/lib/permissions.ts`
- **Role Editor:** `apps/admin/src/components/role-permissions-editor.tsx`
