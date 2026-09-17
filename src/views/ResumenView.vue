<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { Embarque } from '../tipos'

const embarques = ref<Embarque[]>([])

onMounted(async () => {
  embarques.value = await (await fetch('/embarques.json')).json()
})

const porEstado = computed(() => {
  const acc: Record<string, number> = {}
  for (const e of embarques.value) {
    const clave = e.estado || 'sin estado'
    acc[clave] = (acc[clave] || 0) + 1
  }
  return Object.entries(acc).sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <section class="resumen">
    <h1>Resumen de operación</h1>
    <p class="nota">Embarques cargados: {{ embarques.length }}</p>
    <ul>
      <li v-for="[estado, total] in porEstado" :key="estado">
        <span>{{ estado }}</span>
        <b>{{ total }}</b>
      </li>
    </ul>
  </section>
</template>
