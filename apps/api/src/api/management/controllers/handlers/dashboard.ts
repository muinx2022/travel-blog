import { getStrapi } from '../../helpers/common';
import { MANAGEMENT_RESOURCES, toActionString } from '../../helpers/resources-manifest';

type JwtPayload = {
  id?: number;
};

export default {
  async dashboard(ctx: any) {
    try {
      const strapi = getStrapi();
      const service = strapi.service('api::management.management') as any;

      const managementUser = ctx.state?.managementUser as { roleType: string; granted: Set<string> | null } | undefined;
      const isAdmin = !managementUser || managementUser.roleType === 'admin' || managementUser.granted === null;
      const granted = managementUser?.granted ?? null;

      // Build allowed set: for each resource check if user has 'list' (or 'find' for special cases)
      const canResource = (resource: string, action: string) => {
        if (isAdmin) return true;
        return granted!.has(toActionString(resource, action));
      };

      const data = await service.dashboardOverview({
        canPost: canResource('post', 'list'),
        canCategory: canResource('category', 'list'),
        canComment: canResource('comment', 'list'),
        canTag: canResource('tag', 'list'),
        canTour: canResource('tour', 'list'),
        canHotel: canResource('hotel', 'list'),
        canHomestay: canResource('homestay', 'list'),
        canRestaurant: canResource('restaurant', 'list'),
        canSouvenirShop: canResource('souvenirShop', 'list'),
        canTravelGuide: canResource('travelGuide', 'list'),
      });
      ctx.body = { data };
    } catch (error) {
      console.error('[management.dashboard] failed', error);
      ctx.body = {
        data: {
          totals: {
            posts: 0,
            tours: 0,
            hotels: 0,
            categories: 0,
            comments: 0,
            tags: 0,
            homestays: 0,
            restaurants: 0,
            souvenirShops: 0,
            travelGuides: 0,
          },
          recent: {
            posts: [],
            tours: [],
            hotels: [],
            categories: [],
            comments: [],
            tags: [],
            homestays: [],
            restaurants: [],
            souvenirShops: [],
            travelGuides: [],
          },
        },
      };
    }
  },

  async myPermissions(ctx: any) {
    const authHeader = ctx.request.header?.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return ctx.unauthorized('Missing JWT token');
    }

    const strapi = getStrapi();
    const jwtService = strapi.plugin('users-permissions').service('jwt');

    let payload: JwtPayload;
    try {
      payload = (await jwtService.verify(token)) as JwtPayload;
    } catch {
      return ctx.unauthorized('Invalid JWT token');
    }

    if (!payload?.id) {
      return ctx.unauthorized('Invalid token payload');
    }

    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({
        where: { id: payload.id },
        populate: { role: true },
      });

    const roleId = Number(user?.role?.id);
    if (!Number.isFinite(roleId)) {
      return ctx.forbidden('User role is not available');
    }

    const roleType = String(user?.role?.type ?? '').toLowerCase();
    const service = strapi.service('api::management.management') as any;

    // Admin role gets full access — build full permissions map inline
    let permissions: Record<string, Record<string, boolean>>;
    if (roleType === 'admin') {
      permissions = {};
      for (const [resource, actions] of Object.entries(MANAGEMENT_RESOURCES)) {
        permissions[resource] = Object.fromEntries(actions.map((a) => [a, true]));
      }
    } else {
      permissions = await service.getMyPermissions(roleId);
    }

    ctx.body = {
      permissions,
      role: {
        id: user?.role?.id,
        name: user?.role?.name,
        type: user?.role?.type,
      },
    };
  },
};
