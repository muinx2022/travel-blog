import type { Metadata } from "next";
import { TravelGuideForm } from "@/components/travel-guide-form";

export const metadata: Metadata = {
  title: "Edit Travel Guide - Administration",
};

type EditTravelGuidePageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function EditTravelGuidePage({ params }: EditTravelGuidePageProps) {
  const { documentId } = await params;
  return <TravelGuideForm mode="edit" documentId={documentId} />;
}
