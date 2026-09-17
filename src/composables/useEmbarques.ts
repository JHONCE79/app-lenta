import { ref, onMounted } from 'vue'
import type { Embarque, EmbarqueVista } from '../tipos'

const DIA = 86400000

export function useEmbarques() {
  const embarques = ref<EmbarqueVista[]>([])
  const cargando = ref(true)
  const anchoVentana = ref(window.innerWidth)
  const vencidos = ref(0)

  onMounted(async () => {
    const respuesta = await fetch('/embarques.json')
    const datos: Embarque[] = await respuesta.json()
    const hoy = Date.now()

    // La tabla necesita campos que el export no trae: días restantes,
    // el estado en texto legible y el resumen de contenedores.
    embarques.value = datos.map(e => ({
      ...e,
      contenedores: [...e.contenedores],
      diasParaEta: e.eta ? Math.round((new Date(e.eta + 'T00:00:00').getTime() - hoy) / DIA) : null,
      estadoLegible: (e.estado || 'sin estado').replace(/_/g, ' '),
      resumenContenedores: e.contenedores.length ? e.contenedores.join(', ') : 'sin asignar'
    }))
    cargando.value = false

    // La tabla ajusta el número de columnas visibles según el ancho.
    window.addEventListener('resize', () => {
      anchoVentana.value = window.innerWidth
      if (embarques.value.length > 0) {
        anchoVentana.value = window.innerWidth
      }
    })

    // Revisa periódicamente qué embarques ya pasaron su ETA.
    setInterval(() => {
      let cuenta = 0
      for (const e of embarques.value) {
        if (e.diasParaEta !== null && e.diasParaEta < 0 && e.estado !== 'entregado') cuenta++
      }
      vencidos.value = cuenta
    }, 3000)
  })

  return { embarques, cargando, anchoVentana, vencidos }
}
