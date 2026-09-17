<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <nav class="nav">
      <span class="marca">Kila</span>
      <RouterLink to="/embarques">Embarques</RouterLink>
      <RouterLink to="/resumen">Resumen</RouterLink>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>
