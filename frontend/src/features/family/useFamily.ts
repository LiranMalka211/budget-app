import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/authStore'
import { familyKeys, useFamilyOverview } from '@/hooks/useFamilyOverview'
import { familyApi } from './familyApi'

export { useFamilyOverview }

/**
 * Refreshes everything affected by a membership change: the overview, the current user (familyId),
 * and all budget data because the visible scope changes.
 */
function useAfterMembershipChange() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  return async () => {
    await refreshUser()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: familyKeys.overview }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['scheduled'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
  }
}

/** Creates a family. */
export function useCreateFamily() {
  const after = useAfterMembershipChange()
  return useMutation({ mutationFn: (name: string) => familyApi.create(name), onSuccess: after })
}

/** Sends a join request with an invite key. */
export function useJoinFamily() {
  const after = useAfterMembershipChange()
  return useMutation({ mutationFn: (key: string) => familyApi.join(key), onSuccess: after })
}

/** Approves a pending member (head only). */
export function useApproveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => familyApi.approveMember(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyKeys.overview }),
  })
}

/** Removes a member or rejects a request (head only). */
export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => familyApi.removeMember(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyKeys.overview }),
  })
}

/** Leaves the family (or cancels a pending request). */
export function useLeaveFamily() {
  const after = useAfterMembershipChange()
  return useMutation({ mutationFn: () => familyApi.leave(), onSuccess: after })
}

/** Generates a new invite key (head only). */
export function useRegenerateKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => familyApi.regenerateKey(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyKeys.overview }),
  })
}
