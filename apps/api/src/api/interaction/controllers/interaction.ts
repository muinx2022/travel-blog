import { factories } from '@strapi/strapi';

type JwtPayload = {
  id?: number;
};

type TemplateFields = {
  ownerSubject?: string;
  ownerBody?: string;
  adminSubject?: string;
  adminBody?: string;
  requesterSubject?: string;
  requesterBody?: string;
};

type TemplatePayload = TemplateFields & {
  serviceOverrides?: Record<string, Partial<TemplateFields>>;
};

type ContactTarget = {
  uid: string;
  type: string;
};

type TargetEntity = {
  documentId: string;
  title?: string | null;
  author?: { id?: number; email?: string | null; username?: string | null } | null;
};

const ALLOWED_ACTIONS = new Set(['like', 'follow', 'share', 'report']);
const TARGET_UID_BY_TYPE: Record<string, string> = {
  post: 'api::post.post',
  hotel: 'api::hotel.hotel',
  shop: 'api::souvenir-shop.souvenir-shop',
  'souvenir-shop': 'api::souvenir-shop.souvenir-shop',
  tour: 'api::tour.tour',
  restaurant: 'api::restaurant.restaurant',
  homestay: 'api::homestay.homestay',
};

async function resolveAuthUser(ctx: any, strapi: any) {
  if (ctx.state?.user?.id) {
    return ctx.state.user;
  }

  try {
    const jwtService = strapi.plugin('users-permissions').service('jwt');
    const userService = strapi.plugin('users-permissions').service('user');
    const payload = (await jwtService.getToken(ctx)) as JwtPayload;
    if (!payload?.id) {
      return null;
    }

    const user = await userService.fetchAuthenticatedUser(payload.id);
    return user ?? null;
  } catch {
    return null;
  }
}

function normalizeTargetType(rawType: unknown) {
  const type = String(rawType ?? '').trim().toLowerCase();
  return type === 'shop' ? 'souvenir-shop' : type;
}

function interpolateTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

function defaultTemplates(): Required<TemplateFields> {
  return {
    ownerSubject: '[Travel Blog] Ban nhan duoc lien he moi',
    ownerBody:
      'Xin chao {ownerName},\n\n{requesterName} da lien he ve "{targetTitle}" ({targetType}).\nNoi dung:\n{message}\n\nTrang chi tiet: {targetLink}',
    adminSubject: '[Travel Blog] Co lien he moi tu nguoi dung',
    adminBody:
      'Nguoi gui: {requesterName} ({requesterEmail})\nMuc tieu: "{targetTitle}" ({targetType})\nOwner: {ownerName} ({ownerEmail})\nNoi dung:\n{message}\n\nTrang chi tiet: {targetLink}',
    requesterSubject: '[Travel Blog] Da gui lien he thanh cong',
    requesterBody:
      'Chao {requesterName},\n\nBan da gui lien he den "{targetTitle}" ({targetType}).\nNoi dung cua ban:\n{message}\n\nChung toi da thong bao den chu so huu noi dung va admin.',
  };
}

function normalizeTemplatePayload(
  input: Partial<TemplateFields> | null | undefined,
  fallback: Required<TemplateFields>
): Required<TemplateFields> {
  return {
    ownerSubject: input?.ownerSubject?.trim() || fallback.ownerSubject,
    ownerBody: input?.ownerBody?.trim() || fallback.ownerBody,
    adminSubject: input?.adminSubject?.trim() || fallback.adminSubject,
    adminBody: input?.adminBody?.trim() || fallback.adminBody,
    requesterSubject: input?.requesterSubject?.trim() || fallback.requesterSubject,
    requesterBody: input?.requesterBody?.trim() || fallback.requesterBody,
  };
}

async function loadEmailTemplates(strapi: any, targetType: string): Promise<Required<TemplateFields>> {
  const fallback = defaultTemplates();
  try {
    const record = (await strapi.db
      .query('api::contact-email-template.contact-email-template')
      .findOne({ where: {} })) as TemplatePayload | null;

    const base = normalizeTemplatePayload(record, fallback);
    const overridesRaw = (record?.serviceOverrides ?? {}) as Record<string, Partial<TemplateFields>>;
    const targetOverrides = overridesRaw?.[targetType] ?? overridesRaw?.other;
    return normalizeTemplatePayload(targetOverrides, base);
  } catch {
    return fallback;
  }
}

async function sendEmailSafe(strapi: any, to: string, subject: string, text: string) {
  if (!to || !subject || !text) return;
  try {
    await strapi.plugin('email').service('email').send({
      to,
      subject,
      text,
    });
  } catch {
    // Email is optional if provider is not configured.
  }
}

async function resolveContactTarget(strapi: any, targetTypeInput: unknown): Promise<ContactTarget | null> {
  const targetType = normalizeTargetType(targetTypeInput);
  const uid = TARGET_UID_BY_TYPE[targetType];
  if (!uid) return null;
  return { uid, type: targetType };
}

async function findTargetEntity(strapi: any, uid: string, targetDocumentId: string): Promise<TargetEntity | null> {
  try {
    const entity = (await strapi.db.query(uid).findOne({
      where: { documentId: targetDocumentId },
      select: ['documentId', 'title'],
      populate: { author: { select: ['id', 'email', 'username'] } },
    })) as TargetEntity | null;
    return entity;
  } catch {
    return null;
  }
}

async function findAdminRecipients(strapi: any): Promise<Array<{ id: number; email: string; username?: string }>> {
  const configuredEmail = String(process.env.ADMIN_NOTIFICATION_EMAIL ?? '').trim().toLowerCase();

  const users = (await strapi.query('plugin::users-permissions.user').findMany({
    where: {
      role: {
        type: 'admin',
      },
    },
    select: ['id', 'email', 'username'],
  })) as Array<{ id: number; email: string; username?: string }>;

  const filtered = users.filter((u) => !!u?.email);
  if (filtered.length > 0) return filtered;

  if (!configuredEmail) return [];
  return [{ id: 0, email: configuredEmail, username: 'admin' }];
}

export default factories.createCoreController('api::interaction.interaction', ({ strapi }) => ({
  async mine(ctx) {
    const user = await resolveAuthUser(ctx, strapi);
    if (!user) {
      return ctx.send({ data: [] });
    }

    const { targetType, targetDocumentId } = ctx.query as Record<string, string>;

    // strapi.db.query where: plain scalar for a relation = filter by the FK value
    const where: Record<string, unknown> = { user: user.id };
    if (targetType) where.targetType = targetType;
    if (targetDocumentId) where.targetDocumentId = targetDocumentId;

    const interactions = await strapi.db.query('api::interaction.interaction').findMany({
      where,
      select: ['actionType', 'targetDocumentId'],
      limit: 200,
    });

    return ctx.send({ data: interactions });
  },

  async toggle(ctx) {
    const user = await resolveAuthUser(ctx, strapi);
    if (!user) {
      return ctx.unauthorized('You must be logged in to perform this action.');
    }

    const actionType = String(ctx.request.body?.actionType ?? '').trim().toLowerCase();
    const targetType = normalizeTargetType(ctx.request.body?.targetType);
    const targetDocumentId = String(ctx.request.body?.targetDocumentId ?? '').trim();

    if (!actionType || !targetType || !targetDocumentId) {
      return ctx.badRequest('Missing required fields.');
    }

    if (!ALLOWED_ACTIONS.has(actionType)) {
      return ctx.badRequest('Unsupported action type.');
    }

    if (actionType === 'follow' && targetType !== 'post') {
      return ctx.badRequest('Follow is only available for posts.');
    }

    const existing = await strapi.db.query('api::interaction.interaction').findMany({
      where: {
        user: user.id,
        actionType,
        targetType,
        targetDocumentId,
      },
      limit: 1,
    });

    if (existing.length > 0) {
      await strapi.db.query('api::interaction.interaction').delete({
        where: { id: existing[0].id },
      });
      return ctx.send({ data: { message: `Removed ${actionType}`, active: false } });
    }

    const created = await strapi.db.query('api::interaction.interaction').create({
      data: {
        actionType,
        targetType,
        targetDocumentId,
        user: user.id,
        publishedAt: new Date(),
      },
    });
    return ctx.send({ data: { message: `Added ${actionType}`, active: true, interaction: created } });
  },

  async contact(ctx) {
    const user = await resolveAuthUser(ctx, strapi);
    if (!user) {
      return ctx.unauthorized('You must be logged in to contact the owner.');
    }

    const targetTypeInput = ctx.request.body?.targetType;
    const targetDocumentId = String(ctx.request.body?.targetDocumentId ?? '').trim();
    const message = String(ctx.request.body?.message ?? '').trim();

    if (!targetTypeInput || !targetDocumentId || !message) {
      return ctx.badRequest('Missing required fields.');
    }

    if (message.length < 10) {
      return ctx.badRequest('Message must be at least 10 characters.');
    }

    const target = await resolveContactTarget(strapi, targetTypeInput);
    if (!target) {
      return ctx.badRequest('Unsupported contact target type.');
    }

    if (target.type === 'post') {
      return ctx.badRequest('Post does not support contact action.');
    }

    const entity = await findTargetEntity(strapi, target.uid, targetDocumentId);
    if (!entity) {
      return ctx.notFound('Target entity not found.');
    }

    const owner = entity.author;
    if (!owner?.id) {
      return ctx.badRequest('Target does not have an owner to contact.');
    }

    const requestRecord = await strapi.db.query('api::contact-request.contact-request').create({
      data: {
        targetType: target.type,
        targetDocumentId,
        targetTitle: entity.title ?? null,
        message,
        requesterName: user.username ?? user.email ?? `user-${user.id}`,
        requesterEmail: user.email ?? null,
        requesterUser: user.id,
        ownerUser: owner.id,
        status: 'pending',
      },
    });

    const templates = await loadEmailTemplates(strapi, target.type);
    const targetLink = `${process.env.WEB_BASE_URL ?? 'http://localhost:3000'}/${target.type}s/${entity.documentId}`;
    const vars = {
      requesterName: String(user.username ?? user.email ?? `user-${user.id}`),
      requesterEmail: String(user.email ?? ''),
      ownerName: String(owner.username ?? owner.email ?? `user-${owner.id}`),
      ownerEmail: String(owner.email ?? ''),
      targetType: target.type,
      targetTitle: String(entity.title ?? 'No title'),
      targetDocumentId,
      message,
      targetLink,
    };

    if (owner.id !== user.id) {
      await strapi.db.query('api::notification.notification').create({
        data: {
          type: 'contact_owner',
          title: 'Lien he moi',
          message: `${vars.requesterName} da gui lien he toi ban ve "${vars.targetTitle}".`,
          targetType: target.type,
          targetDocumentId,
          recipientUser: owner.id,
          recipientEmail: owner.email ?? null,
          publishedAt: new Date(),
        },
      });
    }

    const adminRecipients = await findAdminRecipients(strapi);
    for (const admin of adminRecipients) {
      if (!admin.email) continue;
      await strapi.db.query('api::notification.notification').create({
        data: {
          type: 'contact_admin',
          title: 'Co lien he moi',
          message: `${vars.requesterName} vua lien he ve "${vars.targetTitle}".`,
          targetType: target.type,
          targetDocumentId,
          recipientUser: admin.id > 0 ? admin.id : null,
          recipientEmail: admin.email,
          publishedAt: new Date(),
        },
      });
    }

    await strapi.db.query('api::notification.notification').create({
      data: {
        type: 'contact_requester',
        title: 'Da gui lien he',
        message: `Ban da gui lien he thanh cong den owner cua "${vars.targetTitle}".`,
        targetType: target.type,
        targetDocumentId,
        recipientUser: user.id,
        recipientEmail: user.email ?? null,
        publishedAt: new Date(),
      },
    });

    if (owner.email) {
      await sendEmailSafe(
        strapi,
        owner.email,
        interpolateTemplate(templates.ownerSubject, vars),
        interpolateTemplate(templates.ownerBody, vars)
      );
    }

    for (const admin of adminRecipients) {
      await sendEmailSafe(
        strapi,
        admin.email,
        interpolateTemplate(templates.adminSubject, vars),
        interpolateTemplate(templates.adminBody, vars)
      );
    }

    if (user.email) {
      await sendEmailSafe(
        strapi,
        user.email,
        interpolateTemplate(templates.requesterSubject, vars),
        interpolateTemplate(templates.requesterBody, vars)
      );
    }

    await strapi.db.query('api::contact-request.contact-request').update({
      where: { id: requestRecord.id },
      data: { status: 'sent' },
    });

    return ctx.send({ data: { ok: true, requestId: requestRecord.id } });
  },
}));
