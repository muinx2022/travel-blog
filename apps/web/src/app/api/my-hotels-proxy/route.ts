import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type HotelRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  starRating?: number;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  amenities?: Array<{ name: string }>;
  roomTypes?: Array<{
    name: string;
    description?: string;
    price?: number;
    available?: boolean;
    amenities?: string;
    videoUrl?: string;
  }>;
  status?: "draft" | "published";
};

const resolveHotelFields = (body: Record<string, unknown>) => ({
  address: typeof body.address === "string" ? body.address : undefined,
  city: typeof body.city === "string" ? body.city : undefined,
  starRating: typeof body.starRating === "number" ? body.starRating : undefined,
  videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : undefined,
  amenities: Array.isArray(body.amenities) ? body.amenities : [],
  roomTypes: Array.isArray(body.roomTypes) ? body.roomTypes : [],
});

const handlers = createMyServiceProxyHandlers<HotelRow>({
  entry: SERVICE_REGISTRY.hotel,
  resourceLabel: "Hotel",
  createTransform: resolveHotelFields,
  updateTransform: resolveHotelFields,
  loadFailureMessage: "Failed to fetch my hotels",
  createFailureMessage: "Failed to create hotel",
  updateFailureMessage: "Failed to update hotel",
  toggleFailureMessage: "Failed to toggle hotel status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

