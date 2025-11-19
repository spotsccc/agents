import { z } from "zod";

export const promtAbRequest = z.object({
  a: z.object({
    systemPrompt: z.string(),
    temperature: z.number(),
    topP: z.number(),
    topK: z.number(),
    maxOutputTokens: z.number(),
    presencePenalty: z.number(),
    frequencyPenalty: z.number(),
  }),
  b: z.object({
    systemPrompt: z.string(),
    temperature: z.number(),
    topP: z.number(),
    topK: z.number(),
    maxOutputTokens: z.number(),
    presencePenalty: z.number(),
    frequencyPenalty: z.number(),
  }),
  userPrompts: z.array(z.string()),
});

export const promtAbResponse = z.object({
  a: z.object({
    score: z.number(),
    response: z.string(),
  }),
  b: z.object({
    score: z.number(),
    response: z.string(),
  }),
});

// Export inferred TypeScript types from zod schemas
export type PromtAbRequest = z.infer<typeof promtAbRequest>;
export type PromtAbResponse = z.infer<typeof promtAbResponse>;
