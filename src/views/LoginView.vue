<template>
  <div class="login-container">
    <v-container class="d-flex align-center justify-center fill-height">
      <v-card width="100%" max-width="450" class="login-card" flat>
        <div class="login-header text-center pa-4">
          <div class="d-flex align-center justify-center mb-2">
            <v-icon icon="mdi-book-open-page-variant" size="40" color="accent" class="me-2" />
            <h1 class="text-h4 text-serif lit-shelf-heading">LitShelf</h1>
          </div>
          <p class="text-subtitle-1 text-white">Bem-vindo à sua estante digital</p>
        </div>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <h2 class="text-h5 mb-4 text-serif">Entrar</h2>

          <v-form ref="form" v-model="valid" @submit.prevent="login">
            <BaseTextField
              v-model="email"
              :rules="emailRules"
              label="E-mail"
              required
              prepend-inner-icon="mdi-email"
              autocomplete="email"
              class="mb-3"
              :error-messages="formErrors.email"
              @input="formErrors.email = ''"
              :hide-details="false"
            />

            <BaseTextField
              v-model="password"
              :rules="passwordRules"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :type="showPassword ? 'text' : 'password'"
              label="Senha"
              required
              prepend-inner-icon="mdi-lock"
              autocomplete="current-password"
              class="mb-2"
              :error-messages="formErrors.password"
              @input="formErrors.password = ''"
              @click:append-inner="showPassword = !showPassword"
              :hide-details="false"
            />

            <div class="d-flex justify-space-between align-center mb-4">
              <v-checkbox
                v-model="rememberMe"
                label="Lembrar-me"
                density="compact"
                hide-details
              ></v-checkbox>

              <a href="#" class="text-decoration-none text-primary"> Esqueceu a senha? </a>
            </div>

            <v-alert v-if="errorMessage" type="error" class="mb-3" variant="tonal" closable>
              {{ errorMessage }}
            </v-alert>

            <div class="d-flex flex-column gap-2">
              <v-btn
                color="primary"
                size="large"
                block
                type="submit"
                :loading="loading"
                :disabled="loading || !valid"
                class="text-white"
                elevation="2"
              >
                Entrar
              </v-btn>

              <div class="separator my-3">
                <span>ou</span>
              </div>

              <v-btn
                variant="outlined"
                size="large"
                block
                :loading="googleLoading"
                :disabled="loading || googleLoading"
                @click="loginWithGoogle"
                class="google-btn"
              >
                <template v-slot:prepend>
                  <svg width="20" height="20" viewBox="0 0 24 24" class="me-2">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </template>
                Continuar com Google
              </v-btn>
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-text class="text-center pa-4">
          <p>
            Não tem uma conta?
            <router-link to="/signup" class="text-decoration-none font-weight-bold">
              Cadastre-se
            </router-link>
          </p>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import BaseTextField from '@/components/BaseTextField.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const valid = ref(false)
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const errorMessage = ref('')
const formErrors = ref({
  email: '',
  password: '',
})

const emailRules = [
  (v: string) => !!v || 'E-mail é obrigatório',
  (v: string) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
]

const passwordRules = [
  (v: string) => !!v || 'Senha é obrigatória',
  (v: string) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres',
]

const login = async () => {
  if (!valid.value) return

  try {
    loading.value = true
    errorMessage.value = ''

    // Simular um pequeno delay para melhorar UX (opcional)
    await new Promise((resolve) => setTimeout(resolve, 600))

    const result = await authStore.loginWithEmail(email.value, password.value)

    if (result === true) {
      if (rememberMe.value) {
        localStorage.setItem('rememberedEmail', email.value)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      router.push('/bookshelf')
    } else if (result === 'email_not_confirmed') {
      // Tratar o caso específico de email não confirmado
      errorMessage.value =
        'Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação que enviamos para você.'
    } else {
      errorMessage.value = 'E-mail ou senha incorretos. Por favor, tente novamente.'
    }
  } catch (error: any) {
    console.error('Erro ao fazer login:', error)
    // Verificar especificamente se é um erro de email não confirmado
    if (error.message && error.message.includes('Email not confirmed')) {
      errorMessage.value =
        'Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação que enviamos para você.'
    } else {
      errorMessage.value = 'E-mail ou senha incorretos. Por favor, tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = async () => {
  try {
    googleLoading.value = true
    errorMessage.value = ''

    // Por enquanto, apenas mostrar mensagem que não está implementado
    errorMessage.value = 'Login com Google será implementado em breve.'

    // router.push('/bookshelf')
  } catch (error: any) {
    console.error('Erro ao fazer login com Google:', error)
    errorMessage.value = 'Erro ao fazer login com Google.'
  } finally {
    googleLoading.value = false
  }
}

// Carregar email salvo se "lembrar-me" estiver ativado
const rememberedEmail = localStorage.getItem('rememberedEmail')
if (rememberedEmail) {
  email.value = rememberedEmail
  rememberMe.value = true
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background-image: url('/bgLogin.jpg');
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.2), transparent);
  z-index: 0;
}

.lit-shelf-heading {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  font-weight: 600;
}

.login-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25) !important;
  position: relative;
  z-index: 1;
  transition: none !important;
  transform: none !important;
}

.login-header {
  background: linear-gradient(to right, #3e2723, #5d4037);
  color: white;
}

/* Separator sem fundo branco */
.separator {
  display: flex;
  align-items: center;
  text-align: center;
  color: #757575;
  position: relative;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.separator span {
  padding: 0 12px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 500;
}

/* Botão Google moderno */
.google-btn {
  border-color: #dadce0 !important;
  color: #3c4043 !important;
  text-transform: none !important;
  font-weight: 500 !important;
  height: 48px !important;
  transition: all 0.2s ease !important;
}

.google-btn:hover {
  background-color: #f8f9fa !important;
  border-color: #c1c7cd !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.google-btn:focus {
  border-color: #4285f4 !important;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2) !important;
}

.google-btn .v-btn__content {
  font-weight: 500;
}
</style>
