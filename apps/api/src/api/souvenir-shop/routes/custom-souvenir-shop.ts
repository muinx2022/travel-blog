export default {
  routes: [
    {
      method: 'POST',
      path: '/souvenir-shops/user-create',
      handler: 'souvenir-shop.userCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/souvenir-shops/:documentId/user-update',
      handler: 'souvenir-shop.userUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/souvenir-shops/my-souvenir-shops',
      handler: 'souvenir-shop.mySouvenirShops',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/souvenir-shops/:documentId/user-publish',
      handler: 'souvenir-shop.userPublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/souvenir-shops/:documentId/user-unpublish',
      handler: 'souvenir-shop.userUnpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
