import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::tour.tour', ({ strapi }) => ({
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
        return ctx.notFound('Tour not found');
      }
      ctx.body = { data: result.data, meta: result.meta };
    } catch (error) {
      console.error('[tour.findOne] error:', error);
      return ctx.notFound('Tour not found');
    }
  },

  async userCreate(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { title, slug, content, categories, destination, duration, price, itinerary } =
      ctx.request.body?.data || {};

    if (!title || !content) {
      return ctx.badRequest('Title and content are required');
    }

    try {
      const tour = await strapi.documents('api::tour.tour').create({
        data: {
          title,
          slug,
          content,
          author: userId,
          categories: categories || [],
          destination,
          duration,
          price,
          itinerary: itinerary || [],
        },
        status: 'draft',
      });

      ctx.body = { data: tour };
    } catch (error) {
      console.error('[tour.userCreate] error:', error);
      return ctx.badRequest('Failed to create tour');
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
      const existing = await strapi.documents('api::tour.tour').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only update your own tours');
      }

      const { title, content, categories, destination, duration, price, itinerary } =
        ctx.request.body?.data || {};

      const updated = await strapi.documents('api::tour.tour').update({
        documentId,
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(categories && { categories }),
          ...(destination !== undefined && { destination }),
          ...(duration !== undefined && { duration }),
          ...(price !== undefined && { price }),
          ...(itinerary && { itinerary }),
        },
      });

      ctx.body = { data: updated };
    } catch (error) {
      console.error('[tour.userUpdate] error:', error);
      return ctx.badRequest('Failed to update tour');
    }
  },

  async myTours(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const page = Math.max(1, parseInt(ctx.query.page as string || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(ctx.query.pageSize as string || '10', 10)));
    const status = ctx.query.status === 'published' ? 'published' : 'draft';

    try {
      const [tours, total] = await Promise.all([
        strapi.documents('api::tour.tour').findMany({
          filters: {
            author: {
              id: userId,
            },
          },
          status,
          sort: 'updatedAt:desc',
          populate: ['categories'],
          pagination: { page, pageSize },
        }),
        strapi.documents('api::tour.tour').count({
          filters: {
            author: {
              id: userId,
            },
          },
          status,
        }),
      ]);

      ctx.body = {
        data: tours || [],
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
      console.error('[tour.myTours] error:', error);
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
      const existing = await strapi.documents('api::tour.tour').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only publish your own tours');
      }

      const documentsApi = strapi.documents('api::tour.tour') as any;
      if (typeof documentsApi.publish === 'function') {
        const result = await documentsApi.publish({ documentId });
        ctx.body = { data: result?.entries?.[0] ?? null };
        return;
      }

      if (!existing.id) {
        return ctx.badRequest('Tour not found');
      }

      await strapi.entityService.update('api::tour.tour', existing.id, {
        data: { publishedAt: new Date().toISOString() },
      });

      const updated = await strapi.documents('api::tour.tour').findOne({
        documentId,
        status: 'published',
      });

      ctx.body = { data: updated ?? null };
    } catch (error) {
      console.error('[tour.userPublish] error:', error);
      return ctx.badRequest('Failed to publish tour');
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
      const existing = await strapi.documents('api::tour.tour').findOne({
        documentId,
        populate: ['author'],
      });

      if (!existing || existing.author?.id !== userId) {
        return ctx.forbidden('You can only unpublish your own tours');
      }

      const documentsApi = strapi.documents('api::tour.tour') as any;
      if (typeof documentsApi.unpublish === 'function') {
        const result = await documentsApi.unpublish({ documentId });
        ctx.body = { data: result ?? null };
        return;
      }

      if (!existing.id) {
        return ctx.badRequest('Tour not found');
      }

      await strapi.entityService.update('api::tour.tour', existing.id, {
        data: { publishedAt: null },
      });

      const updated = await strapi.documents('api::tour.tour').findOne({
        documentId,
        status: 'draft',
      });

      ctx.body = { data: updated ?? null };
    } catch (error) {
      console.error('[tour.userUnpublish] error:', error);
      return ctx.badRequest('Failed to unpublish tour');
    }
  },
}));
