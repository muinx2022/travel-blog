import { TagForm } from "@/components/tag-form";

type Params = Promise<{ documentId: string }>;

export default async function EditTagPage({ params }: { params: Params }) {
  const { documentId } = await params;
  return <TagForm mode="edit" documentId={documentId} />;
}
