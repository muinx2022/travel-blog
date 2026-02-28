import { HomestayView } from "@/components/homestay-view";

type Params = Promise<{ documentId: string }>;

export default async function ViewHomestayPage({ params }: { params: Params }) {
  const { documentId } = await params;
  return <HomestayView documentId={documentId} />;
}
