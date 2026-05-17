import { z } from 'zod'

const AppStatusEnum = z.enum(['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'])

export const CreateApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  companyUrl: z.string().url().optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  remote: z.boolean().optional().default(false),
  status: AppStatusEnum.optional().default('WISHLIST'),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  salaryFreq: z.string().optional().nullable(),
  jobUrl: z.string().url().optional().or(z.literal('')).nullable(),
  jobDescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  linkedResumeId: z.string().optional().nullable(),
  interviewQuestions: z.string().optional(),
})

export const UpdateApplicationSchema = CreateApplicationSchema.partial()

export const ApplicationFiltersSchema = z.object({
  status: AppStatusEnum.optional(),
  search: z.string().optional(),
})

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>
export type ApplicationFilters = z.infer<typeof ApplicationFiltersSchema>
