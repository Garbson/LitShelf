// src/stores/useBookshelfStore.ts
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '../firebase.ts'

const auth = getAuth()

// Interface para o Livro
interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description?: string; // Adicionado
  pageCount?: number; // Adicionado
  genre?: string; // Adicionado
  // ... outras propriedades do livro
}

// Interface para o Usuário
interface User {
  uid: string;
  name: string;
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

  // Ações

  // Fetch User Data
  const fetchUser = async () => {
    error.value = null
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          console.log('Usuário recuperado:', userSnap.data())
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
        console.log('Usuário autenticado:', user.value)
        await fetchUser()
        await fetchBooks() // Now fetchBooks is called after authentication
      } else {
        user.value = null
        console.log('Nenhum usuário autenticado.')
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
      console.log('user.value.uid:', user.value.uid)
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
      console.log('Livros recuperados:', books.value)
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
        if (!bookData.description || !bookData.pageCount || !bookData.genre) {
          const bookDetails = await fetchBookDetailsFromGoogle(bookData.title, bookData.author)
          selectedBook.value = { id: bookSnap.id, ...bookData, ...bookDetails }
          await updateDoc(bookRef, bookDetails)
        } else {
          selectedBook.value = { id: bookSnap.id, ...bookData }
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
  const teste = async (bookData: { title: string; author: string; coverImage: string }) => {
    error.value = null
    console.log('teste bookData:', bookData)
    console.log('teste user:', user.value)
    if (!user.value) return
    try {
      console.log('teste user:', user.value)
      const booksRef = collection(db, `users/${user.value.uid}/books`)
      const bookDetails = await fetchBookDetailsFromGoogle(bookData.title, bookData.author)
      const docRef = await addDoc(booksRef, {
        ...bookData,
        ...bookDetails,
        addedAt: new Date(),
      })
      books.value.push({ id: docRef.id, ...bookData, ...bookDetails })
    } catch (err: any) {
      console.error('Erro ao adicionar livro:', err)
      error.value = 'Erro ao adicionar livro.'
    }
  }

  // Add a Phase to a Book
  const addPhase = async (bookId: string, phaseData: { text: string; page: number }) => {
    error.value = null
    if (!user.value) return
    try {
      const phasesRef = collection(db, `users/${user.value.uid}/books/${bookId}/phases`)
      await addDoc(phasesRef, {
        ...phaseData,
        addedAt: new Date(),
      })
      if (selectedBook.value && selectedBook.value.id === bookId) {
        if (!selectedBook.value.phases) selectedBook.value.phases = []
        selectedBook.value.phases.push(phaseData)
      }
    } catch (err: any) {
      console.error('Erro ao adicionar frase:', err)
      error.value = 'Erro ao adicionar frase.'
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

  return {
    user,
    books,
    selectedBook,
    isLoading,
    isAuthenticated,
    error,
    fetchUser,
    fetchBooks,
    fetchBookDetails,
    teste,
    addPhase,
    deleteBook,
    initAuthListener,
  }
})
