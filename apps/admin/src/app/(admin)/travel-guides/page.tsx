import type { Metadata } from "next";
import { TravelGuidesManager } from "@/components/travel-guides-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Travel Guides - Administration",
};

export default function TravelGuidesPage() {
  return <TravelGuidesManager />;
}
