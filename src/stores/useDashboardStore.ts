// stores/useDashboardStore.ts
import { getAuth } from 'firebase/auth'
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const auth = getAuth()
  const db = getFirestore()

  const totalBooksRead = ref(0)
  const totalFavoriteQuotes = ref(0)

  const fetchDashboardData = async () => {
    const user = auth.currentUser
    if (!user) return

    try {
      const booksQuery = query(collection(db, 'books'), where('userId', '==', user.uid))
      const booksSnapshot = await getDocs(booksQuery)

      totalBooksRead.value = booksSnapshot.size

      let quotesCount = 0
      booksSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.quotes) {
          quotesCount += data.quotes.length
        }
      })

      totalFavoriteQuotes.value = quotesCount
    } catch (error) {
      console.error('Erro ao buscar dados do Firestore:', error)
    }
  }

  return {
    totalBooksRead,
    totalFavoriteQuotes,
    fetchDashboardData,
  }
})
