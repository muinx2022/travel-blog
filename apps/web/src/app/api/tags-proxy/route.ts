import { NextRequest, NextResponse } from "next/server";
import { getTagsByPost, getTagsByTour, getTagsByTravelGuide, getTagBySlug } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postSlug = searchParams.get("postSlug") || undefined;
  const tourSlug = searchParams.get("tourSlug") || undefined;
  const travelGuideSlug = searchParams.get("travelGuideSlug") || undefined;
  const tagSlug = searchParams.get("tagSlug") || undefined;

  try {
    // If requesting tag by slug
    if (tagSlug) {
      const tag = await getTagBySlug(tagSlug);
      return NextResponse.json({ data: tag ? [tag] : [] });
    }

    // If requesting tags for a specific entity
    if (postSlug) {
      const tags = await getTagsByPost(postSlug);
      return NextResponse.json({ data: tags });
    }

    if (tourSlug) {
      const tags = await getTagsByTour(tourSlug);
      return NextResponse.json({ data: tags });
    }

    if (travelGuideSlug) {
      const tags = await getTagsByTravelGuide(travelGuideSlug);
      return NextResponse.json({ data: tags });
    }

    return NextResponse.json({ error: "Missing required parameter: postSlug, tourSlug, travelGuideSlug, or tagSlug" }, { status: 400 });
  } catch (error) {
    console.error("Error in tags proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
