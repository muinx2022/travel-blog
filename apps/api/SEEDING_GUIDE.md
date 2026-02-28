# Database Seeding Guide

This guide explains how to seed the Travel Blog database with initial sample data.

## Overview

The project includes automated seeding functionality that populates the Strapi database with:
- **10 Tags** (geographic locations and travel themes)
- **3 Homestays** (accommodations in different cities)
- **3 Restaurants** (dining establishments)
- **3 Souvenir Shops** (retail locations)
- **4 Travel Guides** (content guides in different formats)

Additionally, public role permissions are automatically granted to access these new content types.

## Enabling Seeding

### Step 1: Configure Environment Variable

Open or create `.env` file in the `apps/api` directory and set:

```env
SEED_DATA=true
```

By default, `SEED_DATA=false` to prevent accidental data overwrites.

### Step 2: Start Strapi

Run Strapi in development mode:

```bash
# From project root
pnpm dev

# Or from apps/api directory
pnpm develop
```

The seeding will automatically run during the bootstrap phase when `SEED_DATA=true`.

### Step 3: Verify in Admin Panel

1. Navigate to http://localhost:1337/admin
2. Sign in with your admin credentials (default: `admin@example.com` / `admin123`)
3. Check the following new content types in the sidebar:
   - **Tags**
   - **Homestays**
   - **Restaurants**
   - **Souvenir Shops**
   - **Travel Guides**

All should be populated with sample data.

## Sample Data Structure

### Tags (10 total)
Geographic and thematic tags used across Posts and Tours:
- Tràng An, Ninh Bình, Hạ Long, Đà Nẵng, Đà Lạt, Phú Quốc, Hà Nội, Hạ Long Bay, Mekong Delta, Sapa

### Homestays (3 total)
- Tràng An Riverside Homestay (Ninh Bình)
- Hạ Long Garden Home (Hạ Long)
- Đà Nẵng Beachfront Homestay (Đà Nẵng)

### Restaurants (3 total)
- Tràng An Restaurant (Vietnamese cuisine, Ninh Bình)
- Seaside Grille (Seafood, Hạ Long)
- Da Nang Style (Local cuisine, Đà Nẵng)

### Souvenir Shops (3 total)
- Ninh Bình Handicraft Shop (Crafts)
- Ha Long Souvenir Corner (Souvenirs)
- Da Nang Silk Shop (Silk products)

### Travel Guides (4 total)
- Beginner guide to Tràng An
- Money-saving tips for Hạ Long
- 3-day Đà Nẵng itinerary
- 2024 Đà Lạt comprehensive guide

## How Seeding Works

### Bootstrap Process

When `SEED_DATA=true`, the Strapi bootstrap function (`src/index.ts`) performs:

1. **Data Validation**: Checks if entities already exist by slug
2. **Creation**: Only creates missing entities (prevents duplicates on restart)
3. **Publishing**: All entities are published by setting `publishedAt` to current timestamp
4. **Permissions**: Automatically grants public role access to all new content types

### Seed Data Files

- **`src/seedData.ts`**: Contains the sample data structure with all tags, homestays, restaurants, shops, and guides
- **`src/bootstrap.ts`**: Exports `seedInitialData()` function that handles the actual database operations

### Permissions Granted

When seeding runs, the following permissions are automatically added to the public role:

```
api::tag.tag.find
api::tag.tag.findOne
api::homestay.homestay.find
api::homestay.homestay.findOne
api::restaurant.restaurant.find
api::restaurant.restaurant.findOne
api::souvenir-shop.souvenir-shop.find
api::souvenir-shop.souvenir-shop.findOne
api::travel-guide.travel-guide.find
api::travel-guide.travel-guide.findOne
```

## Disabling Seeding

To prevent seeding on startup:

```bash
# Option 1: Set environment variable
export SEED_DATA=false

# Option 2: Comment out SEED_DATA in .env (it defaults to false)
# SEED_DATA=true
```

## Testing the Frontend

After seeding, test the frontend features:

### Post Detail Page
1. Navigate to any post on the web app
2. The sidebar should show suggested tours, homestays, restaurants, shops, and guides
3. Suggestions are based on matching tags

### Category Pages
1. Browse category pages
2. New content type entities should be visible where integrated

## Troubleshooting

### Seeds Not Appearing

1. **Check environment variable**: Ensure `SEED_DATA=true` in `.env`
2. **Browser cache**: Clear browser cache or hard refresh
3. **Database state**: If entities were created in previous runs, they won't be recreated
4. **Logs**: Check terminal output for seed progress messages starting with `[seed]`

### Duplicate Data Issues

If you accidentally ran with seeding enabled multiple times:

1. Go to Strapi Admin
2. Manually delete duplicates
3. Ensure each slug is unique
4. Restart Strapi with `SEED_DATA=false` to prevent recreation

### Permission Errors

If public users can't access content:

1. Go to Admin → Settings → Users & Permissions → Roles
2. Click "Public" role
3. Manually check that find/findOne permissions are granted for each new type
4. Re-run seeding with `SEED_DATA=true` to auto-grant permissions

## Adding More Sample Data

To add more sample data:

1. Edit `src/seedData.ts`
2. Add new entries to appropriate arrays (`tags`, `homestays`, `restaurants`, `shops`, `guides`)
3. Ensure each entry has unique `slug` values
4. Set `SEED_DATA=true` and restart Strapi
5. New entries will be created while existing ones are skipped

## Production Notes

**⚠️ WARNING**: Do not enable `SEED_DATA=true` in production environments. This is intended for development/demo purposes only.

For production:
- Manually create content through the admin panel
- Or use the Strapi CLI tools for controlled data imports
- Always set `SEED_DATA=false` in `.env` on production servers
