import Anthropic from "@anthropic-ai/sdk";

import type { Effort } from "../config/env.js";

/** Every agent runs on this model; effort is tuned per agent (see VINYL-55 eval suite). */
export const AGENT_MODEL = "claude-opus-5-5";
/** Beta that enables server-side refusal fallbacks with `fallbacks: "default"`. */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";
/** Streaming request, so a large output budget does not hit HTTP timeouts. */
export const DEFAULT_MAX_TOKENS = 64_000;

type StreamParams = Parameters<Anthropic["beta"]["messages"]["stream"]>[0];

/** The slice of the SDK client the agents use; lets tests inject a fake without network access. */
export interface StreamingClient {
  beta: {
    messages: {
      stream(params: StreamParams): { finalMessage(): Promise<Anthropic.Beta.BetaMessage> };
    };
  };
}

export interface AgentTurnRequest {
  /** Stable per-agent instructions (CLAUDE.md excerpts, role); cached as the prompt prefix. */
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  effort: Effort;
  maxTokens?: number;
}

export class ClaudeRefusalError extends Error {
  override readonly name = "ClaudeRefusalError";

  constructor(
    readonly category: string | null,
    explanation: string | null,
  ) {
    super(
      `Claude declined the request${category ? ` (${category})` : ""}${explanation ? `: ${explanation}` : ""}`,
    );
  }
}

export function createClaudeClient(): Anthropic {
  // Credentials resolve from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or the `ant auth` profile.
  return new Anthropic({ maxRetries: 2 });
}

/** Build the request every agent sends: same model, adaptive thinking, explicit effort, refusal fallback. */
export function buildAgentRequest(request: AgentTurnRequest): StreamParams {
  return {
    model: AGENT_MODEL,
    max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: request.effort },
    system: [{ type: "text", text: request.system, cache_control: { type: "ephemeral" } }],
    messages: request.messages,
  };
}

/** Run one streamed turn and return the final message; a refusal of the whole fallback chain throws. */
export async function runAgentTurn(
  client: StreamingClient,
  request: AgentTurnRequest,
): Promise<Anthropic.Beta.BetaMessage> {
  const message = await client.beta.messages.stream(buildAgentRequest(request)).finalMessage();

  if (message.stop_reason === "refusal") {
    throw new ClaudeRefusalError(
      message.stop_details?.category ?? null,
      message.stop_details?.explanation ?? null,
    );
  }
  return message;
}
