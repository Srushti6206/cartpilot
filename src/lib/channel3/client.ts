import { Channel3 } from "@channel3/sdk";

export function getChannel3Client() {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) {
    throw new Error("CHANNEL3_API_KEY is not configured.");
  }

  return new Channel3({
    apiKey,
    baseUrl: "https://api.trychannel3.com",
    country: process.env.CHANNEL3_COUNTRY || "US",
    currency: process.env.CHANNEL3_CURRENCY || "USD",
    language: process.env.CHANNEL3_LANGUAGE || "en",
    timeoutInSeconds: 15,
    maxRetries: 1,
  });
}
