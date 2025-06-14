<template>
  <div class="profile-container fill-height d-flex justify-center">
    <v-card elevation="0" class="card-container pa-4 rounded-xl" style="width: 90%">
      <h1 class="text-h3 font-weight-bold mb-4 text-center profile-title">
        <span class="page-title">👤 Meu Perfil</span>
      </h1>

      <div v-if="isLoading" class="d-flex justify-center align-center pa-8">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <v-row v-else justify="center">
        <!-- Informações do perfil -->
        <v-col cols="12" md="8" lg="6" class="d-flex flex-column align-center">
          <v-card class="pa-6 rounded-xl profile-card" elevation="2" width="100%">
            <div class="d-flex flex-column align-center">
              <!-- COMPONENTE DE UPLOAD DE FOTO SUBSTITUINDO O v-avatar -->
              <ProfilePictureUpload
                v-model="profileData.profilePictureUrl"
                :size="150"
                :user-name="profileData.name"
                @uploaded="handlePictureUploaded"
                class="mb-4"
              />

              <h2 class="text-h4 font-weight-bold mb-2">{{ profileData.name }}</h2>
              <p class="text-subtitle-1 text-grey">{{ userEmail }}</p>

              <v-divider class="my-4 w-100"></v-divider>

              <div class="w-100 mt-2">
                <v-form ref="profileForm" @submit.prevent="saveChanges">
                  <!-- ID do usuário -->
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      label="ID do Usuário"
                      v-model="profileData.id"
                      readonly
                      variant="outlined"
                      density="comfortable"
                      bg-color="surface"
                      class="flex-grow-1 rounded-lg"
                      append-inner-icon="mdi-content-copy"
                      @click:append-inner="copyToClipboard(profileData.id, 'ID')"
                    />
                  </div>

                  <!-- Nome -->
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      label="Nome"
                      v-model="profileData.name"
                      :readonly="!isEditing"
                      variant="outlined"
                      density="comfortable"
                      bg-color="surface"
                      class="flex-grow-1 rounded-lg"
                      :rules="[(v) => !!v || 'Nome é obrigatório']"
                    />
                  </div>

                  <!-- Meta de leitura -->
                  <div class="d-flex align-center mb-4">
                    <v-text-field
                      label="Meta de livros por ano"
                      v-model.number="profileData.readingGoal"
                      :readonly="!isEditing"
                      variant="outlined"
                      density="comfortable"
                      bg-color="surface"
                      class="flex-grow-1 rounded-lg"
                      type="number"
                      min="0"
                      max="1000"
                    />
                  </div>

                  <!-- Botões de ação -->
                  <div class="d-flex justify-center gap-3 mt-6">
                    <v-btn
                      v-if="!isEditing"
                      variant="elevated"
                      color="primary"
                      prepend-icon="mdi-pencil"
                      @click="startEditing"
                      class="action-btn rounded-lg"
                    >
                      Editar Perfil
                    </v-btn>

                    <template v-else>
                      <v-btn
                        variant="outlined"
                        color="error"
                        prepend-icon="mdi-close"
                        @click="cancelEditing"
                        class="rounded-lg"
                      >
                        Cancelar
                      </v-btn>
                      <v-btn
                        variant="elevated"
                        color="success"
                        prepend-icon="mdi-check"
                        type="submit"
                        :loading="isSaving"
                        class="rounded-lg"
                      >
                        Salvar
                      </v-btn>
                    </template>
                  </div>
                </v-form>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- Snackbar para feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore.js'
import { supabase } from '@/supabase.js'
import { onMounted, ref } from 'vue'
// IMPORTAR O COMPONENTE
import ProfilePictureUpload from '@/components/ProfilePictureUpload.vue'

// Store
const authStore = useAuthStore()

// Estado
const isLoading = ref(true)
const isEditing = ref(false)
const isSaving = ref(false)
const userEmail = ref('')
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
})

// Dados do formulário
const profileData = ref({
  id: '',
  name: '',
  profilePictureUrl: '',
  readingGoal: 0,
})

// Carregar dados do perfil
async function loadProfileData() {
  if (!authStore.userId) return

  isLoading.value = true

  try {
    // Carregar os dados do perfil
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, profile_picture_url, reading_goal')
      .eq('id', authStore.userId)
      .single()

    if (error) throw error

    // Preencher os dados do perfil
    if (data) {
      profileData.value = {
        id: data.id,
        name: data.name || '',
        profilePictureUrl: data.profile_picture_url || '',
        readingGoal: data.reading_goal || 0,
      }
    }

    // Carregar o email do usuário a partir do authStore
    userEmail.value = authStore.user?.email || ''
  } catch (err) {
    console.error('Erro ao carregar dados do perfil:', err)
    showSnackbar('Erro ao carregar dados do perfil', 'error')
  } finally {
    isLoading.value = false
  }
}

// NOVA FUNÇÃO para lidar com upload de foto
function handlePictureUploaded(newUrl: string) {
  // Atualizar dados locais
  profileData.value.profilePictureUrl = newUrl

  // Mostrar feedback
  showSnackbar('Foto de perfil atualizada com sucesso!', 'success')

  // Opcional: recarregar dados do perfil para garantir sincronização
  // loadProfileData();
}

// Iniciar edição
function startEditing() {
  isEditing.value = true
}

// Cancelar edição
function cancelEditing() {
  isEditing.value = false
  loadProfileData() // Recarregar dados originais
}

// Salvar alterações
async function saveChanges() {
  if (!authStore.userId) return

  isSaving.value = true

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileData.value.name,
        reading_goal: profileData.value.readingGoal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authStore.userId)

    if (error) throw error

    isEditing.value = false
    showSnackbar('Perfil atualizado com sucesso', 'success')
  } catch (err) {
    console.error('Erro ao salvar alterações no perfil:', err)
    showSnackbar('Erro ao salvar alterações', 'error')
  } finally {
    isSaving.value = false
  }
}

// Copiar para a área de transferência
function copyToClipboard(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSnackbar(`${label} copiado para a área de transferência`, 'success')
    })
    .catch((err) => {
      console.error('Erro ao copiar para a área de transferência:', err)
      showSnackbar('Não foi possível copiar o texto', 'error')
    })
}

// Exibir snackbar com mensagem
function showSnackbar(text: string, color: string = 'success') {
  snackbar.value = {
    show: true,
    text,
    color,
  }
}

// Carregar dados ao montar o componente
onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
.profile-container {
  width: 100%;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 1rem;
  position: relative;
}

.card-container {
  background: transparent;
}

.profile-title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  letter-spacing: -0.5px;
}

.profile-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.copy-btn {
  color: rgb(var(--v-theme-primary));
}

.action-btn {
  color: rgb(var(--v-theme-on-primary));
  background-color: rgb(var(--v-theme-primary));
}

.action-btn:hover {
  background-color: rgb(var(--v-theme-primary-dark));
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.8rem;
  }
}
</style>
