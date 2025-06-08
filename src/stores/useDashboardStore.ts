// src/stores/useDashboardStore.ts
import { supabase } from '@/supabase'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './useAuthStore'
import { useBookshelfStore } from './useBookshelfStore'

interface ReadingGoal {
  year: number
  target: number
}

export const useDashboardStore = defineStore('dashboard', () => {
  const bookshelfStore = useBookshelfStore()
  const authStore = useAuthStore()

  // Importante: Usar sempre os livros diretamente da bookshelfStore,
  // para garantir que estamos sempre trabalhando com os dados mais recentes
  const books = computed(() => bookshelfStore.books)

  // Estado para contagens
  const quotesCount = ref(0) // Contador para frases favoritas

  // Estado para meta de leitura
  const readingGoal = ref<ReadingGoal>({ year: new Date().getFullYear(), target: 20 })
  const readingGoalLoaded = ref(false)

  // Flag para controlar se estamos no meio de um carregamento
  const isLoading = ref(false)
  // Armazena o último ID de carregamento para controlar sobreposição
  const lastLoadId = ref(0)

  // Livro atual sendo lido
  const currentlyReading = computed(() => {
    return books.value.find((book) => isReading(book))
  })

  // Progresso de leitura do livro atual
  const readingProgress = computed(() => {
    if (!currentlyReading.value) return 0

    // Se temos um livro com progresso de página atual e total de páginas
    if (currentlyReading.value.current_page && currentlyReading.value.page_count) {
      return Math.round(
        (currentlyReading.value.current_page / currentlyReading.value.page_count) * 100,
      )
    }

    return 35 // Valor fixo para exemplo, idealmente seria calculado
  })

  // Total de livros
  const totalBooks = ref(0)

  // Total de livros lidos (status 1)
  const totalBooksRead = ref(0)

  // Total de livros em progresso (status 2)
  const booksInProgress = ref(0)

  // Total de livros na wishlist (status 0)
  const wishlistCount = ref(0)

  // Total de frases favoritas
  const totalFavoriteQuotes = computed(() => {
    let count = 0

    // Verificar arrays de quotes na estrutura de dados
    books.value.forEach((book) => {
      // Array de quotes
      if (book.quotes && Array.isArray(book.quotes)) {
        count += book.quotes.length
      }
    })

    // Se já temos uma contagem dos livros carregados, usamos essa
    if (count > 0) {
      return count
    }

    // Caso a contagem ainda estiver em 0 e temos valor da API, usar esse
    if (quotesCount.value > 0) {
      return quotesCount.value
    }

    // Se ainda não temos dados, buscar do Supabase
    if (count === 0 && authStore.user?.id) {
      // Esta operação será executada de forma assíncrona
      fetchQuotesCount()
    }

    return quotesCount.value
  })

  // Buscar todas as frases do Supabase
  const fetchQuotesCount = async () => {
    if (!authStore.user?.id) return 0

    try {

      // Buscar citações do Supabase da tabela quotes (não phases)
      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authStore.user.id)

      if (error) {
        if (error.code === '42P01') {

          return 0
        }
        throw error
      }

      quotesCount.value = count || 0
      return count
    } catch (error) {
      console.error('Erro ao buscar contagem de citações:', error)
      return 0
    }
  }

  // Distribuição por gênero
  const genresDistribution = ref({})

  const calculateGenresDistribution = (processedBooks) => {
    const genreCounts = {}
    processedBooks.forEach((book) => {
      const genre = book.genre || 'Não categorizado'
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
    genresDistribution.value = genreCounts
  }

  // Tempo médio de leitura
  const averageReadingTime = ref(0)

  const calculateAverageReadingTime = (processedBooks) => {
    let totalTime = 0
    let completedBooks = 0


    processedBooks.forEach((book) => {
      // Se o livro não está marcado como lido (status 1), não consideramos
      if (!isCompleted(book)) return

      // Primeiro tentamos usar os campos do banco
      if (book.started_reading_at && book.finished_reading_at) {
        const start = new Date(book.started_reading_at).getTime()
        const end = new Date(book.finished_reading_at).getTime()

        if (end >= start) {
          // Verificar se as datas são válidas (fim > início)
          const daysElapsed = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))

          totalTime += daysElapsed
          completedBooks++
        }
      }
      // Se não tiver, tentamos usar os campos formatados em DD/MM/YYYY
      else if (book.dataInicioLeitura && book.dataFinalLeitura) {
        try {
          // Convertendo datas no formato DD/MM/YYYY para objetos Date
          const parseDate = (dateStr) => {
            if (!dateStr) return null
            const parts = dateStr.split('/')
            if (parts.length !== 3) return null

            const [day, month, year] = parts.map(Number)
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null

            // Mês em JS começa do zero (janeiro = 0)
            return new Date(year, month - 1, day)
          }

          const startDate = parseDate(book.dataInicioLeitura)
          const endDate = parseDate(book.dataFinalLeitura)

          if (startDate && endDate && endDate >= startDate) {
            const start = startDate.getTime()
            const end = endDate.getTime()

            // Garantir que não estamos calculando valores negativos
            // e usar no mínimo 1 dia para evitar divisão por zero
            const daysElapsed = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))

            totalTime += daysElapsed
            completedBooks++
          }
        } catch (err) {
          console.error(`Erro ao processar datas do livro ${book.title}:`, err)
        }
      }
    })



    // Se não temos livros concluídos com datas válidas
    if (completedBooks === 0 || totalTime === 0) {
      // Calcular com base na média de livros lidos e o dia do ano atual
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const daysElapsed = Math.floor(
        (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Se temos livros lidos, calculamos a média baseada no dia do ano
      const booksRead = totalBooksRead.value
      if (booksRead > 0 && daysElapsed > 0) {
        averageReadingTime.value = Math.round(daysElapsed / booksRead)
        return
      }

      // Caso realmente não tenha dados suficientes, usamos um valor padrão
      averageReadingTime.value = 14
      return
    }

    averageReadingTime.value = Math.round(totalTime / completedBooks)
  }

  // Último livro lido
  const lastBookRead = ref(null)

  // Funções auxiliares para verificar status dos livros de forma consistente
  const ensureNumberStatus = (book) => {
    if (!book) return null

    // Se o status não for um número, converter para número
    if (book.status !== undefined && book.status !== null && typeof book.status !== 'number') {

      book.status = Number(book.status)
    }

    return book
  }

  // Verifica o status de um livro retornando um valor booleano
  const checkBookStatus = (book, statusValue) => {
    if (!book) return false
    const processedBook = ensureNumberStatus(book)
    return Number(processedBook.status) === statusValue
  }

  // Estas funções garantem a verificação segura e consistente dos status
  const isReading = (book) => checkBookStatus(book, 2) // Status 2 = Lendo
  const isCompleted = (book) => checkBookStatus(book, 1) // Status 1 = Lido
  const isWishlist = (book) => checkBookStatus(book, 0) // Status 0 = Quero ler

  // Função para processar os dados de livros
  const processBooks = (books) => {
    if (!books || !Array.isArray(books)) {
      console.warn('[DashboardStore] Tentativa de processar livros inválidos:', books)
      return []
    }

    // Processa e converte o status para número em todos os livros
    return books.map((book) => ensureNumberStatus(book))
  }

  // Carregar meta de leitura do localStorage ou criar um padrão
  const loadReadingGoal = async () => {
    try {
      // Primeiro, tentamos carregar do localStorage
      const savedGoal = localStorage.getItem('readingGoal')
      if (savedGoal) {
        const parsedGoal = JSON.parse(savedGoal)
        readingGoal.value = parsedGoal
        readingGoalLoaded.value = true
        return
      }

      // Se não temos no localStorage e temos um usuário, tentamos carregar do perfil
      if (authStore.user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('reading_goal')
          .eq('id', authStore.user.id)
          .single()

        if (!profileError && profileData?.reading_goal) {
          const newGoal = {
            year: new Date().getFullYear(),
            target: profileData.reading_goal || 20,
          }
          readingGoal.value = newGoal
          localStorage.setItem('readingGoal', JSON.stringify(newGoal))
          readingGoalLoaded.value = true
          return
        }
      }

      // Se chegamos aqui, não conseguimos carregar do banco nem do localStorage
      // Vamos usar um valor padrão
      const defaultGoal = { year: new Date().getFullYear(), target: 20 }
      readingGoal.value = defaultGoal
      localStorage.setItem('readingGoal', JSON.stringify(defaultGoal))
      readingGoalLoaded.value = true
    } catch (error) {
      console.error('Erro ao carregar meta de leitura:', error)
      // Definir um valor padrão em caso de erro
      readingGoal.value = { year: new Date().getFullYear(), target: 20 }
      readingGoalLoaded.value = true
    }
  }

  // Salvar meta de leitura no localStorage e tentar salvar no perfil
  const saveReadingGoal = async (goal: ReadingGoal) => {
    try {
      // Salvar no localStorage sempre
      localStorage.setItem('readingGoal', JSON.stringify(goal))
      readingGoal.value = goal

      // Tentar salvar no perfil do usuário se possível
      if (authStore.user?.id) {
        const { error: userUpdateError } = await supabase
          .from('profiles')
          .update({ reading_goal: goal.target })
          .eq('id', authStore.user.id)

        if (userUpdateError) {
          console.warn('Erro ao atualizar meta no perfil:', userUpdateError)
        }
      }

      return true
    } catch (error) {
      console.error('Erro ao salvar meta de leitura:', error)
      return false
    }
  }

  // Método de carregamento de dados para o dashboard
  const loadDashboardData = async (loadId) => {
    isLoading.value = true
    lastLoadId.value = loadId

    try {
      if (!bookshelfStore.books || bookshelfStore.books.length === 0) {
        await bookshelfStore.fetchBooks()
      }

      // Verificar se outro carregamento foi iniciado
      if (window.DASHBOARD_LOAD_ID !== undefined && window.DASHBOARD_LOAD_ID !== loadId) {
        return
      }

      // Carregar a meta de leitura do localStorage ou Supabase
      await loadReadingGoal()

      // Verificar novamente se outro carregamento foi iniciado
      if (window.DASHBOARD_LOAD_ID !== undefined && window.DASHBOARD_LOAD_ID !== loadId) {
        return
      }

      const processedBooks = processBooks(bookshelfStore.books)

      // Contar os livros por status
      totalBooks.value = processedBooks.length
      totalBooksRead.value = processedBooks.filter(isCompleted).length
      booksInProgress.value = processedBooks.filter(isReading).length
      wishlistCount.value = processedBooks.filter(isWishlist).length

      // Identificar o livro atual
      currentlyReading.value = processedBooks.find(isReading) || null

      // Identificar o último livro lido (ordenado por data de conclusão, decrescente)
      const completedBooks = processedBooks
        .filter((book) => isCompleted(book) && book.finished_reading_at)
        .sort((a, b) => new Date(b.finished_reading_at) - new Date(a.finished_reading_at))

      lastBookRead.value = completedBooks.length > 0 ? completedBooks[0] : null

      // Calcular distribuição de gêneros
      calculateGenresDistribution(processedBooks)

      // Calcular tempo médio de leitura
      calculateAverageReadingTime(processedBooks)

      // Contar citações favoritas
      await fetchQuotesCount()
    } catch (err) {
      console.error('[DashboardStore] Erro ao carregar dados:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    totalBooks,
    totalBooksRead,
    booksInProgress,
    wishlistCount,
    totalFavoriteQuotes,
    genresDistribution,
    averageReadingTime,
    currentlyReading,
    readingProgress,
    lastBookRead,
    readingGoal,
    readingGoalLoaded,
    isLoading,
    loadDashboardData,
    saveReadingGoal,
    loadReadingGoal,
  }
})
