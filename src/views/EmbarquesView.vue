<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEmbarques } from '../composables/useEmbarques'
import type { EmbarqueVista } from '../tipos'

const { embarques, cargando, vencidos } = useEmbarques()

const busqueda = ref('')
const estadoSeleccionado = ref('')
const ordenCampo = ref<'etd' | 'eta' | ''>('')
const ordenAsc = ref(true)

const ESTADOS = ['pendiente', 'en_transito', 'en_puerto', 'nacionalizacion', 'entregado', 'cancelado']

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function embarquesVisibles(): EmbarqueVista[] {
  let lista = embarques.value

  if (busqueda.value) {
    const q = normalizar(busqueda.value)
    lista = lista.filter(e =>
      normalizar(e.cliente).includes(q) ||
      normalizar(e.referencia).includes(q) ||
      normalizar(e.documento).includes(q)
    )
  }

  if (estadoSeleccionado.value) {
    lista = lista.filter(e => e.estado === estadoSeleccionado.value)
  }

  if (!ordenCampo.value) return lista

  const campo = ordenCampo.value
  return [...lista].sort((a, b) => {
    const va = a[campo] || ''
    const vb = b[campo] || ''
    return ordenAsc.value ? va.localeCompare(vb) : vb.localeCompare(va)
  })
}

function formatearFecha(iso: string) {
  if (!iso) return '—'
  const formato = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  return formato.format(new Date(iso + 'T00:00:00'))
}

function formatearPeso(kg: number) {
  const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })
  return formato.format(kg) + ' kg'
}

function ordenarPor(campo: 'etd' | 'eta') {
  if (ordenCampo.value === campo) ordenAsc.value = !ordenAsc.value
  else { ordenCampo.value = campo; ordenAsc.value = true }
}

watch(embarques, () => {
  console.log('embarques actualizados:', embarques.value.length)
}, { deep: true })
</script>

<template>
  <section class="vista">
    <header class="encabezado">
      <h1>Embarques</h1>
      <span class="vencidos" v-if="vencidos">{{ vencidos }} con ETA vencida</span>
    </header>

    <div class="controles">
      <input v-model="busqueda" type="search" placeholder="Buscar por cliente, referencia o documento" />
      <select v-model="estadoSeleccionado">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
      </select>
      <span class="conteo">{{ embarquesVisibles().length }} de {{ embarques.length }}</span>
    </div>

    <p v-if="cargando" class="nota">Cargando…</p>

    <div v-else class="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Embarque</th>
            <th>Referencia</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Destino</th>
            <th class="orden" @click="ordenarPor('etd')">ETD</th>
            <th class="orden" @click="ordenarPor('eta')">ETA</th>
            <th>Documento</th>
            <th>Peso</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, i) in embarquesVisibles()" :key="i">
            <td>{{ e.id }}</td>
            <td>{{ e.referencia }}</td>
            <td>{{ e.cliente }}</td>
            <td><span class="pill">{{ e.estadoLegible }}</span></td>
            <td>{{ e.origen }}</td>
            <td>{{ e.destino }}</td>
            <td>{{ formatearFecha(e.etd) }}</td>
            <td>{{ formatearFecha(e.eta) }}</td>
            <td>{{ e.documento }}</td>
            <td>{{ formatearPeso(e.pesoKg) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
