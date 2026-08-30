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
| `←` `→`   | Rotar nave (cambiar skin en el menú) |
| `↑`       | Propulsar  |
| `Espacio` | Disparar (iniciar partida en el menú) |
| `K`       | Cambiar skin en juego |

## Puntuación

| Asteroide     | Puntos |
| ---------     | ------ |
| Grande        | 20     |
| Mediano       | 50     |
| Pequeño       | 100    |
| Estrella fugaz | 200   |

## Características

- Sistema de skins: cambia la apariencia de la nave desde el menú inicial o con `K` en juego
- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-ups especiales que aparecen aleatoriamente en el campo
- Estrella fugaz: asteroide especial que cruza la pantalla a alta velocidad
- Triple Shot: power-up que dispara 3 balas en abanico durante 5 s
- Escudo: power-up que protege la nave absorbiendo un impacto y rompiéndose

## Estrella fugaz

La estrella fugaz es un asteroide especial que aparece raramente (cada 20–35 s).
Atraviesa la pantalla una sola vez desde un borde hacia el opuesto a ~3× la
velocidad de un asteroide normal, dejando una estela tipo cometa de color
cálido. Otorga **200 puntos** al ser destruida pero no se parte en fragmentos.
Desaparece al salir de la pantalla o a los 6 s. Daña la nave al contacto.

## Skins

El juego arranca en un menú donde se elige el skin de la nave (`←`/`→` para
cambiar, `Espacio` para jugar). Durante la partida la tecla `K` cicla entre los
skins desbloqueados. Los skins se desbloquean alcanzando puntajes máximos
(guardados en `localStorage` junto con el skin elegido).

| Skin    | Desbloqueo | Descripción |
| ------- | ---------- | ----------- |
| Classic | 0          | Silueta blanca clásica |
| Amber   | 1000       | Dardo naranja con llama roja |
| Neon    | 2500       | Flecha fina cian con llama cian |
| Ghost   | 5000       | Diamante gris translúcido |

## Power-ups

| Power-up | Efecto | Duración | Color |
| -------- | ------ | -------- | ----- |
| Speed    | Duplica la propulsión de la nave (velocidad de movimiento) | 5 s | Cian |
| Triple Shot | Dispara 3 balas en abanico por cada disparo | 5 s | Naranja |
| Shield   | Absorbe un golpe de asteroide o estrella fugaz y se rompe | Un golpe | Verde |

Los power-ups (speed, triple shot o shield, elegido al azar) derivan lentamente por el campo y envuelven los bordes. Desaparecen a los 10 s si no se recogen. Solo puede haber uno en pantalla a la vez.

## Escudo

El escudo es un power-up que rodea la nave con una burbuja verde. Absorbe un
único impacto contra un asteroide o estrella fugaz: el escudo se rompe, el
objeto impactado se destruye (otorgando sus puntos) y la nave queda
invencible 1 s. Se pierde al reaparecer o al avanzar de nivel.

## El código fuente y comentarios deberán estar en inglés

## Releases

Los pull requests fusionados en `develop` actualizan automáticamente la versión patch,
publican un prerelease con el tag `vX.Y.Z-dev.N` y despliegan la versión de desarrollo
en GitHub Pages. `N` es el número de ejecución de GitHub Actions. Los cambios directos
en `develop` no publican releases.

Los releases estables se ejecutan manualmente desde `main`. Usan el tag reservado
`vX.Y.Z`, crean un GitHub Release normal y no cambian el despliegue de GitHub Pages.
