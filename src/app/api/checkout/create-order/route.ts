import { NextResponse } from "next/server";
import {
  amountFromCents,
  createCheckoutBinding,
  getCheckoutBindingDiagnostics,
  validateCart,
} from "@/lib/checkout";
import { paypalRequest, PayPalServiceError } from "@/lib/paypal/client";

interface PayPalCreateOrderResponse {
  id?: string;
  status?: string;
  purchase_units?: Array<{ custom_id?: string }>;
  links?: Array<{ rel?: string; href?: string }>;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const cart = await validateCart(body && typeof body === "object" ? (body as { items?: unknown }).items : undefined);
    const binding = createCheckoutBinding(cart);
    const origin = new URL(request.url).origin;
    const response = await paypalRequest<PayPalCreateOrderResponse>("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          custom_id: binding,
          amount: { currency_code: cart.currency, value: amountFromCents(cart.totalCents) },
        }],
        application_context: {
          brand_name: "CartPilot",
          user_action: "PAY_NOW",
          return_url: `${origin}/checkout/return`,
          cancel_url: `${origin}/checkout/return?cancelled=1`,
        },
      }),
    });
    if (!response.id) {
      throw new PayPalServiceError("PayPal did not return an order ID.", 502, "invalid-response");
    }
    const retrieved = await paypalRequest<PayPalCreateOrderResponse>(
      `/v2/checkout/orders/${encodeURIComponent(response.id)}`,
    );
    const retrievedCustomId = retrieved.purchase_units?.[0]?.custom_id;
    const bindingDiagnostics = getCheckoutBindingDiagnostics(retrievedCustomId);
    console.info("[paypal] create order binding diagnostic", {
      customIdPresent: bindingDiagnostics.customIdPresent,
      customIdLength: bindingDiagnostics.customIdLength,
      expectedPrefix: bindingDiagnostics.expectedPrefix,
      prefixMatches: bindingDiagnostics.prefixMatches,
      purchaseUnitCount: retrieved.purchase_units?.length ?? 0,
      paypalOrderStatus: retrieved.status ?? "unknown",
    });
    if (!bindingDiagnostics.customIdPresent || !bindingDiagnostics.expectedPrefix) {
      throw new PayPalServiceError(
        "PayPal did not preserve the CartPilot checkout binding. No approval redirect was started.",
        502,
        "binding-missing",
      );
    }
    const approvalUrl = response.links?.find((link) => link.rel === "approve")?.href;
    if (!response.id || !approvalUrl) {
      throw new PayPalServiceError("PayPal did not return an approval link.", 502, "invalid-response");
    }
    return NextResponse.json({ orderId: response.id, approvalUrl });
  } catch (error) {
    if (error instanceof PayPalServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create checkout." }, { status: 400 });
  }
}
