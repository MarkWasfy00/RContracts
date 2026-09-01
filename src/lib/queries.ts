import { useQuery } from '@tanstack/react-query'

import { fetchProjects, fetchSettings } from './api'
import { defaultProjects, defaultSettings } from './site-data'
import type { Project, SiteSettings } from './site-data'

export const projectsQueryKey = ['projects'] as const
export const settingsQueryKey = ['settings'] as const

/** Projects with the shipped defaults as an instant fallback. */
export function useProjects(): Array<Project> {
  const { data } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: fetchProjects,
  })
  return data ?? defaultProjects
}

/** Site settings with the shipped defaults as an instant fallback. */
export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
  })
  return data ?? defaultSettings
}
