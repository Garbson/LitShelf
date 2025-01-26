import GlobalComponents from '@/components' // Importa o arquivo index.ts da pasta components
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'

import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify) // Adiciona o Vuetify
app.use(GlobalComponents)

app.mount('#app')
