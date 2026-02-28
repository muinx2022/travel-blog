export default {
  routes: [
    {
      method: 'POST',
      path: '/homestays/user-create',
      handler: 'homestay.userCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/homestays/:documentId/user-update',
      handler: 'homestay.userUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/homestays/my-homestays',
      handler: 'homestay.myHomestays',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/homestays/:documentId/user-publish',
      handler: 'homestay.userPublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/homestays/:documentId/user-unpublish',
      handler: 'homestay.userUnpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
