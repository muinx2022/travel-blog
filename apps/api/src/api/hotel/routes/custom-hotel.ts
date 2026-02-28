export default {
  routes: [
    {
      method: 'POST',
      path: '/hotels/user-create',
      handler: 'hotel.userCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/hotels/:documentId/user-update',
      handler: 'hotel.userUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/hotels/my-hotels',
      handler: 'hotel.myHotels',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/hotels/:documentId/user-publish',
      handler: 'hotel.userPublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/hotels/:documentId/user-unpublish',
      handler: 'hotel.userUnpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
