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

## Línea base de rendimiento

Mediciones tomadas antes de modificar la implementación, con el freno de CPU en 4x
activo en DevTools. Los valores son tres grabaciones por escenario y el
promedio reportado corresponde al estado inicial.

### Carga inicial de la tabla (50.000 embarques)

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 254.870 ms | 67.747 ms | 33.203 ms | 5.946 ms | 362.323 ms (6,03 min) |
| Prueba 2 | 238.569 ms | 67.221 ms | 31.962 ms | 24.400 ms | 362.152 ms (6,03 min) |
| Prueba 3 | 254.199 ms | 64.281 ms | 32.823 ms | 3.350 ms | 355.809 ms (5,93 min) |
| **Promedio inicial** | **249.212 ms** | **66.416 ms** | **32.662 ms** | — | **360.094 ms (~6 min)** |

La carga queda bloqueada aproximadamente seis minutos. El mayor costo está en
*scripting*, seguido por el renderizado y pintado masivo de la tabla.

### Búsqueda y filtrado sobre la lista completa

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 213.335 ms | 14.979 ms | 1.909 ms | 5.221 ms | 237.427 ms (3,95 min) |
| Prueba 2 | 198.742 ms | 16.103 ms | 2.115 ms | 4.987 ms | 221.947 ms (3,69 min) |
| Prueba 3 | 225.489 ms | 13.876 ms | 1.998 ms | 5.432 ms | 246.795 ms (4,11 min) |
| **Promedio inicial** | **212.522 ms** | **14.986 ms** | **2.007 ms** | — | **235.389 ms (~3,9 min)** |

Durante la interacción el hilo principal permanece ocupado cerca de 3,9
minutos, lo que explica el atraso visible al escribir en el buscador.

### Memoria: entrar y salir de Embarques

Al repetir la navegación de entrada y salida de la pantalla, Chrome terminó la
pestaña con el mensaje **Out of Memory** / **Render process gone**. Es un fallo
crítico de la línea base: el proceso de renderizado agotó la memoria disponible,
por lo que no fue posible completar la prueba de veinte ciclos ni obtener una
curva final de memoria. Esta evidencia se usará como referencia para comprobar
que la corrección no mantenga memoria al desmontar la vista.
