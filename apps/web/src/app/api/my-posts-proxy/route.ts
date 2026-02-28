import { SERVICE_REGISTRY } from "@/features/my-services/config/service-registry";
import { createMyServiceProxyHandlers } from "../_shared/my-service-proxy";

type PostRow = {
  id?: number;
  documentId?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  categories?: Array<{ id?: number; documentId?: string; name?: string; slug?: string }>;
  status?: "draft" | "published";
};

const handlers = createMyServiceProxyHandlers<PostRow>({
  entry: SERVICE_REGISTRY.post,
  resourceLabel: "Post",
  loadFailureMessage: "Failed to fetch my posts",
  createFailureMessage: "Failed to create post",
  updateFailureMessage: "Failed to update post",
  toggleFailureMessage: "Failed to toggle post status",
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const PATCH = handlers.PATCH;

