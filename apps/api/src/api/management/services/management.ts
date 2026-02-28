import { getStrapi } from '../helpers/common';
import { MANAGEMENT_RESOURCES, toActionString, getFullActionList } from '../helpers/resources-manifest';

const USER_MODEL = 'plugin::users-permissions.user';
const ROLE_MODEL = 'plugin::users-permissions.role';
const POST_UID = 'api::post.post';
const TOUR_UID = 'api::tour.tour';
const HOTEL_UID = 'api::hotel.hotel';
const HOMESTAY_UID = 'api::homestay.homestay';
const RESTAURANT_UID = 'api::restaurant.restaurant';
const SOUVENIR_SHOP_UID = 'api::souvenir-shop.souvenir-shop';
const TRAVEL_GUIDE_UID = 'api::travel-guide.travel-guide';
const CATEGORY_UID = 'api::category.category';
const COMMENT_UID = 'api::comment.comment';
const TAG_UID = 'api::tag.tag';

type AnyObject = Record<string, any>;
type PermissionAction = 'list' | 'find' | 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
type PermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

const MANAGEMENT_ACTION_PREFIX = 'api::management.';

const RESOURCE_ALIASES: Record<string, string> = {
  post: 'post',
  posts: 'post',
  category: 'category',
  categories: 'category',
  tour: 'tour',
  tours: 'tour',
  hotel: 'hotel',
  hotels: 'hotel',
  comment: 'comment',
  comments: 'comment',
  user: 'user',
  users: 'user',
  role: 'role',
  roles: 'role',
  tag: 'tag',
  tags: 'tag',
  homestay: 'homestay',
  homestays: 'homestay',
  restaurant: 'restaurant',
  restaurants: 'restaurant',
  souvenirshop: 'souvenirShop',
  souvenirshops: 'souvenirShop',
  shop: 'souvenirShop',
  shops: 'souvenirShop',
  travelguide: 'travelGuide',
  travelguides: 'travelGuide',
  guide: 'travelGuide',
  guides: 'travelGuide',
  contentpage: 'contentPage',
  contentpages: 'contentPage',
  report: 'report',
  reports: 'report',
  contactrequest: 'contactRequest',
  contactrequests: 'contactRequest',
  contactemailtemplate: 'contactEmailTemplate',
  contactemailtemplates: 'contactEmailTemplate',
  homepage: 'homepage',
};

function normalizeResourceSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeActionSegment(value: string): PermissionAction | null {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'list' || normalized === 'find' || normalized === 'create' || normalized === 'update' || normalized === 'delete' || normalized === 'publish' || normalized === 'unpublish') {
    return normalized;
  }
  return null;
}

function parseLegacyManagementAction(legacyAction: string): { resource: string; action: PermissionAction } | null {
  const matched = legacyAction.match(/^(list|find|create|update|delete|publish|unpublish)([A-Z].+)$/);
  if (!matched) {
    return null;
  }

  const [, actionRaw, resourceRaw] = matched;
  const action = normalizeActionSegment(actionRaw);
  const resource = RESOURCE_ALIASES[normalizeResourceSegment(resourceRaw)];
  if (!action || !resource) {
    return null;
  }

  return { resource, action };
}

function parseManagementAction(action: string): { resource: string; action: PermissionAction } | null {
  if (!action.startsWith(MANAGEMENT_ACTION_PREFIX)) {
    return null;
  }

  const segments = action.split('.');

  if (segments.length >= 3 && segments[1] !== 'management') {
    const resource = RESOURCE_ALIASES[normalizeResourceSegment(segments[1] ?? '')];
    const actionSegment = normalizeActionSegment(segments[2] ?? '');
    if (!resource || !actionSegment) {
      return null;
    }
    return { resource, action: actionSegment };
  }

  if (segments.length >= 3 && segments[1] === 'management') {
    return parseLegacyManagementAction(segments[2] ?? '');
  }

  return null;
}

function sanitizeUser(user: AnyObject) {
  const isBanned = Boolean(user.isBanned);
  const banReason = typeof user.banReason === 'string' ? user.banReason : '';
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    blocked: Boolean(user.blocked),
    confirmed: Boolean(user.confirmed),
    isBanned,
    banReason: isBanned ? banReason : '',
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
          type: user.role.type,
        }
      : null,
  };
}

function summarizePost(item: AnyObject) {
  return {
    id: item.id,
    documentId: item.documentId,
    title: item.title,
    slug: item.slug,
    updatedAt: item.updatedAt,
  };
}

function summarizeSimpleContent(item: AnyObject) {
  return {
    id: item.id,
    documentId: item.documentId,
    title: item.title,
    slug: item.slug,
    updatedAt: item.updatedAt,
  };
}

function summarizeCategory(item: AnyObject) {
  return {
    id: item.id,
    documentId: item.documentId,
    name: item.name,
    slug: item.slug,
    updatedAt: item.updatedAt,
  };
}

function summarizeComment(item: AnyObject) {
  return {
    id: item.id,
    documentId: item.documentId,
    authorName: item.authorName,
    content: item.content,
    targetType: item.targetType,
    targetDocumentId: item.targetDocumentId,
    updatedAt: item.updatedAt,
  };
}

export default {
  // Dashboard
  async dashboardOverview(perms?: {
    canPost?: boolean; canCategory?: boolean; canComment?: boolean; canTag?: boolean;
    canTour?: boolean; canHotel?: boolean; canHomestay?: boolean; canRestaurant?: boolean;
    canSouvenirShop?: boolean; canTravelGuide?: boolean;
  }) {
    const strapi = getStrapi();
    const p = perms ?? {};
    const all = Object.keys(p).length === 0;
    const ok = (flag?: boolean) => all || flag === true;

    const NONE = Promise.resolve(null);
    const countOf = (uid: any) => strapi.entityService.count(uid) as Promise<number>;
    const recentOf = (uid: any, fields: string[]) =>
      strapi.entityService.findMany(uid, { fields, sort: { updatedAt: 'desc' }, limit: 5 }) as Promise<AnyObject[]>;

    const [
      postTotal, tourTotal, hotelTotal, homestayTotal,
      restaurantTotal, souvenirShopTotal, travelGuideTotal,
      categoryTotal, commentTotal, tagTotal,
      recentPosts, recentTours, recentHotels, recentHomestays,
      recentRestaurants, recentSouvenirShops, recentTravelGuides,
      recentCategories, recentComments, recentTags,
    ] = await Promise.all([
      ok(p.canPost)         ? countOf(POST_UID)          : NONE,
      ok(p.canTour)         ? countOf(TOUR_UID)          : NONE,
      ok(p.canHotel)        ? countOf(HOTEL_UID)         : NONE,
      ok(p.canHomestay)     ? countOf(HOMESTAY_UID)      : NONE,
      ok(p.canRestaurant)   ? countOf(RESTAURANT_UID)    : NONE,
      ok(p.canSouvenirShop) ? countOf(SOUVENIR_SHOP_UID) : NONE,
      ok(p.canTravelGuide)  ? countOf(TRAVEL_GUIDE_UID)  : NONE,
      ok(p.canCategory)     ? countOf(CATEGORY_UID)      : NONE,
      ok(p.canComment)      ? countOf(COMMENT_UID)       : NONE,
      ok(p.canTag)          ? countOf(TAG_UID)           : NONE,
      ok(p.canPost)         ? recentOf(POST_UID,          ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canTour)         ? recentOf(TOUR_UID,          ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canHotel)        ? recentOf(HOTEL_UID,         ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canHomestay)     ? recentOf(HOMESTAY_UID,      ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canRestaurant)   ? recentOf(RESTAURANT_UID,    ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canSouvenirShop) ? recentOf(SOUVENIR_SHOP_UID, ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canTravelGuide)  ? recentOf(TRAVEL_GUIDE_UID,  ['id', 'documentId', 'title', 'slug', 'updatedAt']) : NONE,
      ok(p.canCategory)     ? recentOf(CATEGORY_UID,      ['id', 'documentId', 'name', 'slug', 'updatedAt'])  : NONE,
      ok(p.canComment)      ? recentOf(COMMENT_UID,       ['id', 'documentId', 'authorName', 'content', 'targetType', 'targetDocumentId', 'updatedAt']) : NONE,
      ok(p.canTag)          ? recentOf(TAG_UID,           ['id', 'documentId', 'name', 'slug', 'updatedAt'])  : NONE,
    ]);

    return {
      totals: {
        posts:         postTotal         != null ? Number(postTotal)         : null,
        tours:         tourTotal         != null ? Number(tourTotal)         : null,
        hotels:        hotelTotal        != null ? Number(hotelTotal)        : null,
        homestays:     homestayTotal     != null ? Number(homestayTotal)     : null,
        restaurants:   restaurantTotal   != null ? Number(restaurantTotal)   : null,
        souvenirShops: souvenirShopTotal != null ? Number(souvenirShopTotal) : null,
        travelGuides:  travelGuideTotal  != null ? Number(travelGuideTotal)  : null,
        categories:    categoryTotal     != null ? Number(categoryTotal)     : null,
        comments:      commentTotal      != null ? Number(commentTotal)      : null,
        tags:          tagTotal          != null ? Number(tagTotal)          : null,
      },
      recent: {
        posts:         recentPosts         ? (recentPosts as AnyObject[]).map(summarizePost)               : [],
        tours:         recentTours         ? (recentTours as AnyObject[]).map(summarizeSimpleContent)      : [],
        hotels:        recentHotels        ? (recentHotels as AnyObject[]).map(summarizeSimpleContent)     : [],
        homestays:     recentHomestays     ? (recentHomestays as AnyObject[]).map(summarizeSimpleContent)  : [],
        restaurants:   recentRestaurants   ? (recentRestaurants as AnyObject[]).map(summarizeSimpleContent): [],
        souvenirShops: recentSouvenirShops ? (recentSouvenirShops as AnyObject[]).map(summarizeSimpleContent): [],
        travelGuides:  recentTravelGuides  ? (recentTravelGuides as AnyObject[]).map(summarizeSimpleContent): [],
        categories:    recentCategories    ? (recentCategories as AnyObject[]).map(summarizeCategory)      : [],
        comments:      recentComments      ? (recentComments as AnyObject[]).map(summarizeComment)         : [],
        tags:          recentTags          ? (recentTags as AnyObject[]).map((item) => ({
          id: item.id, documentId: item.documentId, name: item.name, slug: item.slug, updatedAt: item.updatedAt,
        })) : [],
      },
    };
  },

  // User management
  async listUsers(page: number, pageSize: number, keyword?: string) {
    const strapi = getStrapi();
    const q = String(keyword ?? '').trim();
    const filters = q
      ? {
          $or: [
            { username: { $containsi: q } },
            { email: { $containsi: q } },
          ],
        }
      : undefined;

    const users = await strapi.entityService.findMany(USER_MODEL, {
      fields: ['id', 'username', 'email', 'blocked', 'confirmed', 'isBanned', 'banReason'],
      populate: { role: { fields: ['id', 'name', 'type'] } },
      sort: { id: 'asc' },
      start: (page - 1) * pageSize,
      limit: pageSize,
      filters,
    });

    const total = await strapi.entityService.count(USER_MODEL, { filters });

    return {
      data: users.map((user: AnyObject) => sanitizeUser(user)),
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.max(1, Math.ceil(total / pageSize)),
          total,
        },
      },
    };
  },

  async findUser(id: number) {
    const strapi = getStrapi();
    const user = await strapi.entityService.findOne(USER_MODEL, id, {
      fields: ['id', 'username', 'email', 'blocked', 'confirmed', 'isBanned', 'banReason'],
      populate: { role: { fields: ['id', 'name', 'type'] } },
    });

    if (!user) {
      return null;
    }

    return sanitizeUser(user as AnyObject);
  },

  async listRoles() {
    const strapi = getStrapi();
    return strapi.db.query(ROLE_MODEL).findMany({
      select: ['id', 'name', 'type', 'description'],
      orderBy: { id: 'asc' },
      limit: 100,
    });
  },

  async createRole(payload: AnyObject) {
    const strapi = getStrapi();
    const name = String(payload.name ?? '').trim();
    if (!name) throw new Error('name is required');

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return strapi.db.query(ROLE_MODEL).create({
      data: { name, type: slug, description: String(payload.description ?? '').trim() },
    });
  },

  async updateRole(id: number, payload: AnyObject) {
    const strapi = getStrapi();
    const data: AnyObject = {};
    if (typeof payload.name === 'string' && payload.name.trim()) data.name = payload.name.trim();
    if (typeof payload.description === 'string') data.description = payload.description.trim();
    return strapi.db.query(ROLE_MODEL).update({ where: { id }, data });
  },

  async deleteRole(id: number) {
    const strapi = getStrapi();
    await strapi.db.query(ROLE_MODEL).delete({ where: { id } });
    return { id };
  },

  async createUser(payload: AnyObject) {
    const strapi = getStrapi();
    const username = String(payload.username ?? '').trim();
    const email = String(payload.email ?? '').trim();
    const password = String(payload.password ?? '').trim();

    if (!username || !email || !password) {
      throw new Error('username, email and password are required');
    }

    const userService = strapi.plugin('users-permissions').service('user');
    const created = await userService.add({
      username,
      email,
      password,
      provider: 'local',
      blocked: Boolean(payload.blocked),
      confirmed: payload.confirmed !== false,
      isBanned: Boolean(payload.isBanned),
      banReason: typeof payload.banReason === 'string' ? payload.banReason.trim() : '',
      role: payload.roleId ? Number(payload.roleId) : undefined,
    });

    const withRole = await strapi.db.query(USER_MODEL).findOne({
      where: { id: created.id },
      populate: { role: true },
    });
    return sanitizeUser((withRole ?? created) as AnyObject);
  },

  async updateUser(id: number, payload: AnyObject) {
    const strapi = getStrapi();
    const data: AnyObject = {};

    if (payload.blocked !== undefined) {
      data.blocked = Boolean(payload.blocked);
    }

    if (payload.confirmed !== undefined) {
      data.confirmed = payload.confirmed !== false;
    }

    if (typeof payload.username === 'string' && payload.username.trim()) {
      data.username = payload.username.trim();
    }

    if (typeof payload.email === 'string' && payload.email.trim()) {
      data.email = payload.email.trim();
    }

    if (typeof payload.password === 'string' && payload.password.trim()) {
      data.password = payload.password.trim();
    }

    if (payload.roleId !== undefined && payload.roleId !== null && payload.roleId !== '') {
      data.role = Number(payload.roleId);
    }

    if (payload.isBanned !== undefined) {
      data.isBanned = Boolean(payload.isBanned);
      if (!data.isBanned) {
        data.banReason = '';
      }
    }

    if (typeof payload.banReason === 'string') {
      data.banReason = payload.banReason.trim();
    }

    const userService = strapi.plugin('users-permissions').service('user');
    await userService.edit(id, data);

    const updated = await strapi.db.query(USER_MODEL).findOne({
      where: { id },
      populate: { role: true },
    });

    return sanitizeUser(updated as AnyObject);
  },

  async removeUser(id: number) {
    const strapi = getStrapi();
    const userService = strapi.plugin('users-permissions').service('user');
    await userService.remove({ id });
    return { id };
  },

  getAvailableActions() {
    return getFullActionList();
  },

  async getRolePermissions(roleId: number): Promise<Record<string, Record<string, boolean>>> {
    const strapi = getStrapi();
    const rows = await (strapi.query('plugin::users-permissions.permission') as any)
      .findMany({ where: { role: roleId } });

    const granted = new Set((rows as AnyObject[]).map((r) => String(r.action)));
    const result: Record<string, Record<string, boolean>> = {};
    for (const [resource, actions] of Object.entries(MANAGEMENT_RESOURCES)) {
      result[resource] = {};
      for (const action of actions) {
        result[resource][action] = granted.has(toActionString(resource, action));
      }
    }
    return result;
  },

  async setRolePermissions(roleId: number, permissionMap: Record<string, Record<string, boolean>>) {
    const strapi = getStrapi();
    // Use strapi.query() (same API as bootstrap) to ensure relations are stored correctly
    const permQuery = strapi.query('plugin::users-permissions.permission') as any;

    // Fetch existing rows (no `select` so `id` is always present)
    const allRows = (await permQuery.findMany({ where: { role: roleId } })) as AnyObject[];

    // Only process management actions to avoid touching other permissions
    const allManagementActions = new Set(getFullActionList().map((a) => a.actionString));
    const existing = allRows.filter((r) => allManagementActions.has(String(r.action)));

    const existingByAction = new Map<string, number>(
      existing.map((r) => [String(r.action), Number(r.id)]),
    );

    const toGrant: string[] = [];
    const toRevoke: number[] = [];

    for (const [resource, actions] of Object.entries(MANAGEMENT_RESOURCES)) {
      for (const action of actions) {
        const key = toActionString(resource, action);
        const shouldGrant = Boolean(permissionMap[resource]?.[action]);
        if (shouldGrant && !existingByAction.has(key)) {
          toGrant.push(key);
        } else if (!shouldGrant && existingByAction.has(key)) {
          toRevoke.push(existingByAction.get(key)!);
        }
      }
    }

    for (const id of toRevoke) {
      await permQuery.delete({ where: { id } });
    }
    for (const action of toGrant) {
      await permQuery.create({ data: { action, role: roleId } });
    }
  },

  async getMyPermissions(roleId: number): Promise<PermissionMap> {
    const strapi = getStrapi();
    const rows = await (strapi.query('plugin::users-permissions.permission') as any)
      .findMany({ where: { role: roleId } });

    const permissionMap: PermissionMap = {};

    for (const permission of rows as AnyObject[]) {
      const parsed = parseManagementAction(String(permission?.action ?? ''));
      if (!parsed) continue;
      const { resource, action } = parsed;
      permissionMap[resource] ??= {};
      permissionMap[resource][action] = true;
    }

    return permissionMap;
  },
};
