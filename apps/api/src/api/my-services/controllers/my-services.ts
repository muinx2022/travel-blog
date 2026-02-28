import { createMyServicesService, type ServiceType } from '../services/my-services-service';

const VALID_SERVICE_TYPES: ServiceType[] = [
  'post',
  'tour',
  'hotel',
  'homestay',
  'restaurant',
  'souvenir-shop',
];

function isValidServiceType(type: string): type is ServiceType {
  return VALID_SERVICE_TYPES.includes(type as ServiceType);
}

export default {
  async find(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const query = ctx.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '100', 10)));

    try {
      const service = createMyServicesService(strapi);
      const result = await service.getAllServices(userId, page, pageSize);

      ctx.body = {
        data: result.data,
        meta: result.meta,
      };
    } catch (error) {
      strapi.log.error('[my-services.find] Error:', error);
      ctx.body = {
        data: [],
        meta: {
          pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
          byType: {
            post: 0,
            tour: 0,
            hotel: 0,
            homestay: 0,
            restaurant: 0,
            'souvenir-shop': 0,
          },
        },
      };
    }
  },

  async findOne(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { type, documentId } = ctx.params as { type?: string; documentId?: string };

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.getServiceById(userId, type, documentId);

      if (!result) {
        return ctx.notFound('Service not found');
      }

      ctx.body = { data: result };
    } catch (error) {
      strapi.log.error('[my-services.findOne] Error:', error);
      return ctx.badRequest('Failed to fetch service');
    }
  },

  async create(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const body = ctx.request.body as {
      data?: {
        type?: string;
        title?: string;
        slug?: string;
        content?: string;
        categories?: number[];
        [key: string]: unknown;
      };
    };

    const { type, title, slug, content, categories, ...extraFields } = body.data || {};

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    if (!title || !content) {
      return ctx.badRequest('Title and content are required');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.createService(userId, {
        type,
        title,
        slug,
        content,
        categories,
        ...extraFields,
      });

      ctx.body = { data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create service';
      strapi.log.error('[my-services.create] Error:', error);
      return ctx.badRequest(message);
    }
  },

  async update(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { documentId } = ctx.params as { documentId?: string };
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const body = ctx.request.body as {
      data?: {
        type?: string;
        title?: string;
        content?: string;
        categories?: number[];
        [key: string]: unknown;
      };
    };

    const { type, title, content, categories, ...extraFields } = body.data || {};

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.updateService(userId, type, documentId, {
        title,
        content,
        categories,
        ...extraFields,
      });

      if (!result) {
        return ctx.notFound('Service not found or update failed');
      }

      ctx.body = { data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update service';
      strapi.log.error('[my-services.update] Error:', error);
      return ctx.badRequest(message);
    }
  },

  async toggleStatus(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { documentId } = ctx.params as { documentId?: string };
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const body = ctx.request.body as {
      type?: string;
      currentStatus?: 'draft' | 'published';
    };

    const { type, currentStatus } = body;

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.toggleServiceStatus(userId, type, documentId, currentStatus || 'draft');

      if (!result) {
        return ctx.notFound('Service not found or status toggle failed');
      }

      ctx.body = { data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle service status';
      strapi.log.error('[my-services.toggleStatus] Error:', error);
      return ctx.badRequest(message);
    }
  },

  async publish(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { documentId } = ctx.params as { documentId?: string };
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const body = ctx.request.body as { type?: string };
    const { type } = body;

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.publishService(userId, type, documentId);

      if (!result) {
        return ctx.notFound('Service not found or publish failed');
      }

      ctx.body = { data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish service';
      strapi.log.error('[my-services.publish] Error:', error);
      return ctx.badRequest(message);
    }
  },

  async unpublish(ctx) {

    const userId = ctx.state?.user?.id as number | undefined;
    if (!userId) {
      return ctx.unauthorized('User not authenticated');
    }

    const { documentId } = ctx.params as { documentId?: string };
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const body = ctx.request.body as { type?: string };
    const { type } = body;

    if (!type || !isValidServiceType(type)) {
      return ctx.badRequest('Invalid or missing service type');
    }

    try {
      const service = createMyServicesService(strapi);
      const result = await service.unpublishService(userId, type, documentId);

      if (!result) {
        return ctx.notFound('Service not found or unpublish failed');
      }

      ctx.body = { data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unpublish service';
      strapi.log.error('[my-services.unpublish] Error:', error);
      return ctx.badRequest(message);
    }
  },
};
