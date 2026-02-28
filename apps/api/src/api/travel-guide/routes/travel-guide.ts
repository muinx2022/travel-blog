import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::travel-guide.travel-guide', {
  only: ['find', 'findOne'],
});
