export type ServiceType =
  | "post"
  | "tour"
  | "hotel"
  | "homestay"
  | "restaurant"
  | "souvenir-shop";

export type PublishStatus = "published" | "draft";

export type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export type ServiceRegistryEntry = {
  type: ServiceType;
  label: string;
  pluralLabel: string;
  basePath: string;
  createPath: string;
  editPathPattern: string;
  apiProxyPath: string;
  entityEndpoint: string;
  myEndpoint: string;
  slugPrefix: string;
};

export type CategoryItem = {
  id: number;
  documentId: string;
  name: string;
  sortOrder?: number;
  parent?: { id?: number; documentId?: string } | null;
};

export type CategoryTreeOption = {
  value: string;
  label: string;
  depth: number;
};

export type MyServiceListItem = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  status?: PublishStatus;
};

export type MyServicePayloadTransform<
  TBody extends Record<string, unknown> = Record<string, unknown>,
> = (body: TBody) => Record<string, unknown>;

