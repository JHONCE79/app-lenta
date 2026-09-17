import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import EmbarquesView from './views/EmbarquesView.vue'
import ResumenView from './views/ResumenView.vue'
import './estilos.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/embarques' },
    { path: '/embarques', name: 'embarques', component: EmbarquesView },
    { path: '/resumen', name: 'resumen', component: ResumenView }
  ]
})

createApp(App).use(router).mount('#app')
