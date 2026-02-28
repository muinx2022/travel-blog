export default {
  routes: [
    {
      method: 'GET',
      path: '/comments',
      handler: 'api::comment.comment.find',
      config: { auth: false, policies: [] },
    },
    {
      method: 'GET',
      path: '/comments/:documentId',
      handler: 'api::comment.comment.findOne',
      config: { auth: false, policies: [] },
    },
    {
      method: 'POST',
      path: '/comments',
      handler: 'api::comment.comment.create',
      config: { auth: false, policies: [] },
    },
  ],
};
