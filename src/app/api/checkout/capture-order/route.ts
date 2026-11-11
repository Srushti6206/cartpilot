import { NextResponse } from "next/server";
import {
  getCheckoutBindingDiagnostics,
  validateCart,
  verifyAmountCurrency,
  verifyCheckoutBinding,
} from "@/lib/checkout";
import { paypalRequest, PayPalServiceError } from "@/lib/paypal/client";

interface PayPalOrderResponse {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { value?: unknown; currency_code?: unknown };
    payments?: { captures?: Array<{
      id?: string;
      status?: string;
      amount?: { value?: unknown; currency_code?: unknown };
    }> };
  }>;
}

function getPurchaseUnit(order: PayPalOrderResponse) {
  const unit = order.purchase_units?.[0];
  if (!unit) throw new Error("PayPal order has no purchase unit.");
  return unit;
}

function getCapture(unit: NonNullable<PayPalOrderResponse["purchase_units"]>[number]) {
  const capture = unit.payments?.captures?.[0];
  if (!capture?.status || !capture.amount) throw new Error("PayPal did not return a verified capture.");
  return capture;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || typeof (body as { orderId?: unknown }).orderId !== "string") {
      return NextResponse.json({ error: "PayPal order ID is required." }, { status: 400 });
    }
    const input = body as { orderId: string; items?: unknown };
    const order = await paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(input.orderId)}`);
    if (order.id !== input.orderId) throw new Error("PayPal returned an unexpected order.");
    const unit = order.purchase_units?.[0];
    const bindingDiagnostics = getCheckoutBindingDiagnostics(unit?.custom_id);
    console.info("[paypal] capture order binding diagnostic", {
      customIdPresent: bindingDiagnostics.customIdPresent,
      customIdLength: bindingDiagnostics.customIdLength,
      expectedPrefix: bindingDiagnostics.expectedPrefix,
      prefixMatches: bindingDiagnostics.prefixMatches,
      purchaseUnitCount: order.purchase_units?.length ?? 0,
      paypalOrderStatus: order.status ?? "unknown",
    });
    if (!unit) throw new Error("PayPal order has no purchase unit.");
    let binding;
    try {
      binding = verifyCheckoutBinding(unit.custom_id);
      console.info("[paypal] capture binding verification", { signatureValid: true });
    } catch (error) {
      console.info("[paypal] capture binding verification", { signatureValid: false });
      throw error;
    }
    let verifiedOrder = order;
    const cart = order.status === "COMPLETED"
      ? null
      : await validateCart(input.items);
    if (cart && (cart.snapshotHash !== binding.snapshotHash || cart.totalCents !== binding.totalCents || cart.currency !== binding.currency)) {
      throw new Error("The cart changed after checkout approval. No payment was captured.");
    }
    if (order.status !== "COMPLETED") {
      if (order.status !== "APPROVED") {
        return NextResponse.json({ error: "Buyer approval is required before capture." }, { status: 409 });
      }
      verifiedOrder = await paypalRequest<PayPalOrderResponse>(`/v2/checkout/orders/${encodeURIComponent(input.orderId)}/capture`, {
        method: "POST",
        headers: { "PayPal-Request-Id": crypto.randomUUID() },
        body: JSON.stringify({}),
      });
    }

    const capturedUnit = getPurchaseUnit(verifiedOrder);
    const capture = getCapture(capturedUnit);
    if (capture.status !== "COMPLETED") {
      throw new Error("PayPal capture was not completed.");
    }
    verifyAmountCurrency(capture.amount, binding.totalCents, binding.currency);
    return NextResponse.json({
      paid: true,
      order: {
        id: capture.id ?? input.orderId,
        paypalOrderId: input.orderId,
        status: "paid",
        total: binding.totalCents / 100,
        currency: binding.currency,
        items: cart?.items ?? [],
        paidAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof PayPalServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not capture checkout." }, { status: 400 });
  }
}
