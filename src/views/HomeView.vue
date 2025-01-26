<template>
  <v-container>
    <v-row>
      <!-- Coluna de Pesquisa -->
      <v-col
        cols="4"
        class="pa-4 red"
        style="background-color: #f5f5dc; border-right: 2px solid #ddd"
      >
        <h2 class="text-h5">Pesquisar Livros</h2>
        <v-text-field
          v-model="searchQuery"
          label="Digite o nome do livro ou autor"
          outlined
          dense
          clearable
          @keyup.enter="fetchBooks"
        ></v-text-field>
        <v-btn @click="fetchBooks" color="primary" block class="mt-3"> Pesquisar </v-btn>

        <div v-if="books.length" class="mt-4">
          <h3 class="text-h6">Resultados da Pesquisa:</h3>
          <v-list dense>
            <v-list-item v-for="book in books" :key="book.id" class="d-flex align-center mb-3">
              <v-img
                :src="book.volumeInfo.imageLinks?.thumbnail"
                alt="Capa do livro"
                max-height="60"
                max-width="40"
                class="mr-3"
              ></v-img>
              <v-list-item-content>
                <v-list-item-title>{{ book.volumeInfo.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  <strong>Autor(es):</strong> {{ book.volumeInfo.authors?.join(', ') }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-btn @click="addToBookshelf(book)" small color="success" outlined class="ml-2">
                Adicionar
              </v-btn>
            </v-list-item>
          </v-list>
        </div>

        <p v-else-if="searchQuery && !loading && !books.length" class="mt-4">
          Nenhum livro encontrado.
        </p>
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mt-3"
        ></v-progress-linear>
      </v-col>

      <!-- Coluna da Estante de Livros -->
      <v-col cols="8" class="pa-4" style="background-color: #fff9e6">
        <h2 class="text-h5">Sua Estante</h2>
        <v-container class="d-flex flex-wrap">
          <v-card
            v-for="book in bookshelfStore.books"
            :key="book.id"
            outlined
            class="mx-2 my-2"
            style="max-width: 200px"
          >
            <v-img :src="book.coverImage" height="200"></v-img>
            <v-card-title class="text-h6">{{ book.title }}</v-card-title>
            <v-card-subtitle>{{ book.author }}</v-card-subtitle>
          </v-card>
        </v-container>
        <p v-if="!bookshelfStore.books.length" class="mt-4">
          Sua estante está vazia. Adicione livros para começar!
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { searchBooks } from '@/services/googleBooks'
import { useBookshelfStore } from '@/stores/useBookshelfStore'

const searchQuery = ref('')
const books = ref([])
const loading = ref(false)

const bookshelfStore = useBookshelfStore()

const fetchBooks = async () => {
  if (!searchQuery.value.trim()) return
  loading.value = true
  books.value = []
  try {
    books.value = await searchBooks(searchQuery.value)
  } catch (error) {
    console.error('Erro ao buscar livros:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  bookshelfStore.initAuthListener()
})

const addToBookshelf = (book: string) => {
  const bookData = {
    title: book.volumeInfo.title,
    author: book.volumeInfo.authors?.join(', '),
    coverImage: book.volumeInfo.imageLinks?.thumbnail,
  }
  bookshelfStore.teste(bookData)
}
</script>

<style scoped>
/* Customização adicional */
</style>
