import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::souvenir-shop.souvenir-shop', {
  only: ['find', 'findOne'],
});
