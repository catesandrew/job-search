import { z } from 'zod'

const ResumeTypeEnum = z.enum(['BASE', 'JOB_APPLICATION_OPTIMIZED', 'JOB_TITLE_OPTIMIZED'])

export const CreateResumeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: ResumeTypeEnum.optional().default('BASE'),
  templateId: z.string().optional().default('harvard'),
  fontFamily: z.string().optional().default('Garamond'),
  fontSize: z.string().optional().default('medium'),
  lineHeight: z.string().optional().default('standard'),
  skillsFormat: z.string().optional().default('labeled'),
  repoLinks: z.boolean().optional().default(true),
  sectionTitleCasing: z.string().optional().default('capitalized'),
  dateFormat: z.string().optional().default('short'),
  marginH: z.string().optional().default('standard'),
  marginV: z.string().optional().default('standard'),
  pageSize: z.string().optional().default('letter'),
  sectionOrder: z.string().optional(),
})

export const UpdateResumeSchema = CreateResumeSchema.partial().extend({
  score: z.number().int().min(0).max(100).optional().nullable(),
  identityId: z.string().optional().nullable(),
})

export const ProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  targetTitle: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
})

export const PositionSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  companyDesc: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  sortOrder: z.number().int(),
  sourcePositionId: z.string().optional().nullable(),
})

export const UpdatePositionSchema = PositionSchema.partial()

export const BulletSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  hidden: z.boolean().optional().default(false),
  sortOrder: z.number().int(),
  sourceBulletId: z.string().optional().nullable(),
})

export const UpdateBulletSchema = BulletSchema.partial()

export const SkillCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  skills: z.string().min(1, 'Skills are required'),
  sortOrder: z.number().int(),
})

export const UpdateSkillCategorySchema = SkillCategorySchema.partial()

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().optional().default(false),
  achievements: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
})

export const UpdateEducationSchema = EducationSchema.extend({
  libraryEducationId: z.string().optional().nullable(),
}).partial()

export const LibraryEducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().optional().default(false),
  achievements: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
})
export const UpdateLibraryEducationSchema = LibraryEducationSchema.partial()

export const ProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  link: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().optional().default(false),
  achievements: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
})

export const UpdateProjectSchema = ProjectSchema.partial()

export const UpdateProfileSchema = ProfileSchema.partial()

export const IdentitySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
})

export const UpdateIdentitySchema = IdentitySchema.partial()

export type IdentityInput = z.infer<typeof IdentitySchema>
export type UpdateIdentityInput = z.infer<typeof UpdateIdentitySchema>

export type CreateResumeInput = z.infer<typeof CreateResumeSchema>
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>
export type ProfileInput = z.infer<typeof ProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type PositionInput = z.infer<typeof PositionSchema>
export type BulletInput = z.infer<typeof BulletSchema>
export type SkillCategoryInput = z.infer<typeof SkillCategorySchema>
export type EducationInput = z.infer<typeof EducationSchema>
export type ProjectInput = z.infer<typeof ProjectSchema>
