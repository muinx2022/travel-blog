# Task Implementation Plan

## Steps to Complete:

### 1. Update Site Header (site-header.tsx)
- [x] Redesign user dropdown menu with icons
- [x] Update menu items: Sửa hồ sơ, Các dịch vụ, Media, Đăng xuất
- [x] Add icons from lucide-react (User, Briefcase, Image, LogOut)
- [x] Improve styling with better hover effects

### 2. Create Unified API Endpoint (Strapi Backend)
- [x] Create Service layer: `apps/api/src/api/my-services/services/my-services-service.ts`
- [x] Create Controller layer: `apps/api/src/api/my-services/controllers/my-services.ts`
- [x] Create Routes: `apps/api/src/api/my-services/routes/my-services.ts`
- [x] Follow MVC pattern - Controller does NOT handle DB directly

### 3. Update Web Proxy (api/my-services-proxy/route.ts)
- [x] Update to use new unified `/api/my-services` endpoint
- [x] Support GET, POST, PUT, PATCH methods
- [x] Remove multiple separate endpoint calls

### 4. Update Services Page (app/my-services/page.tsx)
- [x] Update to use unified toggle endpoint
- [x] Display services in table format
- [x] Add columns: type, title, created, updated, status, actions
- [x] Implement status toggle via unified endpoint
- [x] Add edit button with hover tooltip

### 5. Testing
- [x] Test dropdown menu styling
- [x] Test unified API endpoint
- [x] Test services page functionality

## Implementation Complete!

### Files Created/Modified:

#### Backend (Strapi API):
1. `apps/api/src/api/my-services/services/my-services-service.ts` - Service layer for DB operations
2. `apps/api/src/api/my-services/controllers/my-services.ts` - Controller layer (MVC pattern)
3. `apps/api/src/api/my-services/routes/my-services.ts` - Route definitions

#### Frontend (Web App):
4. `apps/web/src/components/site-header.tsx` - Updated user dropdown menu with icons
5. `apps/web/src/app/api/my-services-proxy/route.ts` - Updated proxy to use unified endpoint
6. `apps/web/src/app/my-services/page.tsx` - Updated to use unified toggle endpoint

### Features Implemented:
- **Header Menu**: Redesigned with user greeting, icons for each menu item, and better styling
- **Menu Items**: Sửa hồ sơ → /profile/edit, Các dịch vụ → /my-services, Media → /my-media, Đăng xuất → logout
- **Unified API Endpoint**: Single `/api/my-services` endpoint replaces multiple separate endpoints
- **MVC Pattern**: Service layer handles DB, Controller handles HTTP
- **API Methods**:
  - `GET /api/my-services` - Get all user services with pagination
  - `GET /api/my-services/:type/:documentId` - Get single service
  - `POST /api/my-services` - Create new service
  - `PUT /api/my-services/:documentId` - Update service
  - `PATCH /api/my-services/:documentId/toggle-status` - Toggle publish/draft
  - `POST /api/my-services/:documentId/publish` - Publish service
  - `POST /api/my-services/:documentId/unpublish` - Unpublish service
- **Services Page**: Table with type badges, title, created/updated dates, status toggle, edit button with tooltip
- **Filter**: Click on stat cards to filter by service type

## Admin Redesign Complete! (apps/admin)

### Files Modified:
1. `apps/admin/src/components/posts-manager.tsx` - Added toggle status button to overlay
2. `apps/admin/src/components/hotels-manager.tsx` - Added hover overlay with toggle status
3. `apps/admin/src/components/tours-manager.tsx` - Added hover overlay with toggle status
4. `apps/admin/src/components/homestays-manager.tsx` - Added hover overlay with toggle status
5. `apps/admin/src/components/restaurants-manager.tsx` - Added hover overlay with toggle status
6. `apps/admin/src/components/souvenir-shops-manager.tsx` - Added hover overlay with toggle status

### Features:
- **Full-Row Hover Overlay**: Darker shadows covering entire row with gradient fade
- **Toggle Status Button**: Quick publish/unpublish from overlay (View → Toggle → Edit → Delete)
- **Consistent Design**: All managers use same overlay pattern and styling
- **Permission Aware**: Toggle button respects canTogglePublish permission

## How To Add New Service Type (Web)

1. Add type config in `apps/web/src/features/my-services/config/service-registry.ts`
2. Add/extend UI row field renderer in `apps/web/src/features/my-services/components/fields/`
3. Create thin proxy wrapper in `apps/web/src/app/api/my-<type>-proxy/route.ts` using `createMyServiceProxyHandlers`
4. Add list/new/edit routes in `apps/web/src/app/my-<type>/...` and reuse shared hooks/components:
   - `useMyServiceAuthGuard`
   - `CategoryMultiSelect`
   - `MyServiceListPage`
5. If service has custom fields, define `createTransform` and `updateTransform` in proxy wrapper
