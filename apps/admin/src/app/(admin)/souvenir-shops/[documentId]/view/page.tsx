import { SouvenirShopView } from "@/components/souvenir-shop-view";

type Params = Promise<{ documentId: string }>;

export default async function ViewSouvenirShopPage({ params }: { params: Params }) {
  const { documentId } = await params;
  return <SouvenirShopView documentId={documentId} />;
}