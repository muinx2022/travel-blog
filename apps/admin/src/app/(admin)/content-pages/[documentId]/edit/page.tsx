import { ContentPageForm } from "@/components/content-page-form";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function EditContentPage({ params }: Props) {
  const { documentId } = await params;
  return <ContentPageForm mode="edit" documentId={documentId} />;
}
