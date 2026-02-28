import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::travel-guide.travel-guide', ({ strapi }) => ({
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
        return ctx.notFound('Travel guide not found');
      }
      ctx.body = { data: result.data, meta: result.meta };
    } catch (error) {
      strapi.log.error('[travel-guide.findOne] error:', error);
      return ctx.notFound('Travel guide not found');
    }
  },
}));
