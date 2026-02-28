import { TourView } from "@/components/tour-view";

export const dynamic = "force-dynamic";

type ViewTourPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function ViewTourPage({ params }: ViewTourPageProps) {
  const { documentId } = await params;
  return <TourView documentId={documentId} />;
}
