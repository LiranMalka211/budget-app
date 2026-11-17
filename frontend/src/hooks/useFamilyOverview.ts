import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/authStore'
import { api } from '@/lib/api'

/** Query key for the family overview, shared by every feature that shows member names. */
export const familyKeys = {
  overview: ['family', 'overview'] as const,
}

/** Loads the current user's family (members, pending requests, invite key) or null when they have none. */
export function useFamilyOverview() {
  const { status } = useAuth()
  return useQuery({
    queryKey: familyKeys.overview,
    queryFn: api.family.getMine,
    enabled: status === 'authenticated',
  })
}

/**
 * Whether the current user may change and delete rows. A personal budget always may; in a family the head decides
 * (the server enforces it too). False while the family is still loading, so edit controls never flash in.
 */
export function useCanEdit(): boolean {
  const { data, isPending } = useFamilyOverview()
  if (isPending) return false
  return data ? data.canEdit : true
}

/** Returns a function that maps a userId to a display name ("you" for the current user). */
export function useMemberName() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data } = useFamilyOverview()
  return useCallback(
    (userId: string): string => {
      if (user && userId === user.id) return t('family.you')
      const member = data?.members.find((m) => m.userId === userId)
      return member ? `${member.user.firstName} ${member.user.lastName}` : ''
    },
    [data, t, user],
  )
}
