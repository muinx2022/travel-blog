import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type SouvenirShopRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  address?: string;
  city?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  status?: "draft" | "published";
};

const resolveSouvenirShopFields = (body: Record<string, unknown>) => ({
  address: typeof body.address === "string" ? body.address : undefined,
  city: typeof body.city === "string" ? body.city : undefined,
  phone: typeof body.phone === "string" ? body.phone : undefined,
});

const handlers = createMyServiceProxyHandlers<SouvenirShopRow>({
  entry: SERVICE_REGISTRY["souvenir-shop"],
  resourceLabel: "Souvenir shop",
  createTransform: resolveSouvenirShopFields,
  updateTransform: resolveSouvenirShopFields,
  loadFailureMessage: "Failed to fetch my souvenir shops",
  createFailureMessage: "Failed to create souvenir shop",
  updateFailureMessage: "Failed to update souvenir shop",
  toggleFailureMessage: "Failed to toggle souvenir shop status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

