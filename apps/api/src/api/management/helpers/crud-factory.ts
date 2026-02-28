import { getStrapi, readDocumentId, adminOnly } from './common';

type ResourceConfig = {
  resourceName: string;       // e.g., 'post'
  resourceLabel: string;      // e.g., 'Post' (for error messages)
  serviceId: string;          // e.g., 'api::post.post'
  pluralName?: string;        // e.g., 'categories' (optional, defaults to resourceName + 's')
};

function pluralize(name: string): string {
  if (name.endsWith('y')) {
    return name.slice(0, -1) + 'ies';
  }
  return name + 's';
}

export function createCrudHandlers(config: ResourceConfig) {
  const { resourceName, resourceLabel, serviceId } = config;
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const name = capitalize(resourceName);
  const plural = capitalize(config.pluralName ?? pluralize(resourceName));

  return {
    [`list${plural}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      ctx.body = await service.listForAdmin(ctx.query);
    },

    [`find${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const documentId = readDocumentId(ctx);
      if (!documentId) return;

      const data = await service.findOneForAdmin(documentId, ctx.query);
      if (!data) {
        return ctx.notFound(`${resourceLabel} not found`);
      }

      ctx.body = { data };
    },

    [`create${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const data = await service.createForAdmin(ctx.request.body?.data);
      ctx.body = { data };
    },

    [`update${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const documentId = readDocumentId(ctx);
      if (!documentId) return;

      const data = await service.updateForAdmin(documentId, ctx.request.body?.data);
      ctx.body = { data };
    },

    [`delete${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const documentId = readDocumentId(ctx);
      if (!documentId) return;

      await service.deleteForAdmin(documentId);
      ctx.body = { data: { documentId } };
    },

    [`publish${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const documentId = readDocumentId(ctx);
      if (!documentId) return;

      const data = await service.publishForAdmin(documentId);
      ctx.body = { data };
    },

    [`unpublish${name}`]: async (ctx: any) => {
      const service = getStrapi().service(serviceId) as any;
      const documentId = readDocumentId(ctx);
      if (!documentId) return;

      const data = await service.unpublishForAdmin(documentId);
      ctx.body = { data };
    },
  };
}

// customPluralPath: URL segment (e.g. 'souvenir-shops')
// customPluralName: handler name suffix (e.g. 'souvenirShops') — defaults to customPluralPath
export function createCrudRoutes(resourceName: string, customPluralPath?: string, customPluralName?: string) {
  const pluralPath = customPluralPath ?? pluralize(resourceName);
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const name = capitalize(resourceName);
  const plural = capitalize(customPluralName ?? customPluralPath ?? pluralize(resourceName));

  return [
    { method: 'GET', path: `/management/${pluralPath}`, handler: `management.list${plural}`, config: adminOnly },
    { method: 'GET', path: `/management/${pluralPath}/:documentId`, handler: `management.find${name}`, config: adminOnly },
    { method: 'POST', path: `/management/${pluralPath}`, handler: `management.create${name}`, config: adminOnly },
    { method: 'PUT', path: `/management/${pluralPath}/:documentId`, handler: `management.update${name}`, config: adminOnly },
    { method: 'DELETE', path: `/management/${pluralPath}/:documentId`, handler: `management.delete${name}`, config: adminOnly },
    { method: 'POST', path: `/management/${pluralPath}/:documentId/publish`, handler: `management.publish${name}`, config: adminOnly },
    { method: 'POST', path: `/management/${pluralPath}/:documentId/unpublish`, handler: `management.unpublish${name}`, config: adminOnly },
  ];
}
