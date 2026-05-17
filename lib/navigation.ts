import { Briefcase, FileText, Mail, Camera, CheckSquare, Settings, UserCircle, GitBranch, Library } from 'lucide-react'

export const navItems = [
  { href: '/applications', label: 'Applications', icon: Briefcase },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/identities', label: 'Identities', icon: UserCircle },
  { href: '/repositories', label: 'Repositories', icon: GitBranch },
  { href: '/cover-letters', label: 'Cover Letters', icon: Mail },
  { href: '/headshots', label: 'Headshots', icon: Camera },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export const taskItem = {
  href: '/tasks',
  label: 'Tasks',
  icon: CheckSquare,
}
