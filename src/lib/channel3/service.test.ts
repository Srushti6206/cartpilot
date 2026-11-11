import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/channel3/client", () => ({
  getChannel3Client: vi.fn(),
}));

import { getChannel3Client } from "@/lib/channel3/client";
import { Channel3ServiceError, searchProducts } from "@/lib/channel3/service";

describe("Channel3 service validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CHANNEL3_API_KEY;
  });

  it("rejects empty searches before making an API call", async () => {
    await expect(searchProducts({ query: " " })).rejects.toMatchObject({
      code: "validation",
      status: 400,
    });
    expect(getChannel3Client).not.toHaveBeenCalled();
  });

  it("rejects inverted price ranges", async () => {
    await expect(searchProducts({ query: "shoes", minPrice: 200, maxPrice: 100 }))
      .rejects.toBeInstanceOf(Channel3ServiceError);
  });

  it("reports missing credentials explicitly", async () => {
    vi.mocked(getChannel3Client).mockImplementation(() => {
      throw new Error("CHANNEL3_API_KEY is not configured.");
    });
    await expect(searchProducts({ query: "shoes" })).rejects.toMatchObject({
      code: "missing-key",
      status: 503,
    });
  });
});
