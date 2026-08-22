# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-ups especiales que aparecen aleatoriamente en el campo

## Power-ups

| Power-up | Efecto | Duración | Color |
| -------- | ------ | -------- | ----- |
| Speed    | Duplica la propulsión de la nave (velocidad de movimiento) | 5 s | Cian |

Los power-ups.derivan lentamente por el campo y envuelven los bordes. Desaparecen a los 10 s si no se recogen. Solo puede haber uno en pantalla a la vez.

## el codigo fuente y comentarios deberan estar en Ingles

## Releases

Los pull requests fusionados en `develop` actualizan automáticamente la versión patch,
publican un prerelease con el tag `vX.Y.Z-dev.N` y despliegan la versión de desarrollo
en GitHub Pages. `N` es el número de ejecución de GitHub Actions. Los cambios directos
en `develop` no publican releases.

Los releases estables se ejecutan manualmente desde `main`. Usan el tag reservado
`vX.Y.Z`, crean un GitHub Release normal y no cambian el despliegue de GitHub Pages.
