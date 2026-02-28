"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listSouvenirShops,
  deleteSouvenirShop,
  publishSouvenirShop,
  unpublishSouvenirShop,
  type SouvenirShopItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { Store } from "lucide-react";

export default function SouvenirShopsPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id" as keyof SouvenirShopItem,
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: "title" as keyof SouvenirShopItem,
      className: "w-[30%]",
    },
    {
      header: "Location",
      accessor: (item: SouvenirShopItem) => item.city || "-",
    },
    {
      header: "Shop Type",
      accessor: (item: SouvenirShopItem) => item.shopType || "-",
    },
    {
      header: "Category",
      accessor: (item: SouvenirShopItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
    },
  ];

  const api = {
    list: listSouvenirShops,
    delete: deleteSouvenirShop,
    publish: publishSouvenirShop,
    unpublish: unpublishSouvenirShop,
  };

  return (
    <ResourceListPage<SouvenirShopItem>
      resourceName="Souvenir Shop"
      resourceNamePlural="souvenir-shops"
      api={api}
      columns={columns}
      canCreate={can("souvenirShop", "create")}
      canUpdate={can("souvenirShop", "update")}
      canDelete={can("souvenirShop", "delete")}
      canPublish={can("souvenirShop", "publish")}
      canUnpublish={can("souvenirShop", "unpublish")}
      Icon={Store}
    />
  );
}
