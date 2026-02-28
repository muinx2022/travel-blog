export default {
  routes: [
    { method: 'GET',    path: '/entity-medias',             handler: 'entity-media.find',       config: { auth: false, policies: [], middlewares: [] } },
    { method: 'POST',   path: '/entity-medias/upload',      handler: 'entity-media.upload',     config: { auth: false, policies: [], middlewares: [] } },
    { method: 'PUT',    path: '/entity-medias/:id',         handler: 'entity-media.update',     config: { auth: false, policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/entity-medias/:id',         handler: 'entity-media.delete',     config: { auth: false, policies: [], middlewares: [] } },
    { method: 'POST',   path: '/entity-medias/reorder',     handler: 'entity-media.reorder',    config: { auth: false, policies: [], middlewares: [] } },
    { method: 'PATCH',  path: '/entity-medias/bulk-update', handler: 'entity-media.bulkUpdate', config: { auth: false, policies: [], middlewares: [] } },
  ],
};
