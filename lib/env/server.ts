import "server-only";
import { z } from "zod";
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_DEFAULT_PROVIDER: z.enum(["openai", "anthropic", "google"]),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development")
});
export const env = schema.parse(process.env);
