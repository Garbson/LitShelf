import { defineStore } from "pinia";
import { useBookshelfStore } from "./useBookshelfStore";
import { computed, ref } from "vue";

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  quotes: string[];
  genre?: string; // Add genre property
  startDate?: Date; // Add start date
  endDate?: Date; // Add end date
}

export const useDashboardStore = defineStore("dashboard", () => {
  const bookshelfStore = useBookshelfStore();
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

  const fetchDashboardData = async () => {
    // No need to fetch data here, it's all computed from bookshelfStore.books
  };

  return {
    totalBooksRead,
    totalFavoriteQuotes,
    genresRead,
    averageReadingTime,
    booksInProgress,
    fetchDashboardData,
  };
});
