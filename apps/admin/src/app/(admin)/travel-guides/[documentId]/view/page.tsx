import type { Metadata } from "next";
import { TravelGuideView } from "@/components/travel-guide-view";

export const metadata: Metadata = {
  title: "View Travel Guide - Administration",
};

type ViewTravelGuidePageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function ViewTravelGuidePage({ params }: ViewTravelGuidePageProps) {
  const { documentId } = await params;
  return (
    <div>
      <TravelGuideView documentId={documentId} />
    </div>
  );
}
