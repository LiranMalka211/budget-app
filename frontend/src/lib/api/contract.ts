import type {
  AiInsight,
  AuthResponse,
  Category,
  CommitImportInput,
  CreateCategoryInput,
  DashboardSummary,
  Family,
  FamilyOverview,
  ImportResult,
  LoginInput,
  Paged,
  RegisterInput,
  ScheduledTransaction,
  ScheduledTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionType,
  UpdateProfileInput,
  User,
} from '@/types'

/**
 * Every endpoint the frontend needs, as a typed interface.
 * `httpApi` implements it against the Python backend and `mockApi` implements it in memory,
 * so this file is also the specification the backend must satisfy.
 */
export interface ApiContract {
  auth: {
    /** POST /auth/register */
    register(input: RegisterInput): Promise<AuthResponse>
    /** POST /auth/login */
    login(input: LoginInput): Promise<AuthResponse>
    /** GET /auth/me */
    me(): Promise<User>
    /** PUT /auth/me */
    updateProfile(input: UpdateProfileInput): Promise<User>
    /** POST /auth/forgot-password. Returns the reset token only in mock mode so the flow can be tested locally. */
    forgotPassword(email: string): Promise<{ resetToken?: string }>
    /** POST /auth/reset-password */
    resetPassword(token: string, password: string): Promise<void>
  }
  family: {
    /** GET /families/me. Returns null when the user has no family. */
    getMine(): Promise<FamilyOverview | null>
    /** POST /families. Creator becomes head. */
    create(name: string): Promise<Family>
    /** POST /families/join. Creates a pending membership request. */
    join(inviteKey: string): Promise<{ status: 'pending' | 'approved' }>
    /** POST /families/members/{userId}/approve (head only) */
    approveMember(userId: string): Promise<void>
    /** DELETE /families/members/{userId} (head only). Also rejects pending requests. */
    removeMember(userId: string): Promise<void>
    /** POST /families/leave */
    leave(): Promise<void>
    /** POST /families/regenerate-key (head only) */
    regenerateKey(): Promise<Family>
  }
  lookups: {
    /** GET /transaction-types */
    transactionTypes(): Promise<TransactionType[]>
    /** GET /categories */
    categories(): Promise<Category[]>
    /** POST /categories */
    createCategory(input: CreateCategoryInput): Promise<Category>
  }
  transactions: {
    /** GET /transactions?from&to&typeId&categoryId&search&page&pageSize */
    list(filters: TransactionFilters): Promise<Paged<Transaction>>
    /** POST /transactions */
    create(input: TransactionInput): Promise<Transaction>
    /** PUT /transactions/{id} */
    update(id: string, input: TransactionInput): Promise<Transaction>
    /** DELETE /transactions/{id} */
    remove(id: string): Promise<void>
  }
  scheduled: {
    /** GET /scheduled-transactions */
    list(): Promise<ScheduledTransaction[]>
    /** POST /scheduled-transactions */
    create(input: ScheduledTransactionInput): Promise<ScheduledTransaction>
    /** PUT /scheduled-transactions/{id} */
    update(id: string, input: ScheduledTransactionInput): Promise<ScheduledTransaction>
    /** DELETE /scheduled-transactions/{id} */
    remove(id: string): Promise<void>
    /** POST /scheduled-transactions/{id}/toggle */
    toggle(id: string, isActive: boolean): Promise<ScheduledTransaction>
  }
  imports: {
    /** POST /imports. Persists reviewed rows, skipping rows that duplicate an existing transaction. */
    commit(input: CommitImportInput): Promise<ImportResult>
  }
  insights: {
    /** GET /insights */
    list(): Promise<AiInsight[]>
    /** POST /insights/generate */
    generate(): Promise<AiInsight[]>
  }
  dashboard: {
    /** GET /dashboard/summary?from&to */
    summary(from: string, to: string): Promise<DashboardSummary>
  }
}
