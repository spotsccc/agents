// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { openai } from "@ai-sdk/openai";
import { ModelMessage, generateText } from "ai";
import { promtAbRequest } from "@qqq/agent-function-contracts";
import { z } from "zod";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  const requestParseResult = promtAbRequest.safeParse(await req.json());

  if (!requestParseResult.success) {
    const { error } = requestParseResult;
    return new Response(JSON.stringify({ error: z.treeifyError(error) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data } = requestParseResult;

  const aTestConfig = {
    model: openai("gpt-4o"),
    systemPrompt: data.a.systemPrompt,
    temperature: data.a.temperature,
    topP: data.a.topP,
    topK: data.a.topK,
    maxOutputTokens: data.a.maxOutputTokens,
    presencePenalty: data.a.presencePenalty,
    frequencyPenalty: data.a.frequencyPenalty,
  };

  const bTestConfig = {
    model: openai("gpt-4o"),
    systemPrompt: data.b.systemPrompt,
    temperature: data.b.temperature,
    topP: data.b.topP,
    topK: data.b.topK,
    maxOutputTokens: data.b.maxOutputTokens,
    presencePenalty: data.b.presencePenalty,
    frequencyPenalty: data.b.frequencyPenalty,
  };

  const resultPromises = [];

  for (const userPrompt of data.userPrompts) {
    resultPromises.push(
      generateText({
        ...aTestConfig,
        messages: [
          { role: "system", content: aTestConfig.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      })
    );
    resultPromises.push(
      generateText({
        ...bTestConfig,
        messages: [
          { role: "system", content: bTestConfig.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      })
    );
  }

  return new Response(JSON.stringify({ request: request.data }), {
    headers: { "Content-Type": "application/json" },
  });
});
