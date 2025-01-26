<template>
  <v-dialog v-model="internalVisible" persistent>
    <v-card>
      <v-card-title>
        <slot name="title">Título do Dialog</slot>
      </v-card-title>
      <v-card-text>
        <slot>Conteúdo do Dialog</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" @click="$emit('close')">Fechar</v-btn>
        <slot name="actions"></slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineProps, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})

const internalVisible = ref(props.visible)

watch(
  () => props.visible,
  (newVal) => {
    internalVisible.value = newVal
  },
)

watch(
  () => internalVisible.value,
  (newVal) => {
    if (!newVal) {
      // Emite o evento de fechamento
      $emit('close')
    }
  },
)
</script>
