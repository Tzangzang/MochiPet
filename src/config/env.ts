import { z } from "zod"

/**
 * Schema cho các biến môi trường PUBLIC dùng ở phía browser (Supabase browser client).
 *
 * Chỉ chứa những biến an toàn để lộ ra client bundle. TUYỆT ĐỐI không đưa
 * service role key hay bất kỳ secret server-side nào vào đây.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

let cached: ClientEnv | null = null

/**
 * Đọc và validate biến môi trường public.
 *
 * Gọi hàm này LAZY — chỉ khi Supabase client thực sự được khởi tạo, để quá
 * trình build không bị crash khi chưa có credentials thật (biến chưa được set).
 *
 * Các biến `process.env.NEXT_PUBLIC_*` được tham chiếu tĩnh để Next.js inline
 * được giá trị vào bundle tại build time.
 */
export function getClientEnv(): ClientEnv {
  if (cached) return cached

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid or missing public environment variables:\n${issues}\n\n` +
        "Copy .env.example to .env.local and fill in your Supabase project values.",
    )
  }

  cached = parsed.data
  return cached
}
