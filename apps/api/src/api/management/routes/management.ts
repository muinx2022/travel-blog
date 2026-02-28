import postsRoutes from './modules/posts';
import categoriesRoutes from './modules/categories';
import toursRoutes from './modules/tours';
import hotelsRoutes from './modules/hotels';
import commentsRoutes from './modules/comments';
import usersRoutes from './modules/users';
import tagsRoutes from './modules/tags';
import homestaysRoutes from './modules/homestays';
import restaurantsRoutes from './modules/restaurants';
import souvenirShopsRoutes from './modules/souvenir-shops';
import travelGuidesRoutes from './modules/travel-guides';
import contentPagesRoutes from './modules/content-pages';
import homepageRoutes from './modules/homepage';
import reportsRoutes from './modules/reports';
import contactRequestsRoutes from './modules/contact-requests';
import contactEmailTemplateRoutes from './modules/contact-email-template';
import { adminOnly } from '../helpers/common';

export default {
  routes: [
    { method: 'GET', path: '/management/dashboard', handler: 'management.dashboard', config: adminOnly },
    { method: 'GET', path: '/management/my-permissions', handler: 'management.myPermissions', config: adminOnly },
    ...postsRoutes,
    ...categoriesRoutes,
    ...toursRoutes,
    ...hotelsRoutes,
    ...commentsRoutes,
    ...usersRoutes,
    ...tagsRoutes,
    ...homestaysRoutes,
    ...restaurantsRoutes,
    ...souvenirShopsRoutes,
    ...travelGuidesRoutes,
    ...contentPagesRoutes,
    ...homepageRoutes,
    ...reportsRoutes,
    ...contactRequestsRoutes,
    ...contactEmailTemplateRoutes,
  ],
};
