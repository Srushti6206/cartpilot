import { NextResponse } from "next/server";
import { runShoppingAgent } from "@/lib/agent/orchestrator";
import { Channel3ServiceError } from "@/lib/channel3/service";
import { AgentValidationError, validateShoppingAgentRequest } from "@/lib/agent/validation";

export async function POST(request: Request) {
  try {
    const body = validateShoppingAgentRequest(await request.json());
    const response = await runShoppingAgent(body.message, body.history);
    console.info("[agent] shopping request complete", {
      mode: response.mode,
      status: response.status,
      toolCalls: response.toolCalls,
      diagnostics: response.diagnostics,
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AgentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Channel3ServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "The shopping agent could not process this request." }, { status: 502 });
  }
}
