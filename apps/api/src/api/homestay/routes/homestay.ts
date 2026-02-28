import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::homestay.homestay', {
  only: ['find', 'findOne'],
});
