# Reserva de citas médicas · demo

Prototipo frontend (React + Vite + Tailwind) de un sistema de reservas de citas médicas: Inicio, Reservar cita y Mis reservas, con barra lateral.

> **Esta es la copia para el portafolio** de [Cesar-diaz1347/Reservas-Front](https://github.com/Cesar-diaz1347/Reservas-Front). En lugar de los datos fijos y los comentarios `BACKEND:` del original, las pantallas usan una API simulada en el navegador (`src/services/`). Los cambios están en `../ORIGEN.md`.

## Qué hace

- **Inicio:** estado de la semana que todavía se puede gestionar (3 días reservados y 2 pendientes de ejemplo) y accesos rápidos.
- **Reservar cita:** sede, fecha y servicio (dermatología, pediatría, medicina general u oftalmología). La fecha parte de la primera fecha reservable (según el plazo del jueves a las 5:00 p.m.), y los fines de semana no tienen servicio.
- **Selector de fecha:** un calendario propio (`SelectorFecha.jsx`) que se abre con un clic en cualquier parte del campo y mide lo mismo que él. Los días anteriores a la primera fecha reservable salen atenuados y no se pueden elegir. Con teclado: ↓ abre desde el campo; flechas, Inicio, Fin y RePág / AvPág (Mayús: año) mueven el día; Enter o Espacio eligen; Esc cierra.
- **Mis reservas:** calendario por mes. Cancelar pide confirmación y solo se puede hasta el límite de gestión.
- **Demo:** los cambios se guardan en `localStorage` (clave `reservas.demo.v2`); «Reiniciar demo» borra solo esa clave.

## Estructura

```text
src/
  main.jsx                  punto de entrada de React
  App.jsx                   layout, tema, navegación y refresco de datos
  index.css                 directivas de Tailwind, foco visible y movimiento reducido
  hooks/useRecurso.js       carga asíncrona con estados cargando / error / listo
  services/
    reglas.js               calendario, plazo de gestión y servicios del día (funciones puras)
    reservasApi.js          API simulada (latencia 250 a 600 ms, datos en localStorage)
    *.test.js               pruebas con node --test
  utils/
    calendar.js             fechas del calendario: días visibles del mes, sumar meses y teclas de navegación
    calendar.test.js        pruebas con node --test
  components/
    Sidebar.jsx Header.jsx DemoBanner.jsx SesionCerrada.jsx
    Dashboard.jsx Reservar.jsx MisReservas.jsx     pantallas
    SelectorFecha.jsx       campo de fecha con calendario desplegable
    Dialogo.jsx Cargando.jsx ErrorConReintento.jsx  piezas comunes
```

## Requisitos

- Node.js 18 o superior
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente http://localhost:5173).

## Pruebas y compilación

```bash
npm test          # reglas, API simulada y calendario, con node --test (sin dependencias nuevas)
npm run build     # genera dist/ con rutas relativas (base: './')
```

## Conectar con un backend real

`src/services/reservasApi.js` expone `obtenerUsuario`, `obtenerSucursales`, `obtenerMenus`, `obtenerReservasSemana`, `obtenerReservasCalendario`, `obtenerNotificacionesNoLeidas`, `crearReserva`, `cancelarReserva` y `cerrarSesion`, todas asíncronas, con errores `ApiError(status, codigo, mensaje)`. Reemplazar ese módulo por llamadas HTTP no obliga a tocar las pantallas.
