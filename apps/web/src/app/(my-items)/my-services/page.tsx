"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useMyServiceAuthGuard } from "@/features/my-services/hooks/useMyServiceAuthGuard";
import { useAuth } from "@/components/auth-context";
import type { ServiceType } from "@/features/my-services/types";
import {
  Briefcase,
  FileText,
  MapPin,
  Hotel,
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Edit3,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";

type ServiceItem = {
  documentId: string;
  type: ServiceType;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published";
  editUrl: string;
};

type ServicesMeta = {
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  byType: Record<ServiceType, number>;
};

const typeLabels: Record<
  ServiceType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  post: {
    label: "Bài viết",
    icon: <FileText className="h-4 w-4" />,
    color: "text-sky-600 bg-sky-50",
  },
  tour: {
    label: "Tour",
    icon: <MapPin className="h-4 w-4" />,
    color: "text-emerald-600 bg-emerald-50",
  },
  hotel: {
    label: "Khách sạn",
    icon: <Hotel className="h-4 w-4" />,
    color: "text-amber-600 bg-amber-50",
  },
  homestay: {
    label: "Homestay",
    icon: <Home className="h-4 w-4" />,
    color: "text-indigo-600 bg-indigo-50",
  },
  restaurant: {
    label: "Nhà hàng",
    icon: <UtensilsCrossed className="h-4 w-4" />,
    color: "text-rose-600 bg-rose-50",
  },
  "souvenir-shop": {
    label: "Quà lưu niệm",
    icon: <ShoppingBag className="h-4 w-4" />,
    color: "text-violet-600 bg-violet-50",
  },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IconTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="pointer-events-none absolute -top-8 right-0 z-10 hidden whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-[11px] text-white shadow group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
      {label}
      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100"></span>
    </span>
  );
}

export default function MyServicesPage() {
  const { isReady, jwt } = useMyServiceAuthGuard();
  const { user } = useAuth();
  const isReadOnly = Boolean(user?.isBanned);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [meta, setMeta] = useState<ServicesMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ServiceType | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    if (!jwt) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/my-services-proxy", {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });

      const payload = (await res.json().catch(() => ({}))) as {
        data?: ServiceItem[];
        meta?: ServicesMeta;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || "Failed to load services");
      }

      setServices(payload.data ?? []);
      setMeta(payload.meta ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  const onToggleStatus = async (item: ServiceItem) => {
    if (isReadOnly) {
      return;
    }
    if (!jwt) return;
    setError(null);

    try {
      const res = await fetch("/api/my-services-proxy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          documentId: item.documentId,
          type: item.type,
          currentStatus: item.status,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        data?: { status?: "draft" | "published" };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || "Không đổi được trạng thái");
      }

      setServices((prev) =>
        prev.map((s) =>
          s.documentId === item.documentId
            ? {
                ...s,
                status: payload.data?.status ??
                  (s.status === "published" ? "draft" : "published"),
              }
            : s,
        ),
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Không đổi được trạng thái");
    }
  };

  useEffect(() => {
    if (!isReady || !jwt) return;
    void load();
  }, [isReady, jwt, load]);

  const filteredServices =
    filterType === "all" ? services : services.filter((s) => s.type === filterType);

  const totalFiltered = filteredServices.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedServices = filteredServices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  if (!isReady || !jwt) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 md:p-6">
      <header>
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
          Trang chủ
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Các dịch vụ của tôi
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Quản lý tất cả bài viết, khách sạn, tour và dịch vụ khác
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </header>
      {meta && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <button
            onClick={() => {
              setFilterType("all");
              setPage(1);
            }}
            className={`rounded-lg border p-3 text-left transition ${
              filterType === "all"
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
            }`}
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {meta.pagination.total}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Tất cả</p>
          </button>

          {(Object.keys(meta.byType) as ServiceType[])
            .filter((type) => meta.byType[type] > 0)
            .map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(filterType === type ? "all" : type);
                  setPage(1);
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  filterType === type
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                }`}
              >
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {meta.byType[type]}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {typeLabels[type].label}
                </p>
              </button>
            ))}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {isReadOnly && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          Tài khoản của bạn đang bị cấm hoạt động. Bạn chỉ có thể xem danh sách dịch vụ.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!loading && filteredServices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Briefcase className="h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Chưa có dịch vụ nào
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Bắt đầu bằng cách tạo dịch vụ đầu tiên của bạn
          </p>
        </div>
      )}

      {!loading && filteredServices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Tiêu đề
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Tạo lúc
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    Cập nhật
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {paginatedServices.map((service) => (
                  <tr
                    key={`${service.type}-${service.documentId}`}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeLabels[service.type].color}`}
                      >
                        {typeLabels[service.type].icon}
                        {typeLabels[service.type].label}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {service.title}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDate(service.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatDate(service.updatedAt)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(service)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          service.status === "published"
                            ? "bg-emerald-500 hover:bg-emerald-600"
                            : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                        } ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
                        title={service.status === "published" ? "Chuyển về nháp" : "Xuất bản"}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            service.status === "published" ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {!isReadOnly && (
                        <Link
                          href={service.editUrl}
                          className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                          <IconTooltip label="Chỉnh sửa">
                            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100"></span>
                          </IconTooltip>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tổng: {totalFiltered} • Trang {safePage}/{pageCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                disabled={safePage >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}



