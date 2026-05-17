'use client'

import { useState } from 'react'
import { CompanyCard } from '@/components/resumes/company-card'
import { SkillChip } from '@/components/resumes/skill-chip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Building2, List, Trash2, GraduationCap } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text-editor'
import {
  useLibrarySkills,
  useAddLibrarySkillCategory,
  useUpdateLibrarySkillCategory,
  useDeleteLibrarySkillCategory,
  useCloneLibrarySkillCategory,
  useLibraryExperiences,
  useAddLibraryExperience,
  useUpdateLibraryExperience,
  useDeleteLibraryExperience,
  useCloneLibraryExperience,
  useAddLibraryBullet,
  useUpdateLibraryBullet,
  useDeleteLibraryBullet,
  useLibraryEducations,
  useAddLibraryEducation,
  useUpdateLibraryEducation,
  useDeleteLibraryEducation,
  useCloneLibraryEducation,
  SkillLibraryCategory,
  LibraryExperience,
  LibraryBullet,
  LibraryEducation,
} from '@/hooks/use-library'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

// ---------------------------------------------------------------------------
// Skills Tab
// ---------------------------------------------------------------------------

function SkillCategoryCard({ category }: { category: SkillLibraryCategory }) {
  const updateCategory = useUpdateLibrarySkillCategory()
  const deleteCategory = useDeleteLibrarySkillCategory()
  const cloneCategory = useCloneLibrarySkillCategory()
  const [newSkill, setNewSkill] = useState('')

  const skills: string[] = (() => {
    try {
      return JSON.parse(category.skills)
    } catch {
      return []
    }
  })()

  const saveSkills = (updated: string[]) => {
    updateCategory.mutate({ id: category.id, skills: JSON.stringify(updated) })
  }

  const handleRemoveSkill = (skill: string) => {
    saveSkills(skills.filter(s => s !== skill))
  }

  const handleAddSkill = () => {
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) return
    saveSkills([...skills, trimmed])
    setNewSkill('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  return (
    <CompanyCard
      icon={List}
      iconColor="text-orange-400"
      title={category.name}
      onClone={() => cloneCategory.mutate(category.id)}
      onDelete={() => deleteCategory.mutate({ id: category.id })}
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Category Name</Label>
          <input
            defaultValue={category.name}
            onBlur={e => updateCategory.mutate({ id: category.id, name: e.target.value })}
            className={underlineInput}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Skills</Label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map(skill => (
              <SkillChip
                key={skill}
                label={skill}
                onRemove={() => handleRemoveSkill(skill)}
              />
            ))}
          </div>
          <input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddSkill}
            placeholder="Type a skill and press Enter"
            className={underlineInput}
          />
        </div>
      </div>
    </CompanyCard>
  )
}

function SkillsTab() {
  const { data: categories = [], isLoading } = useLibrarySkills()
  const addCategory = useAddLibrarySkillCategory()

  const handleAddCategory = () => {
    addCategory.mutate({
      name: 'New Category',
      skills: '[]',
      sortOrder: categories.length * 10,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Skills Library</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleAddCategory}
          disabled={addCategory.isPending}
        >
          <Plus size={12} />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading skills...
        </div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No skill categories yet. Add one to get started.
          </p>
          <Button
            type="button"
            size="sm"
            className="bg-mint hover:bg-mint/90 text-primary-foreground"
            onClick={handleAddCategory}
            disabled={addCategory.isPending}
          >
            <Plus size={12} className="mr-1.5" />
            Add Category
          </Button>
        </div>
      ) : (
        <div>
          {[...categories]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(category => (
              <SkillCategoryCard key={category.id} category={category} />
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Experience Tab
// ---------------------------------------------------------------------------

interface BulletRowProps {
  bullet: LibraryBullet
  experienceId: string
}

function BulletRow({ bullet, experienceId }: BulletRowProps) {
  const updateBullet = useUpdateLibraryBullet(experienceId)
  const deleteBullet = useDeleteLibraryBullet(experienceId)

  return (
    <div className="flex items-start gap-2">
      <textarea
        defaultValue={bullet.content}
        rows={2}
        onBlur={e => {
          const val = e.target.value.trim()
          if (val !== bullet.content) {
            updateBullet.mutate({ id: bullet.id, content: val })
          }
        }}
        className="flex-1 bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors resize-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-1.5"
        onClick={() => deleteBullet.mutate({ id: bullet.id })}
      >
        <Trash2 size={12} />
      </Button>
    </div>
  )
}

interface ExperienceCardProps {
  experience: LibraryExperience
}

function ExperienceCard({ experience }: ExperienceCardProps) {
  const updateExperience = useUpdateLibraryExperience()
  const deleteExperience = useDeleteLibraryExperience()
  const cloneExperience = useCloneLibraryExperience()
  const addBullet = useAddLibraryBullet(experience.id)
  const [currentToggle, setCurrentToggle] = useState(experience.current)

  const bullets = [...(experience.bullets ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleAddBullet = () => {
    addBullet.mutate({ content: '', sortOrder: bullets.length * 10 })
  }

  return (
    <CompanyCard
      icon={Building2}
      iconColor="text-green-400"
      title={experience.company}
      onClone={() => cloneExperience.mutate(experience.id)}
      onDelete={() => deleteExperience.mutate({ id: experience.id })}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Company</Label>
            <input
              defaultValue={experience.company}
              onBlur={e => updateExperience.mutate({ id: experience.id, company: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <input
              defaultValue={experience.title}
              onBlur={e => updateExperience.mutate({ id: experience.id, title: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Company Description</Label>
            <input
              defaultValue={experience.companyDesc ?? ''}
              onBlur={e => updateExperience.mutate({ id: experience.id, companyDesc: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <input
              defaultValue={experience.location ?? ''}
              onBlur={e => updateExperience.mutate({ id: experience.id, location: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <input
              defaultValue={experience.startDate ?? ''}
              onBlur={e => updateExperience.mutate({ id: experience.id, startDate: e.target.value })}
              placeholder="e.g. Jan 2023"
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <input
              defaultValue={experience.endDate ?? ''}
              onBlur={e => updateExperience.mutate({ id: experience.id, endDate: e.target.value })}
              placeholder="e.g. Dec 2024"
              disabled={currentToggle}
              className={`${underlineInput} disabled:opacity-50`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={currentToggle}
            onCheckedChange={val => {
              setCurrentToggle(val)
              updateExperience.mutate({ id: experience.id, current: val })
            }}
          />
          <Label className="text-xs font-normal text-muted-foreground">Currently in position</Label>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Bullets</Label>
          <div className="space-y-2">
            {bullets.map(bullet => (
              <BulletRow key={bullet.id} bullet={bullet} experienceId={experience.id} />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 mt-2"
            onClick={handleAddBullet}
            disabled={addBullet.isPending}
          >
            <Plus size={12} />
            Add bullet
          </Button>
        </div>
      </div>
    </CompanyCard>
  )
}

function ExperienceTab() {
  const { data: experiences = [], isLoading } = useLibraryExperiences()
  const addExperience = useAddLibraryExperience()

  const handleAddExperience = () => {
    addExperience.mutate({
      company: 'New Company',
      title: 'Position Title',
      current: false,
      sortOrder: experiences.length * 10,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Experience Library</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store reusable work experience entries and bullets to pull into resumes.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5 shrink-0"
          onClick={handleAddExperience}
          disabled={addExperience.isPending}
        >
          <Plus size={12} />
          Add Experience
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading experiences...
        </div>
      ) : experiences.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No experiences yet. Add one to get started.
          </p>
          <Button
            type="button"
            size="sm"
            className="bg-mint hover:bg-mint/90 text-primary-foreground"
            onClick={handleAddExperience}
            disabled={addExperience.isPending}
          >
            <Plus size={12} className="mr-1.5" />
            Add Experience
          </Button>
        </div>
      ) : (
        <div>
          {[...experiences]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(experience => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Education Tab
// ---------------------------------------------------------------------------

interface EducationCardProps {
  entry: LibraryEducation
}

function EducationCard({ entry }: EducationCardProps) {
  const updateEntry = useUpdateLibraryEducation()
  const deleteEntry = useDeleteLibraryEducation()
  const cloneEntry = useCloneLibraryEducation()
  const [currentToggle, setCurrentToggle] = useState(entry.current)

  const linkedCount = entry._count?.educations ?? 0

  return (
    <CompanyCard
      icon={GraduationCap}
      iconColor="text-yellow-400"
      title={entry.institution}
      onClone={() => cloneEntry.mutate(entry.id)}
      onDelete={linkedCount > 0 ? undefined : () => deleteEntry.mutate({ id: entry.id })}
    >
      {linkedCount > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          Linked to {linkedCount} resume{linkedCount === 1 ? '' : 's'} — unlink all before deleting.
        </p>
      )}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Institution</Label>
            <input
              defaultValue={entry.institution}
              onBlur={e => updateEntry.mutate({ id: entry.id, institution: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Degree</Label>
            <input
              defaultValue={entry.degree ?? ''}
              onBlur={e => updateEntry.mutate({ id: entry.id, degree: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Location</Label>
            <input
              defaultValue={entry.location ?? ''}
              onBlur={e => updateEntry.mutate({ id: entry.id, location: e.target.value })}
              className={underlineInput}
            />
          </div>
          <div />
          <div>
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <input
              defaultValue={entry.startDate ?? ''}
              onBlur={e => updateEntry.mutate({ id: entry.id, startDate: e.target.value })}
              placeholder="e.g. Sep 2018"
              className={underlineInput}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <input
              defaultValue={entry.endDate ?? ''}
              onBlur={e => updateEntry.mutate({ id: entry.id, endDate: e.target.value })}
              placeholder="e.g. May 2022"
              disabled={currentToggle}
              className={`${underlineInput} disabled:opacity-50`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={currentToggle}
            onCheckedChange={val => {
              setCurrentToggle(val)
              updateEntry.mutate({ id: entry.id, current: val })
            }}
          />
          <Label className="text-xs font-normal text-muted-foreground">Currently attending</Label>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Achievements</Label>
          <RichTextEditor
            value={entry.achievements ?? ''}
            onChange={html => updateEntry.mutate({ id: entry.id, achievements: html })}
            placeholder="Describe achievements, honors, GPA..."
            minHeight="80px"
          />
        </div>
      </div>
    </CompanyCard>
  )
}

function EducationTab() {
  const { data: entries = [], isLoading } = useLibraryEducations()
  const addEntry = useAddLibraryEducation()

  const handleAdd = () => {
    addEntry.mutate({
      institution: 'New Institution',
      current: false,
      sortOrder: entries.length * 10,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Education Library</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store reusable education entries to link into resumes.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5 shrink-0"
          onClick={handleAdd}
          disabled={addEntry.isPending}
        >
          <Plus size={12} />
          Add Education
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading education...</div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No education entries yet. Add one to get started.
          </p>
          <Button
            type="button"
            size="sm"
            className="bg-mint hover:bg-mint/90 text-primary-foreground"
            onClick={handleAdd}
            disabled={addEntry.isPending}
          >
            <Plus size={12} className="mr-1.5" />
            Add Education
          </Button>
        </div>
      ) : (
        <div>
          {[...entries]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(entry => (
              <EducationCard key={entry.id} entry={entry} />
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LibraryPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <List className="h-6 w-6 text-orange-400" />
        <div>
          <h1 className="text-2xl font-semibold">Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage reusable skills, experience, and education entries.
          </p>
        </div>
      </div>

      <Tabs defaultValue="skills">
        <TabsList className="mb-6">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <SkillsTab />
        </TabsContent>

        <TabsContent value="experience">
          <ExperienceTab />
        </TabsContent>

        <TabsContent value="education">
          <EducationTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
