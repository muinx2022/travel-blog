import { createCrudHandlers } from '../../helpers/crud-factory';

export default createCrudHandlers({
  resourceName: 'souvenirShop',
  pluralName: 'souvenirShops',
  resourceLabel: 'Souvenir shop',
  serviceId: 'api::souvenir-shop.souvenir-shop',
});
