// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { openai } from "npm:@ai-sdk/openai";
import { ModelMessage, generateText } from "npm:ai";

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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-sdk-test' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
