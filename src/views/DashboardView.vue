<template>
  <div id="/dashboard">
    <h1>Dashboard</h1>
    <p>
      Bem-vindo ao seu painel. Aqui você pode acessar estatísticas e informações sobre sua leitura.
    </p>

    <ul>
      <li>Total de livros lidos: {{ dashboardStore.totalBooksRead }}</li>
      <li>Total de frases favoritas: {{ dashboardStore.totalFavoriteQuotes }}</li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/useDashboardStore'

const dashboardStore = useDashboardStore()

onMounted(() => {
  dashboardStore.fetchDashboardData()
})
</script>
