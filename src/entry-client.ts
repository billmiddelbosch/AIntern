import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'

import App from './App.vue'
import { createAppRouter } from './router'
import { i18n } from './lib/i18n'

const app = createApp(App)
const router = createAppRouter()
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(head)

router.isReady().then(() => app.mount('#app'))
