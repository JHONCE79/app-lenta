import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Embarque, EmbarqueVista } from '../tipos'

function normalizarTexto(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const DIA = 86400000

export function useEmbarques() {
  const embarques = ref<EmbarqueVista[]>([])
  const cargando = ref(true)
  const anchoVentana = ref(window.innerWidth)
  const vencidos = ref(0)

  let intervaloEta: number | undefined
  let manejarResize: (() => void) | undefined

  function actualizarVencidos() {
    let cuenta = 0
    for (const e of embarques.value) {
      if (e.diasParaEta !== null && e.diasParaEta < 0 && e.estado !== 'entregado') cuenta++
    }
    vencidos.value = cuenta
  }

  onMounted(async () => {
    const respuesta = await fetch('/embarques.json')
    const datos: Embarque[] = await respuesta.json()
    const hoy = Date.now()

    embarques.value = datos.map(e => ({
      ...e,
      contenedores: [...e.contenedores],
      diasParaEta: e.eta ? Math.round((new Date(e.eta + 'T00:00:00').getTime() - hoy) / DIA) : null,
      estadoLegible: (e.estado || 'sin estado').replace(/_/g, ' '),
      resumenContenedores: e.contenedores.length ? e.contenedores.join(', ') : 'sin asignar',
      textoBusqueda: normalizarTexto(`${e.cliente} ${e.referencia} ${e.documento}`),
    }))
    cargando.value = false
    actualizarVencidos()

    manejarResize = () => {
      anchoVentana.value = window.innerWidth
    }
    window.addEventListener('resize', manejarResize)

    intervaloEta = window.setInterval(() => {
      actualizarVencidos()
    }, 3000)
  })

  onBeforeUnmount(() => {
    if (intervaloEta !== undefined) {
      window.clearInterval(intervaloEta)
    }

    if (manejarResize) {
      window.removeEventListener('resize', manejarResize)
    }
  })

  return { embarques, cargando, anchoVentana, vencidos }
}
