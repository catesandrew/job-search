import { z } from 'zod'

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  done: z.boolean().optional().default(false),
})

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
