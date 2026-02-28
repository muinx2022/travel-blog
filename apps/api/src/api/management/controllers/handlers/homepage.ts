import { getStrapi } from '../../helpers/common';

const UID = 'api::site-homepage.site-homepage';

export default {
  async findHomepage(ctx: any) {
    const strapi = getStrapi();
    const data = await strapi.documents(UID).findFirst();
    ctx.body = { data: data ?? null };
  },

  async updateHomepage(ctx: any) {
    const strapi = getStrapi();
    const payload = ctx.request.body?.data ?? {};
    const existing = await strapi.documents(UID).findFirst();

    if (!existing?.documentId) {
      const created = await strapi.documents(UID).create({ data: payload });
      ctx.body = { data: created };
      return;
    }

    const updated = await strapi.documents(UID).update({
      documentId: existing.documentId,
      data: payload,
    });
    ctx.body = { data: updated };
  },
};
