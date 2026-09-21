# Embarques · Kila

Una vista simple para revisar embarques en tránsito. Acá se listan los movimientos,
se puede buscar por cliente o documento, filtrar por estado y ordenar por fecha sin
perderse en una tabla enorme.

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Después, abrí esta URL en el navegador:

http://localhost:5173

## Datos

El archivo `public/embarques.json` contiene 50.000 embarques de ejemplo, con un formato
parecido al export de operación real.

## Estructura

```
public/embarques.json          datos de ejemplo
src/
  views/EmbarquesView.vue      tabla principal
  views/ResumenView.vue        resumen por estado
  composables/useEmbarques.ts  carga y manejo de datos
  tipos.ts                     definición de Embarque
```

## Diagnóstico y mediciones

Las mediciones de Performance se tomaron con el freno de CPU en 4x activo en DevTools.
Cada escenario se grabó tres veces. En todos los casos, los tiempos usan coma como
separador decimal: `362,323 s` equivale a 362,323 segundos, o unos 6,04 minutos.

### Carga inicial de la tabla (50.000 embarques)

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 254,870 s | 67,747 s | 33,203 s | 5,946 s | 362,323 s (6,04 min) |
| Prueba 2 | 238,569 s | 67,221 s | 31,962 s | 24,400 s | 362,152 s (6,04 min) |
| Prueba 3 | 254,199 s | 64,281 s | 32,823 s | 3,350 s | 355,809 s (5,93 min) |
| **Promedio inicial** | **249,212 s** | **66,416 s** | **32,662 s** | — | **360,094 s (6,00 min)** |

La línea base tenía un problema claro: el costo más grande venía de *scripting*,
seguido por el render y el pintado masivo de la tabla. En la práctica, la pantalla
quedaba bloqueada durante casi seis minutos al abrirse la vista.

### Carga después del cambio

Después de sacar el filtrado de la vista, virtualizar las filas y preparar un índice
de búsqueda, volvimos a medir lo mismo con los mismos 50.000 embarques:

| Medición | System | Scripting | Rendering | Painting | Loading | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 1,862 s | 1,337 s | 0,040 s | 0,018 s | 0,008 s | 3,588 s |
| Prueba 2 | 1,563 s | 1,404 s | 0,041 s | 0,018 s | 0,008 s | 3,555 s |
| Prueba 3 | 1,701 s | 1,340 s | 0,042 s | 0,020 s | 0,007 s | 3,299 s |
| **Promedio posterior** | **1,709 s** | **1,360 s** | **0,041 s** | **0,019 s** | **0,008 s** | **3,481 s** |

La diferencia fue enorme: bajamos de un promedio de **360,094 s (6,00 min)** a
**3,481 s**, una reducción aproximada del **99,03 %**. El trabajo de *rendering* y
*painting* también cayó bastante, y el costo restante quedó más concentrado en preparar
los datos y en la actividad del navegador durante la carga.

### Búsqueda y filtrado sobre la lista completa

| Medición | Scripting | Rendering | Painting | System | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 213,335 s | 14,979 s | 1,909 s | 5,221 s | 237,427 s (3,96 min) |
| Prueba 2 | 198,742 s | 16,103 s | 2,115 s | 4,987 s | 221,947 s (3,70 min) |
| Prueba 3 | 225,489 s | 13,876 s | 1,998 s | 5,432 s | 246,795 s (4,11 min) |
| **Promedio inicial** | **212,522 s** | **14,986 s** | **2,007 s** | — | **235,389 s (3,92 min)** |

Mientras se escribía en el buscador, el hilo principal seguía ocupado cerca de 235
segundos por grabación. Eso explicaba por qué el teclado se retrasaba y la interfaz
se volvía casi imposible de usar.

La mejora estuvo en `src/composables/useEmbarques.ts`: se preparó una sola vez el campo
`textoBusqueda` con cliente, referencia y documento normalizados. Después, en
`src/lib/embarquesFiltrado.ts`, el filtro compara contra ese texto ya listo en lugar
de normalizar tres cadenas para cada registro en cada tecla.

Las tres grabaciones posteriores se hicieron buscando `munoz` con la misma configuración:

| Medición | Scripting | System | Rendering | Painting | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prueba 1 | 2,116 s | 0,696 s | 0,084 s | 0,088 s | 4,799 s |
| Prueba 2 | 1,916 s | 0,666 s | 0,079 s | 0,044 s | 3,790 s |
| Prueba 3 | 1,910 s | 0,549 s | 0,055 s | 0,025 s | 3,919 s |
| **Promedio posterior** | **1,981 s** | **0,637 s** | **0,073 s** | **0,052 s** | **4,169 s** |

La respuesta real del buscador bajó de **235,389 s (3,92 min)** a **4,169 s**, una
reducción aproximada del **98,23 %**. El scripting sigue siendo el mayor costo, pero ya
no bloquea la interfaz durante minutos.

Además, un benchmark controlado con los 50.000 registros y 20 búsquedas de `munoz`
dio estos resultados aislando la lógica de filtrado:

| Implementación | Promedio por búsqueda |
| --- | ---: |
| Normalización en cada filtro | 147,89 ms |
| Texto normalizado precalculado | 5,79 ms |
| **Reducción** | **96,08 %** |

El benchmark de la función y la medición de Performance se complementan: uno muestra
el costo del algoritmo; el otro, el impacto real en la experiencia del usuario.

### Memoria: entrar y salir de Embarques

Después de ejecutar Garbage Collection, estos fueron los snapshots:

| Momento | Memoria |
| --- | ---: |
| Inicial | 34,8 MB |
| Después de 20 ciclos | 49,0 MB |
| Segunda ronda | 51,4 MB |
| Repetición posterior | 51,4 MB |

La memoria subió durante la primera carga, pero luego quedó estable en 51,4 MB tras
otra ronda y otra ejecución de Garbage Collection. En los 40 ciclos observados no hubo
crecimiento sostenido. El composable libera el `setInterval` y el listener de `resize`
en `onBeforeUnmount`, así la vista no se queda con esos recursos al desmontarse.

## Tests y compatibilidad

La lógica de filtrado quedó fuera de los componentes, en `src/lib/embarquesFiltrado.ts`,
y cuenta con tests para:

- búsqueda ignorando mayúsculas, minúsculas y tildes (`muñoz` / `munoz`);
- ordenamiento por ETA conservando registros sin ETA.

Comandos verificados:

```bash
npm test
npm run build
```

## Segunda pasada

Repetiría la medición de carga con una recarga limpia y un protocolo idéntico para
resolver la diferencia entre las líneas base registradas. Después evaluaría evitar la
carga completa de datos cuando se abre la pantalla, cancelar el `fetch` al desmontar el
composable y paginar o consultar los embarques desde el servidor. También agregaría una
medición automatizada de interacción para no depender solo de lecturas manuales en DevTools.

## Uso de IA

Se utilizó IA como apoyo para revisar el código, plantear hipótesis de rendimiento,
implementar cambios acotados y redactar parte de este informe. Las decisiones,
mediciones y validaciones fueron revisadas sobre este repositorio.
