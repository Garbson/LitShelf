// stores/useAuthStore.ts
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const auth = getAuth()
  const user = ref<null | { uid: string; email: string }>(null)
  const router = useRouter()

  // Sincronizar o estado do usuário ao carregar a aplicação
  const initializeAuth = () => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        user.value = {
          uid: currentUser.uid,
          email: currentUser.email || '',
        }
      } else {
        user.value = null
      }
    })
  }

  // Registrar usuário
  const signup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
      }
      router.push('/dashboard') // Redireciona após o registro
    } catch (error) {
      console.error('Erro ao registrar usuário:', error)
      throw new Error('Não foi possível criar a conta.')
    }
  }

  // Fazer login
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
      }
      console.log('Usuário logado:', user.value)
      router.push('/dashboard') // Redireciona após o login
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      throw new Error('Credenciais inválidas.')
    }
  }

  // Fazer logout
  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      router.push('/login') // Redireciona para a página de login
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw new Error('Não foi possível fazer logout.')
    }
  }

  // Inicializar a autenticação no momento certo
  onMounted(() => {
    initializeAuth()
  })

  return {
    user,
    signup,
    login,
    logout,
    initializeAuth,
  }
})
