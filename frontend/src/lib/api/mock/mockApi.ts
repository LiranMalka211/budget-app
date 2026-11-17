import { startOfMonth, endOfMonth, addMonths, isAfter, isBefore, parseISO, subMonths } from 'date-fns'
import type {
  AiInsight,
  Category,
  DashboardSummary,
  Family,
  FamilyMember,
  FamilyOverview,
  ImportBatch,
  MonthBudget,
  MonthlyTotal,
  ScheduledTransaction,
  ScheduledTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionInput,
  User,
} from '@/types'
import { ApiError } from '@/types'
import { monthRange, toIsoDate, todayIso } from '@/lib/format/dates'
import { newId, newInviteKey } from '@/lib/utils/id'
import type { ApiContract } from '../contract'
import { getToken, setToken } from '../httpClient'
import { firstRunDate, materializeDueSchedules, nextRunAfter } from './scheduler'
import {
  DEFAULT_EXPENSE_CATEGORY_ID,
  DEFAULT_INCOME_CATEGORY_ID,
  DEMO_USER,
  INSIGHT_TEMPLATES,
  SEED_CATEGORIES,
  SEED_TYPES,
  TYPE_EXPENSE_ID,
  TYPE_INCOME_ID,
} from './seed'

/** localStorage key holding the whole mock database. */
const DB_KEY = 'budget.mockdb.v1'

/** A user row including the password, which only the mock ever sees. */
interface StoredUser extends User {
  password: string
}

/** Shape of the persisted mock database. Each array is one future DB table. */
interface MockDb {
  users: StoredUser[]
  families: Family[]
  members: Array<Omit<FamilyMember, 'user'>>
  categories: Category[]
  transactions: Transaction[]
  scheduled: ScheduledTransaction[]
  insights: AiInsight[]
  imports: ImportBatch[]
  /** Monthly savings goal per budget owner: a family id, or a user id for a personal budget. */
  goals?: Record<string, number | null>
  /** token -> userId */
  sessions: Record<string, string>
  /** resetToken -> userId */
  resetTokens: Record<string, string>
}

/** Small deterministic PRNG so seeded demo data is identical on every fresh load. */
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Builds the initial database with a demo family and a few months of realistic history. */
function buildSeedDb(): MockDb {
  const now = new Date()
  const rand = seededRandom(42)
  const familyId = 'family_demo'
  const dana: StoredUser = { ...DEMO_USER, familyId }
  const yossi: StoredUser = {
    id: 'user_yossi',
    firstName: 'Yossi',
    lastName: 'Cohen',
    email: 'yossi@example.com',
    password: 'password123',
    familyId,
  }
  const noa: StoredUser = {
    id: 'user_noa',
    firstName: 'Noa',
    lastName: 'Levi',
    email: 'noa@example.com',
    password: 'password123',
    familyId: null,
  }
  const createdAt = subMonths(now, 4).toISOString()
  const family: Family = { id: familyId, name: 'Cohen family', inviteKey: 'DEMO-2026', headUserId: dana.id, createdAt }
  const members: MockDb['members'] = [
    { userId: dana.id, familyId, status: 'approved', canEdit: true, joinedAt: createdAt },
    { userId: yossi.id, familyId, status: 'approved', canEdit: false, joinedAt: createdAt },
    { userId: noa.id, familyId, status: 'pending', canEdit: false, joinedAt: now.toISOString() },
  ]

  const transactions: Transaction[] = []
  const push = (
    date: Date,
    title: string,
    amount: number,
    categoryId: string,
    typeId: string,
    userId: string,
    source: Transaction['source'] = 'manual',
  ) => {
    if (isAfter(date, now)) return
    transactions.push({
      id: newId('tx'),
      date: toIsoDate(date),
      title,
      amount: Math.round(amount),
      userId,
      categoryId,
      typeId,
      familyId,
      source,
      createdAt: date.toISOString(),
    })
  }
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const groceries = ['Shufersal', 'Rami Levy', 'Victory', 'Local market']
  const dining = ['Pizza night', 'Sushi', 'Cafe', 'Burger place']
  const fun = ['Cinema', 'Concert tickets', 'Board game', 'Streaming']

  for (let m = 4; m >= 0; m -= 1) {
    const base = subMonths(now, m)
    const y = base.getFullYear()
    const mo = base.getMonth()
    const d = (day: number) => new Date(y, mo, day)
    push(d(10), 'Salary', 15000, 'cat_salary', TYPE_INCOME_ID, dana.id, 'scheduled')
    push(d(1), 'Salary', 9000, 'cat_salary', TYPE_INCOME_ID, yossi.id, 'scheduled')
    push(d(1), 'Rent', 5200, 'cat_rent', TYPE_EXPENSE_ID, dana.id, 'scheduled')
    push(d(5), 'Gym', 150, 'cat_health', TYPE_EXPENSE_ID, dana.id, 'scheduled')
    push(d(15), 'Netflix', 55, 'cat_entertainment', TYPE_EXPENSE_ID, yossi.id, 'scheduled')
    push(d(12), 'Electricity & water', 380 + rand() * 200, 'cat_utilities', TYPE_EXPENSE_ID, dana.id)
    push(d(20), 'Car insurance', 380, 'cat_insurance', TYPE_EXPENSE_ID, yossi.id)
    push(d(8), 'Fuel', 250 + rand() * 200, 'cat_transport', TYPE_EXPENSE_ID, yossi.id)
    for (let i = 0; i < 5; i += 1) {
      push(d(2 + i * 6), pick(groceries), 180 + rand() * 450, 'cat_groceries', TYPE_EXPENSE_ID, pick([dana.id, yossi.id]))
    }
    for (let i = 0; i < 3; i += 1) {
      push(d(4 + i * 9), pick(dining), 90 + rand() * 220, 'cat_dining', TYPE_EXPENSE_ID, pick([dana.id, yossi.id]))
    }
    push(d(18), pick(fun), 80 + rand() * 300, 'cat_entertainment', TYPE_EXPENSE_ID, dana.id)
    if (rand() > 0.5) push(d(22), 'Pharmacy', 60 + rand() * 150, 'cat_health', TYPE_EXPENSE_ID, dana.id)
    if (rand() > 0.6) push(d(25), 'Clothes', 200 + rand() * 400, 'cat_shopping', TYPE_EXPENSE_ID, yossi.id)
    if (m === 2) push(d(27), 'Annual bonus', 4000, 'cat_bonus', TYPE_INCOME_ID, dana.id)
  }

  /** Next occurrence of a given day of month strictly after today. */
  const nextOccurrence = (day: number) => {
    const candidate = new Date(now.getFullYear(), now.getMonth(), day)
    return toIsoDate(isAfter(candidate, now) ? candidate : addMonths(candidate, 1))
  }
  const schedule = (
    title: string,
    amount: number,
    categoryId: string,
    typeId: string,
    userId: string,
    day: number,
  ): ScheduledTransaction => ({
    id: newId('sch'),
    title,
    amount,
    categoryId,
    typeId,
    userId,
    familyId,
    interval: 'monthly',
    dayOfMonth: day,
    startDate: toIsoDate(subMonths(now, 4)),
    endDate: null,
    nextRunDate: nextOccurrence(day),
    isActive: true,
    createdAt,
  })

  return {
    users: [dana, yossi, noa],
    families: [family],
    members,
    categories: [...SEED_CATEGORIES],
    transactions,
    scheduled: [
      schedule('Salary', 15000, 'cat_salary', TYPE_INCOME_ID, dana.id, 10),
      schedule('Salary', 9000, 'cat_salary', TYPE_INCOME_ID, yossi.id, 1),
      schedule('Rent', 5200, 'cat_rent', TYPE_EXPENSE_ID, dana.id, 1),
      schedule('Gym', 150, 'cat_health', TYPE_EXPENSE_ID, dana.id, 5),
      schedule('Netflix', 55, 'cat_entertainment', TYPE_EXPENSE_ID, yossi.id, 15),
    ],
    insights: [],
    imports: [],
    sessions: {},
    resetTokens: {},
  }
}

/** Loads the database from localStorage or seeds a new one, then materialises due schedules. */
function loadDb(): MockDb {
  let db: MockDb | null = null
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) db = JSON.parse(raw) as MockDb
  } catch {
    db = null
  }
  if (!db) db = buildSeedDb()
  const created = materializeDueSchedules(db.scheduled)
  if (created.length) db.transactions.push(...created)
  saveDb(db)
  return db
}

/** Persists the database to localStorage. */
function saveDb(db: MockDb): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* storage unavailable */
  }
}

let db: MockDb | null = null

/** Returns the singleton database, loading it on first use. */
function getDb(): MockDb {
  if (!db) db = loadDb()
  return db
}

/** Simulates network latency so loading states are visible during development. */
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

/** Strips the password before a user leaves the mock. */
function publicUser(u: StoredUser): User {
  const { password: _password, ...rest } = u
  return rest
}

/** Resolves the logged-in user from the stored token or throws 401. */
function currentUser(): StoredUser {
  const token = getToken()
  const d = getDb()
  const userId = token ? d.sessions[token] : undefined
  const user = userId ? d.users.find((u) => u.id === userId) : undefined
  if (!user) throw new ApiError('Unauthorized', 401, 'unauthorized')
  return user
}

/** All transactions visible to a user: their family's, or their own personal ones. */
function visibleTransactions(user: User): Transaction[] {
  const d = getDb()
  return user.familyId
    ? d.transactions.filter((t) => t.familyId === user.familyId)
    : d.transactions.filter((t) => t.userId === user.id && t.familyId === null)
}

/** All scheduled transactions visible to a user, same scoping as transactions. */
function visibleScheduled(user: User): ScheduledTransaction[] {
  const d = getDb()
  return user.familyId
    ? d.scheduled.filter((s) => s.familyId === user.familyId)
    : d.scheduled.filter((s) => s.userId === user.id && s.familyId === null)
}

/** Builds the family overview response for a user, or null when they have no family link at all. */
function familyOverviewFor(user: StoredUser): FamilyOverview | null {
  const d = getDb()
  const link = d.members.find((m) => m.userId === user.id)
  if (!link) return null
  const family = d.families.find((f) => f.id === link.familyId)
  if (!family) return null
  const withUser = (m: Omit<FamilyMember, 'user'>): FamilyMember => ({
    ...m,
    canEdit: m.canEdit ?? m.userId === family.headUserId,
    user: publicUser(d.users.find((u) => u.id === m.userId)!),
  })
  const all = d.members.filter((m) => m.familyId === family.id)
  const isPending = link.status === 'pending'
  return {
    family: isPending ? { ...family, inviteKey: '' } : family,
    members: isPending ? [] : all.filter((m) => m.status === 'approved').map(withUser),
    pending: isPending ? [] : all.filter((m) => m.status === 'pending').map(withUser),
    isHead: family.headUserId === user.id,
    myStatus: link.status,
    canEdit: mayEdit(user),
  }
}

/** Same rule as the server: a personal budget and the head always edit; other members when the head allowed it. */
function mayEdit(user: StoredUser): boolean {
  if (!user.familyId) return true
  const d = getDb()
  const family = d.families.find((f) => f.id === user.familyId)
  if (family?.headUserId === user.id) return true
  const link = d.members.find((m) => m.userId === user.id && m.familyId === user.familyId)
  return Boolean(link && link.status === 'approved' && link.canEdit)
}

/** Same as the server's month budget: this month against the goal, with scheduled items still due set aside. */
function monthBudgetFor(user: StoredUser): MonthBudget {
  const d = getDb()
  const now = new Date()
  const start = toIsoDate(startOfMonth(now))
  const end = toIsoDate(endOfMonth(now))
  const month = visibleTransactions(user).filter((t) => t.date >= start && t.date <= end)
  const income = month.filter((t) => t.typeId === TYPE_INCOME_ID).reduce((s, t) => s + t.amount, 0)
  const expense = month.filter((t) => t.typeId === TYPE_EXPENSE_ID).reduce((s, t) => s + t.amount, 0)
  let expectedIncome = 0
  let upcomingFixed = 0
  for (const s of visibleScheduled(user).filter((x) => x.isActive)) {
    for (let run = s.nextRunDate; run <= end && (!s.endDate || run <= s.endDate); run = nextRunAfter(run, s)) {
      if (run < start) continue
      if (s.typeId === TYPE_INCOME_ID) expectedIncome += s.amount
      else upcomingFixed += s.amount
    }
  }
  const goal = d.goals?.[user.familyId ?? user.id] ?? null
  const spendable = income + expectedIncome - (goal ?? 0)
  return {
    month: start.slice(0, 7),
    goal,
    income,
    expectedIncome,
    expense,
    upcomingFixed,
    spendable,
    leftToSpend: spendable - expense - upcomingFixed,
  }
}

/** Throws the server's 403 when the user may not edit. */
function requireEdit(user: StoredUser): void {
  if (!mayEdit(user)) throw new ApiError('Forbidden', 403, 'edit_not_allowed')
}

/** Built-in category keys in Hebrew, for generated insight text. */
const CATEGORY_HE: Record<string, string> = {
  groceries: 'סופר',
  rent: 'שכר דירה ומשכנתא',
  utilities: 'חשבונות',
  transport: 'תחבורה',
  dining: 'מסעדות',
  entertainment: 'בילויים',
  health: 'בריאות',
  education: 'חינוך',
  shopping: 'קניות',
  insurance: 'ביטוח',
  savings: 'חיסכון',
  otherExpense: 'אחר',
}

/** Turns a category key like "otherExpense" into "Other expense" for generated insight text. */
function humanize(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** ApiContract implementation that runs entirely in the browser and persists to localStorage. */
export const mockApi: ApiContract = {
  auth: {
    async register(input) {
      await delay()
      const d = getDb()
      if (d.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError('Email already registered', 409, 'email_taken')
      }
      const user: StoredUser = { id: newId('user'), ...input, familyId: null }
      d.users.push(user)
      const token = `mock-${newId()}`
      d.sessions[token] = user.id
      saveDb(d)
      setToken(token)
      return { token, user: publicUser(user) }
    },
    async login(input) {
      await delay()
      const d = getDb()
      const user = d.users.find(
        (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.password === input.password,
      )
      if (!user) throw new ApiError('Invalid credentials', 401, 'invalid_credentials')
      const token = `mock-${newId()}`
      d.sessions[token] = user.id
      saveDb(d)
      setToken(token)
      return { token, user: publicUser(user) }
    },
    async me() {
      await delay(50)
      return publicUser(currentUser())
    },
    async updateProfile(input) {
      await delay()
      const user = currentUser()
      user.firstName = input.firstName
      user.lastName = input.lastName
      saveDb(getDb())
      return publicUser(user)
    },
    async forgotPassword(email) {
      await delay()
      const d = getDb()
      const user = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user) return {}
      const resetToken = newId('reset')
      d.resetTokens[resetToken] = user.id
      saveDb(d)
      return { resetToken }
    },
    async resetPassword(token, password) {
      await delay()
      const d = getDb()
      const userId = d.resetTokens[token]
      const user = userId ? d.users.find((u) => u.id === userId) : undefined
      if (!user) throw new ApiError('Invalid token', 400, 'invalid_token')
      user.password = password
      delete d.resetTokens[token]
      saveDb(d)
    },
  },

  family: {
    async getMine() {
      await delay()
      return familyOverviewFor(currentUser())
    },
    async create(name) {
      await delay()
      const user = currentUser()
      const d = getDb()
      if (d.members.some((m) => m.userId === user.id)) {
        throw new ApiError('Already in a family', 409, 'already_in_family')
      }
      const family: Family = {
        id: newId('family'),
        name,
        inviteKey: newInviteKey(),
        headUserId: user.id,
        createdAt: new Date().toISOString(),
      }
      d.families.push(family)
      d.members.push({ userId: user.id, familyId: family.id, status: 'approved', canEdit: true, joinedAt: family.createdAt })
      user.familyId = family.id
      // Personal history moves into the new shared budget.
      d.transactions.filter((t) => t.userId === user.id && t.familyId === null).forEach((t) => (t.familyId = family.id))
      d.scheduled.filter((s) => s.userId === user.id && s.familyId === null).forEach((s) => (s.familyId = family.id))
      saveDb(d)
      return family
    },
    async join(inviteKey) {
      await delay()
      const user = currentUser()
      const d = getDb()
      if (d.members.some((m) => m.userId === user.id)) {
        throw new ApiError('Already in a family', 409, 'already_in_family')
      }
      const family = d.families.find((f) => f.inviteKey.toUpperCase() === inviteKey.trim().toUpperCase())
      if (!family) throw new ApiError('Key not found', 404, 'key_not_found')
      d.members.push({ userId: user.id, familyId: family.id, status: 'pending', canEdit: false, joinedAt: new Date().toISOString() })
      saveDb(d)
      return { status: 'pending' }
    },
    async approveMember(userId) {
      await delay()
      const head = currentUser()
      const d = getDb()
      const family = d.families.find((f) => f.id === head.familyId && f.headUserId === head.id)
      if (!family) throw new ApiError('Forbidden', 403, 'forbidden')
      const link = d.members.find((m) => m.userId === userId && m.familyId === family.id)
      const user = d.users.find((u) => u.id === userId)
      if (!link || !user) throw new ApiError('Not found', 404, 'not_found')
      link.status = 'approved'
      link.joinedAt = new Date().toISOString()
      user.familyId = family.id
      d.transactions.filter((t) => t.userId === user.id && t.familyId === null).forEach((t) => (t.familyId = family.id))
      d.scheduled.filter((s) => s.userId === user.id && s.familyId === null).forEach((s) => (s.familyId = family.id))
      saveDb(d)
    },
    async removeMember(userId) {
      await delay()
      const head = currentUser()
      const d = getDb()
      const family = d.families.find((f) => f.id === head.familyId && f.headUserId === head.id)
      if (!family) throw new ApiError('Forbidden', 403, 'forbidden')
      if (userId === head.id) throw new ApiError('Cannot remove head', 409, 'head_cannot_leave')
      d.members = d.members.filter((m) => !(m.userId === userId && m.familyId === family.id))
      const user = d.users.find((u) => u.id === userId)
      if (user && user.familyId === family.id) user.familyId = null
      saveDb(d)
    },
    async setMemberPermission(userId, canEdit) {
      await delay()
      const head = currentUser()
      const d = getDb()
      const family = d.families.find((f) => f.id === head.familyId && f.headUserId === head.id)
      if (!family) throw new ApiError('Forbidden', 403, 'forbidden')
      if (userId === head.id) throw new ApiError('The head can always edit', 409, 'head_always_edits')
      const link = d.members.find((m) => m.userId === userId && m.familyId === family.id && m.status === 'approved')
      if (!link) throw new ApiError('Not found', 404, 'not_found')
      link.canEdit = canEdit
      saveDb(d)
    },
    async leave() {
      await delay()
      const user = currentUser()
      const d = getDb()
      const link = d.members.find((m) => m.userId === user.id)
      if (!link) return
      const family = d.families.find((f) => f.id === link.familyId)
      const others = d.members.filter((m) => m.familyId === link.familyId && m.userId !== user.id && m.status === 'approved')
      if (family && family.headUserId === user.id && others.length > 0) {
        throw new ApiError('Head cannot leave', 409, 'head_cannot_leave')
      }
      d.members = d.members.filter((m) => m.userId !== user.id)
      user.familyId = null
      if (family && family.headUserId === user.id) {
        d.families = d.families.filter((f) => f.id !== family.id)
        d.members = d.members.filter((m) => m.familyId !== family.id)
      }
      saveDb(d)
    },
    async regenerateKey() {
      await delay()
      const head = currentUser()
      const d = getDb()
      const family = d.families.find((f) => f.id === head.familyId && f.headUserId === head.id)
      if (!family) throw new ApiError('Forbidden', 403, 'forbidden')
      family.inviteKey = newInviteKey()
      saveDb(d)
      return family
    },
  },

  lookups: {
    async transactionTypes() {
      await delay(30)
      return SEED_TYPES
    },
    async categories() {
      await delay(30)
      return getDb().categories
    },
    async createCategory(input) {
      await delay()
      currentUser()
      const d = getDb()
      const category: Category = { id: newId('cat'), name: input.name, typeId: input.typeId }
      d.categories.push(category)
      saveDb(d)
      return category
    },
  },

  transactions: {
    async list(filters: TransactionFilters) {
      await delay()
      const user = currentUser()
      let items = visibleTransactions(user)
      if (filters.from) items = items.filter((t) => t.date >= filters.from!)
      if (filters.to) items = items.filter((t) => t.date <= filters.to!)
      if (filters.typeId) items = items.filter((t) => t.typeId === filters.typeId)
      if (filters.categoryId) items = items.filter((t) => t.categoryId === filters.categoryId)
      if (filters.search) {
        const q = filters.search.toLowerCase()
        items = items.filter((t) => t.title.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q))
      }
      items = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)))
      const page = filters.page ?? 1
      const pageSize = filters.pageSize ?? 20
      const start = (page - 1) * pageSize
      return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
    },
    async create(input: TransactionInput) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const tx: Transaction = {
        id: newId('tx'),
        ...input,
        userId: user.id,
        familyId: user.familyId,
        source: 'manual',
        createdAt: new Date().toISOString(),
      }
      d.transactions.push(tx)
      saveDb(d)
      return tx
    },
    async update(id, input) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const tx = visibleTransactions(user).find((t) => t.id === id)
      if (!tx) throw new ApiError('Not found', 404, 'not_found')
      requireEdit(user)
      Object.assign(tx, input)
      saveDb(d)
      return tx
    },
    async remove(id) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const tx = visibleTransactions(user).find((t) => t.id === id)
      if (!tx) throw new ApiError('Not found', 404, 'not_found')
      requireEdit(user)
      d.transactions = d.transactions.filter((t) => t.id !== id)
      saveDb(d)
    },
  },

  scheduled: {
    async list() {
      await delay()
      const user = currentUser()
      return [...visibleScheduled(user)].sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate))
    },
    async create(input: ScheduledTransactionInput) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const s: ScheduledTransaction = {
        id: newId('sch'),
        ...input,
        endDate: input.endDate ?? null,
        userId: user.id,
        familyId: user.familyId,
        nextRunDate: firstRunDate(input),
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      d.scheduled.push(s)
      // Generate anything already due (e.g. a start date in the past).
      const created = materializeDueSchedules([s])
      d.transactions.push(...created)
      saveDb(d)
      return s
    },
    async update(id, input) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const s = visibleScheduled(user).find((x) => x.id === id)
      if (!s) throw new ApiError('Not found', 404, 'not_found')
      requireEdit(user)
      const scheduleChanged =
        s.interval !== input.interval || s.dayOfMonth !== input.dayOfMonth || s.startDate !== input.startDate
      Object.assign(s, input, { endDate: input.endDate ?? null })
      if (scheduleChanged) {
        const first = firstRunDate(s)
        s.nextRunDate = isBefore(parseISO(first), new Date()) ? s.nextRunDate : first
      }
      saveDb(d)
      return s
    },
    async remove(id) {
      await delay()
      const user = currentUser()
      const d = getDb()
      if (!visibleScheduled(user).some((x) => x.id === id)) throw new ApiError('Not found', 404, 'not_found')
      requireEdit(user)
      d.scheduled = d.scheduled.filter((x) => x.id !== id)
      saveDb(d)
    },
    async toggle(id, isActive) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const s = visibleScheduled(user).find((x) => x.id === id)
      if (!s) throw new ApiError('Not found', 404, 'not_found')
      requireEdit(user)
      s.isActive = isActive
      saveDb(d)
      return s
    },
  },

  imports: {
    async commit(input) {
      await delay(400)
      const user = currentUser()
      const d = getDb()
      const existing = visibleTransactions(user)
      const dupKey = (date: string, amount: number, title: string) => `${date}|${amount}|${title.trim().toLowerCase()}`
      const seen = new Set(existing.map((t) => dupKey(t.date, t.amount, t.title)))
      let inserted = 0
      let skippedDuplicates = 0
      for (const row of input.rows) {
        const key = dupKey(row.date, row.amount, row.title)
        if (seen.has(key)) {
          skippedDuplicates += 1
          continue
        }
        seen.add(key)
        const isIncome = row.type === 'income'
        d.transactions.push({
          id: newId('tx'),
          date: row.date,
          title: row.title,
          amount: Math.abs(row.amount),
          userId: user.id,
          categoryId: row.categoryId || (isIncome ? DEFAULT_INCOME_CATEGORY_ID : DEFAULT_EXPENSE_CATEGORY_ID),
          typeId: isIncome ? TYPE_INCOME_ID : TYPE_EXPENSE_ID,
          familyId: user.familyId,
          source: 'import',
          createdAt: new Date().toISOString(),
        })
        inserted += 1
      }
      const batch: ImportBatch = {
        id: newId('imp'),
        fileName: input.fileName,
        source: input.source,
        rowCount: inserted,
        createdAt: new Date().toISOString(),
      }
      d.imports.push(batch)
      saveDb(d)
      return { batchId: batch.id, inserted, skippedDuplicates }
    },
  },

  insights: {
    async list() {
      await delay()
      const user = currentUser()
      const d = getDb()
      const scopeUserIds = user.familyId
        ? d.members.filter((m) => m.familyId === user.familyId && m.status === 'approved').map((m) => m.userId)
        : [user.id]
      return d.insights
        .filter((i) => scopeUserIds.includes(i.userId))
        .map((i) => ({ ...i, language: i.language ?? 'en' }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async generate() {
      await delay(1200)
      const user = currentUser()
      const d = getDb()
      const { from, to } = monthRange()
      const txs = visibleTransactions(user).filter((t) => t.date >= from && t.date <= to)
      const income = txs.filter((t) => t.typeId === TYPE_INCOME_ID).reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter((t) => t.typeId === TYPE_EXPENSE_ID).reduce((s, t) => s + t.amount, 0)
      const byCat = new Map<string, number>()
      txs.filter((t) => t.typeId === TYPE_EXPENSE_ID).forEach((t) => byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount))
      const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]
      const topKey = top ? (d.categories.find((c) => c.id === top[0])?.name ?? 'otherExpense') : 'otherExpense'
      const topPct = top && expense ? Math.round((top[1] / expense) * 100) : 0
      const savingsRate = income ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0
      const recurring = visibleScheduled(user).filter((s) => s.isActive && s.typeId === TYPE_EXPENSE_ID)
      const recurringTotal = `₪${recurring.reduce((s, r) => s + r.amount, 0).toLocaleString()}`
      const now = Date.now()
      // One row per insight and language; item k is stamped k ms earlier so newest-first keeps the order.
      const created: AiInsight[] = (['en', 'he'] as const).flatMap((language) => {
        const tpl = INSIGHT_TEMPLATES[language]
        const topName = language === 'he' ? (CATEGORY_HE[topKey] ?? topKey) : humanize(topKey)
        return [tpl.topCategory(topName, topPct), tpl.savingsRate(savingsRate), tpl.recurring(recurring.length, recurringTotal)].map(
          (text, k) => ({ id: newId('ins'), userId: user.id, createdAt: new Date(now - k).toISOString(), language, ...text }),
        )
      })
      d.insights.push(...created)
      saveDb(d)
      return created
    },
  },

  dashboard: {
    async summary(from, to) {
      await delay()
      const user = currentUser()
      const d = getDb()
      const all = visibleTransactions(user)
      const txs = all.filter((t) => t.date >= from && t.date <= to)
      const totalIncome = txs.filter((t) => t.typeId === TYPE_INCOME_ID).reduce((s, t) => s + t.amount, 0)
      const totalExpense = txs.filter((t) => t.typeId === TYPE_EXPENSE_ID).reduce((s, t) => s + t.amount, 0)
      const fixedExpense = txs
        .filter((t) => t.typeId === TYPE_EXPENSE_ID && t.source === 'scheduled')
        .reduce((s, t) => s + t.amount, 0)

      const catMap = new Map<string, number>()
      txs.filter((t) => t.typeId === TYPE_EXPENSE_ID).forEach((t) => catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount))
      const byCategory = [...catMap.entries()]
        .map(([categoryId, total]) => ({
          categoryId,
          categoryName: d.categories.find((c) => c.id === categoryId)?.name ?? categoryId,
          total,
        }))
        .sort((a, b) => b.total - a.total)

      const monthMap = new Map<string, MonthlyTotal>()
      // Always show at least the last 6 months so the chart has context even for a short range.
      const months = Math.max(6, Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / (30 * 86400000)) + 1)
      for (let i = months - 1; i >= 0; i -= 1) {
        const key = toIsoDate(subMonths(parseISO(to), i)).slice(0, 7)
        monthMap.set(key, { month: key, income: 0, expense: 0 })
      }
      all.forEach((t) => {
        const entry = monthMap.get(t.date.slice(0, 7))
        if (!entry) return
        if (t.typeId === TYPE_INCOME_ID) entry.income += t.amount
        else entry.expense += t.amount
      })

      const recentTransactions = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
      const today = todayIso()
      const upcomingScheduled = visibleScheduled(user)
        .filter((s) => s.isActive && s.nextRunDate >= today)
        .sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate))
        .slice(0, 5)
      const insights = await mockApi.insights.list()
      // The newest generation: rows stamped within a second of the newest one (see insights.generate).
      const newest = insights[0] ? Date.parse(insights[0].createdAt) : 0
      const latestInsights = insights.filter((i) => newest - Date.parse(i.createdAt) < 1000)

      return {
        from,
        to,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        byCategory,
        byMonth: [...monthMap.values()],
        recentTransactions,
        upcomingScheduled,
        latestInsights,
        fixedExpense,
        variableExpense: totalExpense - fixedExpense,
        monthBudget: monthBudgetFor(user),
      } satisfies DashboardSummary
    },
    async setSavingsGoal(amount) {
      await delay()
      const user = currentUser()
      requireEdit(user)
      const d = getDb()
      d.goals = { ...(d.goals ?? {}), [user.familyId ?? user.id]: amount === null ? null : Math.round(amount * 100) / 100 }
      saveDb(d)
      return monthBudgetFor(user)
    },
  },
}
