import { z } from 'zod'

export const UpsertSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
})

export const UpdateSettingSchema = z.object({
  value: z.string(),
})

export type UpsertSettingInput = z.infer<typeof UpsertSettingSchema>
export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>
