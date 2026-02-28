import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type HomestayRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  priceRange?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  amenities?: Array<{ name: string }>;
  status?: "draft" | "published";
};

const resolveHomestayFields = (body: Record<string, unknown>) => ({
  address: typeof body.address === "string" ? body.address : undefined,
  city: typeof body.city === "string" ? body.city : undefined,
  priceRange: typeof body.priceRange === "string" ? body.priceRange : undefined,
  amenities: Array.isArray(body.amenities) ? body.amenities : [],
});

const handlers = createMyServiceProxyHandlers<HomestayRow>({
  entry: SERVICE_REGISTRY.homestay,
  resourceLabel: "Homestay",
  createTransform: resolveHomestayFields,
  updateTransform: resolveHomestayFields,
  loadFailureMessage: "Failed to fetch my homestays",
  createFailureMessage: "Failed to create homestay",
  updateFailureMessage: "Failed to update homestay",
  toggleFailureMessage: "Failed to toggle homestay status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

