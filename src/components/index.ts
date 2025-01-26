import { App as VueApp } from 'vue' // Import correto do tipo 'App'
import BaseButton from './BaseButton.vue'
import BaseCard from './BaseCard.vue'
import BaseDialog from './BaseDialog.vue'
import BaseTextField from './BaseTextField.vue'

export default {
  install(app: VueApp) {
    app.component('BaseButton', BaseButton)
    app.component('BaseDialog', BaseDialog)
    app.component('BaseCard', BaseCard)
    app.component('BaseTextField', BaseTextField)
  },
}
