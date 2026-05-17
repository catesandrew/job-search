'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/rich-text-editor'
import Link from 'next/link'

const applicationFormSchema = z.object({
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED']).default('WISHLIST'),
  company: z.string().min(1, 'Company is required'),
  companyUrl: z.string().default(''),
  role: z.string().min(1, 'Role is required'),
  location: z.string().default(''),
  remote: z.boolean().default(false),
  salaryMin: z.union([z.number().int().positive(), z.nan(), z.literal(0)]).optional().nullable(),
  salaryMax: z.union([z.number().int().positive(), z.nan(), z.literal(0)]).optional().nullable(),
  salaryFreq: z.string().default(''),
  jobUrl: z.string().default(''),
  linkedResumeId: z.string().optional().nullable(),
  jobDescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type ApplicationFormValues = z.infer<typeof applicationFormSchema>

interface ApplicationFormProps {
  defaultValues?: Partial<ApplicationFormValues>
  onSubmit: (data: ApplicationFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function ApplicationForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Create Application',
}: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      status: 'WISHLIST',
      company: '',
      companyUrl: '',
      role: '',
      location: '',
      remote: false,
      salaryMin: null,
      salaryMax: null,
      salaryFreq: '',
      jobUrl: '',
      linkedResumeId: null,
      jobDescription: null,
      notes: null,
      ...defaultValues,
    },
  })

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes')
      if (!res.ok) return []
      const json = await res.json()
      return json.data as { id: string; title: string }[]
    },
  })

  const processSubmit = async (data: ApplicationFormValues) => {
    const cleaned: ApplicationFormValues = {
      ...data,
      salaryMin: data.salaryMin && !isNaN(data.salaryMin) ? data.salaryMin : null,
      salaryMax: data.salaryMax && !isNaN(data.salaryMax) ? data.salaryMax : null,
      linkedResumeId: data.linkedResumeId === 'none' ? null : data.linkedResumeId || null,
    }
    await onSubmit(cleaned)
  }

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WISHLIST">Wishlist</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                  <SelectItem value="OFFER">Offer</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company */}
          <div className="space-y-2">
            <Label>Company *</Label>
            <Input {...register('company')} placeholder="Company name" />
            {errors.company && (
              <p className="text-xs text-destructive">{errors.company.message}</p>
            )}
          </div>

          {/* Company Website */}
          <div className="space-y-2">
            <Label>Company Website</Label>
            <Input {...register('companyUrl')} placeholder="https://company.com" />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role *</Label>
            <Input {...register('role')} placeholder="Job title" />
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Location + Remote */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex items-center gap-3">
              <Input {...register('location')} placeholder="City, State" className="flex-1" />
              <div className="flex items-center gap-2 shrink-0">
                <Controller
                  control={control}
                  name="remote"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label className="text-xs font-normal text-muted-foreground">Remote</Label>
              </div>
            </div>
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label>Expected Salary Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                {...register('salaryMin', { valueAsNumber: true })}
                placeholder="Min"
              />
              <span className="text-muted-foreground text-sm">-</span>
              <Input
                type="number"
                {...register('salaryMax', { valueAsNumber: true })}
                placeholder="Max"
              />
            </div>
          </div>

          {/* Salary Frequency */}
          <div className="space-y-2">
            <Label>Salary Pay Frequency</Label>
            <Controller
              control={control}
              name="salaryFreq"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Job Details URL */}
        <div className="space-y-2">
          <Label>Job Details URL</Label>
          <Input {...register('jobUrl')} placeholder="https://company.com/careers/..." />
        </div>

        {/* Resume Selector */}
        <div className="space-y-2">
          <Label>Linked Resume</Label>
          <Controller
            control={control}
            name="linkedResumeId"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={(val) => field.onChange(val || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No resume linked</SelectItem>
                  {resumes.map((r: { id: string; title: string }) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <Label>Job Description</Label>
          <Controller
            control={control}
            name="jobDescription"
            render={({ field }) => (
              <RichTextEditor
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Paste the job description here"
                minHeight="200px"
              />
            )}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <RichTextEditor
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Add notes about the position"
                minHeight="120px"
              />
            )}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-border bg-background px-6 py-4 flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          Use the browser extension to quickly add applications from job boards
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/applications">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-mint hover:bg-mint/90 text-primary-foreground"
          >
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
