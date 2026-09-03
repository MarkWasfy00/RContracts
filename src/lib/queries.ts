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

/**
 * One project by id, for its own page.
 *
 * Unlike `useProjects` this reports whether the list is still loading: on a
 * cold visit straight to a project URL the shipped defaults don't contain
 * the project, and answering "not found" before the API replies would be
 * wrong.
 */
export function useProject(id: string): {
  project: Project | undefined
  isPending: boolean
} {
  const { data, isPending } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: fetchProjects,
  })
  return {
    project: (data ?? defaultProjects).find((p) => p.id === id),
    isPending,
  }
}

/** Site settings with the shipped defaults as an instant fallback. */
export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({
    queryKey: settingsQueryKey,
    queryFn: fetchSettings,
  })
  return data ?? defaultSettings
}
