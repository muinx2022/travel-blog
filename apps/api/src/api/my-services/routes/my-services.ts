export default {
  routes: [
    {
      method: 'GET',
      path: '/my-services',
      handler: 'my-services.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/my-services/:type/:documentId',
      handler: 'my-services.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/my-services',
      handler: 'my-services.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/my-services/:documentId',
      handler: 'my-services.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PATCH',
      path: '/my-services/:documentId/toggle-status',
      handler: 'my-services.toggleStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/my-services/:documentId/publish',
      handler: 'my-services.publish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/my-services/:documentId/unpublish',
      handler: 'my-services.unpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
