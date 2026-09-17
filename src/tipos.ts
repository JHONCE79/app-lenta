export interface Embarque {
  id: string
  referencia: string
  cliente: string
  estado: string
  modo: string
  origen: string
  destino: string
  incoterm: string
  etd: string
  eta: string
  documento: string
  contenedores: string[]
  pesoKg: number
  valorFob: number
}

export interface EmbarqueVista extends Embarque {
  diasParaEta: number | null
  estadoLegible: string
  resumenContenedores: string
}
