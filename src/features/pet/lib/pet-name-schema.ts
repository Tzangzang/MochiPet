import { z } from "zod"

export const petNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng đặt tên cho pet")
    .max(40, "Tên pet tối đa 40 ký tự"),
})

export type PetNameInput = z.infer<typeof petNameSchema>
