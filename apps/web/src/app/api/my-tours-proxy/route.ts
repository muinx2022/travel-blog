import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type TourRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  destination?: string;
  duration?: number;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  itinerary?: Array<{ label: string; title: string; description?: string }>;
  status?: "draft" | "published";
};

const resolveTourFields = (body: Record<string, unknown>) => ({
  destination: typeof body.destination === "string" ? body.destination : undefined,
  duration: typeof body.duration === "number" ? body.duration : undefined,
  price: typeof body.price === "number" ? body.price : undefined,
  itinerary: Array.isArray(body.itinerary) ? body.itinerary : [],
});

const handlers = createMyServiceProxyHandlers<TourRow>({
  entry: SERVICE_REGISTRY.tour,
  resourceLabel: "Tour",
  createTransform: resolveTourFields,
  updateTransform: resolveTourFields,
  loadFailureMessage: "Failed to fetch my tours",
  createFailureMessage: "Failed to create tour",
  updateFailureMessage: "Failed to update tour",
  toggleFailureMessage: "Failed to toggle tour status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

