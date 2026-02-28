import type { Metadata } from "next";
import { TravelGuideForm } from "@/components/travel-guide-form";

export const metadata: Metadata = {
  title: "Create Travel Guide - Administration",
};

export default function NewTravelGuidePage() {
  return <TravelGuideForm mode="create" />;
}
