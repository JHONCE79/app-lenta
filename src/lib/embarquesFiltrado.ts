import type { EmbarqueVista } from '../tipos'

export function normalizarTexto(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function filtrarYOrdenarEmbarques(
  lista: EmbarqueVista[],
  busqueda: string,
  estadoSeleccionado: string,
  ordenCampo: 'etd' | 'eta' | '',
  ordenAsc: boolean,
) {
  let resultado = lista

  if (busqueda) {
    const q = normalizarTexto(busqueda)
    resultado = resultado.filter(e =>
      (e.textoBusqueda || normalizarTexto(`${e.cliente} ${e.referencia} ${e.documento}`)).includes(q),
    )
  }

  if (estadoSeleccionado) {
    resultado = resultado.filter(e => e.estado === estadoSeleccionado)
  }

  if (!ordenCampo) return resultado

  const campo = ordenCampo
  return [...resultado].sort((a, b) => {
    const va = a[campo] || ''
    const vb = b[campo] || ''

    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1

    return ordenAsc ? va.localeCompare(vb) : vb.localeCompare(va)
  })
}
