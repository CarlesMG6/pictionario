# Pictionario Online

Pictionario online multijugador: crea una sala desde el PC y únete con tu móvil para jugar en tiempo real con amigos. El sistema gestiona turnos, tablero, dado animado, temporizador, categorías y palabras, todo sincronizado mediante Firebase/Firestore.

---

## Stack Tecnológico

- **Next.js** (React, app directory, SSR/SSG)
- **Firebase Firestore** (base de datos en tiempo real)
- **Firebase Hosting** (opcional, recomendado Vercel)
- **TailwindCSS** (estilos y diseño responsive)
- **Animaciones 3D**: dado animado con CSS/React
- **Vercel** (despliegue recomendado, SSR compatible)

---

## Instalación y Despliegue

1. **Clona el repositorio:**
   ```bash
   git clone <repo-url>
   cd pictionario
   ```

2. **Instala dependencias:**
   ```bash
   npm install
   # o yarn install
   ```

3. **Configura Firebase:**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
   - Habilita Firestore Database.
   - Obtén las credenciales web y copia el objeto de configuración en `src/firebaseClient.js`.

4. **Arranca en desarrollo:**
   ```bash
   npm run dev
   # o yarn dev
   ```
   Accede a [http://localhost:3000](http://localhost:3000)

5. **Despliegue en Vercel:**
   - Sube el repo a GitHub.
   - Conecta el repo en [Vercel](https://vercel.com/), añade las variables de entorno de Firebase.
   - Deploy automático.

---

## Funcionamiento y Flujo de Juego

### 1. Crear y Unirse a una Sala
- Un jugador (host) crea una sala desde el PC.
- Los demás se unen escaneando el QR o introduciendo el código desde el móvil.
- El host configura categorías, duración y equipos.

### 2. Turnos y Tablero
- El tablero se genera alternando las categorías seleccionadas.
- Cada equipo tiene una pieza con icono personalizado.
- El turno avanza automáticamente entre equipos.

### 3. Tirada de Dado y Movimiento
- El host tira el dado (animación 3D).
- Tras la animación, la pieza del equipo se mueve suavemente a la nueva casilla.
- Si se rebasa la meta, la pieza rebota hacia atrás.

### 4. Categorías y Palabras
- Cada casilla tiene una categoría (color y nombre).
- Se muestra una palabra aleatoria de la categoría para que el equipo la dibuje.
- Hay rondas "¡Todos juegan!" (all_play) con probabilidad 1/3 en categorías normales.

### 5. Temporizador y Sonidos
- El host inicia el temporizador (cuenta atrás visual y sonora).
- Avisos sonoros en los últimos segundos y al finalizar el tiempo.
- Barra de progreso SVG animada.

### 6. Experiencia Visual
- Animación de dado 3D y movimiento de piezas.
- UI adaptada a móvil y escritorio.
- Colores y mensajes contextuales según fase y turno.

---

## Personalización
- Palabras y categorías centralizadas en `src/utils/CategoryWords.js`.
- Puedes editar o añadir nuevas categorías fácilmente.

---

## Notas
- El sistema es reactivo: todos los jugadores ven los cambios en tiempo real.
- No requiere backend propio, solo una cuenta de Firebase.
- Compatible con despliegue en Vercel (SSR listo para producción).

---

¿Dudas? Abre un issue o contacta al autor.
