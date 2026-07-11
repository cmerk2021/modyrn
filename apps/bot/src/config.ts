import { z } from 'zod';

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  REDIS_URL: z.string().url(),
  API_URL: z.string().url().default('http://localhost:4000'),
  /** Shared secret for authenticating bot -> API internal calls. */
  BOT_API_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type BotConfig = z.infer<typeof schema>;

/** Parses and validates the bot's environment. Fails fast on misconfiguration. */
export function loadConfig(): BotConfig {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid bot configuration:\n${issues}`);
  }
  return parsed.data;
}
