import { createBacklogExecutionSkill } from "./backlog-execution.js";
import { createBacklogPlanningSkill } from "./backlog-planning.js";
import { createBacklogReadinessSkill } from "./backlog-readiness.js";
import { createBacklogResearchSkill } from "./backlog-research.js";
import { createBacklogSkill } from "./backlog-workflow.js";
import { createEngineeringStandardsSkill } from "./engineering-standards.js";
import { createJavaScriptSkill } from "./javascript.js";
import { createPlaywrightSkill } from "./playwright.js";
import { createSqlSkill } from "./sql.js";
import { createTestingVerificationSkill } from "./testing-verification.js";
import { createVercelSkill } from "./vercel.js";
import { createVitestSkill } from "./vitest.js";

const skillContentFactories = {
  "backlog-workflow": createBacklogSkill,
  "backlog-research": createBacklogResearchSkill,
  "backlog-planning": createBacklogPlanningSkill,
  "backlog-readiness": createBacklogReadinessSkill,
  "backlog-execution": createBacklogExecutionSkill,
  "engineering-standards": createEngineeringStandardsSkill,
  "testing-verification": createTestingVerificationSkill,
  javascript: createJavaScriptSkill,
  sql: createSqlSkill,
  vercel: createVercelSkill,
  playwright: createPlaywrightSkill,
  vitest: createVitestSkill,
} as const;

type SkillSlug = keyof typeof skillContentFactories;

export function createSkillContent(slug: string) {
  const factory = skillContentFactories[slug as SkillSlug];

  if (!factory) {
    throw new Error(`Unknown skill slug: ${slug}`);
  }

  return factory();
}
