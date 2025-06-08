// src/stores/useBookshelfStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../supabase'
import { useAuthStore } from './useAuthStore'

// Enumeração para Status de Leitura
export enum ReadingStatus {
  WISHLIST = 0, // Quero ler
  COMPLETED = 1, // Já li
  READING = 2, // Estou lendo
}

// Interface para o Livro
interface Book {
  id: string
  user_id: string
  title: string
  author: string
  cover_image_url?: string
  description?: string
  page_count?: number
  genre?: string
  status?: ReadingStatus | number
  rating?: number
  current_page?: number
  started_reading_at?: string // ISO date string
  finished_reading_at?: string // ISO date string
  notes?: string
  added_at?: string
  updated_at?: string
  google_book_id?: string
}

export const useBookshelfStore = defineStore('bookshelf', () => {
  // Estado
  const books = ref<Book[]>([])
  const friendBooks = ref<Book[]>([]) // Novo array para livros do amigo
  const selectedBook = ref<Book | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const viewingFriendId = ref<string | null>(null) // ID do amigo cuja estante está sendo visualizada

  // Cache para requisições da Google Books API - evitar chamadas repetidas
  const googleBooksCache = new Map()

  // Computed
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const userId = computed(() => authStore.userId)

  // Livros exibidos atualmente (meus ou do amigo)
  const currentBooks = computed(() => {
    return viewingFriendId.value ? friendBooks.value : books.value
  })

  // Filtragem de livros por status
  const booksByStatus = computed(() => {
    const result = {
      [ReadingStatus.WISHLIST]: [] as Book[],
      [ReadingStatus.READING]: [] as Book[],
      [ReadingStatus.COMPLETED]: [] as Book[],
      all: [] as Book[],
    }

    currentBooks.value.forEach((book) => {
      if (typeof book.status === 'number') {
        result[book.status as ReadingStatus].push(book)
      } else {
        // Se não tiver status, considere como "wishlist"
        result[ReadingStatus.WISHLIST].push(book)
      }
    })

    result.all = currentBooks.value
    return result
  })

  // Método para definir que estamos visualizando a estante de um amigo
  const setViewingFriend = (friendId: string | null) => {
    viewingFriendId.value = friendId

    // Se não estamos mais visualizando a estante de um amigo, limpar os livros dele
    if (!friendId) {
      friendBooks.value = []
    }
  }

  // Garantir que o status dos livros seja sempre um número
  const ensureBookStatusIsNumber = (book) => {
    if (book && (book.status === undefined || book.status === null)) {
      book.status = 0
    } else if (book && typeof book.status !== 'number') {
      // Se o status não for um número, converter para número
      book.status = Number(book.status)
    }
    return book
  }

  // Fetch Books for the Logged User
  const fetchBooks = async () => {
    if (!userId.value) {
      console.warn('Tentativa de buscar livros sem usuário autenticado.')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Consulta ao Supabase para buscar todos os livros do usuário
      const { data, error: supabaseError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId.value)

      if (supabaseError) {
        console.error('Erro ao buscar livros do Supabase:', supabaseError)
        throw supabaseError
      }

      if (data && data.length > 0) {
        // Fetch additional data for each book if needed
        const booksWithDetails = await Promise.all(
          data.map(async (book) => {
            // Mapear datas ISO para formato brasileiro (DD/MM/YYYY)
            const formatDate = (dateStr: string | null): string | null => {
              if (!dateStr) return null
              const date = new Date(dateStr)
              return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
            }

            // Convertendo datas para o formato brasileiro para exibição
            const bookWithDates = {
              ...book,
              dataInicioLeitura: formatDate(book.started_reading_at),
              dataFinalLeitura: formatDate(book.finished_reading_at),
            }

            // Adicionando campo de compatibilidade para a imagem
            if (book.cover_image_url) {
              bookWithDates.coverImage = book.cover_image_url
            }

            // Garantir que o status seja um número
            ensureBookStatusIsNumber(bookWithDates)

            if (!book.description || !book.page_count || !book.genre) {
              const bookDetails = await fetchBookDetailsFromGoogle(book.title, book.author)

              // Atualizar o livro no Supabase com os detalhes obtidos
              if (bookDetails.description || bookDetails.page_count || bookDetails.genre) {
                await supabase
                  .from('books')
                  .update({
                    description: bookDetails.description,
                    page_count: bookDetails.page_count,
                    genre: bookDetails.genre,
                  })
                  .eq('id', book.id)
              }

              return ensureBookStatusIsNumber({ ...bookWithDates, ...bookDetails })
            }
            return ensureBookStatusIsNumber(bookWithDates)
          }),
        )

        books.value = booksWithDetails
      } else {
        books.value = []
      }
    } catch (err: any) {
      console.error('Erro ao buscar livros:', err)
      error.value = 'Erro ao buscar livros.'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch Friend's Books
  const fetchFriendBooks = async (friendId: string) => {
    if (!userId.value) {
      console.warn('Tentativa de buscar livros sem usuário autenticado.')
      return
    }

    isLoading.value = true
    error.value = null
    setViewingFriend(friendId)

    try {
      // Usar a view friend_books_view
      const { data, error: supabaseError } = await supabase
        .from('friend_books_view')
        .select('*')
        .eq('user_id', friendId)
        .or(`user_id_1.eq.${userId.value},user_id_2.eq.${userId.value}`)

      if (supabaseError) {
        console.error('Erro ao buscar livros do amigo:', supabaseError)
        throw supabaseError
      }

      if (data && data.length > 0) {
        // Processar detalhes dos livros do amigo
        const friendBooksWithDetails = data.map((book) => {
          // Formatação de data para exibição em formato brasileiro
          const formatDate = (dateStr: string | null): string | null => {
            if (!dateStr) return null
            const date = new Date(dateStr)
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
          }

          return {
            ...book,
            coverImage: book.cover_image_url,
            dataInicioLeitura: formatDate(book.started_reading_at),
            dataFinalLeitura: formatDate(book.finished_reading_at),
          }
        })

        friendBooks.value = friendBooksWithDetails
      } else {
        friendBooks.value = []
      }
    } catch (err: any) {
      console.error('Erro ao buscar livros do amigo:', err)
      error.value = 'Erro ao buscar livros do amigo.'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch Friend's Book Details
  const fetchFriendBookDetails = async (bookId: string, friendId: string) => {
    error.value = null
    if (!userId.value) return null

    try {
      // Marcar que estamos vendo um livro do amigo
      setViewingFriend(friendId)

      // Buscar o livro na view específica de amigos
      const { data: book, error: bookError } = await supabase
        .from('friend_books_view')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', friendId)
        .single()

      if (bookError) {
        console.error('Erro ao buscar detalhes do livro do amigo:', bookError)
        throw bookError
      }

      if (book) {
        // Buscar as citações/frases favoritas do livro do amigo
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', friendId)

        if (quotesError) {
          console.warn('Erro ao buscar citações do livro do amigo:', quotesError)
          // Continuamos mesmo se não conseguirmos as citações
        }

        // Preparar arrays de citações e páginas
        const quoteTexts: string[] = []
        const quotePages: (number | null)[] = []

        if (quotes && Array.isArray(quotes)) {
          quotes.forEach((quote) => {
            quoteTexts.push(quote.text)
            quotePages.push(quote.page)
          })
        }

        // Formatar datas para exibição
        const formatDate = (dateStr: string | null): string | null => {
          if (!dateStr) return null
          const date = new Date(dateStr)
          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        }

        // Montar o objeto do livro com os detalhes necessários
        const mappedBook = {
          ...book,
          coverImage: book.cover_image_url,
          dataInicioLeitura: formatDate(book.started_reading_at),
          dataFinalLeitura: formatDate(book.finished_reading_at),
          quotes: quoteTexts,
          quotePages: quotePages,
          quotesData: quotes || [],
        }

        // Definir como livro selecionado
        selectedBook.value = mappedBook

        return selectedBook.value
      } else {
        error.value = 'Livro do amigo não encontrado.'
        console.error('Livro do amigo não encontrado')
        return null
      }
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do livro do amigo:', err)
      error.value = 'Erro ao buscar detalhes do livro do amigo.'
      return null
    }
  }

  // Fetch Details of a Specific Book
  const fetchBookDetails = async (bookId: string) => {
    error.value = null
    if (!userId.value) return

    try {
      // Buscar o livro no Supabase
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', userId.value)
        .single()

      if (bookError) throw bookError

      if (book) {
        // Buscar detalhes adicionais do Google se necessário
        let bookDetails = {}
        if (!book.description || !book.page_count || !book.genre) {
          bookDetails = await fetchBookDetailsFromGoogle(book.title, book.author)

          // Atualizar o livro no Supabase com os detalhes obtidos
          if (Object.keys(bookDetails).length > 0) {
            await supabase.from('books').update(bookDetails).eq('id', book.id)
          }
        }

        // Buscar frases/citações relacionadas a este livro
        const { data: quotes, error: quotesError } = await supabase
          .from('quotes')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', userId.value)

        if (quotesError) throw quotesError

        // Preparar arrays de citações e páginas
        const quoteTexts: string[] = []
        const quotePages: (number | null)[] = []

        if (quotes) {
          quotes.forEach((quote) => {
            quoteTexts.push(quote.text)
            quotePages.push(quote.page)
          })
        }

        // Converter datas ISO para formato brasileiro
        const formatDate = (dateStr: string | null): string | null => {
          if (!dateStr) return null
          const date = new Date(dateStr)
          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        }

        // Garantir que temos as propriedades necessárias
        const mappedBook = {
          ...book,
          coverImage: book.cover_image_url, // Para retrocompatibilidade
          ...bookDetails,
          quotes: quoteTexts,
          quotePages: quotePages,
          quotesData: quotes || [], // Manter os dados completos para referência

          // Mapear datas ISO para formato brasileiro (DD/MM/YYYY)
          dataInicioLeitura: formatDate(book.started_reading_at),
          dataFinalLeitura: formatDate(book.finished_reading_at),
        }

        // Adicionar a seleção atual
        selectedBook.value = mappedBook

        // Garantir que o status está definido
        if (selectedBook.value.status === undefined || selectedBook.value.status === null) {
          selectedBook.value.status = 0 // Definir como "Quero Ler" como padrão
          await supabase.from('books').update({ status: 0 }).eq('id', bookId)
        }

        return selectedBook.value
      } else {
        error.value = 'Livro não encontrado.'
        console.error('Livro não encontrado.')
        return null
      }
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do livro:', err)
      error.value = 'Erro ao buscar detalhes do livro.'
      return null
    }
  }

  // Add a Book
  const addBook = async (bookData: any) => {
    error.value = null

    try {
      // Verificar autenticação
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        error.value = 'Sessão expirada. Faça login novamente.'
        console.error('Sem sessão ativa no Supabase')
        throw new Error('Sem sessão ativa')
      }

      const currentUser = sessionData.session.user
      if (!currentUser) {
        error.value = 'Usuário não encontrado na sessão atual.'
        console.error('Usuário não encontrado na sessão')
        throw new Error('Usuário não encontrado')
      }

      // Buscar detalhes adicionais se necessário
      const bookDetails = await fetchBookDetailsFromGoogle(bookData.title, bookData.author)

      // Preparar o objeto com todos os dados do livro
      const bookToSave = {
        user_id: currentUser.id, // Usar ID diretamente da sessão
        title: bookData.title,
        author: bookData.author,
        cover_image_url: bookData.coverImage || bookData.cover_image_url,
        description: bookData.description || bookDetails.description,
        page_count: bookData.pageCount || bookData.page_count || bookDetails.page_count,
        genre: bookData.genre || bookDetails.genre,
        status: Number(bookData.status || 0),
        google_book_id: bookData.googleBookId || bookData.google_book_id,
        added_at: new Date().toISOString(),
        started_reading_at: bookData.dataInicioLeitura
          ? new Date(bookData.dataInicioLeitura.split('/').reverse().join('-')).toISOString()
          : null,
        finished_reading_at: bookData.dataFinalLeitura
          ? new Date(bookData.dataFinalLeitura.split('/').reverse().join('-')).toISOString()
          : null,
      }

      // Inserir no Supabase
      const { data, error: supabaseError } = await supabase
        .from('books')
        .insert([bookToSave])
        .select()

      if (supabaseError) {
        console.error('Erro do Supabase ao adicionar livro:', {
          código: supabaseError.code,
          mensagem: supabaseError.message,
          detalhes: supabaseError.details,
        })
        throw supabaseError
      }

      if (data && data[0]) {
        // Adicionar o livro à lista local
        books.value.push(data[0])
        return data[0].id
      }
    } catch (err: any) {
      console.error('Erro ao adicionar livro:', err)
      error.value = `Erro ao adicionar livro: ${err.message || JSON.stringify(err)}`
      throw err
    }
  }

  // Add a Quote to a Book
  const addPhase = async (bookId: string, phaseData: { text: string; page: number | null }) => {
    error.value = null
    if (!userId.value) return

    try {
      // Verificar se já existe uma citação igual para evitar duplicatas
      const { data: existingQuotes, error: checkError } = await supabase
        .from('quotes')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId.value)
        .eq('text', phaseData.text)

      if (checkError) {
        console.error('Erro ao verificar citações existentes:', checkError)
      } else if (existingQuotes && existingQuotes.length > 0) {
        return existingQuotes[0].id
      }

      // Inserir a citação no Supabase apenas se não existir
      const { data, error: supabaseError } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: userId.value,
            book_id: bookId,
            text: phaseData.text,
            page: phaseData.page,
            added_at: new Date().toISOString(),
          },
        ])
        .select()

      if (supabaseError) {
        console.error('Erro completo ao inserir citação:', supabaseError)
        throw supabaseError
      }

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value && selectedBook.value.id === bookId) {
        if (!selectedBook.value.quotes) selectedBook.value.quotes = []
        if (!selectedBook.value.quotePages) selectedBook.value.quotePages = []
        if (!selectedBook.value.quotesData) selectedBook.value.quotesData = []

        // Evitar duplicação no front-end - verificar se a frase já existe nos arrays locais
        const existingIndex = selectedBook.value.quotes.findIndex((q) => q === phaseData.text)
        if (existingIndex === -1) {
          selectedBook.value.quotes.push(phaseData.text)
          selectedBook.value.quotePages.push(phaseData.page)

          if (data && data[0]) {
            selectedBook.value.quotesData.push(data[0])
          }
        }
      }

      return data ? data[0].id : null
    } catch (err: any) {
      console.error('Erro ao adicionar frase:', err)
      error.value = 'Erro ao adicionar frase.'
      throw err
    }
  }

  // Edit a Quote
  const editPhase = async (phaseId: string, phaseData: { text: string; page: number | null }) => {
    error.value = null
    if (!userId.value) return

    try {
      // Atualizar a citação no Supabase
      const { data, error: supabaseError } = await supabase
        .from('quotes')
        .update({
          text: phaseData.text,
          page: phaseData.page,
        })
        .eq('id', phaseId)
        .eq('user_id', userId.value)
        .select()

      if (supabaseError) throw supabaseError

      // Atualizar o livro selecionado se necessário
      if (selectedBook.value && data && data[0]) {
        const bookId = data[0].book_id
        if (selectedBook.value.id === bookId) {
          // Encontrar o índice da citação nos arrays
          const quoteIndex = selectedBook.value.quotesData.findIndex(
            (quote: any) => quote.id === phaseId,
          )

          if (quoteIndex !== -1) {
            // Atualizar os arrays
            selectedBook.value.quotes[quoteIndex] = phaseData.text
            selectedBook.value.quotePages[quoteIndex] = phaseData.page
            selectedBook.value.quotesData[quoteIndex] = data[0]
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao editar frase:', err)
      error.value = 'Erro ao editar frase.'
    }
  }

  // Remove a Quote
  const removePhase = async (phaseId: string) => {
    error.value = null
    if (!userId.value) return

    try {
      // Buscar a citação primeiro para ter os detalhes
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', phaseId)
        .single()

      // Excluir a citação do Supabase
      const { error: supabaseError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', phaseId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value && quoteData && selectedBook.value.id === quoteData.book_id) {
        // Encontrar o índice da citação nos arrays
        const quoteIndex = selectedBook.value.quotesData.findIndex(
          (quote: any) => quote.id === phaseId,
        )

        if (quoteIndex !== -1) {
          // Remover dos arrays
          selectedBook.value.quotes.splice(quoteIndex, 1)
          selectedBook.value.quotePages.splice(quoteIndex, 1)
          selectedBook.value.quotesData.splice(quoteIndex, 1)
        }
      }
    } catch (err: any) {
      console.error('Erro ao remover frase:', err)
      error.value = 'Erro ao remover frase.'
    }
  }

  // Delete a Book
  const deleteBook = async (bookId: string) => {
    error.value = null
    if (!userId.value) return

    try {
      // Excluir o livro do Supabase
      const { error: supabaseError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Remover da lista local
      books.value = books.value.filter((book) => book.id !== bookId)

      // Limpar o livro selecionado se for o mesmo
      if (selectedBook.value && selectedBook.value.id === bookId) {
        selectedBook.value = null
      }
    } catch (err: any) {
      console.error('Erro ao deletar livro:', err)
      error.value = 'Erro ao deletar livro.'
    }
  }

  // Fetch Book Details from Google Books API
  const fetchBookDetailsFromGoogle = async (title: string, author: string) => {
    try {
      // Criar uma chave de cache única para esta combinação de título e autor
      const cacheKey = `${title}|${author}`.toLowerCase()

      // Verificar se já temos esta busca em cache
      if (googleBooksCache.has(cacheKey)) {
        return googleBooksCache.get(cacheKey)
      }

      // Se não está em cache, fazer a requisição à API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`,
      )

      const data = await response.json()
      const result = {
        description: '',
        page_count: 0,
        genre: '',
      }

      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo
        result.description = bookInfo.description || ''
        result.page_count = bookInfo.pageCount || 0
        result.genre = bookInfo.categories ? bookInfo.categories[0] : ''
      }

      // Salvar no cache para futuras consultas
      googleBooksCache.set(cacheKey, result)
      return result
    } catch (err: any) {
      console.error('[Google Books] Erro ao buscar detalhes:', err)
      return {
        description: '',
        page_count: 0,
        genre: '',
      }
    }
  }

  // Update Reading Status
  const updateReadingStatus = async (bookId: string, status: ReadingStatus) => {
    error.value = null
    if (!userId.value) return

    try {
      const updateData: any = { status }

      // Adicionar datas de início/conclusão conforme o status
      const book = books.value.find((b) => b.id === bookId)
      if (status === ReadingStatus.READING && !book?.started_reading_at) {
        updateData.started_reading_at = new Date().toISOString()
      }
      if (status === ReadingStatus.COMPLETED && !book?.finished_reading_at) {
        updateData.finished_reading_at = new Date().toISOString()
      }

      // Atualizar no Supabase
      const { error: supabaseError } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Atualizar estado local
      const bookIndex = books.value.findIndex((book) => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], ...updateData }
      }

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, ...updateData }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status do livro:', err)
      error.value = 'Erro ao atualizar status do livro.'
    }
  }

  // Update Book Rating
  const updateBookRating = async (bookId: string, rating: number) => {
    error.value = null
    if (!userId.value) return

    try {
      // Atualizar no Supabase
      const { error: supabaseError } = await supabase
        .from('books')
        .update({ rating })
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Atualizar estado local
      const bookIndex = books.value.findIndex((book) => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], rating }
      }

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, rating }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar avaliação do livro:', err)
      error.value = 'Erro ao atualizar avaliação do livro.'
    }
  }

  // Update Reading Progress
  const updateReadingProgress = async (bookId: string, current_page: number) => {
    error.value = null
    if (!userId.value) return

    try {
      // Atualizar no Supabase
      const { error: supabaseError } = await supabase
        .from('books')
        .update({ current_page })
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Atualizar estado local
      const bookIndex = books.value.findIndex((book) => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], current_page }
      }

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, current_page }
      }

      // Se a página atual for igual ao total de páginas, marcar como concluído automaticamente
      const book = books.value.find((book) => book.id === bookId)
      if (book && book.page_count && current_page === book.page_count) {
        await updateReadingStatus(bookId, ReadingStatus.COMPLETED)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar progresso de leitura:', err)
      error.value = 'Erro ao atualizar progresso de leitura.'
    }
  }

  // Update Book Notes
  const updateBookNotes = async (bookId: string, notes: string) => {
    error.value = null
    if (!userId.value) return

    try {
      // Atualizar no Supabase
      const { error: supabaseError } = await supabase
        .from('books')
        .update({ notes })
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // Atualizar estado local
      const bookIndex = books.value.findIndex((book) => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], notes }
      }

      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, notes }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar notas do livro:', err)
      error.value = 'Erro ao atualizar notas do livro.'
    }
  }

  // Em stores/useBookshelfStore.ts

  // Generic Update Book Method
  const updateBook = async (bookId: string, updateData: any) => {
    error.value = null
    if (!userId.value) return

    try {
      // Atualizar no Supabase (esta parte já estava correta)
      const { error: supabaseError } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('user_id', userId.value)

      if (supabaseError) throw supabaseError

      // --- LÓGICA DE ATUALIZAÇÃO LOCAL CORRIGIDA ---
      const bookIndex = books.value.findIndex((book) => book.id === bookId)
      if (bookIndex !== -1) {
        // Mescla o livro antigo com os novos dados para não perder nenhuma propriedade
        const updatedBook = { ...books.value[bookIndex], ...updateData }

        // Formata as datas para exibição, se elas foram atualizadas
        if (updateData.started_reading_at) {
          updatedBook.dataInicioLeitura = formatDateForStorage(updateData.started_reading_at)
        }
        if (updateData.finished_reading_at) {
          updatedBook.dataFinalLeitura = formatDateForStorage(updateData.finished_reading_at)
        }

        // Substitui o livro na lista para garantir a reatividade
        books.value.splice(bookIndex, 1, updatedBook)

        // Atualiza o livro selecionado se for o mesmo
        if (selectedBook.value?.id === bookId) {
          selectedBook.value = updatedBook
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar livro:', err)
      error.value = 'Erro ao atualizar livro.'
      throw err
    }
  }

  // Adicione esta função auxiliar dentro do seu defineStore, se ela não existir
  const formatDateForStorage = (date: Date | string | null | undefined): string => {
    if (!date) return ''
    const dateObj = new Date(date)
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
  }

  // Fetch Friend's Quotes
  const fetchFriendQuotes = async (friendId: string) => {
    error.value = null
    if (!userId.value) return []

    try {
      // Buscar as citações na view específica de citações de amigos
      const { data, error: quotesError } = await supabase
        .from('friend_quotes_view')
        .select('*')
        .eq('user_id', friendId)
        .order('added_at', { ascending: false })

      if (quotesError) {
        console.error('Erro ao buscar citações do amigo:', quotesError)

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('quotes')
          .select('*, books(title, author, cover_image_url)')
          .eq('user_id', friendId)
          .order('added_at', { ascending: false })

        if (fallbackError) {
          console.error('Erro ao buscar citações diretamente:', fallbackError)
          return []
        }

        return fallbackData || []
      }

      return data || []
    } catch (err: any) {
      console.error('Erro ao buscar citações do amigo:', err)
      error.value = 'Erro ao buscar citações do amigo.'
      return []
    }
  }

  return {
    books: currentBooks, // Exportamos currentBooks em vez de books diretamente
    friendBooks,
    booksByStatus,
    selectedBook,
    isLoading,
    isAuthenticated,
    error,
    viewingFriendId,
    setViewingFriend,
    fetchBooks,
    fetchFriendBooks,
    fetchBookDetails,
    fetchFriendBookDetails,
    fetchFriendQuotes, // Exportando o novo método
    addBook,
    addPhase,
    editPhase,
    removePhase,
    deleteBook,
    updateReadingStatus,
    updateBookRating,
    updateReadingProgress,
    updateBookNotes,
    updateBook,
    get user() {
      return userId.value ? { id: userId.value } : null
    },
  }
})
