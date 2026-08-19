# Editor de Video en el guion `.md`

El editor de video del TTS Studio se controla desde el mismo guion `.md`.
Cada video se construye con **diálogos** (`@Personaje: texto`) y **directivas de timeline**
(`!start` / `!end`), y el **estilo visual** se define con un archivo **CSS** referenciado en el frontmatter.

---

## 1. Estructura del guion

```markdown
---
title: Mi video
characters:
  - name: Narrador
    voice: Jorge
    service: loquendo
styles: ./estilos.css
---

@Narrador: Hola, este es mi primer video.

!start:img:gato url="./gato.png"
@Narrador: Esto es un gato.
!end:gato
```

- **Frontmatter YAML** (entre `---`): configuración y personajes.
- **`styles:`**: ruta al archivo CSS del proyecto (relativa a la carpeta seleccionada).
- Los diálogos y directivas se mezclan en el **orden en que se reproducen**.

---

## 2. Diálogos

```markdown
@Narrador: Hola
@Zundamon: おはよう！
```

- El diálogo ocupa el tiempo de su **audio TTS** (se genera automáticamente al reproducir).
- Los personajes deben existir en el frontmatter (`characters`).

---

## 3. Directivas de timeline

Una directiva crea una **capa** que aparece y desaparece:

```
!start:<tipo>:<id> param=valor param=valor ...
!end:<id>
```

| Tipo    | Descripción                        | Params funcionales              |
|---------|------------------------------------|---------------------------------|
| `img`   | Imagen en pantalla                 | `url`                           |
| `sub`   | Subtítulo / texto                  | `text`                          |
| `bg`    | Capa de color / fondo              | (ninguno, se estila en CSS)     |
| `audio` | Pista de música                    | `url`, `volume`                 |

### Reglas del timeline

1. El reloj **avanza con los diálogos** (cada `@Personaje` suma la duración de su audio).
2. Una capa está activa desde su `!start` hasta su `!end`.
3. Varias capas pueden estar activas a la vez (se superponen por `z-index`).
4. `!end` de un id no iniciado genera un aviso, no rompe el video.
5. Sin `!end`, la capa se cierra al final del video (o usa `dur=` para cerrarla sola).

### Ejemplo con superposición

```markdown
@Narrador: Que es esto?
!start:img:img-gato url="./gato.png"
!start:sub:sub1 text="buenos días"
@Zundamon: おはよう！
!end:sub1
!end:img-gato
```

Resultado: el gato aparece con el subtítulo encima mientras Zundamon habla.

### Clips sin voz (`dur=`)

```markdown
!start:img:portada url="./portada.png" dur=1500
```

Muestra `portada.png` por **1500 ms** sin necesidad de `!end`.

### Música de fondo

```markdown
!start:audio:musica url="./bgm.mp3" volume=0.5
@Narrador: ...varias líneas...
!end:musica
```

La música suena en **loop** desde su `!start` hasta su `!end`. `volume` va de `0` a `1`.

---

## 4. Params permitidos (solo funcionales)

| Param    | Se usa en | Descripción                            |
|----------|-----------|----------------------------------------|
| `url`    | img, audio | Ruta del archivo o URL http(s)        |
| `text`   | sub       | Texto del subtítulo (con comillas si lleva espacios) |
| `dur`    | todos     | Duración en ms (cierra la capa sola)   |
| `volume` | audio     | Volumen `0..1`                         |

> Los valores con espacios van entre comillas: `text="buenos días"`.

Nada de estilo en las directivas: **todo lo visual va en el CSS** usando el `id` como selector.

---

## 5. Estilos con CSS

El frontmatter referencia un archivo CSS:

```yaml
styles: ./estilos.css
```

Cada capa se estiliza con su `id` como selector `#id`:

```css
:root {
  --video-width: 1280;
  --video-height: 720;
  --fps: 30;
  --video-bg: #000;
}

#img-gato {
  object-fit: cover;      /* cover | contain | fill */
  z-index: 1;
  animation: fadeIn 0.6s ease-out;
}

#sub1 {
  font-size: 48px;
  color: #ffffff;
  top: 80%;
  left: 0;
  right: 0;
  height: 100px;
  text-align: center;
  z-index: 2;
}

#fondo {
  background: linear-gradient(#1c1c28, #000);
  z-index: 0;
}
```

### Configuración global (`:root`)

| Variable          | Default | Descripción                          |
|-------------------|---------|--------------------------------------|
| `--video-width`   | `1280`  | Ancho del video                      |
| `--video-height`  | `720`   | Alto del video                       |
| `--fps`           | `30`    | Frames por segundo                   |
| `--video-bg`      | `#000`  | Color de fondo del video             |

> La resolución también puede elegirse desde el selector de la UI (horizontal, vertical, cuadrado).

### Propiedades soportadas (subconjunto)

- **Layout**: `top`, `left`, `right`, `bottom`, `width`, `height` (px o `%`).
- **Apariencia**: `color`, `background` (sólido o `linear-gradient`), `font-size`, `font-family`, `text-align`, `object-fit`.
- **Apilado**: `z-index`.
- **Animaciones**: `animation` (nombre + duración) con `@keyframes`.

### Animaciones con `@keyframes`

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

@keyframes slideLeft {
  from { transform: translateX(200px); }
  to   { transform: translateX(0); }
}

#img-gato { animation: fadeIn 0.6s ease-out; }
#zoom     { animation: zoomIn 1s ease-out; }
```

Se interpolan propiedades numéricas (`opacity`, `font-size`, `top`, `left`, `width`, `height`)
y `transform` (`translate`, `scale`, `rotate`).

---

## 6. Carpeta del proyecto

El editor usa la **API de File System Access** (como vscode.dev):

1. Clic en **"Abrir carpeta"** en el editor de video.
2. Selecciona la carpeta del proyecto.
3. Las rutas `./archivo.png`, `./musica.mp3` y el CSS se resuelven desde ahí.

- Las **URLs http(s)** funcionan sin carpeta.
- En navegadores sin soporte (p. ej. Firefox), usa URLs http.

---

## 7. Exportar

El botón **"Exportar WebM"** genera un `.webm` con:

- La composición de capas y animaciones (Canvas + MediaRecorder).
- Las **voces TTS** de cada diálogo (se generan automáticamente si faltan).
- La **música** `!start:audio` mezclada.

El export corre en tiempo real (dura lo que dura el video).

---

## 8. Ejemplo completo

```markdown
---
title: Demo vertical
characters:
  - name: Narrador
    voice: Jorge
    service: loquendo
  - name: Zundamon
    voice: 5
    service: voicebox
styles: ./estilos.css
---

!start:bg:fondo
!start:img:portada url="./portada.png" dur=2000
!start:audio:musica url="./bgm.mp3" volume=0.4

@Narrador: Bienvenidos al video de hoy.

!start:img:gato url="./gato.png"
@Narrador: Esto es un gato.
!end:gato

!start:sub:sub1 text="おはよう！"
@Zundamon: おはよう！
!end:sub1

!end:audio
!end:bg
```

```css
:root {
  --video-width: 1080;
  --video-height: 1920;
  --fps: 30;
  --video-bg: #0d0d14;
}

#fondo   { background: linear-gradient(#1c1c28, #0d0d14); z-index: 0; }
#portada { object-fit: cover; z-index: 1; animation: fadeIn 0.8s; }
#gato    { object-fit: contain; z-index: 1; top: 15%; left: 10%; right: 10%; height: 60%; animation: zoomIn 0.6s; }
#sub1    { font-size: 64px; color: #ffffff; top: 85%; left: 0; right: 0; text-align: center; z-index: 3; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```