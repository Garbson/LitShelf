<template>
  <v-card
    :elevation="elevation"
    :outlined="outlined"
    v-bind="{ ...$attrs, ...$props }"
    :rounded="rounded"
    :class="baseCardClass"
    :width="width"
  >
    <slot name="title">
      <!-- Título padrão caso o slot não seja fornecido -->
      <v-card-title></v-card-title>
    </slot>

    <slot name="subtitle">
      <!-- Subtítulo padrão caso o slot não seja fornecido -->
      <v-card-subtitle></v-card-subtitle>
    </slot>

    <slot>
      <!-- Conteúdo principal padrão -->
      <v-card-text></v-card-text>
    </slot>

    <slot name="actions">
      <!-- Ações padrão caso o slot não seja fornecido -->
      <v-card-actions></v-card-actions>
    </slot>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Definindo as props com valores padrão
const props = defineProps({
  outlined: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [Number, String],
    default: 'auto',
  },
  rounded: {
    type: [Boolean, String],
    default: 'xl', // Pode ser true, false, ou valores como 'sm', 'lg'
  },
  bgColor: {
    type: String,
    default: 'surface',
  },
  elevation: {
    type: [Number, String],
    default: 0,
  },
})

const baseCardClass = computed(() => ({
  'base-card': true,
  [`bg-${props.bgColor}`]: props.bgColor,
  [`rounded-${props.rounded}`]: typeof props.rounded === 'string',
}))
</script>

<style scoped>
.base-card {
  margin: 16px;
  padding: 8px;
  border-radius: 8px;
}
</style>
