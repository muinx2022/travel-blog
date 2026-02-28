"use client";

import {
  Refine,
  useNavigation,
} from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Tag, 
  MessageSquare, 
  ArrowRight, 
  Map, 
  Home, 
  UtensilsCrossed, 
  Store, 
  BookOpen, 
  Building2,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminDataProvider } from "@/lib/refine-admin-provider";
import { getAdminDashboard, type AdminDashboardData } from "@/lib/admin-api";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();
const adminDataProvider = createAdminDataProvider();

type PostRecord = AdminDashboardData["recent"]["posts"][number];
type TourRecord = AdminDashboardData["recent"]["tours"][number];
type HotelRecord = AdminDashboardData["recent"]["hotels"][number];
type CategoryRecord = AdminDashboardData["recent"]["categories"][number];
type CommentRecord = AdminDashboardData["recent"]["comments"][number];
type TagRecord = AdminDashboardData["recent"]["tags"][number];
type HomestayRecord = AdminDashboardData["recent"]["homestays"][number];
type RestaurantRecord = AdminDashboardData["recent"]["restaurants"][number];
type SouvenirShopRecord = AdminDashboardData["recent"]["souvenirShops"][number];
type TravelGuideRecord = AdminDashboardData["recent"]["travelGuides"][number];

const statCardColors = [
  { bg: "from-blue-500/10 to-blue-600/5", icon: "text-blue-600", darkBg: "from-blue-400/20 to-blue-500/10", darkIcon: "text-blue-400" },
  { bg: "from-emerald-500/10 to-emerald-600/5", icon: "text-emerald-600", darkBg: "from-emerald-400/20 to-emerald-500/10", darkIcon: "text-emerald-400" },
  { bg: "from-amber-500/10 to-amber-600/5", icon: "text-amber-600", darkBg: "from-amber-400/20 to-amber-500/10", darkIcon: "text-amber-400" },
  { bg: "from-rose-500/10 to-rose-600/5", icon: "text-rose-600", darkBg: "from-rose-400/20 to-rose-500/10", darkIcon: "text-rose-400" },
  { bg: "from-violet-500/10 to-violet-600/5", icon: "text-violet-600", darkBg: "from-violet-400/20 to-violet-500/10", darkIcon: "text-violet-400" },
  { bg: "from-cyan-500/10 to-cyan-600/5", icon: "text-cyan-600", darkBg: "from-cyan-400/20 to-cyan-500/10", darkIcon: "text-cyan-400" },
];

function StatCard({
  label,
  value,
  icon: Icon,
  onClick,
  index,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  onClick?: () => void;
  index: number;
}) {
  const colors = statCardColors[index % statCardColors.length];
  
  return (
    <Card
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-md",
        onClick ? "cursor-pointer" : ""
      )}
      onClick={onClick}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-100 dark:opacity-0",
        colors.bg
      )} />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 dark:opacity-100",
        colors.darkBg
      )} />
      <CardContent className="relative flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value === null ? "-" : value.toLocaleString()}
          </p>
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-white/10 shadow-sm backdrop-blur-sm",
          colors.icon,
          colors.darkIcon
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceOverview() {
  const navigation = useNavigation();
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const data = dashboard.data;
  const postRows = data?.recent.posts ?? [];
  const categoryRows = data?.recent.categories ?? [];
  const commentRows = data?.recent.comments ?? [];
  const tagRows = data?.recent.tags ?? [];
  const tourRows = data?.recent.tours ?? [];
  const hotelRows = data?.recent.hotels ?? [];
  const homestayRows = data?.recent.homestays ?? [];
  const restaurantRows = data?.recent.restaurants ?? [];
  const souvenirShopRows = data?.recent.souvenirShops ?? [];
  const travelGuideRows = data?.recent.travelGuides ?? [];

  const postTotal = data?.totals.posts ?? null;
  const categoryTotal = data?.totals.categories ?? null;
  const commentTotal = data?.totals.comments ?? null;
  const tagTotal = data?.totals.tags ?? null;
  const tourTotal = data?.totals.tours ?? null;
  const hotelTotal = data?.totals.hotels ?? null;
  const homestayTotal = data?.totals.homestays ?? null;
  const restaurantTotal = data?.totals.restaurants ?? null;
  const souvenirShopTotal = data?.totals.souvenirShops ?? null;
  const travelGuideTotal = data?.totals.travelGuides ?? null;

  const canPost = can("post", "list");
  const canCategory = can("category", "list");
  const canComment = can("comment", "list");
  const canTag = can("tag", "list");
  const canTour = can("tour", "list");
  const canHotel = can("hotel", "list");
  const canHomestay = can("homestay", "list");
  const canRestaurant = can("restaurant", "list");
  const canSouvenirShop = can("souvenirShop", "list");
  const canTravelGuide = can("travelGuide", "list");

  const allStats = [
    canPost && { key: "posts", label: "Total Posts", value: postTotal, icon: FileText, onClick: () => navigation.list("management/posts") },
    canCategory && { key: "categories", label: "Categories", value: categoryTotal, icon: Tag, onClick: () => navigation.list("management/categories") },
    canComment && { key: "comments", label: "Comments", value: commentTotal, icon: MessageSquare, onClick: () => navigation.list("management/comments") },
    canTag && { key: "tags", label: "Tags", value: tagTotal, icon: Tag, onClick: () => navigation.list("management/tags") },
    canTour && { key: "tours", label: "Tours", value: tourTotal, icon: Map, onClick: () => navigation.list("management/tours") },
    canHotel && { key: "hotels", label: "Hotels", value: hotelTotal, icon: Building2, onClick: () => navigation.list("management/hotels") },
    canHomestay && { key: "homestays", label: "Homestays", value: homestayTotal, icon: Home, onClick: () => navigation.list("management/homestays") },
    canRestaurant && { key: "restaurants", label: "Restaurants", value: restaurantTotal, icon: UtensilsCrossed, onClick: () => navigation.list("management/restaurants") },
    canSouvenirShop && { key: "shops", label: "Souvenir Shops", value: souvenirShopTotal, icon: Store, onClick: () => navigation.list("management/souvenir-shops") },
    canTravelGuide && { key: "guides", label: "Travel Guides", value: travelGuideTotal, icon: BookOpen, onClick: () => navigation.list("management/travel-guides") },
  ].filter(Boolean) as Array<{ key: string; label: string; value: number | null; icon: React.ElementType; onClick: () => void }>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's an overview of your travel content.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {allStats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {allStats.map((stat, index) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              onClick={stat.onClick}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {dashboard.isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive font-medium">
              Failed to load admin dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Items Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {canPost && (
          <RecentCard 
            title="Recent Posts" 
            icon={FileText} 
            rows={postRows} 
            onViewAll={() => navigation.list("management/posts")}
            color="blue"
          >
            {(item: PostRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canTour && (
          <RecentCard 
            title="Recent Tours" 
            icon={Map} 
            rows={tourRows} 
            onViewAll={() => navigation.list("management/tours")}
            color="emerald"
          >
            {(item: TourRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canHotel && (
          <RecentCard 
            title="Recent Hotels" 
            icon={Building2} 
            rows={hotelRows} 
            onViewAll={() => navigation.list("management/hotels")}
            color="amber"
          >
            {(item: HotelRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canHomestay && (
          <RecentCard 
            title="Recent Homestays" 
            icon={Home} 
            rows={homestayRows} 
            onViewAll={() => navigation.list("management/homestays")}
            color="rose"
          >
            {(item: HomestayRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canRestaurant && (
          <RecentCard 
            title="Recent Restaurants" 
            icon={UtensilsCrossed} 
            rows={restaurantRows} 
            onViewAll={() => navigation.list("management/restaurants")}
            color="violet"
          >
            {(item: RestaurantRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canSouvenirShop && (
          <RecentCard 
            title="Recent Souvenir Shops" 
            icon={Store} 
            rows={souvenirShopRows} 
            onViewAll={() => navigation.list("management/souvenir-shops")}
            color="cyan"
          >
            {(item: SouvenirShopRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canTravelGuide && (
          <RecentCard 
            title="Recent Travel Guides" 
            icon={BookOpen} 
            rows={travelGuideRows} 
            onViewAll={() => navigation.list("management/travel-guides")}
            color="indigo"
          >
            {(item: TravelGuideRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canTag && (
          <RecentCard 
            title="Tags" 
            icon={Tag} 
            rows={tagRows} 
            onViewAll={() => navigation.list("management/tags")}
            color="pink"
          >
            {(item: TagRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{item.slug}</TableCell>
              </>
            )}
          </RecentCard>
        )}

        {canComment && (
          <RecentCard 
            title="Recent Comments" 
            icon={MessageSquare} 
            rows={commentRows} 
            onViewAll={() => navigation.list("management/comments")}
            color="orange"
          >
            {(item: CommentRecord) => (
              <>
                <TableCell className="font-medium text-foreground">{item.authorName}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {item.content}
                </TableCell>
              </>
            )}
          </RecentCard>
        )}
      </div>
    </div>
  );
}

const colorMap: Record<string, { light: string; dark: string }> = {
  blue: { light: "bg-blue-50 text-blue-600", dark: "dark:bg-blue-500/20 dark:text-blue-400" },
  emerald: { light: "bg-emerald-50 text-emerald-600", dark: "dark:bg-emerald-500/20 dark:text-emerald-400" },
  amber: { light: "bg-amber-50 text-amber-600", dark: "dark:bg-amber-500/20 dark:text-amber-400" },
  rose: { light: "bg-rose-50 text-rose-600", dark: "dark:bg-rose-500/20 dark:text-rose-400" },
  violet: { light: "bg-violet-50 text-violet-600", dark: "dark:bg-violet-500/20 dark:text-violet-400" },
  cyan: { light: "bg-cyan-50 text-cyan-600", dark: "dark:bg-cyan-500/20 dark:text-cyan-400" },
  indigo: { light: "bg-indigo-50 text-indigo-600", dark: "dark:bg-indigo-500/20 dark:text-indigo-400" },
  pink: { light: "bg-pink-50 text-pink-600", dark: "dark:bg-pink-500/20 dark:text-pink-400" },
  orange: { light: "bg-orange-50 text-orange-600", dark: "dark:bg-orange-500/20 dark:text-orange-400" },
};

function RecentCard<T extends { id: number }>({
  title,
  icon: Icon,
  rows,
  onViewAll,
  children,
  color = "blue",
}: {
  title: string;
  icon: React.ElementType;
  rows: T[];
  onViewAll?: () => void;
  children: (row: T) => React.ReactNode;
  color?: string;
}) {
  const colors = colorMap[color] || colorMap.blue;
  
  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colors.light, colors.dark)}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="gap-1 text-xs text-muted-foreground hover:text-primary h-8 px-2"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">Name</TableHead>
              <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">Identifier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                {children(row)}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="px-5 py-8 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <span>No data yet</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AdminShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <Refine
        dataProvider={adminDataProvider}
        routerProvider={routerProvider}
        resources={[
          { name: "management/homepage", list: "/homepage" },
          { name: "management/content-pages", list: "/content-pages" },
          { name: "management/posts", list: "/posts" },
          { name: "management/tours", list: "/tours" },
          { name: "management/hotels", list: "/hotels" },
          { name: "management/homestays", list: "/homestays" },
          { name: "management/restaurants", list: "/restaurants" },
          { name: "management/souvenir-shops", list: "/souvenir-shops" },
          { name: "management/travel-guides", list: "/travel-guides" },
          { name: "management/categories", list: "/categories" },
          { name: "management/comments", list: "/comments" },
          { name: "management/tags", list: "/tags" },
        ]}
      >
        <ResourceOverview />
      </Refine>
    </QueryClientProvider>
  );
}
