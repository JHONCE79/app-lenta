import { describe, expect, it } from 'vitest'
import { filtrarYOrdenarEmbarques } from './embarquesFiltrado'

describe('filtrarYOrdenarEmbarques', () => {
  const embarques = [
    {
      id: '1',
      referencia: 'REF-100',
      cliente: 'Muñoz Logística',
      estado: 'en_transito',
      origen: 'Callao',
      destino: 'Lima',
      documento: 'DOC-01',
      etd: '2025-01-10',
      eta: '2025-02-12',
      pesoKg: 1200,
    },
    {
      id: '2',
      referencia: 'REF-200',
      cliente: 'Acme Chile',
      estado: 'entregado',
      origen: 'Valparaíso',
      destino: 'Santiago',
      documento: 'DOC-02',
      etd: '2025-01-02',
      eta: '',
      pesoKg: 900,
    },
    {
      id: '3',
      referencia: 'REF-300',
      cliente: 'Muñoz Distribución',
      estado: 'pendiente',
      origen: 'Qingdao',
      destino: 'Shanghai',
      documento: 'DOC-03',
      etd: '2025-01-08',
      eta: '2025-01-15',
      pesoKg: 1500,
    }
  ] as any

  it('filtra por cliente ignorando mayúsculas, minúsculas y tildes', () => {
    const resultado = filtrarYOrdenarEmbarques(embarques, 'munoz', '', '', true)

    expect(resultado.map(e => e.id)).toEqual(['1', '3'])
  })

  it('mantiene los embarques sin ETA visibles al ordenar por fecha', () => {
    const resultado = filtrarYOrdenarEmbarques(embarques, '', '', 'eta', true)

    expect(resultado.map(e => e.id)).toEqual(['3', '1', '2'])
    expect(resultado.some(e => e.id === '2')).toBe(true)
  })
})
