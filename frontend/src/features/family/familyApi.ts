import { api } from '@/lib/api'

/** Typed wrappers around the family endpoints. */
export const familyApi = {
  /** Loads the current user's family overview. */
  getMine: () => api.family.getMine(),
  /** Creates a family; the caller becomes its head. */
  create: (name: string) => api.family.create(name),
  /** Requests to join a family using its invite key. */
  join: (inviteKey: string) => api.family.join(inviteKey),
  /** Approves a pending member (head only). */
  approveMember: (userId: string) => api.family.approveMember(userId),
  /** Removes a member or rejects a pending request (head only). */
  removeMember: (userId: string) => api.family.removeMember(userId),
  /** Leaves the current family. */
  leave: () => api.family.leave(),
  /** Replaces the invite key (head only). */
  regenerateKey: () => api.family.regenerateKey(),
}
