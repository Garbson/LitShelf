// stores/useDashboardStore.ts

import { supabase } from '@/supabase'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBookshelfStore } from './useBookshelfStore'
import { useRecommendationStore } from './useRecommendationStore'

interface ReadingGoal {
  year: number
  target: number
}

export const useDashboardStore = defineStore('dashboard', () => {
  // =================================================================
  // 1. ESTADO (State)
  // =================================================================
  const bookshelfStore = useBookshelfStore()
  const recommendationStore = useRecommendationStore()
  const isLoading = ref(false)

  const readingGoal = ref<ReadingGoal>({
    year: new Date().getFullYear(),
    target: 20, // Valor padrão que será substituído pelo do banco
  })

  // =================================================================
  // 2. GETTERS (Computed) - Dados calculados automaticamente
  // =================================================================

  // O cálculo do gráfico. Reage automaticamente quando a lista de livros muda.
  const genresDistribution = computed(() => {
    const counts: { [key: string]: number } = {}
    for (const book of bookshelfStore.books) {
      const genre = book.genre?.trim() || 'Não categorizado'
      counts[genre] = (counts[genre] || 0) + 1
    }
    return counts
  })

  // As estatísticas agora são computadas e reativas.
  const totalFavoriteQuotes = computed(() => {
    return bookshelfStore.books.reduce((count, book) => count + (book.quotes?.length || 0), 0)
  })

  const averageReadingTime = computed(() => {
    const completedBooks = bookshelfStore.books.filter(
      (book) => Number(book.status) === 1 && book.started_reading_at && book.finished_reading_at,
    )
    if (completedBooks.length === 0) return 0
    const totalDays = completedBooks.reduce((acc, book) => {
      const diffTime = Math.abs(
        new Date(book.finished_reading_at!).getTime() -
          new Date(book.started_reading_at!).getTime(),
      )
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return acc + (diffDays > 0 ? diffDays : 1)
    }, 0)
    return Math.round(totalDays / completedBooks.length)
  })

  const currentlyReading = computed(() => {
    return bookshelfStore.books.find((book) => Number(book.status) === 2) || null
  })

  const lastBookRead = computed(() => {
    const completedBooks = bookshelfStore.books
      .filter((book) => Number(book.status) === 1 && book.finished_reading_at)
      .sort(
        (a, b) =>
          new Date(b.finished_reading_at!).getTime() - new Date(a.finished_reading_at!).getTime(),
      )
    return completedBooks.length > 0 ? completedBooks[0] : null
  })

  // =================================================================
  // 3. AÇÕES (Actions)
  // =================================================================

  async function fetchDashboardData() {
    isLoading.value = true
    try {
      // Busca tudo em paralelo para mais performance
      await Promise.all([
        bookshelfStore.fetchBooks(),
        recommendationStore.fetchRecommendations(),
        fetchReadingGoal(),
      ])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchReadingGoal() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const currentYear = new Date().getFullYear()
    const { data, error } = await supabase
      .from('reading_goals')
      .select('target')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .maybeSingle() // Corrigido para não dar erro se não houver meta

    if (error) {
      console.error('Erro ao buscar meta de leitura:', error)
    }
    if (data) {
      readingGoal.value = { year: currentYear, target: data.target }
    } else {
      readingGoal.value = { year: currentYear, target: 20 }
    }
  }

  async function saveReadingGoal(goal: ReadingGoal): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    try {
      const { error } = await supabase.from('reading_goals').upsert(
        {
          user_id: user.id,
          year: goal.year,
          target: goal.target,
        },
        { onConflict: 'user_id, year' },
      )
      if (error) throw error
      readingGoal.value = goal
      return true
    } catch (error) {
      console.error('Erro ao salvar meta de leitura:', error)
      return false
    }
  }

  return {
    isLoading,
    readingGoal,
    genresDistribution,
    totalFavoriteQuotes,
    averageReadingTime,
    currentlyReading,
    lastBookRead,
    fetchDashboardData,
    saveReadingGoal,
  }
})
