export interface PromptConfig {
  systemPrompt: string
  temperature: number
  topP: number
  topK: number
  maxOutputTokens: number
  presencePenalty: number
  frequencyPenalty: number
}

export interface PromptResult {
  variant: 'A' | 'B'
  score: number
  response: string
  latencyMs: number
  tokensUsed: number
  promptPreview: string
}
