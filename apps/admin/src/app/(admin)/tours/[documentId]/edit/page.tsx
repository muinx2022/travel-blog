import { TourForm } from "@/components/tour-form";

export const dynamic = "force-dynamic";

type EditTourPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function EditTourPage({ params }: EditTourPageProps) {
  const { documentId } = await params;
  return <TourForm mode="edit" documentId={documentId} />;
}
