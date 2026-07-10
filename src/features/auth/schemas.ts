import { z } from "zod"

/**
 * Zod schemas cho luồng authentication. Dùng chung cho validate phía client
 * (react-hook-form) và phía server (server actions).
 *
 * KHÔNG lưu password / confirmPassword vào database profile.
 */

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Vui lòng nhập email")
  .email("Email không hợp lệ")
  .max(254, "Email quá dài")

export const signInSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .max(128, "Mật khẩu quá dài"),
})

export type SignInInput = z.infer<typeof signInSchema>

export const signUpSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên hiển thị")
      .max(80, "Tên hiển thị tối đa 80 ký tự"),
    email: emailField,
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .max(128, "Mật khẩu quá dài"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type SignUpInput = z.infer<typeof signUpSchema>

/**
 * Timezone gửi kèm từ browser khi đăng ký. Validate riêng để không phụ thuộc
 * input người dùng — có fallback 'UTC' phía server.
 */
export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .catch("UTC")
