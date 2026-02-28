export default {
  routes: [
    {
      method: 'POST',
      path: '/restaurants/user-create',
      handler: 'restaurant.userCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/restaurants/:documentId/user-update',
      handler: 'restaurant.userUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/restaurants/my-restaurants',
      handler: 'restaurant.myRestaurants',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/restaurants/:documentId/user-publish',
      handler: 'restaurant.userPublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/restaurants/:documentId/user-unpublish',
      handler: 'restaurant.userUnpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
