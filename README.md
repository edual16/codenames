# Código Secreto

Versión web no oficial del juego Código Secreto, para jugar con amigos cuando no llevamos el juego físico.

La aplicación tiene dos páginas independientes, adaptadas a móvil, tablet y PC. Está hecha con HTML, CSS y JavaScript nativos, sin instalación de paquetes ni compilación.

## Uso

- **Tablero:** abre `/` en el PC o tablet que verán los jugadores. Al entrar aparece el creador de partidas, donde eliges el mazo; las palabras se muestran en mayúsculas mediante CSS.
- **Pistas:** los capitanes abren `/pistas.html?id=0` en sus móviles, sustituyendo `0` por el ID de la partida. El botón del QR del tablero comparte esa misma ficha con ambos móviles.
- Las páginas no tienen navegación entre ellas. El QR se usa para abrir las pistas en otro dispositivo.
- Pulsa una tarjeta para recorrer los estados: sin marcar, roja, azul, neutra, negra y sin marcar. No hay revelado automático ni selección de texto al pulsar rápidamente.
- **Validar** compara solo las tarjetas marcadas, incluidas las neutras. Las incorrectas tienen un borde; el mensaje junto al botón indica si las marcadas coinciden. Las pendientes no se descubren.
- El tablero guarda palabras, mazo, ficha y marcas en `localStorage`. El creador recuerda el último mazo utilizado. Al recargar puedes continuar la partida guardada o crear otra; sustituirla requiere pulsar Crear partida.
- Cambiar ficha, junto al ID de ficha del tablero, permite introducir el ID de los capitanes sin cambiar las palabras ni las marcas. Actualiza el QR y la validación, y guarda la nueva ficha. No se sincronizan los dispositivos automáticamente: ambos capitanes deben usar el mismo ID que el tablero.
- Los diálogos no se cierran al pulsar fuera; usa sus botones o Escape (salvo al crear la primera partida).
- El botón del QR queda resaltado mientras el panel compartido está desplegado. Si ya tienes una partida, puedes cerrar el creador con Continuar partida, Cancelar o Escape; sin partida guardada, debes crear una antes de jugar.
- El botón de ampliar junto al equipo inicial activa el modo foco: solo muestra el tablero, ajustado a la pantalla y con desplazamiento si hace falta. Vuelve con el botón de reducir o Escape, sin cambiar la partida.
- Las pistas permiten elegir el ID, abrir una ficha aleatoria y ocultar temporalmente el mapa. El botón aleatorio pide confirmación antes de sustituir la ficha actual; cancelar conserva el mapa y el ID. Ambos tableros mantienen la misma orientación 5×5.

Los jugadores llevan los turnos y las reglas; no hay servidor, cuentas ni sincronización de movimientos. Las fichas son datos públicos, no una protección contra consultar el mapa secreto.

## Desarrollo y publicación

Abre el proyecto con **Live Server** de VS Code (Go Live):

- Tablero: `http://127.0.0.1:5500/`
- Pistas: `http://127.0.0.1:5500/pistas.html?id=0`

Usa un servidor HTTP, no abras los HTML con `file://`: los módulos y la carga de JSON necesitan HTTP.
Para escanear el QR con móviles, abre el tablero usando la IP del PC en la red local, por ejemplo `http://192.168.1.20:5500/`; `127.0.0.1` apunta al propio dispositivo. Permite el acceso a Live Server en la red privada si el firewall lo bloquea. Copiar el enlace puede requerir HTTPS; si falla, el campo permite copiarlo manualmente.

GitHub Pages puede publicar estos archivos directamente desde la rama y carpeta elegidas, sin pasos de instalación o build. Las rutas relativas funcionan tanto en la raíz como bajo `/codenames/`. No hay dependencias de CDN ni configuración de testing.

## Estructura

```text
index.html                  Tablero público
pistas.html                 Ficha secreta para capitanes
generateClues.ps1           Generador offline de fichas
data/
	clues.json                Fichas usadas por ambas páginas
	words/
		normal.json             Castellano general
		english.json            Inglés general
		infantil.json           Palabras básicas (3-6 años)
		peliculas-infantiles.json Películas y personajes infantiles
		peliculas.json          Películas y personajes generales
scripts/
	board.js                  Estado, marcado, validación, persistencia y QR
	clues.js                  Selección y presentación de pistas
	game.js                   Lógica y carga de datos compartidas
	vendor/                   Biblioteca QR local y su licencia
styles/
	base.css                  Estilos comunes
	board.css                 Tablero responsive
	clues.css                 Pistas responsive
assets/
	icons/                    Iconos locales y su licencia
```

Los diccionarios son arrays JSON de palabras. Conservan su capitalización original; el estilo aplica las mayúsculas. Cada ficha es una cadena de 25 letras en orden por filas: `R` roja, `B` azul, `G` neutra y `K` negra. Su posición en el array es el ID, empezando en cero.

## Mazos

Los archivos de `data/words/` se identifican por mazo, sin prefijo `word.` ni sufijo de idioma. El catálogo `DECKS` de `scripts/game.js` relaciona cada ID con su nombre visible y archivo.

- **Normal:** 400 palabras en castellano.
- **English:** 400 palabras en inglés.
- **Infantil:** 100 palabras cotidianas de animales, alimentos, objetos y naturaleza, pensadas para niños de 3 a 6 años. Los más pequeños pueden necesitar ayuda para leerlas.
- **Películas infantiles:** 90 títulos y personajes familiares.
- **Películas:** 120 títulos y personajes de cine general.

Cada mazo necesita al menos 25 entradas distintas para formar el tablero. Para añadir uno, crea su JSON y registra un ID único, nombre y archivo en `DECKS`; aparecerá en el creador. Mantén los IDs estables para recuperar partidas y recordar la elección anterior. Las partidas antiguas de castellano e inglés se recuperan como Normal y English, conservando sus palabras y marcas.

## Generar fichas

Desde PowerShell, en la raíz del proyecto:

```powershell
.\generateClues.ps1 -Count 300
```

Genera `data/clues.generated.json` sin modificar las fichas actuales. La cantidad debe ser par, entre 2 y 10000. Las fichas son únicas y aleatorias: exactamente la mitad tienen 9 rojas y 8 azules; la otra mitad, 8 rojas y 9 azules. Todas tienen 7 neutras y 1 negra. También se baraja el orden final para no agruparlas por equipo inicial.

Para elegir otro destino o reemplazar explícitamente uno existente:

```powershell
.\generateClues.ps1 -Count 600 -OutputPath .\data\clues.generated.json -Force
```

Revisa el archivo generado antes de sustituir `data/clues.json`. No lo reemplaces durante partidas en curso: cambiaría el significado de los IDs y de los QR compartidos. El tablero detecta si una partida guardada ya no coincide y permite cambiar la ficha o crear otra antes de compartir.

## Recursos

La biblioteca QR y los iconos se sirven localmente. Sus avisos de licencia están junto a los recursos en `scripts/vendor/` y `assets/icons/`.
