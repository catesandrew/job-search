'use client'

import { Resume, useUpdateProfile, useUpdateResume } from '@/hooks/use-resume'
import { useIdentities, Identity } from '@/hooks/use-identity'
import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserCircle, ExternalLink, Unlink } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

const readonlyInput =
  'w-full bg-transparent border-0 border-b border-border/40 rounded-none px-0 py-1.5 text-sm text-muted-foreground cursor-default select-none'

interface GeneralTabProps {
  resume: Resume
}

interface ProfileFormValues {
  firstName: string
  lastName: string
  location: string
  email: string
  phone: string
  linkedin: string
  website: string
  github: string
}

export function GeneralTab({ resume }: GeneralTabProps) {
  const updateProfile = useUpdateProfile(resume.id)
  const updateResume = useUpdateResume()
  const { data: identities = [] } = useIdentities()

  const { register, handleSubmit } = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: resume.profile?.firstName ?? '',
      lastName: resume.profile?.lastName ?? '',
      location: resume.profile?.location ?? '',
      email: resume.profile?.email ?? '',
      phone: resume.profile?.phone ?? '',
      linkedin: resume.profile?.linkedin ?? '',
      website: resume.profile?.website ?? '',
      github: resume.profile?.github ?? '',
    },
  })

  const saveField = handleSubmit(data => {
    updateProfile.mutate(data)
  })

  const linkIdentity = (identityId: string) => {
    updateResume.mutate({ id: resume.id, identityId: identityId === 'none' ? null : identityId })
  }

  const linked = resume.identity

  return (
    <div className="space-y-8">
      {/* Identity Link */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <UserCircle size={14} className="text-indigo-400" />
          <h3 className="text-sm font-semibold">Identity</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Link to a shared identity to keep name, email, and contact info in sync across resumes.
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={resume.identityId ?? 'none'}
            onValueChange={linkIdentity}
          >
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue placeholder="No identity linked" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No identity (use profile fields below)</SelectItem>
              {identities.map((id: Identity) => (
                <SelectItem key={id.id} value={id.id}>
                  {id.label} — {id.firstName} {id.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {linked && (
            <>
              <Link href="/identities" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0">
                <ExternalLink size={12} />
                Edit
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => linkIdentity('none')}
              >
                <Unlink size={12} className="mr-1" />
                Unlink
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Personal Information */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Personal Information</h3>
          {linked && (
            <span className="text-xs text-indigo-400 flex items-center gap-1">
              <UserCircle size={11} />
              From identity: {linked.label}
            </span>
          )}
        </div>
        {linked ? (
          <div key="personal-linked" className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <input readOnly value={linked.firstName} className={readonlyInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <input readOnly value={linked.lastName} className={readonlyInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <input readOnly value={linked.location ?? ''} className={readonlyInput} />
            </div>
          </div>
        ) : (
          <div key="personal-own" className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <input {...register('firstName')} onBlur={saveField} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <input {...register('lastName')} onBlur={saveField} className={underlineInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <input {...register('location')} onBlur={saveField} className={underlineInput} />
            </div>
          </div>
        )}
      </section>

      {/* Contact Information */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Contact Information</h3>
          {linked && (
            <span className="text-xs text-indigo-400 flex items-center gap-1">
              <UserCircle size={11} />
              From identity
            </span>
          )}
        </div>
        {linked ? (
          <div key="contact-linked" className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <input readOnly value={linked.email} className={readonlyInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <input readOnly value={linked.phone ?? ''} className={readonlyInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <input readOnly value={linked.linkedin ?? ''} className={readonlyInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <input readOnly value={linked.website ?? ''} className={readonlyInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">GitHub</Label>
              <input readOnly value={linked.github ?? ''} className={readonlyInput} />
            </div>
          </div>
        ) : (
          <div key="contact-own" className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <input {...register('email')} onBlur={saveField} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <input {...register('phone')} onBlur={saveField} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <input {...register('linkedin')} onBlur={saveField} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <input {...register('website')} onBlur={saveField} className={underlineInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">GitHub</Label>
              <input {...register('github')} onBlur={saveField} className={underlineInput} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
