import { getAuth, onAuthStateChanged } from 'firebase/auth' // Importação do Firebase Auth
import { createRouter, createWebHistory } from 'vue-router'

// Importando as views
import BookDetailsView from '../views/BookDetailsView.vue'
import BookshelfView from '../views/BookshelfView.vue'
import DashboardView from '../views/DashboardView.vue'
import adcionarLivro
 from '../views/adcionarLivro.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'

const auth = getAuth()

// Função para proteger as rotas
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}

const requireAuth = async (to, from, next) => {
  const user = await getCurrentUser()
  if (user) {
    next()
  } else {
    next('/login')
  }
}

// Configuração das rotas
const routes = [
  {
    path: '/addBook',
    name: 'add book',
    component: adcionarLivro
  },
  {
    path: '/',
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
  history: createWebHistory('/'),
  routes,
})

export default router
