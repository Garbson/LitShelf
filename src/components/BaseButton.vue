<template>
  <v-btn
    :color="color"
    :variant="variant"
    :elevation="elevation"
    :size="size"
    :rounded="rounded"
    :block="block"
    :disabled="disabled"
    class="base-btn pa-2"
    v-bind="{ ...$attrs, ...$props }"
  >
    <slot>
      <!-- Texto padrão caso nenhum slot seja fornecido -->
      Botão
    </slot>
  </v-btn>
</template>

<script lang="ts" setup>
// Definindo as props com valores padrão
defineProps({
  color: {
    type: String,
    default: 'primary', // Cor padrão
  },
  variant: {
    type: String,
    default: 'flat',
  },
  elevation: {
    type: [Number, String],
    default: 0, // Elevação padrão
  },
  rounded: {
    type: String,
    default: 'lg', // Arredondamento padrão
  },
  size: {
    type: String,
    default: 'medium', // Tamanhos como "small", "default", "large"
  },
  block: {
    type: Boolean,
    default: false, // Torna o botão "block" (ocupa 100% da largura)
  },
  disabled: {
    type: Boolean,
    default: false, // Estado de desabilitado
  },
})
</script>

<style scoped>
.base-btn {
  font-weight: 500;
  text-transform: none; /* Desativa texto em maiúsculas */
}
</style>
