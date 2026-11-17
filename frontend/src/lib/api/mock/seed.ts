import type { Category, TransactionType } from '@/types'

/** Fixed ids for the two transaction types so seed data and UI can reference them. */
export const TYPE_INCOME_ID = 'type_income'
export const TYPE_EXPENSE_ID = 'type_expense'

/** The two rows of the `transaction_types` table. */
export const SEED_TYPES: TransactionType[] = [
  { id: TYPE_INCOME_ID, type: 'income' },
  { id: TYPE_EXPENSE_ID, type: 'expense' },
]

/**
 * Default categories. `name` is an i18n key under `categories.*` so the label follows the UI language;
 * user-created categories store a plain name instead.
 */
export const SEED_CATEGORIES: Category[] = [
  { id: 'cat_salary', name: 'salary', typeId: TYPE_INCOME_ID, icon: 'Briefcase' },
  { id: 'cat_bonus', name: 'bonus', typeId: TYPE_INCOME_ID, icon: 'Gift' },
  { id: 'cat_other_income', name: 'otherIncome', typeId: TYPE_INCOME_ID, icon: 'Plus' },
  { id: 'cat_groceries', name: 'groceries', typeId: TYPE_EXPENSE_ID, icon: 'ShoppingCart' },
  { id: 'cat_rent', name: 'rent', typeId: TYPE_EXPENSE_ID, icon: 'Home' },
  { id: 'cat_utilities', name: 'utilities', typeId: TYPE_EXPENSE_ID, icon: 'Zap' },
  { id: 'cat_transport', name: 'transport', typeId: TYPE_EXPENSE_ID, icon: 'Car' },
  { id: 'cat_dining', name: 'dining', typeId: TYPE_EXPENSE_ID, icon: 'Utensils' },
  { id: 'cat_entertainment', name: 'entertainment', typeId: TYPE_EXPENSE_ID, icon: 'Film' },
  { id: 'cat_health', name: 'health', typeId: TYPE_EXPENSE_ID, icon: 'HeartPulse' },
  { id: 'cat_education', name: 'education', typeId: TYPE_EXPENSE_ID, icon: 'GraduationCap' },
  { id: 'cat_shopping', name: 'shopping', typeId: TYPE_EXPENSE_ID, icon: 'ShoppingBag' },
  { id: 'cat_insurance', name: 'insurance', typeId: TYPE_EXPENSE_ID, icon: 'Shield' },
  { id: 'cat_savings', name: 'savings', typeId: TYPE_EXPENSE_ID, icon: 'PiggyBank' },
  { id: 'cat_other_expense', name: 'otherExpense', typeId: TYPE_EXPENSE_ID, icon: 'MoreHorizontal' },
]

/** Id of the fallback category used for imported rows without a chosen category. */
export const DEFAULT_EXPENSE_CATEGORY_ID = 'cat_other_expense'
export const DEFAULT_INCOME_CATEGORY_ID = 'cat_other_income'

/** Demo account that exists in a fresh mock database. */
export const DEMO_USER = {
  id: 'user_demo',
  firstName: 'Dana',
  lastName: 'Cohen',
  email: 'demo@example.com',
  password: 'password123',
}

/** Canned insight templates the mock "generates" from the user's real totals, in every UI language. */
export const INSIGHT_TEMPLATES = {
  en: {
    topCategory: (cat: string, pct: number) => ({
      title: 'Biggest spending category',
      body: `${cat} accounts for ${pct}% of your expenses this month. Setting a monthly cap for it and reviewing it weekly is the single most effective change you can make.`,
    }),
    savingsRate: (rate: number) => ({
      title: 'Savings rate',
      body:
        rate >= 20
          ? `You are saving ${rate}% of your income, which is above the recommended 20%. Consider moving the surplus into a dedicated savings account automatically each month.`
          : `You are saving ${rate}% of your income. Aim for at least 20% by trimming discretionary categories such as dining and entertainment.`,
    }),
    recurring: (count: number, total: string) => ({
      title: 'Recurring commitments',
      body: `You have ${count} recurring payments totalling ${total} per month. Review each subscription and cancel the ones you no longer use.`,
    }),
  },
  he: {
    topCategory: (cat: string, pct: number) => ({
      title: 'קטגוריית ההוצאה הגדולה',
      body: `${cat} היא ${pct}% מההוצאות שלכם החודש. הגדרת תקרה חודשית לקטגוריה הזו ובדיקה שבועית שלה הם השינוי האפקטיבי ביותר שאפשר לעשות.`,
    }),
    savingsRate: (rate: number) => ({
      title: 'שיעור החיסכון',
      body:
        rate >= 20
          ? `אתם חוסכים ${rate}% מההכנסה, מעל ל-20% המומלצים. כדאי להעביר את העודף אוטומטית לחשבון חיסכון ייעודי בכל חודש.`
          : `אתם חוסכים ${rate}% מההכנסה. כדאי לשאוף ל-20% לפחות, למשל בקיצוץ בהוצאות גמישות כמו מסעדות ובילויים.`,
    }),
    recurring: (count: number, total: string) => ({
      title: 'התחייבויות קבועות',
      body: `יש לכם ${count} תשלומים קבועים בסך ${total} בחודש. עברו על כל מנוי ובטלו את אלה שאתם כבר לא משתמשים בהם.`,
    }),
  },
} as const
