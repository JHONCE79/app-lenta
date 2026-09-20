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

## Diagnóstico y mediciones

Las mediciones de Performance se tomaron con el freno de CPU en 4x activo en
DevTools. Cada escenario tiene tres grabaciones. Todas las medidas usan coma
como separador decimal: `362,323 s` significa 362,323 segundos,
aproximadamente 6,04 minutos.

### Carga inicial de la tabla (50.000 embarques)

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 254,870 s | 67,747 s | 33,203 s | 5,946 s | 362,323 s (6,04 min) |
| Prueba 2 | 238,569 s | 67,221 s | 31,962 s | 24,400 s | 362,152 s (6,04 min) |
| Prueba 3 | 254,199 s | 64,281 s | 32,823 s | 3,350 s | 355,809 s (5,93 min) |
| **Promedio inicial** | **249,212 s** | **66,416 s** | **32,662 s** | — | **360,094 s (6,00 min)** |

La línea base mostraba un costo dominante de *scripting*, seguido por el
renderizado y el pintado masivo de la tabla. La carga bloqueaba la pantalla
durante aproximadamente seis minutos.

### Carga después del cambio

Después de extraer el filtrado, virtualizar las filas y preparar el índice de
búsqueda, se obtuvieron estas mediciones sobre los mismos 50.000 embarques:

| Medición | System | Scripting | Rendering | Painting | Loading | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 1,862 s | 1,337 s | 0,040 s | 0,018 s | 0,008 s | 3,588 s |
| Prueba 2 | 1,563 s | 1,404 s | 0,041 s | 0,018 s | 0,008 s | 3,555 s |
| Prueba 3 | 1,701 s | 1,340 s | 0,042 s | 0,020 s | 0,007 s | 3,299 s |
| **Promedio posterior** | **1,709 s** | **1,360 s** | **0,041 s** | **0,019 s** | **0,008 s** | **3,481 s** |

La carga posterior bajó de un promedio de **360,094 s (6,00 min)** a
**3,481 s**, una reducción aproximada del **99,03 %**. El trabajo de
*rendering* y *painting* también quedó reducido; el costo posterior está
principalmente en la preparación de los datos y el trabajo del navegador durante
la carga.

### Búsqueda y filtrado sobre la lista completa

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 213,335 s | 14,979 s | 1,909 s | 5,221 s | 237,427 s (3,96 min) |
| Prueba 2 | 198,742 s | 16,103 s | 2,115 s | 4,987 s | 221,947 s (3,70 min) |
| Prueba 3 | 225,489 s | 13,876 s | 1,998 s | 5,432 s | 246,795 s (4,11 min) |
| **Promedio inicial** | **212,522 s** | **14,986 s** | **2,007 s** | — | **235,389 s (3,92 min)** |

Durante la interacción el hilo principal permanecía ocupado cerca de 235 segundos
en cada grabación de búsqueda, lo que explica que el teclado se atrasara y la
interfaz quedara congelada.

El cambio en `src/composables/useEmbarques.ts` prepara una sola vez el campo
`textoBusqueda` con cliente, referencia y documento normalizados. Luego
`src/lib/embarquesFiltrado.ts` compara el término contra ese campo, en lugar de
normalizar tres textos para cada registro en cada tecla.

Las tres grabaciones posteriores se realizaron buscando `munoz` con la misma
configuración de Performance:

| Medición | Scripting | System | Rendering | Painting | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 2,116 s | 0,696 s | 0,084 s | 0,088 s | 4,799 s |
| Prueba 2 | 1,916 s | 0,666 s | 0,079 s | 0,044 s | 3,790 s |
| Prueba 3 | 1,910 s | 0,549 s | 0,055 s | 0,025 s | 3,919 s |
| **Promedio posterior** | **1,981 s** | **0,637 s** | **0,073 s** | **0,052 s** | **4,169 s** |

La respuesta real del buscador bajó de **235,389 s (3,92 min)** a
**4,169 s**, una reducción aproximada del **98,23 %**. El scripting sigue
siendo el mayor costo, pero ya no bloquea la interfaz durante minutos.

Además, un benchmark controlado sobre los 50.000 registros, con 20 búsquedas de
`munoz`, dio estos resultados aislando la lógica de filtrado:

| Implementación | Promedio por búsqueda |
| --- | ---: |
| Normalización en cada filtro | 147,89 ms |
| Texto normalizado precalculado | 5,79 ms |
| **Reducción** | **96,08 %** |

El benchmark de la función y la medición de Performance son complementarios: el
primero demuestra el costo del algoritmo y la segunda demuestra el efecto en la
interacción completa del navegador.

### Memoria: entrar y salir de Embarques

Después de ejecutar Garbage Collection, los snapshots fueron:

| Momento | Memoria |
| --- | ---: |
| Inicial | 34,8 MB |
| Después de 20 ciclos | 49,0 MB |
| Segunda ronda | 51,4 MB |
| Repetición posterior | 51,4 MB |

La memoria aumentó durante la primera carga, pero permaneció estable en 51,4 MB
después de otra ronda y otra ejecución de Garbage Collection. En los 40 ciclos
observados no hubo crecimiento sostenido. El composable libera el `setInterval`
y el listener de `resize` en `onBeforeUnmount`, evitando que la vista conserve
esos recursos al desmontarse.

## Tests y compatibilidad

La lógica de filtrado vive fuera de los componentes en
`src/lib/embarquesFiltrado.ts` y tiene tests para:

- búsqueda ignorando mayúsculas, minúsculas y tildes (`muñoz` / `munoz`);
- ordenamiento por ETA conservando registros sin ETA.

Comandos verificados:

```bash
npm test
npm run build
```

## Segunda pasada

Repetiría la medición de carga con una recarga limpia y un protocolo idéntico
para resolver la diferencia entre las líneas base registradas. Después evaluaría
evitar la carga completa de datos cuando la pantalla se abre, cancelar el
`fetch` al desmontar el composable y paginar o consultar los embarques desde el
servidor. También agregaría una medición automatizada de interacción para evitar
depender únicamente de lecturas manuales de DevTools.

## Uso de IA

Se utilizó IA como apoyo para revisar el código, proponer hipótesis de rendimiento,
implementar cambios acotados y redactar parte de este informe. Las decisiones,
mediciones y validaciones fueron revisadas sobre este repositorio.
