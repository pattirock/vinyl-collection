import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";

import {
  AGENT_MODEL,
  ClaudeRefusalError,
  DEFAULT_MAX_TOKENS,
  FALLBACK_BETA,
  buildAgentRequest,
  createClaudeClient,
  runAgentTurn,
  type StreamingClient,
} from "./client.js";

const request = {
  system: "You are the Back agent.",
  messages: [{ role: "user" as const, content: "Implement VINYL-22" }],
  effort: "high" as const,
};

function fakeClient(message: Partial<Anthropic.Beta.BetaMessage>) {
  const finalMessage = vi.fn(() => Promise.resolve(message as Anthropic.Beta.BetaMessage));
  const stream = vi.fn(() => ({ finalMessage }));
  const client: StreamingClient = { beta: { messages: { stream } } };
  return { client, stream };
}

describe("buildAgentRequest", () => {
  it("uses the agent model, adaptive thinking, explicit effort and the refusal fallback", () => {
    expect(buildAgentRequest(request)).toEqual({
      model: AGENT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [{ type: "text", text: request.system, cache_control: { type: "ephemeral" } }],
      messages: request.messages,
    });
  });

  it("pins the expected model and beta", () => {
    expect(AGENT_MODEL).toBe("claude-opus-5-5");
    expect(FALLBACK_BETA).toBe("server-side-fallback-2026-07-01");
  });

  it("allows overriding max_tokens", () => {
    expect(buildAgentRequest({ ...request, maxTokens: 1024 }).max_tokens).toBe(1024);
  });
});

describe("runAgentTurn", () => {
  it("streams the request and returns the final message", async () => {
    const message = { stop_reason: "end_turn", content: [] } as Partial<Anthropic.Beta.BetaMessage>;
    const { client, stream } = fakeClient(message);

    await expect(runAgentTurn(client, request)).resolves.toBe(message);
    expect(stream).toHaveBeenCalledWith(buildAgentRequest(request));
  });

  it("throws ClaudeRefusalError when the whole fallback chain refuses", async () => {
    const { client } = fakeClient({
      stop_reason: "refusal",
      stop_details: { type: "refusal", category: "cyber", explanation: "Not allowed" },
    } as Partial<Anthropic.Beta.BetaMessage>);

    const turn = runAgentTurn(client, request);
    await expect(turn).rejects.toBeInstanceOf(ClaudeRefusalError);
    await expect(turn).rejects.toMatchObject({ category: "cyber" });
  });

  it("handles a refusal without stop details", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", stop_details: null });
    await expect(runAgentTurn(client, request)).rejects.toThrow("Claude declined the request");
  });
});

describe("createClaudeClient", () => {
  it("builds an SDK client without making any request", () => {
    const client = createClaudeClient();
    expect(typeof client.beta.messages.stream).toBe("function");
  });
});
