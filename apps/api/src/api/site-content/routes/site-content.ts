export default {
  routes: [
    {
      method: 'GET',
      path: '/site-content/homepage',
      handler: 'site-content.homepage',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/site-content/pages',
      handler: 'site-content.pages',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/site-content/pages/:slug',
      handler: 'site-content.pageBySlug',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
