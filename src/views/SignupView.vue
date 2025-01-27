<template>
  <v-container fluid class="d-flex justify-center align-center mx-auto fill-height">
    <BaseCard width="400px" class="pa-5" rounded="lg">
      <!-- Título -->
      <template #title>
        <h2 class="text-center mx-auto">Criar Conta</h2>
      </template>

      <!-- Formulário -->
      <template #default>
        <v-form ref="signupForm" v-model="isFormValid" lazy-validation>
          <BaseTextField
            v-model="email"
            label="Email"
            type="email"
            :rules="emailRules"
            outlined
            dense
            required
          />
          <BaseTextField
            v-model="password"
            label="Senha"
            type="password"
            :rules="passwordRules"
            outlined
            dense
            required
          />

          <v-alert v-if="errorMessage" type="error" outlined>
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </template>

      <!-- Ações -->
      <template #actions>
        <v-card-actions class="d-flex flex-column align-center">
          <!-- Botão Registrar -->
          <BaseButton
            :disabled="!isFormValid"
            color="primary"
            variant="flat"
            block
            @click="handleSignup"
          >
            Registrar
          </BaseButton>

          <!-- Link para Login -->
          <div class="text-center mt-3">
            <span>Já tem uma conta? </span>
            <BaseButton color="primary" size="small" text @click="goToLogin">
              Fazer Login
            </BaseButton>
          </div>
        </v-card-actions>
      </template>
    </BaseCard>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const email = ref('')
const password = ref('')
const isFormValid = ref(false)
const errorMessage = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Regras de validação para os campos
const emailRules = [
  (v: string) => !!v || 'Email é obrigatório.',
  (v: string) => /.+@.+\..+/.test(v) || 'Email deve ser válido.',
]

const passwordRules = [
  (v: string) => !!v || 'Senha é obrigatória.',
  (v: string) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres.',
]

const handleSignup = async () => {
  try {
    await authStore.signup(email.value, password.value)
    errorMessage.value = ''
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Falha ao criar conta.'
  }
}

const goToLogin = () => {
  router.push('/login') // Redireciona para a página de login
}
</script>

<style scoped>
.fill-height {
  height: 100vh !important;
  background-image: url(/public/bgLogin.jpg);
  background-size: cover;
}
</style>
