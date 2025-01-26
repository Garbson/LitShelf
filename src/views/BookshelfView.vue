<script lang="ts" setup>
import { onMounted } from 'vue'
import { useBookshelfStore } from '@/stores/useBookshelfStore'

const bookshelfStore = useBookshelfStore()

onMounted(() => {
  bookshelfStore.fetchUser() // Carrega os dados do usuário
  bookshelfStore.fetchBooks() // Carrega os livros
})
</script>

<template>
  <div id="bookshelf">
    <h1>Minha Estante</h1>
    <p v-if="bookshelfStore.isLoading">Carregando...</p>
    <ul v-else>
      <li v-for="book in bookshelfStore.books" :key="book.id">
        {{ book.title }} - {{ book.author }}
      </li>
    </ul>
  </div>
</template>
