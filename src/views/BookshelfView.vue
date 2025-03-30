<template>
  <div class="bookshelf-container fill-height d-flex justify-center align-center">
    <v-card elevation="0" class="bg-transparent pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-8 text-center text-text bookshelf-title">
        <span class="title-highlight">📚 Minha Estante Digital</span>
      </h1>

      <!-- Mensagem de carregamento -->
      <v-progress-linear
        v-if="bookshelfStore.isLoading"
        indeterminate
        color="accent"
        class="mb-4"
      />

      <!-- Mensagem de erro -->
      <v-alert
        v-if="bookshelfStore.error"
        type="error"
        class="mb-4 text-text"
        color="error"
      >
        {{ bookshelfStore.error }}
      </v-alert>

      <!-- Lista de livros -->
      <v-row v-if="computedBooks.length" justify="center" align="start" dense>
        <v-col
          v-for="book in computedBooks"
          :key="book.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="d-flex justify-center"
          v-motion
          :initial="{ opacity: 0, y: 50 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 100 * book.index } }"
        >
          <v-card
            class="ma-4 bg-primary rounded-xl book-card"
            width="280"
            elevation="6"
            @click="goToBookDetails(book.id)"
          >
            <div class="book-cover-container">
              <v-img
                :src="book.coverImage"
                :alt="book.title"
                contain
                class="book-cover rounded-xl"
              />
            </div>
            <v-card-title
              class="text-subtitle-1 font-weight-bold text-background text-truncate book-title"
            >
              {{ book.title }}
            </v-card-title>
            <v-card-subtitle
              class="text-caption text-background text-truncate book-author"
            >
              {{ book.author }}
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- Mensagem de nenhum livro -->
      <p
        v-else-if="!bookshelfStore.isLoading && !bookshelfStore.error"
        class="text-text text-center text-h6"
      >
        Nenhum livro encontrado na sua estante.
      </p>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, reactive } from "vue";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useRouter } from "vue-router";

const bookshelfStore = useBookshelfStore();
const computedBooks = computed(() => {
  return bookshelfStore.books.map((book, index) =>
    reactive({ ...book, isHovered: false, index })
  );
});
const router = useRouter();

onMounted(() => {
  bookshelfStore.initAuthListener();
});

const goToBookDetails = (bookId: string) => {
  router.push(`/book/${bookId}`);
};
</script>

<style scoped>
.bookshelf-container {
  width: 100%;
  background: linear-gradient(45deg, #a19f9f, #6d5e5e, #f2bd6f);
  background-size: 300% 300%;
  animation: colorAnimation 10s ease-in-out infinite;
  padding: 1rem;
}

.book-card {
  cursor: pointer;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  /* Adicionando uma borda sutil */
  padding: 0.5rem;
  /* Adicionando um padding */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* Adicionando uma sombra mais suave */
}

.book-card:hover {
  transform: scale(1.03) rotate(0.5deg);
  /* Ajustando o efeito de hover */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  /* Ajustando a sombra no hover */
}

.bookshelf-title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-highlight {
  background: linear-gradient(to right, #d7ba80, #443f3f, #f5f4f2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.book-cover-container {
  width: 100%;
  height: 250px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-in-out;
}

.book-title {
  font-size: 1rem;
  line-height: 1.2rem;
}

.book-author {
  font-size: 0.8rem;
  line-height: 1rem;
}

@keyframes colorAnimation {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}
</style>
