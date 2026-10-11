# Pokédex Regional

Pokédex 100% frontend: React + TypeScript (Vite), sin backend ni base de datos que consume las APIs https://pokeapi.co/api/v2/pokemon/Zekrom y https://pokeapi.co/api/v2/pokemon-species/Zekrom

## Que hace?

- Listado paginado de todos los Pokémon.
- Búsqueda por nombre o número en vivo.
- Filtro por tipo (18 tipos).
- Detalles: artwork, tipos, altura,peso, experiencia base, habilidades y estadísticas base.
- Ficha de especie (`GET /pokemon-species/{nombre}`): género (p. ej. "Pokémon Fuerza Bruta"), descripción de Pokédex, insignia de Legendario/Mítico, hábitat y tasa de captura. Se pide en paralelo al detalle; si esta llamada falla, el modal igual muestra el resto de la información.

## Cómo funciona sin backend?

- Al montar, se pide una sola vez la lista completa de nombres (`GET /pokemon?limit=2000`) y se guarda en una variable de módulo (memoria del navegador, se pierde al recargar — no es persistencia real).
- Los sprites de la grilla se arman con la URL pública y predecible del artwork oficial a partir del id (sin pedir el detalle de cada Pokémon uno por uno).
- El filtro por tipo pide `GET /type/{tipo}` solo cuando cambia el tipo, y lo cachea en memoria por si se vuelve a seleccionar.
- El detalle completo (`GET /pokemon/{nombre}`) y la especie (`GET /pokemon-species/{nombre}`) se piden en paralelo recién al abrir el modal, ambos con caché en memoria para no repetir las llamadas si se vuelve a abrir el mismo Pokémon en la misma sesión.
