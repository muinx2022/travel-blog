import postsHandlers from './handlers/posts';
import categoriesHandlers from './handlers/categories';
import toursHandlers from './handlers/tours';
import hotelsHandlers from './handlers/hotels';
import commentsHandlers from './handlers/comments';
import usersHandlers from './handlers/users';
import dashboardHandlers from './handlers/dashboard';
import tagsHandlers from './handlers/tags';
import homestaysHandlers from './handlers/homestays';
import restaurantsHandlers from './handlers/restaurants';
import souvenirShopsHandlers from './handlers/souvenir-shops';
import travelGuidesHandlers from './handlers/travel-guides';
import contentPagesHandlers from './handlers/content-pages';
import homepageHandlers from './handlers/homepage';
import reportsHandlers from './handlers/reports';
import contactRequestsHandlers from './handlers/contact-requests';
import contactEmailTemplateHandlers from './handlers/contact-email-template';

export default {
  ...postsHandlers,
  ...categoriesHandlers,
  ...toursHandlers,
  ...hotelsHandlers,
  ...commentsHandlers,
  ...usersHandlers,
  ...tagsHandlers,
  ...homestaysHandlers,
  ...restaurantsHandlers,
  ...souvenirShopsHandlers,
  ...travelGuidesHandlers,
  ...contentPagesHandlers,
  ...homepageHandlers,
  ...reportsHandlers,
  ...contactRequestsHandlers,
  ...contactEmailTemplateHandlers,
  ...dashboardHandlers,
};
