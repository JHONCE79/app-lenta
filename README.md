# Embarques · Kila

Vista de embarques de la plataforma. Lista los embarques en tránsito, permite
buscar por cliente o documento, filtrar por estado y ordenar por fecha.

## Correr el proyecto

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Datos

`public/embarques.json` — 50.000 embarques de ejemplo con la forma de un
export de operación.

## Estructura

```
public/embarques.json          los datos
src/
  views/EmbarquesView.vue      la tabla
  views/ResumenView.vue        conteo por estado
  composables/useEmbarques.ts  carga de datos
  tipos.ts                     el tipo Embarque
```
