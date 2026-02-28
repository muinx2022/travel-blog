import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  async find(ctx) {
    const isAuthenticated = !!ctx.state?.user?.id;
    if (!isAuthenticated) {
      ctx.query = { ...ctx.query, status: 'published' };
    }
    const { data, meta } = await super.find(ctx);
    ctx.body = { data, meta };
  },

  async findOne(ctx) {
    ctx.query = { ...ctx.query, status: 'published' };
    try {
      const result = await super.findOne(ctx);
      if (!result || !result.data) {
        return ctx.notFound('Restaurant not found');
      }
      ctx.body = { data: result.data, meta: result.meta };
    } catch (error) {
      strapi.log.error('[restaurant.findOne] error:', error);
      return ctx.notFound('Restaurant not found');
    }
  },

  async userCreate(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const {
      title,
      slug,
      content,
      categories,
      address,
      city,
      cuisineType,
      priceRange,
      excerpt,
      thumbnail,
      images,
    } = ctx.request.body?.data || {};

    if (!title || !content) {
      return ctx.badRequest('Title and content are required');
    }

    try {
      const restaurant = await strapi.documents('api::restaurant.restaurant').create({
        data: {
          title,
          slug,
          content,
          excerpt,
          author: userId,
          categories: categories || [],
          address,
          city,
          cuisineType,
          priceRange,
          thumbnail,
          images,
        },
        status: 'draft',
      });

      ctx.body = { data: restaurant };
    } catch (error) {
      strapi.log.error('[restaurant.userCreate] error:', error);
      return ctx.badRequest('Failed to create restaurant');
    }
  },

  async userUpdate(ctx) {
    const userId = ctx.state?.user?.id;
    const documentId = ctx.params.documentId;

    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    try {
      const existing = await strapi.documents('api::restaurant.restaurant').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only update your own restaurants');
      }

      const {
        title,
        content,
        categories,
        address,
        city,
        cuisineType,
        priceRange,
        excerpt,
        thumbnail,
        images,
      } = ctx.request.body?.data || {};

      const updated = await strapi.documents('api::restaurant.restaurant').update({
        documentId,
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(categories && { categories }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(cuisineType !== undefined && { cuisineType }),
          ...(priceRange !== undefined && { priceRange }),
          ...(excerpt !== undefined && { excerpt }),
          ...(thumbnail !== undefined && { thumbnail }),
          ...(images !== undefined && { images }),
        },
      });

      ctx.body = { data: updated };
    } catch (error) {
      strapi.log.error('[restaurant.userUpdate] error:', error);
      return ctx.badRequest('Failed to update restaurant');
    }
  },

  async myRestaurants(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const page = Math.max(1, parseInt((ctx.query.page as string) || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt((ctx.query.pageSize as string) || '10', 10)));
    const status = ctx.query.status === 'published' ? 'published' : 'draft';

    try {
      const [rows, total] = await Promise.all([
        strapi.documents('api::restaurant.restaurant').findMany({
          filters: {
            author: { id: userId },
          },
          status,
          sort: 'updatedAt:desc',
          populate: ['categories', 'thumbnail'],
          pagination: { page, pageSize },
        }),
        strapi.documents('api::restaurant.restaurant').count({
          filters: {
            author: { id: userId },
          },
          status,
        }),
      ]);

      ctx.body = {
        data: rows || [],
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.max(1, Math.ceil((total || 0) / pageSize)),
            total: total || 0,
          },
        },
      };
    } catch (error) {
      strapi.log.error('[restaurant.myRestaurants] error:', error);
      ctx.body = {
        data: [],
        meta: {
          pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
        },
      };
    }
  },

  async userPublish(ctx) {
    const userId = ctx.state?.user?.id;
    const documentId = String(ctx.params?.documentId ?? '').trim();

    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    try {
      const existing = await strapi.documents('api::restaurant.restaurant').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only publish your own restaurants');
      }

      const documentsApi = strapi.documents('api::restaurant.restaurant') as any;
      if (typeof documentsApi.publish === 'function') {
        const result = await documentsApi.publish({ documentId });
        ctx.body = { data: result?.entries?.[0] ?? null };
        return;
      }

      if (!existing.id) {
        return ctx.badRequest('Restaurant not found');
      }

      await strapi.entityService.update('api::restaurant.restaurant', existing.id, {
        data: { publishedAt: new Date().toISOString() },
      });

      const updated = await strapi.documents('api::restaurant.restaurant').findOne({
        documentId,
        status: 'published',
      });

      ctx.body = { data: updated ?? null };
    } catch (error) {
      strapi.log.error('[restaurant.userPublish] error:', error);
      return ctx.badRequest('Failed to publish restaurant');
    }
  },

  async userUnpublish(ctx) {
    const userId = ctx.state?.user?.id;
    const documentId = String(ctx.params?.documentId ?? '').trim();

    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    try {
      const existing = await strapi.documents('api::restaurant.restaurant').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only unpublish your own restaurants');
      }

      const documentsApi = strapi.documents('api::restaurant.restaurant') as any;
      if (typeof documentsApi.unpublish === 'function') {
        const result = await documentsApi.unpublish({ documentId });
        ctx.body = { data: result ?? null };
        return;
      }

      if (!existing.id) {
        return ctx.badRequest('Restaurant not found');
      }

      await strapi.entityService.update('api::restaurant.restaurant', existing.id, {
        data: { publishedAt: null },
      });

      const updated = await strapi.documents('api::restaurant.restaurant').findOne({
        documentId,
        status: 'draft',
      });

      ctx.body = { data: updated ?? null };
    } catch (error) {
      strapi.log.error('[restaurant.userUnpublish] error:', error);
      return ctx.badRequest('Failed to unpublish restaurant');
    }
  },
}));
