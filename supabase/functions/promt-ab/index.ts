import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { openai } from "npm:@ai-sdk/openai";
import { ModelMessage, generateText } from "npm:ai";
import { promtAbRequest, promtAbResponse } from "npm:function-contracts";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  console.log("OPENAI_KEY:", Deno.env.get("OPENAI_API_KEY"));
  const { name } = await req.json();
  const response = await generateText({
    model: openai("gpt-4o"),
    prompt: "Hello, how are you?",
  });

  console.log(response.text);

  return new Response(JSON.stringify({ message: response.text }), {
    headers: { "Content-Type": "application/json" },
  });
});
