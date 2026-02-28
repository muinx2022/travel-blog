export type ServiceType = 'post' | 'tour' | 'hotel' | 'homestay' | 'restaurant' | 'souvenir-shop';

// Strapi core type - matches the strapi object structure
type StrapiCore = {
  documents: (uid: string) => {
    findMany: (params: Record<string, unknown>) => Promise<unknown[]>;
    findOne: (params: Record<string, unknown>) => Promise<unknown | null>;
    create: (params: Record<string, unknown>) => Promise<unknown>;
    update: (params: Record<string, unknown>) => Promise<unknown>;
    count: (params: Record<string, unknown>) => Promise<number>;
  } & Record<string, unknown>;
  entityService: {
    update: (uid: string, id: number, data: Record<string, unknown>) => Promise<unknown>;
  };
  log: {
    error: (...args: unknown[]) => void;
  };
};


type ServiceItem = {
  documentId: string;
  type: ServiceType;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
};

type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type ServicesResult = {
  data: ServiceItem[];
  meta: {
    pagination: Pagination;
    byType: Record<ServiceType, number>;
  };
};

type CreateServiceData = {
  type: ServiceType;
  title: string;
  slug?: string;
  content: string;
  categories?: number[];
  [key: string]: unknown;
};

type UpdateServiceData = {
  title?: string;
  content?: string;
  categories?: number[];
  [key: string]: unknown;
};

const serviceTypeToApi: Record<ServiceType, string> = {
  post: 'api::post.post',
  tour: 'api::tour.tour',
  hotel: 'api::hotel.hotel',
  homestay: 'api::homestay.homestay',
  restaurant: 'api::restaurant.restaurant',
  'souvenir-shop': 'api::souvenir-shop.souvenir-shop',
};

const serviceTypeToEditPath: Record<ServiceType, string> = {
  post: '/my-posts',
  tour: '/my-tours',
  hotel: '/my-hotels',
  homestay: '/my-homestays',
  restaurant: '/my-restaurants',
  'souvenir-shop': '/my-souvenir-shops',
};

export class MyServicesService {
  private strapi: StrapiCore;

  constructor(strapi: StrapiCore) {
    this.strapi = strapi;
  }


  private async fetchServicesByType(
    userId: number,
    type: ServiceType,
    status: 'draft' | 'published'
  ): Promise<ServiceItem[]> {
    const apiName = serviceTypeToApi[type];

    try {
      const services = await this.strapi.documents(apiName).findMany({
        filters: {
          author: {
            id: userId,
          },
        },
        status,
        sort: 'updatedAt:desc',
        pagination: { page: 1, pageSize: 1000 },
      }) as Array<{
        documentId: string;
        title: string;
        createdAt: string;
        updatedAt: string;
      }>;

      return services.map((item) => ({
        documentId: item.documentId,
        type,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        status,
      }));
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.fetchServicesByType] Error fetching ${type} (${status}):`, error);
      return [];
    }
  }

  async getAllServices(userId: number, page = 1, pageSize = 100): Promise<ServicesResult> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));

    // Fetch all services in parallel
    const [postsPublished, postsDraft, toursPublished, toursDraft, hotelsPublished, hotelsDraft, homestaysPublished, homestaysDraft, restaurantsPublished, restaurantsDraft, souvenirShopsPublished, souvenirShopsDraft] = await Promise.all([
      this.fetchServicesByType(userId, 'post', 'published'),
      this.fetchServicesByType(userId, 'post', 'draft'),
      this.fetchServicesByType(userId, 'tour', 'published'),
      this.fetchServicesByType(userId, 'tour', 'draft'),
      this.fetchServicesByType(userId, 'hotel', 'published'),
      this.fetchServicesByType(userId, 'hotel', 'draft'),
      this.fetchServicesByType(userId, 'homestay', 'published'),
      this.fetchServicesByType(userId, 'homestay', 'draft'),
      this.fetchServicesByType(userId, 'restaurant', 'published'),
      this.fetchServicesByType(userId, 'restaurant', 'draft'),
      this.fetchServicesByType(userId, 'souvenir-shop', 'published'),
      this.fetchServicesByType(userId, 'souvenir-shop', 'draft'),
    ]);

    // Merge and deduplicate (published takes precedence)
    const mergedMap = new Map<string, ServiceItem>();

    // Add draft first
    [
      ...postsDraft,
      ...toursDraft,
      ...hotelsDraft,
      ...homestaysDraft,
      ...restaurantsDraft,
      ...souvenirShopsDraft,
    ].forEach((item) => {
      mergedMap.set(`${item.type}-${item.documentId}`, item);
    });

    // Add published (overwrites draft if exists)
    [
      ...postsPublished,
      ...toursPublished,
      ...hotelsPublished,
      ...homestaysPublished,
      ...restaurantsPublished,
      ...souvenirShopsPublished,
    ].forEach((item) => {
      mergedMap.set(`${item.type}-${item.documentId}`, item);
    });

    // Convert to array and sort by updatedAt
    const allServices = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Calculate pagination
    const total = allServices.length;
    const pageCount = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;
    const paginatedData = allServices.slice(start, end);

    // Count by type from merged unique rows (no draft/published double count)
    const byType: Record<ServiceType, number> = {
      post: 0,
      tour: 0,
      hotel: 0,
      homestay: 0,
      restaurant: 0,
      'souvenir-shop': 0,
    };

    for (const item of allServices) {
      byType[item.type] += 1;
    }

    return {
      data: paginatedData,
      meta: {
        pagination: {
          page: safePage,
          pageSize: safePageSize,
          pageCount,
          total,
        },
        byType,
      },
    };
  }

  async getServiceById(userId: number, type: ServiceType, documentId: string): Promise<ServiceItem | null> {
    const apiName = serviceTypeToApi[type];

    try {
      // Try published first
      let service = await this.strapi.documents(apiName).findOne({
        documentId,
        status: 'published',
        populate: ['author'],
      }) as { documentId: string; title: string; createdAt: string; updatedAt: string; author?: { id: number } } | null;

      let status: 'draft' | 'published' = 'published';

      if (!service) {
        // Try draft
        service = await this.strapi.documents(apiName).findOne({
          documentId,
          status: 'draft',
          populate: ['author'],
        }) as { documentId: string; title: string; createdAt: string; updatedAt: string; author?: { id: number } } | null;
        status = 'draft';
      }

      if (!service || service.author?.id !== userId) {
        return null;
      }

      return {
        documentId: service.documentId,
        type,
        title: service.title,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        status,
      };
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.getServiceById] Error fetching ${type}/${documentId}:`, error);
      return null;
    }
  }

  async createService(userId: number, data: CreateServiceData): Promise<ServiceItem | null> {
    const { type, title, slug, content, categories, ...extraFields } = data;
    const apiName = serviceTypeToApi[type];

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    try {
      const service = await this.strapi.documents(apiName).create({
        data: {
          title,
          slug,
          content,
          author: userId,
          categories: categories || [],
          ...extraFields,
        },
        status: 'draft',
      }) as { documentId: string; title: string; createdAt: string; updatedAt: string };

      return {
        documentId: service.documentId,
        type,
        title: service.title,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        status: 'draft',
      };
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.createService] Error creating ${type}:`, error);
      throw error;
    }
  }

  async updateService(userId: number, type: ServiceType, documentId: string, data: UpdateServiceData): Promise<ServiceItem | null> {
    const apiName = serviceTypeToApi[type];

    try {
      // Verify ownership
      const existing = await this.strapi.documents(apiName).findOne({
        documentId,
        populate: ['author'],
      }) as { author?: { id: number } } | null;

      if (!existing || existing.author?.id !== userId) {
        throw new Error('You can only update your own services');
      }

      const { title, content, categories, ...extraFields } = data;

      const updated = await this.strapi.documents(apiName).update({
        documentId,
        data: {
          ...(title && { title }),
          ...(content && { content }),
          ...(categories && { categories }),
          ...extraFields,
        },
      }) as { documentId: string; title: string; createdAt: string; updatedAt: string };

      // Check if it was published before
      const publishedVersion = await this.strapi.documents(apiName).findOne({
        documentId,
        status: 'published',
        fields: ['documentId'],
      });

      // If it was published, republish
      if (publishedVersion) {
        const documentsApi = this.strapi.documents(apiName) as unknown as {
          publish?: (params: { documentId: string }) => Promise<{ entries?: Array<{ documentId: string; title: string; createdAt: string; updatedAt: string }> }>;
        };
        if (typeof documentsApi.publish === 'function') {
          const result = await documentsApi.publish({ documentId });
          if (result?.entries?.[0]) {
            return {
              documentId: result.entries[0].documentId,
              type,
              title: result.entries[0].title,
              createdAt: result.entries[0].createdAt,
              updatedAt: result.entries[0].updatedAt,
              status: 'published',
            };
          }
        }
      }

      return {
        documentId: updated.documentId,
        type,
        title: updated.title,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        status: publishedVersion ? 'published' : 'draft',
      };
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.updateService] Error updating ${type}/${documentId}:`, error);
      throw error;
    }
  }

  async publishService(userId: number, type: ServiceType, documentId: string): Promise<ServiceItem | null> {
    const apiName = serviceTypeToApi[type];

    try {
      // Verify ownership
      const existing = await this.strapi.documents(apiName).findOne({
        documentId,
        populate: ['author'],
      }) as { author?: { id: number }; id?: number } | null;

      if (!existing || existing.author?.id !== userId) {
        throw new Error('You can only publish your own services');
      }

      const documentsApi = this.strapi.documents(apiName) as unknown as {
        publish?: (params: { documentId: string }) => Promise<{ entries?: Array<{ documentId: string; title: string; createdAt: string; updatedAt: string }> }>;
      };

      if (typeof documentsApi.publish === 'function') {
        const result = await documentsApi.publish({ documentId });
        if (result?.entries?.[0]) {
          return {
            documentId: result.entries[0].documentId,
            type,
            title: result.entries[0].title,
            createdAt: result.entries[0].createdAt,
            updatedAt: result.entries[0].updatedAt,
            status: 'published',
          };
        }
      }

      // Fallback
      if (existing.id) {
        await this.strapi.entityService.update(apiName, existing.id, {
          data: { publishedAt: new Date().toISOString() },
        });

        const published = await this.strapi.documents(apiName).findOne({
          documentId,
          status: 'published',
        }) as { documentId: string; title: string; createdAt: string; updatedAt: string } | null;

        if (published) {
          return {
            documentId: published.documentId,
            type,
            title: published.title,
            createdAt: published.createdAt,
            updatedAt: published.updatedAt,
            status: 'published',
          };
        }
      }

      return null;
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.publishService] Error publishing ${type}/${documentId}:`, error);
      throw error;
    }
  }

  async unpublishService(userId: number, type: ServiceType, documentId: string): Promise<ServiceItem | null> {
    const apiName = serviceTypeToApi[type];

    try {
      // Verify ownership
      const existing = await this.strapi.documents(apiName).findOne({
        documentId,
        populate: ['author'],
      }) as { author?: { id: number } } | null;

      if (!existing || existing.author?.id !== userId) {
        throw new Error('You can only unpublish your own services');
      }

      const documentsApi = this.strapi.documents(apiName) as unknown as {
        unpublish?: (params: { documentId: string }) => Promise<{ documentId: string; title: string; createdAt: string; updatedAt: string }>;
      };

      if (typeof documentsApi.unpublish === 'function') {
        const result = await documentsApi.unpublish({ documentId });
        if (result) {
          return {
            documentId: result.documentId,
            type,
            title: result.title,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            status: 'draft',
          };
        }
      }

      // Fallback - get draft version
      const draft = await this.strapi.documents(apiName).findOne({
        documentId,
        status: 'draft',
      }) as { documentId: string; title: string; createdAt: string; updatedAt: string } | null;

      if (draft) {
        return {
          documentId: draft.documentId,
          type,
          title: draft.title,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          status: 'draft',
        };
      }

      return null;
    } catch (error) {
      this.strapi.log.error(`[MyServicesService.unpublishService] Error unpublishing ${type}/${documentId}:`, error);
      throw error;
    }
  }

  async toggleServiceStatus(userId: number, type: ServiceType, documentId: string, currentStatus: 'draft' | 'published'): Promise<ServiceItem | null> {
    if (currentStatus === 'published') {
      return this.unpublishService(userId, type, documentId);
    } else {
      return this.publishService(userId, type, documentId);
    }
  }
}

export const createMyServicesService = (strapi: StrapiCore) => new MyServicesService(strapi);
