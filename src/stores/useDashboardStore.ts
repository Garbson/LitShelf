// src/stores/useDashboardStore.ts
import { defineStore } from "pinia";
import { useBookshelfStore } from "./useBookshelfStore";
import { computed, ref } from "vue";
import { useAuthStore } from "./useAuthStore";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  quotes: string[];
  genre?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const bookshelfStore = useBookshelfStore();
  const authStore = useAuthStore();
  const books = computed(() => bookshelfStore.books);

  const totalBooksRead = computed(() => {
    return books.value.filter((book) => book.endDate).length;
  });

  const totalFavoriteQuotes = computed(() => {
    let count = 0;
    books.value.forEach((book) => {
      count += book.quotes.length;
    });
    return count;
  });

  const genresRead = computed(() => {
    const genreCounts: { [key: string]: number } = {};
    books.value.forEach((book) => {
      if (book.genre) {
        genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
      }
    });
    return genreCounts;
  });

  const averageReadingTime = computed(() => {
    let totalTime = 0;
    let completedBooks = 0;

    books.value.forEach((book) => {
      if (book.startDate && book.endDate) {
        const start = new Date(book.startDate).getTime();
        const end = new Date(book.endDate).getTime();
        totalTime += end - start;
        completedBooks++;
      }
    });

    if (completedBooks === 0) {
      return 0;
    }

    const averageTimeInDays = totalTime / completedBooks / (1000 * 60 * 60 * 24);
    return Math.round(averageTimeInDays);
  });

  const booksInProgress = computed(() => {
    return books.value.filter((book) => !book.endDate);
  });

  // Ranking de Leitura (Dados Fictícios por enquanto)
  const readingRanking = computed(() => {
    // Aqui você implementaria a lógica para obter o ranking real
    // Por enquanto, vamos usar dados fictícios
    return [
      { name: authStore.user?.email || "Você", booksRead: totalBooksRead.value },
      { name: "Amigo 1", booksRead: 12 },
      { name: "Amigo 2", booksRead: 10 },
      { name: "Amigo 3", booksRead: 8 },
      { name: "Amigo 4", booksRead: 5 },
    ];
  });

  // Visitantes da Estante (Dados Fictícios por enquanto)
  const bookshelfVisitors = computed(() => {
    // Aqui você implementaria a lógica para obter os visitantes reais
    // Por enquanto, vamos usar dados fictícios
    return ["Visitante 1", "Visitante 2", "Visitante 3"];
  });

  // Último Livro Lido
  const lastBookRead = computed(() => {
    const completedBooks = books.value.filter((book) => book.endDate);
    if (completedBooks.length > 0) {
      return completedBooks.reduce((a, b) => (a.endDate! > b.endDate! ? a : b));
    }
    return null;
  });

  // Última Frase Adicionada
  const lastQuoteAdded = computed(() => {
    const allQuotes = books.value.flatMap((book) => book.quotes);
    if (allQuotes.length > 0) {
      return allQuotes[allQuotes.length - 1];
    }
    return null;
  });

  const fetchDashboardData = async () => {
    // No need to fetch data here, it's all computed from bookshelfStore.books
  };

  return {
    totalBooksRead,
    totalFavoriteQuotes,
    genresRead,
    averageReadingTime,
    booksInProgress,
    readingRanking,
    bookshelfVisitors,
    lastBookRead,
    lastQuoteAdded,
    fetchDashboardData,
  };
});
