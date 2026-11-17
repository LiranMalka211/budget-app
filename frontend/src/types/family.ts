import type { User } from './user'

/** A family budget group. Mirrors the `families` table. */
export interface Family {
  id: string
  name: string
  /** Secret key members use to request joining the family. */
  inviteKey: string
  /** User who can approve and remove members. */
  headUserId: string
  createdAt: string
}

/** Membership status of a user in a family. */
export type FamilyMemberStatus = 'pending' | 'approved'

/** A link between a user and a family, including the user record for display. */
export interface FamilyMember {
  userId: string
  familyId: string
  status: FamilyMemberStatus
  /** Granted by the head: may change and delete rows. Every member may read and add. */
  canEdit: boolean
  joinedAt: string
  user: User
}

/** Everything the family page needs in a single response. */
export interface FamilyOverview {
  family: Family
  members: FamilyMember[]
  pending: FamilyMember[]
  /** True when the current user is the head of this family. */
  isHead: boolean
  /** The current user's own membership status; "pending" users see the family name only. */
  myStatus: FamilyMemberStatus
  /** Whether the current user may change and delete rows (always true for the head). */
  canEdit: boolean
}
