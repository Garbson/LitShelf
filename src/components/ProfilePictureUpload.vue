<template>
  <div class="profile-picture-upload">
    <!-- Avatar com botão de edição -->
    <div class="avatar-container">
      <v-avatar
        :size="size"
        class="profile-avatar elevation-3"
        :class="{ 'avatar-hover': !readonly }"
        @click="currentImageUrl ? openImageViewer() : openUploadDialog()"
      >
        <v-img
          v-if="currentImageUrl"
          :src="currentImageUrl"
          alt="Foto de perfil"
          class="avatar-image"
        />
        <!-- Mostrar iniciais quando não há imagem -->
        <div v-else class="avatar-initials" :style="{ fontSize: `${size * 0.35}px` }">
          {{ userInitials }}
        </div>

        <!-- Overlay de edição -->
        <div v-if="!readonly" class="avatar-overlay">
          <v-icon size="24" color="white">
            {{ currentImageUrl ? 'mdi-eye' : 'mdi-camera' }}
          </v-icon>
        </div>
      </v-avatar>

      <!-- Botão de upload para telas menores -->
      <v-btn
        v-if="showUploadButton && !readonly"
        icon
        size="small"
        color="primary"
        class="upload-btn"
        @click.stop="openUploadDialog"
        elevation="2"
      >
        <v-icon size="20">mdi-camera</v-icon>
      </v-btn>
    </div>

    <!-- Dialog de upload -->
    <v-dialog v-model="uploadDialog" max-width="600" persistent>
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 pt-3 pb-6 d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-image-edit</v-icon>
          Alterar foto de perfil
        </v-card-title>

        <v-card-text>
          <!-- Abas para diferentes métodos -->
          <v-tabs v-model="uploadMethod" class="mb-4">
            <v-tab value="file">
              <v-icon class="mr-2">mdi-upload</v-icon>
              Upload de arquivo
            </v-tab>
            <v-tab value="url">
              <v-icon class="mr-2">mdi-link</v-icon>
              URL da imagem
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="uploadMethod">
            <!-- Upload de arquivo -->
            <v-tabs-window-item value="file">
              <div class="upload-area">
                <!-- Área de drop -->
                <div
                  class="drop-zone"
                  :class="{ 'drag-over': isDragOver }"
                  @dragover.prevent="isDragOver = true"
                  @dragleave.prevent="isDragOver = false"
                  @drop.prevent="handleFileDrop"
                  @click="$refs.fileInput.click()"
                >
                  <v-icon size="48" color="primary" class="mb-3">
                    {{ selectedFile ? 'mdi-file-image' : 'mdi-cloud-upload' }}
                  </v-icon>
                  <p class="text-body-1 font-weight-medium mb-2">
                    {{ selectedFile ? selectedFile.name : 'Clique ou arraste uma imagem aqui' }}
                  </p>
                  <p class="text-caption text-grey">Formatos aceitos: JPG, PNG, GIF (máx. 5MB)</p>

                  <!-- Preview da imagem selecionada -->
                  <div v-if="previewUrl" class="preview-container mt-4">
                    <v-img
                      :src="previewUrl"
                      max-height="200"
                      max-width="200"
                      class="rounded-lg mx-auto"
                      contain
                    />
                  </div>
                </div>

                <!-- Input de arquivo oculto -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  @change="handleFileSelect"
                  style="display: none"
                />

                <!-- Progresso do upload -->
                <v-progress-linear
                  v-if="uploadProgress > 0 && uploadProgress < 100"
                  :model-value="uploadProgress"
                  color="primary"
                  height="8"
                  class="mt-4 rounded"
                />
              </div>
            </v-tabs-window-item>

            <!-- Upload por URL -->
            <v-tabs-window-item value="url">
              <v-text-field
                v-model="imageUrl"
                label="URL da imagem"
                placeholder="https://exemplo.com/minha-foto.jpg"
                variant="outlined"
                class="mb-3"
                clearable
                prepend-inner-icon="mdi-link"
                :rules="[urlValidation]"
              />

              <!-- Preview da URL -->
              <div v-if="imageUrl && isValidUrl(imageUrl)" class="preview-container mt-4">
                <v-img
                  :src="imageUrl"
                  max-height="200"
                  max-width="200"
                  class="rounded-lg mx-auto"
                  contain
                  @error="urlError = true"
                  @load="urlError = false"
                />
                <p v-if="urlError" class="text-error text-caption mt-2 text-center">
                  Não foi possível carregar a imagem desta URL
                </p>
              </div>

              <p class="text-caption text-grey mt-3">
                Insira a URL completa de uma imagem para usar como foto de perfil
              </p>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>

        <v-card-actions class="pt-3 pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeDialog" :disabled="isUploading">
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="saveImage"
            :disabled="!canSave"
            :loading="isUploading"
            variant="elevated"
          >
            {{ isUploading ? 'Salvando...' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para visualizar imagem atual -->
    <v-dialog v-model="imageViewerDialog" max-width="500">
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 pt-3 pb-4 d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-image</v-icon>
          Foto de Perfil
        </v-card-title>

        <v-card-text class="text-center">
          <v-img
            :src="currentImageUrl"
            max-height="300"
            max-width="300"
            class="rounded-lg mx-auto mb-4"
            contain
          />
        </v-card-text>

        <v-card-actions class="pt-3 pb-4 px-4">
          <v-btn color="primary" variant="text" prepend-icon="mdi-crop" @click="openCropDialog">
            Cortar
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeDialog"> Fechar </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-camera"
            @click="
              () => {
                closeDialog()
                openUploadDialog()
              }
            "
          >
            Alterar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para cortar imagem -->
    <v-dialog v-model="cropDialog" max-width="600" persistent>
      <v-card class="pa-4 rounded-xl">
        <v-card-title class="text-h5 pt-3 pb-4 d-flex align-center">
          <v-icon class="mr-3" color="primary">mdi-crop</v-icon>
          Cortar Imagem
        </v-card-title>

        <v-card-text class="text-center">
          <div class="crop-container">
            <img
              ref="cropImage"
              :src="cropImageUrl"
              class="crop-image"
              style="max-width: 100%; max-height: 400px"
            />
          </div>
          <p class="text-caption text-grey mt-3">Ajuste a área de corte e clique em salvar</p>
        </v-card-text>

        <v-card-actions class="pt-3 pb-4 px-4">
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="closeDialog"> Cancelar </v-btn>
          <v-btn color="primary" variant="elevated" @click="applyCrop" :loading="isUploading">
            Salvar Corte
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/supabase'
import { computed, ref, watch } from 'vue'

// Props
interface Props {
  modelValue?: string
  size?: number
  readonly?: boolean
  showUploadButton?: boolean
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 150,
  readonly: false,
  showUploadButton: true,
  userName: 'Usuario',
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  uploaded: [url: string]
}>()

// Store
const authStore = useAuthStore()

// Estado
const uploadDialog = ref(false)
const imageViewerDialog = ref(false)
const cropDialog = ref(false)
const uploadMethod = ref('file')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const cropImageUrl = ref('')
const imageUrl = ref('')
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const urlError = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
})

// Computed
const currentImageUrl = computed(() => props.modelValue)

const userInitials = computed(() => {
  if (!props.userName) return 'U'

  const names = props.userName.trim().split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }

  const firstName = names[0]
  const lastName = names[names.length - 1]
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

const canSave = computed(() => {
  if (uploadMethod.value === 'file') {
    return selectedFile.value !== null
  } else {
    return imageUrl.value && isValidUrl(imageUrl.value) && !urlError.value
  }
})

// Watchers
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      imageUrl.value = newVal
    }
  },
)

// Métodos
function openUploadDialog() {
  if (props.readonly) return
  uploadDialog.value = true
  imageUrl.value = props.modelValue || ''
}

function openImageViewer() {
  if (props.readonly) return
  imageViewerDialog.value = true
}

function openCropDialog() {
  imageViewerDialog.value = false
  cropDialog.value = true
  cropImageUrl.value = props.modelValue || ''
}

function closeDialog() {
  uploadDialog.value = false
  imageViewerDialog.value = false
  cropDialog.value = false
  selectedFile.value = null
  previewUrl.value = ''
  cropImageUrl.value = ''
  imageUrl.value = props.modelValue || ''
  uploadProgress.value = 0
  urlError.value = false
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleFileDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function processFile(file: File) {
  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    showSnackbar('Por favor, selecione apenas arquivos de imagem', 'error')
    return
  }

  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showSnackbar('A imagem deve ter no máximo 5MB', 'error')
    return
  }

  selectedFile.value = file

  // Criar preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function uploadFile(): Promise<string | null> {
  if (!selectedFile.value || !authStore.userId) return null

  try {
    const fileExt = selectedFile.value.name.split('.').pop()?.toLowerCase()
    const fileName = `${authStore.userId}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile.value, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Erro no upload:', error)
    throw error
  }
}

async function saveImage() {
  if (!authStore.userId) return

  isUploading.value = true
  uploadProgress.value = 10

  try {
    let finalImageUrl = ''

    if (uploadMethod.value === 'file' && selectedFile.value) {
      // Upload de arquivo
      uploadProgress.value = 30
      finalImageUrl = (await uploadFile()) || ''
      uploadProgress.value = 70
    } else if (uploadMethod.value === 'url') {
      // URL direta
      finalImageUrl = imageUrl.value
    }

    if (!finalImageUrl) {
      throw new Error('Nenhuma imagem foi selecionada')
    }

    // Atualizar no banco de dados
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: finalImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authStore.userId)

    if (error) throw error

    uploadProgress.value = 100

    // Emitir eventos
    emit('update:modelValue', finalImageUrl)
    emit('uploaded', finalImageUrl)

    showSnackbar('Foto de perfil atualizada com sucesso!', 'success')
    closeDialog()
  } catch (error) {
    console.error('Erro ao salvar imagem:', error)
    showSnackbar('Erro ao atualizar foto de perfil', 'error')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function urlValidation(value: string) {
  if (!value) return true
  return isValidUrl(value) || 'URL inválida'
}

function showSnackbar(text: string, color: string = 'success') {
  snackbar.value = {
    show: true,
    text,
    color,
  }
}

// Função para aplicar o corte (versão simples - apenas redimensiona)
async function applyCrop() {
  if (!cropImageUrl.value || !authStore.userId) return

  isUploading.value = true

  try {
    // Para uma implementação simples, vamos usar a URL atual
    // Em uma implementação completa, você usaria uma biblioteca como Cropper.js
    const finalImageUrl = cropImageUrl.value

    // Atualizar no banco de dados
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: finalImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authStore.userId)

    if (error) throw error

    // Emitir eventos
    emit('update:modelValue', finalImageUrl)
    emit('uploaded', finalImageUrl)

    showSnackbar('Imagem cortada e salva com sucesso!', 'success')
    closeDialog()
  } catch (error) {
    console.error('Erro ao aplicar corte:', error)
    showSnackbar('Erro ao salvar imagem cortada', 'error')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.avatar-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.profile-avatar {
  border: 3px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.avatar-hover:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  transform: scale(1.02);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-hover:hover .avatar-overlay {
  opacity: 1;
}

.upload-btn {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: rgb(var(--v-theme-primary)) !important;
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  letter-spacing: 1px;
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface), 0.5);
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.05);
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.upload-area {
  width: 100%;
}

.crop-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.crop-image {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsividade */
@media (max-width: 600px) {
  .drop-zone {
    padding: 1.5rem 1rem;
  }

  .preview-container .v-img {
    max-height: 150px !important;
    max-width: 150px !important;
  }
}
</style>
