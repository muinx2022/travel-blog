export default {
  routes: [
    {
      method: 'POST',
      path: '/tours/user-create',
      handler: 'tour.userCreate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/tours/:documentId/user-update',
      handler: 'tour.userUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/tours/my-tours',
      handler: 'tour.myTours',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/tours/:documentId/user-publish',
      handler: 'tour.userPublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/tours/:documentId/user-unpublish',
      handler: 'tour.userUnpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
