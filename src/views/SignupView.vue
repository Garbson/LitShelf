<template>
  <div class="signup-container">
    <v-container class="d-flex align-center justify-center fill-height">
      <v-row>
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <v-card 
            width="100%" 
            max-width="450" 
            class="signup-card"
            flat
          >
            <div class="signup-header text-center pa-6">
              <div class="d-flex align-center justify-center mb-4">
                <v-icon icon="mdi-book-open-page-variant" size="40" color="accent" class="me-2" />
                <h1 class="text-h4 text-serif lit-shelf-heading">LitShelf</h1>
              </div>
              <p class="text-subtitle-1 text-medium-emphasis">Crie sua conta e comece a organizar suas leituras</p>
            </div>
            
            <v-divider></v-divider>
            
            <v-card-text class="pa-6">
              <h2 class="text-h5 mb-6 text-serif">Cadastro</h2>
              
              <v-form ref="signupForm" v-model="isFormValid" lazy-validation @submit.prevent="handleSignup">
                <BaseTextField
                  v-model="name"
                  label="Nome"
                  required
                  prepend-inner-icon="mdi-account"
                  :rules="nameRules"
                />

                <BaseTextField
                  v-model="email"
                  label="E-mail"
                  type="email"
                  required
                  prepend-inner-icon="mdi-email"
                  :rules="emailRules"
                />

                <BaseTextField
                  v-model="password"
                  label="Senha"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  prepend-inner-icon="mdi-lock"
                  :rules="passwordRules"
                  @click:append-inner="showPassword = !showPassword"
                />

                <BaseTextField
                  v-model="confirmPassword"
                  label="Confirmar Senha"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  prepend-inner-icon="mdi-lock-check"
                  :rules="confirmPasswordRules"
                />

                <v-alert
                  v-if="successMessage"
                  type="success"
                  class="mb-4"
                  variant="tonal"
                  closable
                >
                  {{ successMessage }}
                </v-alert>

                <v-alert
                  v-if="errorMessage"
                  type="error"
                  class="mb-4"
                  variant="tonal"
                  closable
                >
                  {{ errorMessage }}
                </v-alert>

                <div class="d-flex flex-column gap-3">
                  <v-btn
                    color="primary"
                    size="large"
                    block
                    type="submit"
                    :loading="loading"
                    :disabled="loading || !isFormValid"
                    class="text-white"
                    elevation="2"
                  >
                    Criar conta
                  </v-btn>
                  
                  <div class="separator my-4">
                    <span>ou</span>
                  </div>
                  
                  <v-btn
                    color="error"
                    variant="outlined"
                    size="large"
                    block
                    prepend-icon="mdi-google"
                    @click="signupWithGoogle"
                  >
                    Registrar com Google
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-text class="text-center pa-6">
              <p>
                Já tem uma conta?
                <router-link to="/login" class="text-decoration-none font-weight-bold">
                  Fazer login
                </router-link>
              </p>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6" class="d-none d-md-flex">
          <div class="signup-showcase">
            <div class="showcase-content text-center">
              <h2 class="text-h3 text-white text-serif mb-6">Comece sua jornada literária</h2>
              <div class="showcase-features">
                <div class="feature-item">
                  <v-icon icon="mdi-bookshelf" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Organize sua estante</h3>
                </div>
                
                <div class="feature-item">
                  <v-icon icon="mdi-book-open-variant" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Registre seu progresso</h3>
                </div>
                
                <div class="feature-item">
                  <v-icon icon="mdi-star" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Avalie suas leituras</h3>
                </div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import BaseTextField from '@/components/BaseTextField.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isFormValid = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const loading = ref(false)
const authStore = useAuthStore()
const router = useRouter()

// Regras de validação
const nameRules = [
  (v: string) => !!v || 'Nome é obrigatório.',
]

const emailRules = [
  (v: string) => !!v || 'Email é obrigatório.',
  (v: string) => /.+@.+\..+/.test(v) || 'Email deve ser válido.',
]

const passwordRules = [
  (v: string) => !!v || 'Senha é obrigatória.',
  (v: string) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres.',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Confirmação de senha é obrigatória.',
  (v: string) => v === password.value || 'As senhas não correspondem.',
]

const handleSignup = async () => {
  if (!isFormValid.value) return
  
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    // Simular um pequeno delay para melhorar UX (opcional)
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const result = await authStore.registerWithEmail(email.value, password.value)
    
    if (result) {
      successMessage.value = 'Conta criada com sucesso! Por favor, verifique seu email para confirmar sua conta antes de fazer login. Enviamos um link de confirmação para ' + email.value
    }
  } catch (error: any) {
    console.error('Erro ao criar conta:', error)
    errorMessage.value = error.message || 'Falha ao criar conta.'
  } finally {
    loading.value = false
  }
}

const signupWithGoogle = async () => {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    // Implementação futura
    errorMessage.value = 'Registro com Google será implementado em breve.'
  } catch (error: any) {
    errorMessage.value = 'Erro ao registrar com Google.'
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #3E2723, #5D4037, #8D6E63);
  position: relative;
}

.signup-container::before {
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
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  font-weight: 600;
}

.signup-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25) !important; /* Importante para garantir que a sombra não mude */
  position: relative;
  z-index: 1;
  transition: none !important; /* Desativa transições */
  transform: none !important; /* Impede transformações */
}

.signup-header {
  background: linear-gradient(to right, #3E2723, #5D4037);
  color: white;
}

.signup-showcase {
  height: 100%;
  background-image: url('/bgLogin.jpg');
  background-size: cover;
  background-position: center;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.signup-showcase::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(93, 64, 55, 0.85), rgba(141, 110, 99, 0.8));
}

.showcase-content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  width: 100%;
}

.showcase-features {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin-top: 3rem;
}

.feature-item {
  padding: 1rem;
  text-align: center;
  max-width: 180px;
}

.separator {
  display: flex;
  align-items: center;
  text-align: center;
  color: #757575;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.separator span {
  padding: 0 10px;
  background-color: #fff;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}
</style>
