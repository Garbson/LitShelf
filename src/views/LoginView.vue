<template>
  <v-container fluid class="d-flex justify-center align-center mx-auto fill-height">
    <BaseCard width="400px" class="pa-5 login-card" rounded="lg">
      <!-- Slot do título -->
      <template #title>
        <v-card-title>
          <h2 class="text-center mx-auto login-title">Login</h2>
        </v-card-title>
      </template>

      <!-- Slot do conteúdo principal -->
      <v-card-text>
        <v-form ref="loginForm" v-model="isFormValid" lazy-validation>
          <BaseTextField
            v-model="email"
            label="Email"
            placeholder="Digite seu email"
            type="email"
            :rules="emailRules"
          />

          <BaseTextField
            v-model="password"
            label="Senha"
            placeholder="Digite sua senha"
            type="password"
            :rules="passwordRules"
          />

          <v-alert v-if="errorMessage" type="error" outlined class="login-alert">
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card-text>

      <!-- Slot de ações -->
      <template #actions>
        <v-card-actions class="d-flex flex-column align-center">
          <!-- Botão de entrar -->
          <BaseButton color="primary" variant="flat" class="mb-1" @click="handleLogin">
            Entrar
          </BaseButton>

          <!-- Div com o link para criar conta -->
          <div class="text-center mt-2">
            <span>Não tem uma conta? </span>
            <BaseButton color="primary" size="small" text @click="goToSignup">
              Criar Conta
            </BaseButton>
          </div>
        </v-card-actions>
      </template>
    </BaseCard>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";

const email = ref("");
const password = ref("");
const isFormValid = ref(false);
const errorMessage = ref("");
const authStore = useAuthStore();
const router = useRouter();

// Validações para os campos
const emailRules = [
  (v: string) => !!v || "Email é obrigatório.",
  (v: string) => /.+@.+\..+/.test(v) || "Email deve ser válido.",
];

const passwordRules = [
  (v: string) => !!v || "Senha é obrigatória.",
  (v: string) => v.length >= 6 || "Senha deve ter pelo menos 6 caracteres.",
];

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    errorMessage.value = "";
    router.push("/dashboard");
  } catch (error) {
    errorMessage.value = error.message || "Falha ao fazer login.";
  }
};

const goToSignup = () => {
  router.push("/signup"); // Redireciona para a página de criação de conta
};
</script>

<style scoped>
.fill-height {
  height: 100vh !important;
  background-image: url("/public/bgLogin.jpg");
  background-size: cover;
  background-position: center;
}

.login-card {
  background-color: var(--v-secondary);
  color: var(--v-text);
}

.login-title {
  color: var(--v-text);
}

.login-alert {
  background-color: var(--v-error);
  color: var(--v-text);
}
</style>
