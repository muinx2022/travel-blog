import { RestaurantView } from "@/components/restaurant-view";

type Params = Promise<{ documentId: string }>;

export default async function ViewRestaurantPage({ params }: { params: Params }) {
  const { documentId } = await params;
  return <RestaurantView documentId={documentId} />;
}