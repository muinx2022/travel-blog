import { getStrapi } from '../../helpers/common';

const UID = 'api::contact-email-template.contact-email-template';

export default {
  async findContactEmailTemplate(ctx: any) {
    const strapi = getStrapi();
    const data = await strapi.documents(UID).findFirst();
    ctx.body = { data: data ?? null };
  },

  async updateContactEmailTemplate(ctx: any) {
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

