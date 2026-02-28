import { HotelView } from "@/components/hotel-view";

export const dynamic = "force-dynamic";

type ViewHotelPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function ViewHotelPage({ params }: ViewHotelPageProps) {
  const { documentId } = await params;
  return <HotelView documentId={documentId} />;
}
