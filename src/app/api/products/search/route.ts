import { NextResponse } from "next/server";
import { Channel3ServiceError, searchProducts } from "@/lib/channel3/service";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const result = await searchProducts({
      query: typeof input.query === "string" ? input.query : "",
      maxPrice: typeof input.maxPrice === "number" ? input.maxPrice : undefined,
      minPrice: typeof input.minPrice === "number" ? input.minPrice : undefined,
      pageToken: typeof input.pageToken === "string" ? input.pageToken : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Channel3ServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
