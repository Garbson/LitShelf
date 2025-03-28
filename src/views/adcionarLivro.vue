<template>
  <v-container class="d-flex flex-column align-center justify-start mt-10">
    
      <!-- Título -->
      <h2 class="text-h5 mb-4">Pesquisar Livros</h2>

      <!-- Campo de busca + botão -->
      <v-row class="d-flex justify-center" style="max-width: 600px; width: 100%">
        <v-col cols="12">
          <v-text-field
            v-model="searchQuery"
            label="Digite o nome do livro ou autor"
            outlined
            dense
            clearable
            @keyup.enter="fetchBooks"
          />
          <v-btn @click="fetchBooks" color="primary" block class="mt-2">
            Pesquisar
          </v-btn>
        </v-col>
      </v-row>

      <!-- Resultados da busca -->
      <v-row v-if="books.length" class="mt-6" justify="center">
        <v-col
          v-for="book in books"
          :key="book.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="d-flex justify-center"
        >
          <v-card outlined class="pa-2" style="max-width: 250px; width: 100%">
            <v-img
              :src="book.volumeInfo.imageLinks?.thumbnail"
              alt="Capa do livro"
              height="200"
              contain
            />
            <v-card-title class="text-h6">
              {{ book.volumeInfo.title }}
            </v-card-title>
            <v-card-subtitle class="text-subtitle-2 mb-2">
              <strong>Autor(es):</strong> {{ book.volumeInfo.authors?.join(", ") }}
            </v-card-subtitle>
            <v-btn @click="addToBookshelf(book)" small color="success" outlined block>
              Adicionar à Estante
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- Mensagens de status -->
      <p v-else-if="searchQuery && !loading && !books.length" class="mt-6">
        Nenhum livro encontrado.
      </p>
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
        class="mt-3"
        style="width: 100%; max-width: 600px"
      />

  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { searchBooks } from "@/services/googleBooks";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

const searchQuery = ref("");
const books = ref([]);
const loading = ref(false);

const bookshelfStore = useBookshelfStore();

const fetchBooks = async () => {
  if (!searchQuery.value.trim()) return;
  loading.value = true;
  books.value = [];
  try {
    books.value = await searchBooks(searchQuery.value);
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  bookshelfStore.initAuthListener();
});

const addToBookshelf = (book: any) => {
  const bookData = {
    title: book.volumeInfo.title,
    author: book.volumeInfo.authors?.join(", "),
    coverImage: book.volumeInfo.imageLinks?.thumbnail,
  };
  bookshelfStore.teste(bookData);
};
</script>

<style scoped>
.v-container {
  min-height: 100vh;
}
</style>
