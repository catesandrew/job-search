'use client'

import { useState } from 'react'
import { useIdentities, useCreateIdentity, useUpdateIdentity, useDeleteIdentity, useCloneIdentity, Identity } from '@/hooks/use-identity'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, UserCircle, Pencil, Trash2, Check, X, Link2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

export default function IdentitiesPage() {
  const { data: identities = [], isLoading } = useIdentities()
  const createIdentity = useCreateIdentity()
  const [creating, setCreating] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Identities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reusable contact info profiles. Link a resume to an identity so name, email, phone, and location stay in sync.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreating(true)}
          disabled={creating}
        >
          <Plus size={14} />
          New Identity
        </Button>
      </div>

      <div className="space-y-3">
        {creating && (
          <NewIdentityCard
            onSave={async (data) => {
              await createIdentity.mutateAsync(data)
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        )}

        {!isLoading && identities.length === 0 && !creating && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No identities yet. Create one to share contact info across resumes.</p>
          </div>
        )}

        {identities.map(identity => (
          <IdentityCard key={identity.id} identity={identity} />
        ))}
      </div>
    </div>
  )
}

function NewIdentityCard({
  onSave,
  onCancel,
}: {
  onSave: (data: Partial<Identity>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<Identity>>({
    label: 'Primary',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    github: '',
  })

  const set = (key: keyof Identity) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const valid = form.label && form.firstName && form.lastName && form.email

  return (
    <div className="rounded-lg border border-mint/40 bg-card p-4">
      <h3 className="text-sm font-semibold mb-4">New Identity</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <input value={form.label} onChange={set('label')} placeholder="e.g. Primary, Remote" className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">First Name</Label>
          <input value={form.firstName} onChange={set('firstName')} className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Last Name</Label>
          <input value={form.lastName} onChange={set('lastName')} className={underlineInput} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <input value={form.email} onChange={set('email')} type="email" className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Phone</Label>
          <input value={form.phone ?? ''} onChange={set('phone')} className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Location</Label>
          <input value={form.location ?? ''} onChange={set('location')} className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">LinkedIn</Label>
          <input value={form.linkedin ?? ''} onChange={set('linkedin')} className={underlineInput} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Website</Label>
          <input value={form.website ?? ''} onChange={set('website')} className={underlineInput} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">GitHub</Label>
          <input value={form.github ?? ''} onChange={set('github')} className={underlineInput} />
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}><X size={13} className="mr-1" />Cancel</Button>
        <Button size="sm" disabled={!valid} onClick={() => onSave(form)}><Check size={13} className="mr-1" />Save</Button>
      </div>
    </div>
  )
}

function IdentityCard({ identity }: { identity: Identity }) {
  const updateIdentity = useUpdateIdentity()
  const deleteIdentity = useDeleteIdentity()
  const cloneIdentity = useCloneIdentity()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Identity>>(identity)

  const linkedCount = identity._count?.resumes ?? 0
  const set = (key: keyof Identity) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const save = async () => {
    await updateIdentity.mutateAsync({ id: identity.id, ...form })
    setEditing(false)
  }

  const remove = async () => {
    if (linkedCount > 0) return
    if (!confirm(`Delete "${identity.label}"?`)) return
    await deleteIdentity.mutateAsync(identity.id)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserCircle size={15} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-medium">{identity.label}</span>
          {linkedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <Link2 size={11} />{linkedCount} resume{linkedCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setForm(identity); setEditing(e => !e) }}>
            <Pencil size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => cloneIdentity.mutate(identity.id)}
            disabled={cloneIdentity.isPending}
            title="Duplicate"
          >
            <Copy size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 w-7 p-0', linkedCount > 0 ? 'opacity-30 cursor-not-allowed' : 'text-destructive hover:text-destructive')}
            onClick={remove}
            disabled={linkedCount > 0}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <input value={form.label} onChange={set('label')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <input value={form.firstName} onChange={set('firstName')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <input value={form.lastName} onChange={set('lastName')} className={underlineInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <input value={form.email} onChange={set('email')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <input value={form.phone ?? ''} onChange={set('phone')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <input value={form.location ?? ''} onChange={set('location')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <input value={form.linkedin ?? ''} onChange={set('linkedin')} className={underlineInput} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <input value={form.website ?? ''} onChange={set('website')} className={underlineInput} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">GitHub</Label>
              <input value={form.github ?? ''} onChange={set('github')} className={underlineInput} />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={13} className="mr-1" />Cancel</Button>
            <Button size="sm" onClick={save}><Check size={13} className="mr-1" />Save</Button>
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>{identity.firstName} {identity.lastName}</p>
          <p>{identity.email}</p>
          {identity.phone && <p>{identity.phone}</p>}
          {identity.location && <p>{identity.location}</p>}
          {identity.linkedin && <p>{identity.linkedin}</p>}
          {identity.website && <p>{identity.website}</p>}
          {identity.github && <p>{identity.github}</p>}
        </div>
      )}
    </div>
  )
}
