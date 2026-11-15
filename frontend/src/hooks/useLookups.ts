import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Category, CreateCategoryInput, TransactionTypeKey } from '@/types'

/** Query keys for lookup tables, shared so mutations can invalidate them. */
export const lookupKeys = {
  types: ['lookups', 'types'] as const,
  categories: ['lookups', 'categories'] as const,
}

/** Loads the income/expense type rows (cached for the whole session). */
export function useTransactionTypes() {
  return useQuery({ queryKey: lookupKeys.types, queryFn: api.lookups.transactionTypes, staleTime: Infinity })
}

/** Loads all categories (cached for the whole session). */
export function useCategories() {
  return useQuery({ queryKey: lookupKeys.categories, queryFn: api.lookups.categories, staleTime: Infinity })
}

/** Creates a custom category and refreshes the category list. */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api.lookups.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lookupKeys.categories }),
  })
}

/** Resolves the id of a type by its key ("income" / "expense") and tells whether an id is income. */
export function useTypeHelpers() {
  const { data: types = [] } = useTransactionTypes()
  const idOf = useCallback((key: TransactionTypeKey) => types.find((t) => t.type === key)?.id ?? '', [types])
  const isIncome = useCallback((typeId: string) => types.find((t) => t.id === typeId)?.type === 'income', [types])
  return { types, idOf, isIncome }
}

/** Returns a function that gives the display name of a category, translating built-in ones. */
export function useCategoryLabel() {
  const { t, i18n } = useTranslation()
  const { data: categories = [] } = useCategories()
  return useCallback(
    (categoryOrId: Category | string | undefined | null): string => {
      const category = typeof categoryOrId === 'string' ? categories.find((c) => c.id === categoryOrId) : categoryOrId
      if (!category) return ''
      const key = `categories.${category.name}`
      return i18n.exists(key) ? t(key) : category.name
    },
    [categories, i18n, t],
  )
}
