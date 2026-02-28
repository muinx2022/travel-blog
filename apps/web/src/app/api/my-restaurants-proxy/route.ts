import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type RestaurantRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  cuisineType?: string;
  priceRange?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  status?: "draft" | "published";
};

const resolveRestaurantFields = (body: Record<string, unknown>) => ({
  address: typeof body.address === "string" ? body.address : undefined,
  city: typeof body.city === "string" ? body.city : undefined,
  cuisineType: typeof body.cuisineType === "string" ? body.cuisineType : undefined,
  priceRange: typeof body.priceRange === "string" ? body.priceRange : undefined,
});

const handlers = createMyServiceProxyHandlers<RestaurantRow>({
  entry: SERVICE_REGISTRY.restaurant,
  resourceLabel: "Restaurant",
  createTransform: resolveRestaurantFields,
  updateTransform: resolveRestaurantFields,
  loadFailureMessage: "Failed to fetch my restaurants",
  createFailureMessage: "Failed to create restaurant",
  updateFailureMessage: "Failed to update restaurant",
  toggleFailureMessage: "Failed to toggle restaurant status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

