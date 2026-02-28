"use client";

import { ResourceListPage } from "@/components/resource-list-page";
import {
  listRestaurants,
  deleteRestaurant,
  publishRestaurant,
  unpublishRestaurant,
  type RestaurantItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { UtensilsCrossed } from "lucide-react";

export default function RestaurantsPage() {
  const columns = [
    {
      header: "ID",
      accessor: "id" as keyof RestaurantItem,
      className: "w-[60px]",
    },
    {
      header: "Title",
      accessor: "title" as keyof RestaurantItem,
      className: "w-[30%]",
    },
    {
      header: "Location",
      accessor: (item: RestaurantItem) => item.city || "-",
    },
    {
      header: "Cuisine",
      accessor: (item: RestaurantItem) => item.cuisineType || "-",
    },
    {
      header: "Category",
      accessor: (item: RestaurantItem) => (item.categories ?? []).map((cat) => cat.name).join(", ") || "-",
    },
  ];

  const api = {
    list: listRestaurants,
    delete: deleteRestaurant,
    publish: publishRestaurant,
    unpublish: unpublishRestaurant,
  };

  return (
    <ResourceListPage<RestaurantItem>
      resourceName="Restaurant"
      resourceNamePlural="Restaurants"
      api={api}
      columns={columns}
      canCreate={can("restaurant", "create")}
      canUpdate={can("restaurant", "update")}
      canDelete={can("restaurant", "delete")}
      canPublish={can("restaurant", "publish")}
      canUnpublish={can("restaurant", "unpublish")}
      Icon={UtensilsCrossed}
    />
  );
}
