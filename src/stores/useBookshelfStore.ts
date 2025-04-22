// src/stores/useBookshelfStore.ts
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '../firebase.ts'

const auth = getAuth()

// Enumeração para Status de Leitura
export enum ReadingStatus {
  WISHLIST = 0, // Quero ler
  COMPLETED = 1, // Já li
  READING = 2    // Estou lendo
}

// Interface para o Livro
interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description?: string;
  pageCount?: number;
  genre?: string;
  status?: ReadingStatus | number; // Status de leitura como valor numérico
  rating?: number; // Avaliação de 1-5 estrelas
  currentPage?: number; // Página atual (para livros em leitura)
  dateStarted?: Date; // Data de início da leitura
  dateCompleted?: Date; // Data de conclusão da leitura
  notes?: string; // Notas pessoais sobre o livro
  // ... outras propriedades do livro
}

// Interface para o Usuário
interface User {
  uid: string;
  name: string;
  friends?: string[]; // IDs dos amigos
}

export const useBookshelfStore = defineStore('bookshelf', () => {
  // Estado
  const user = ref<User | null>(null)
  const books = ref<Book[]>([])
  const selectedBook = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  
  // Filtragem de livros por status
  const booksByStatus = computed(() => {
    const result = {
      [ReadingStatus.WISHLIST]: [] as Book[],
      [ReadingStatus.READING]: [] as Book[],
      [ReadingStatus.COMPLETED]: [] as Book[],
      all: [] as Book[]
    }
    
    books.value.forEach(book => {
      if (book.status) {
        result[book.status].push(book)
      } else {
        // Se não tiver status, considere como "wishlist"
        result[ReadingStatus.WISHLIST].push(book)
      }
    })
    
    result.all = books.value
    return result
  })

  // Fetch User Data
  const fetchUser = async () => {
    error.value = null
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          user.value = { uid: firebaseUser.uid, ...userSnap.data() } as User
        } else {
          error.value = 'Usuário não encontrado no banco de dados.'
        }
      } catch (err: any) {
        console.error('Erro ao buscar usuário:', err)
        error.value = 'Erro ao buscar usuário.'
      }
    }
  }

  // Initialize Authentication Listener
  const initAuthListener = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
        }

        await fetchUser()
        await fetchBooks() // Now fetchBooks is called after authentication
      } else {
        user.value = null
     
        books.value = [] // Clear books when logged out
      }
    })
  }

  // Fetch Books for the Logged User
  const fetchBooks = async () => {
    if (!user.value) {
      console.warn('Tentativa de buscar livros sem usuário autenticado.')
      return
    }
    isLoading.value = true
    error.value = null
    try {

      const booksQuery = collection(db, `users/${user.value.uid}/books`)
      const booksSnapshot = await getDocs(booksQuery)
      const fetchedBooks = booksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[]

      // Fetch additional data for each book
      const booksWithDetails = await Promise.all(
        fetchedBooks.map(async (book) => {
          if (!book.description || !book.pageCount || !book.genre) {
            const bookDetails = await fetchBookDetailsFromGoogle(book.title, book.author)
            return { ...book, ...bookDetails }
          }
          return book
        })
      )

      books.value = booksWithDetails

    } catch (err: any) {
      console.error('Erro ao buscar livros:', err)
      error.value = 'Erro ao buscar livros.'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch Details of a Specific Book
  const fetchBookDetails = async (bookId: string) => {
    error.value = null
    if (!user.value) return
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      const bookSnap = await getDoc(bookRef)
      if (bookSnap.exists()) {
        const bookData = bookSnap.data() as Book
        
        // Buscar os detalhes do Google se necessário
        let bookDetails = {}
        if (!bookData.description || !bookData.pageCount || !bookData.genre) {
          bookDetails = await fetchBookDetailsFromGoogle(bookData.title, bookData.author)
          await updateDoc(bookRef, bookDetails)
        }
        
        // Buscar frases da subcoleção
        const quotes: string[] = []
        const quotePages: (number | null)[] = []
        const phasesQuery = collection(db, `users/${user.value.uid}/books/${bookId}/phases`)
        const phasesSnapshot = await getDocs(phasesQuery)
        
        phasesSnapshot.forEach((phaseDoc) => {
          const phaseData = phaseDoc.data()
          if (phaseData.text) {
            quotes.push(phaseData.text)
            quotePages.push(phaseData.page || null)
          }
        })
        
        // Combinar todos os dados
        selectedBook.value = { 
          id: bookSnap.id, 
          ...bookData, 
          ...bookDetails,
          quotes: quotes,
          quotePages: quotePages
        }
        
        // Garantir que o status está definido
        if (selectedBook.value.status === undefined || selectedBook.value.status === null) {
          selectedBook.value.status = 0 // Definir como "Quero Ler" como padrão
          await updateDoc(bookRef, { status: 0 })
        }
        
    
      } else {
        error.value = 'Livro não encontrado.'
        console.error('Livro não encontrado.')
      }
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do livro:', err)
      error.value = 'Erro ao buscar detalhes do livro.'
    }
  }

  // Add a Book
  const addBook = async (bookData: any) => {
    error.value = null;

    if (!user.value) return;
    
    try {

      const booksRef = collection(db, `users/${user.value.uid}/books`);
      
      // Buscar detalhes adicionais se necessário
      const bookDetails = await fetchBookDetailsFromGoogle(bookData.title, bookData.author);
      
      // Preparar o objeto com todos os dados do livro
      const bookToSave = {
        ...bookData,
        ...bookDetails,
        addedAt: new Date()
      };
      
      // Converter valores de status para garantir consistência
      bookToSave.status = Number(bookToSave.status || 0);
      

      const docRef = await addDoc(booksRef, bookToSave);
      
      // Adicionar o livro à lista local
      const newBook = { 
        id: docRef.id,
        ...bookToSave
      };
      
      books.value.push(newBook);
  
    } catch (err: any) {
      console.error('Erro ao adicionar livro:', err);
      error.value = 'Erro ao adicionar livro.';
    }
  }

  // Add a Phase to a Book
  const addPhase = async (bookId: string, phaseData: { text: string; page: number | null }) => {
    error.value = null
    if (!user.value) return
    try {
      const phasesRef = collection(db, `users/${user.value.uid}/books/${bookId}/phases`)
      const docRef = await addDoc(phasesRef, {
        ...phaseData,
        addedAt: new Date(),
      })
      if (selectedBook.value && selectedBook.value.id === bookId) {
        if (!selectedBook.value.quotes) selectedBook.value.quotes = []
        if (!selectedBook.value.quotePages) selectedBook.value.quotePages = []
        selectedBook.value.quotes.push(phaseData.text)
        selectedBook.value.quotePages.push(phaseData.page)
      }
    } catch (err: any) {
      console.error('Erro ao adicionar frase:', err)
      error.value = 'Erro ao adicionar frase.'
    }
  }

  // Edit a Phase
  const editPhase = async (bookId: string, phaseId: string, phaseData: { text: string; page: number | null }) => {
    error.value = null
    if (!user.value) return
    try {
      const phaseRef = doc(db, `users/${user.value.uid}/books/${bookId}/phases/${phaseId}`)
      await updateDoc(phaseRef, {
        text: phaseData.text,
        page: phaseData.page,
        updatedAt: new Date(),
      })
      
      if (selectedBook.value && selectedBook.value.id === bookId) {
        const index = selectedBook.value.quotes.findIndex((quote: string) => quote === phaseData.text)
        if (index !== -1) {
          selectedBook.value.quotes[index] = phaseData.text
          if (!selectedBook.value.quotePages) selectedBook.value.quotePages = []
          selectedBook.value.quotePages[index] = phaseData.page
        }
      }
    } catch (err: any) {
      console.error('Erro ao editar frase:', err)
      error.value = 'Erro ao editar frase.'
    }
  }

  // Remove a Phase
  const removePhase = async (bookId: string, phaseId: string, quoteText: string) => {
    error.value = null
    if (!user.value) return
    try {
      const phaseRef = doc(db, `users/${user.value.uid}/books/${bookId}/phases/${phaseId}`)
      await deleteDoc(phaseRef)
      
      if (selectedBook.value && selectedBook.value.id === bookId) {
        const index = selectedBook.value.quotes.findIndex((quote: string) => quote === quoteText)
        if (index !== -1) {
          selectedBook.value.quotes.splice(index, 1)
          if (selectedBook.value.quotePages) {
            selectedBook.value.quotePages.splice(index, 1)
          }
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
    if (!user.value) return
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await deleteDoc(bookRef)
      books.value = books.value.filter((book) => book.id !== bookId)
    } catch (err: any) {
      console.error('Erro ao deletar livro:', err)
      error.value = 'Erro ao deletar livro.'
    }
  }

  // Fetch Book Details from Google Books API
  const fetchBookDetailsFromGoogle = async (title: string, author: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${title}+inauthor:${author}`
      )
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo
        return {
          description: bookInfo.description || '',
          pageCount: bookInfo.pageCount || 0,
          genre: bookInfo.categories ? bookInfo.categories[0] : '',
        }
      } else {
        return {
          description: '',
          pageCount: 0,
          genre: '',
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do livro na API do Google:', err)
      return {
        description: '',
        pageCount: 0,
        genre: '',
      }
    }
  }

  // Atualizar status de leitura de um livro
  const updateReadingStatus = async (bookId: string, status: ReadingStatus) => {
    error.value = null
    if (!user.value) return
    
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      const updateData: any = { status }
      
      // Adicionar datas de início/conclusão conforme o status
      if (status === ReadingStatus.READING && !books.value.find(b => b.id === bookId)?.dateStarted) {
        updateData.dateStarted = new Date()
      }
      if (status === ReadingStatus.COMPLETED && !books.value.find(b => b.id === bookId)?.dateCompleted) {
        updateData.dateCompleted = new Date()
      }
      
      await updateDoc(bookRef, updateData)
      
      // Atualizar estado local
      const bookIndex = books.value.findIndex(book => book.id === bookId)
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
  
  // Atualizar avaliação de um livro
  const updateBookRating = async (bookId: string, rating: number) => {
    error.value = null
    if (!user.value) return
    
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await updateDoc(bookRef, { rating })
      
      // Atualizar estado local
      const bookIndex = books.value.findIndex(book => book.id === bookId)
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
  
  // Atualizar progresso de leitura (página atual)
  const updateReadingProgress = async (bookId: string, currentPage: number) => {
    error.value = null
    if (!user.value) return
    
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await updateDoc(bookRef, { currentPage })
      
      // Atualizar estado local
      const bookIndex = books.value.findIndex(book => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], currentPage }
      }
      
      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, currentPage }
      }
      
      // Se a página atual for igual ao total de páginas, marcar como concluído automaticamente
      const book = books.value.find(book => book.id === bookId)
      if (book && book.pageCount && currentPage === book.pageCount) {
        await updateReadingStatus(bookId, ReadingStatus.COMPLETED)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar progresso de leitura:', err)
      error.value = 'Erro ao atualizar progresso de leitura.'
    }
  }
  
  // Adicionar notas a um livro
  const updateBookNotes = async (bookId: string, notes: string) => {
    error.value = null
    if (!user.value) return
    
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await updateDoc(bookRef, { notes })
      
      // Atualizar estado local
      const bookIndex = books.value.findIndex(book => book.id === bookId)
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

  // Método genérico para atualizar qualquer campo de um livro
  const updateBook = async (bookId: string, updateData: any) => {
    error.value = null
    if (!user.value) return
    
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await updateDoc(bookRef, updateData)
      
      // Atualizar estado local na lista de books
      const bookIndex = books.value.findIndex(book => book.id === bookId)
      if (bookIndex !== -1) {
        books.value[bookIndex] = { ...books.value[bookIndex], ...updateData }
      }
      
      // Atualizar o livro selecionado se for o mesmo
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = { ...selectedBook.value, ...updateData }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar livro:', err)
      error.value = 'Erro ao atualizar livro.'
      throw err
    }
  }

  return {
    user,
    books,
    booksByStatus,
    selectedBook,
    isLoading,
    isAuthenticated,
    error,
    fetchUser,
    fetchBooks,
    fetchBookDetails,
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
    initAuthListener,
  }
})
