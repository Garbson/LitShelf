import { getAuth, onAuthStateChanged } from 'firebase/auth' // Importação do Firebase Auth
import { createRouter, createWebHistory } from 'vue-router'

// Importando as views
import BookDetailsView from '../views/BookDetailsView.vue'
import BookshelfView from '../views/BookshelfView.vue'
import DashboardView from '../views/DashboardView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'

const auth = getAuth()

// Função para proteger as rotas
const requireAuth = (to, from, next) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsubscribe() // Para evitar chamadas redundantes
      next() // Usuário autenticado, permite acesso
    } else {
      unsubscribe()
      next('/login') // Redireciona para a página de login
    }
  })
}

// Configuração das rotas
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    beforeEnter: requireAuth, // Protegendo a rota
  },
  {
    path: '/bookshelf',
    name: 'bookshelf',
    component: BookshelfView,
    beforeEnter: requireAuth, // Protegendo a rota
  },
  {
    path: '/book/:id',
    name: 'book-details',
    component: BookDetailsView,
    props: true,
    beforeEnter: requireAuth, // Protegendo a rota
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/', // Redireciona para a página inicial se a rota não existir
  },
]

// Criando o roteador
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
