// stores/useBookshelfStore.ts
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db } from '../firebase'

const auth = getAuth()

export const useBookshelfStore = defineStore('bookshelf', () => {
  // Estado
  const user = ref<null | { uid: string; name: string }>(null)

  const books = ref<any[]>([])
  const selectedBook = ref<any>(null)
  const isLoading = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value)

  // Ações

  // Fetch User Data
  const fetchUser = async () => {
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        console.log('Usuário recuperado:', userSnap.data()) // Verificar os dados recuperados
        user.value = { uid: firebaseUser.uid, ...userSnap.data() } as typeof user.value
      }
    }
  }

  const initAuthListener = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
        }
        console.log('Usuário autenticado:', user.value)
      } else {
        user.value = null
        console.log('Nenhum usuário autenticado.')
      }
    })
  }

  // Fetch Books for the Logged User
  const fetchBooks = async () => {
    if (!user.value) return
    isLoading.value = true
    try {
      const booksQuery = collection(db, `users/${user.value.uid}/books`)
      const booksSnapshot = await getDocs(booksQuery)
      books.value = booksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Erro ao buscar livros:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch Details of a Specific Book
  const fetchBookDetails = async (bookId: string) => {
    if (!user.value) return
    const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
    const bookSnap = await getDoc(bookRef)
    if (bookSnap.exists()) {
      selectedBook.value = { id: bookSnap.id, ...bookSnap.data() }
    } else {
      console.error('Livro não encontrado.')
    }
  }

  // Add a Book
  const teste = async (bookData: { title: string; author: string; coverImage: string }) => {
    console.log('teste bookData:', bookData)
    console.log('teste user:', user.value)
    if (!user.value) return
    try {
      console.log('teste user:', user.value)
      const booksRef = collection(db, `users/${user.value.uid}/books`)
      const docRef = await addDoc(booksRef, {
        ...bookData,
        addedAt: new Date(),
      })
      books.value.push({ id: docRef.id, ...bookData })
    } catch (error) {
      console.error('Erro ao adicionar livro:', error)
    }
  }

  // Add a Phase to a Book
  const addPhase = async (bookId: string, phaseData: { text: string; page: number }) => {
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
    } catch (error) {
      console.error('Erro ao adicionar frase:', error)
    }
  }

  // Delete a Book
  const deleteBook = async (bookId: string) => {
    if (!user.value) return
    try {
      const bookRef = doc(db, `users/${user.value.uid}/books/${bookId}`)
      await deleteDoc(bookRef)
      books.value = books.value.filter((book) => book.id !== bookId)
    } catch (error) {
      console.error('Erro ao deletar livro:', error)
    }
  }

  return {
    user,
    books,
    selectedBook,
    isLoading,
    isAuthenticated,
    fetchUser,
    fetchBooks,
    fetchBookDetails,
    teste,
    addPhase,
    deleteBook,
    initAuthListener,
  }
})
