const DEFAULT_PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";
const REQUEST_TIMEOUT_MS = 15_000;

interface PayPalErrorBody {
  name?: string;
  message?: string;
  details?: Array<{ issue?: string; description?: string }>;
}

export class PayPalServiceError extends Error {
  constructor(
    message: string,
    readonly status = 502,
    readonly code = "paypal-error",
  ) {
    super(message);
  }
}

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PayPalServiceError("PayPal Sandbox is not configured on this server.", 503, "missing-key");
  }
  return {
    clientId,
    clientSecret,
    baseUrl: process.env.PAYPAL_BASE_URL || DEFAULT_PAYPAL_BASE_URL,
  };
}

async function parseError(response: Response) {
  let body: PayPalErrorBody | undefined;
  try {
    body = await response.json() as PayPalErrorBody;
  } catch {
    body = undefined;
  }
  const detail = body?.details?.find((item) => item.description)?.description;
  const message = detail || body?.message || "PayPal could not complete the request.";
  return new PayPalServiceError(message.slice(0, 240), response.status >= 500 ? 502 : response.status);
}

async function requestPayPal<T>(path: string, init: RequestInit, accessToken: string): Promise<T> {
  const { baseUrl } = getPayPalConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) throw await parseError(response);
    return await response.json() as T;
  } catch (error) {
    if (error instanceof PayPalServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new PayPalServiceError("PayPal request timed out.", 504, "timeout");
    }
    throw new PayPalServiceError("Could not connect to PayPal.", 502, "upstream");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPayPalAccessToken() {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
    });
    if (!response.ok) throw await parseError(response);
    const body = await response.json() as { access_token?: unknown };
    if (typeof body.access_token !== "string" || !body.access_token) {
      throw new PayPalServiceError("PayPal did not return an access token.", 502, "invalid-response");
    }
    return body.access_token;
  } catch (error) {
    if (error instanceof PayPalServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new PayPalServiceError("PayPal authentication timed out.", 504, "timeout");
    }
    throw new PayPalServiceError("Could not authenticate with PayPal.", 502, "upstream");
  } finally {
    clearTimeout(timeout);
  }
}

export async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  return requestPayPal<T>(path, init, await getPayPalAccessToken());
}
