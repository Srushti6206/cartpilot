import { afterEach, describe, expect, it, vi } from "vitest";
import { getGroqProvider, normalizeGroqResponse } from "./groq";

describe("Groq provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes a valid tool call", () => {
    const response = normalizeGroqResponse({
      id: "response-1",
      choices: [{
        message: {
          content: null,
          tool_calls: [{
            id: "call-1",
            function: { name: "search_products", arguments: '{"query":"headphones"}' },
          }],
        },
      }],
    });
    expect(response.toolCalls).toEqual([{
      id: "call-1",
      name: "search_products",
      arguments: { query: "headphones" },
    }]);
  });

  it("rejects malformed tool arguments", () => {
    expect(() => normalizeGroqResponse({
      id: "response-1",
      choices: [{
        message: {
          tool_calls: [{ id: "call-1", function: { name: "search_products", arguments: "{" } }],
        },
      }],
    })).toThrow("malformed tool arguments");
  });

  it("requires server-side credentials", () => {
    vi.stubEnv("GROQ_API_KEY", "");
    expect(() => getGroqProvider()).toThrow("GROQ_API_KEY is not configured");
  });

  it("surfaces sanitized provider errors", async () => {
    vi.stubEnv("GROQ_API_KEY", "configured");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: "rate limited" } }),
    }));
    await expect(getGroqProvider().extractIntent("Find headphones")).rejects.toThrow("Groq request failed (429): rate limited");
  });
});
