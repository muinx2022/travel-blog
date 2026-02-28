import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::tag.tag', () => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    ctx.body = { data, meta };
  },

  async findOne(ctx) {
    const result = await super.findOne(ctx);
    if (!result || !result.data) {
      return ctx.notFound('Tag not found');
    }
    ctx.body = { data: result.data, meta: result.meta };
  },
}));
