<template>
  <v-text-field
    v-bind="attrs"
    :label="label"
    clearable
    hide-details
    :variant="variant"
    :type="type"
    :rules="rules"
    :outlined="outlined"
    :rounded="rounded"
    :dense="dense"
    class="base-text-field"
  />
</template>

<script lang="ts" setup>
import { defineProps, useAttrs } from 'vue';

// Props definidas
defineProps({
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  variant: {
    type: String,
    default: 'outlined',
  },
  rules: {
    type: Array,
    default: () => [],
  },
  outlined: {
    type: Boolean,
    default: true,
  },
  dense: {
    type: Boolean,
    default: true,
  },
  rounded: {
    type: [Boolean, String],
    default: 'lg',
  },
})

// Pegando atributos adicionais
const attrs = useAttrs()
</script>

<style scoped>
.base-text-field {
  margin-bottom: 16px;
}
</style>
