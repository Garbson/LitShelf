<template>
  <div class="login-container">
    <v-container class="d-flex align-center justify-center fill-height">
      <v-row>
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <v-card 
            width="100%" 
            max-width="450" 
            class="login-card"
            flat
          >
            <div class="login-header text-center pa-6">
              <div class="d-flex align-center justify-center mb-4">
                <v-icon icon="mdi-book-open-page-variant" size="40" color="accent" class="me-2" />
                <h1 class="text-h4 text-serif lit-shelf-heading">LitShelf</h1>
              </div>
              <p class="text-subtitle-1 text-medium-emphasis">Bem-vindo à sua estante digital</p>
            </div>
            
            <v-divider></v-divider>
            
            <v-card-text class="pa-6">
              <h2 class="text-h5 mb-6 text-serif">Entrar</h2>
              
              <v-form ref="form" v-model="valid" @submit.prevent="login">
                <v-text-field
                  v-model="email"
                  :rules="emailRules"
                  label="E-mail"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  autocomplete="email"
                  class="mb-4"
                  :error-messages="formErrors.email"
                  @input="formErrors.email = ''"
                ></v-text-field>

                <v-text-field
                  v-model="password"
                  :rules="passwordRules"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  label="Senha"
                  required
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  autocomplete="current-password"
                  class="mb-2"
                  :error-messages="formErrors.password"
                  @input="formErrors.password = ''"
                  @click:append-inner="showPassword = !showPassword"
                ></v-text-field>

                <div class="d-flex justify-space-between align-center mb-6">
                  <v-checkbox
                    v-model="rememberMe"
                    label="Lembrar-me"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                  
                  <a href="#" class="text-decoration-none text-primary">
                    Esqueceu a senha?
                  </a>
                </div>

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
                    :disabled="loading || !valid"
                    class="text-white"
                    elevation="2"
                  >
                    Entrar
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
                    :loading="googleLoading"
                    :disabled="loading || googleLoading"
                    @click="loginWithGoogle"
                  >
                    Entrar com Google
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
            
            <v-divider></v-divider>
            
            <v-card-text class="text-center pa-6">
              <p>
                Não tem uma conta?
                <router-link to="/signup" class="text-decoration-none font-weight-bold">
                  Cadastre-se
                </router-link>
              </p>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6" class="d-none d-md-flex">
          <div class="login-showcase">
            <div class="showcase-content text-center">
              <h2 class="text-h3 text-white text-serif mb-6">Sua biblioteca digital pessoal</h2>
              <div class="showcase-features">
                <div class="feature-item">
                  <v-icon icon="mdi-bookmark-check" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Organize suas leituras</h3>
                </div>
                
                <div class="feature-item">
                  <v-icon icon="mdi-format-quote-close" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Salve citações favoritas</h3>
                </div>
                
                <div class="feature-item">
                  <v-icon icon="mdi-account-group" color="accent" size="36" />
                  <h3 class="text-h6 text-white mt-2">Conecte-se com amigos</h3>
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
    await new Promise(resolve => setTimeout(resolve, 600))
    
    await authStore.login(email.value, password.value)
    
    if (rememberMe.value) {
      localStorage.setItem('rememberedEmail', email.value)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    
    router.push('/bookshelf')
  } catch (error: any) {
    console.error('Erro ao fazer login:', error)
    errorMessage.value = 'E-mail ou senha incorretos. Por favor, tente novamente.'
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = async () => {
  try {
    googleLoading.value = true
    errorMessage.value = ''
    
    // Simular função para login com Google (implementação real depende do Firebase)
    // await authStore.loginWithGoogle()
    
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
  background: linear-gradient(135deg, #3E2723, #5D4037, #8D6E63);
  position: relative;
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
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  font-weight: 600;
}

.login-card {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  backdrop-filter: blur(5px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25) !important; /* Importante para garantir que a sombra não mude */
  position: relative;
  z-index: 1;
  transition: none !important; /* Desativa transições */
  transform: none !important; /* Impede transformações */
}

.login-header {
  background: linear-gradient(to right, #3E2723, #5D4037);
  color: white;
}

.login-showcase {
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

.login-showcase::before {
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
