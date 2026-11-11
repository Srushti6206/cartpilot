import { NextResponse } from "next/server";
import { Channel3ServiceError, getProduct } from "@/lib/channel3/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return NextResponse.json(await getProduct((await params).id));
  } catch (error) {
    if (error instanceof Channel3ServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load product." }, { status: 502 });
  }
}
