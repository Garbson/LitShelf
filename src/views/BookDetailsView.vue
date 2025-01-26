<template>
  <div id="">
    <h1>Detalhes do Livro</h1>
    <p>Aqui você pode ver os detalhes do livro selecionado.</p>

    <div v-if="selectedBook">
      <h2>{{ selectedBook.title }}</h2>
      <p><strong>Autor:</strong> {{ selectedBook.author }}</p>
      <p><strong>Descrição:</strong> {{ selectedBook.description }}</p>

      <h3>Frases Favoritas:</h3>
      <ul>
        <li v-for="quote in selectedBook.quotes" :key="quote">{{ quote }}</li>
      </ul>
    </div>
    <div v-else>
      <p>Carregando...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBookshelfStore } from '@/stores/useBookshelfStore'

const route = useRoute()
const bookshelfStore = useBookshelfStore()

onMounted(() => {
  const bookId = route.params.id as string
  bookshelfStore.fetchBookDetails(bookId)
})
</script>
