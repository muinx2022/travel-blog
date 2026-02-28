import { NextRequest, NextResponse } from "next/server";
import { getHomestaysWithPagination } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const categorySlug = searchParams.get("category") || undefined;

  try {
    const data = await getHomestaysWithPagination(page, pageSize, categorySlug);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch homestays", error);
    return NextResponse.json({ error: "Failed to fetch homestays" }, { status: 500 });
  }
}
