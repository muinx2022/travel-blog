import type { ServiceRegistryEntry, ServiceType } from "../types";

export const SERVICE_REGISTRY: Record<ServiceType, ServiceRegistryEntry> = {
  post: {
    type: "post",
    label: "Bài viết",
    pluralLabel: "Bài viết",
    basePath: "/my-posts",
    createPath: "/my-posts/new",
    editPathPattern: "/my-posts/:documentId/edit",
    apiProxyPath: "/api/my-posts-proxy",
    entityEndpoint: "posts",
    myEndpoint: "my-posts",
    slugPrefix: "post",
  },
  tour: {
    type: "tour",
    label: "Tour",
    pluralLabel: "Tours",
    basePath: "/my-tours",
    createPath: "/my-tours/new",
    editPathPattern: "/my-tours/:documentId/edit",
    apiProxyPath: "/api/my-tours-proxy",
    entityEndpoint: "tours",
    myEndpoint: "my-tours",
    slugPrefix: "tour",
  },
  hotel: {
    type: "hotel",
    label: "Khách sạn",
    pluralLabel: "Khách sạn",
    basePath: "/my-hotels",
    createPath: "/my-hotels/new",
    editPathPattern: "/my-hotels/:documentId/edit",
    apiProxyPath: "/api/my-hotels-proxy",
    entityEndpoint: "hotels",
    myEndpoint: "my-hotels",
    slugPrefix: "hotel",
  },
  homestay: {
    type: "homestay",
    label: "Homestay",
    pluralLabel: "Homestays",
    basePath: "/my-homestays",
    createPath: "/my-homestays/new",
    editPathPattern: "/my-homestays/:documentId/edit",
    apiProxyPath: "/api/my-homestays-proxy",
    entityEndpoint: "homestays",
    myEndpoint: "my-homestays",
    slugPrefix: "homestay",
  },
  restaurant: {
    type: "restaurant",
    label: "Nhà hàng",
    pluralLabel: "Nhà hàng",
    basePath: "/my-restaurants",
    createPath: "/my-restaurants/new",
    editPathPattern: "/my-restaurants/:documentId/edit",
    apiProxyPath: "/api/my-restaurants-proxy",
    entityEndpoint: "restaurants",
    myEndpoint: "my-restaurants",
    slugPrefix: "restaurant",
  },
  "souvenir-shop": {
    type: "souvenir-shop",
    label: "Quà lưu niệm",
    pluralLabel: "Cửa hàng quà lưu niệm",
    basePath: "/my-souvenir-shops",
    createPath: "/my-souvenir-shops/new",
    editPathPattern: "/my-souvenir-shops/:documentId/edit",
    apiProxyPath: "/api/my-souvenir-shops-proxy",
    entityEndpoint: "souvenir-shops",
    myEndpoint: "my-souvenir-shops",
    slugPrefix: "souvenir-shop",
  },
};

export const SERVICE_TYPES = Object.keys(SERVICE_REGISTRY) as ServiceType[];

export function getServiceRegistryEntry(type: ServiceType) {
  return SERVICE_REGISTRY[type];
}

export function resolveEditPath(type: ServiceType, documentId: string) {
  const entry = getServiceRegistryEntry(type);
  return entry.editPathPattern.replace(":documentId", documentId);
}

