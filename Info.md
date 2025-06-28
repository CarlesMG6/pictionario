Inventario de uso de Supabase
Archivo / Ruta	Tabla/Entidad	Operación	Campos/Datos involucrados	Notas/Eventos gestionados
page.jsx	rooms	insert	{ code }	Crear sala
page.jsx	rooms	select	code (por código de sala)	Comprobar existencia de sala
page.jsx	rooms	select	id (por código de sala)	Obtener sala por código
page.jsx	teams	insert	{ name, icon_url, room_id, position }	Crear equipo
page.jsx	rooms	select	id (por código de sala)	Obtener sala por código
page.jsx	teams	select	* (por room_id, ordenados por posición)	Obtener equipos de la sala
page.jsx	supabase.channel	eventos	team_join	Suscripción a eventos de equipo
page.jsx	supabase.removeChannel	eventos	-	Eliminar canal de eventos
page.jsx	rooms	select	id (por código de sala)	Obtener sala por código
page.jsx	teams	select	* (por room_id, ordenados por posición)	Obtener equipos de la sala
page.jsx	supabase.channel	eventos	team_join	Suscripción a eventos de equipo
page.jsx	supabase.removeChannel	eventos	-	Eliminar canal de eventos
page.jsx	rooms	update	{ duration, round_time, categories }	Actualizar configuración de sala
page.jsx	teams	select	id (por room_id, ordenados por posición)	Obtener equipos para iniciar partida
page.jsx	game_state	insert	{ room_id, current_turn_team, current_phase, ... }	Iniciar estado de juego
page.jsx	supabase.channel	eventos	match_starts	Enviar evento de inicio de partida
page.jsx	game_state	select	* (por room_id)	Obtener estado de juego
page.jsx	teams	select	* (por room_id, ordenados por posición)	Obtener equipos
page.jsx	rooms	select	duration, categories (por id)	Obtener configuración de sala
page.jsx	supabase.channel	eventos	update_match, roll_dice	Suscripción a eventos de juego
page.jsx	supabase.removeChannel	eventos	-	Eliminar canal de eventos
page.jsx	teams	update	{ position }	Actualizar posición de equipo
page.jsx	game_state	update	{ current_category, current_word, current_phase }	Actualizar estado de juego
page.jsx	game_state	select	* (por room_id)	Obtener estado de juego
page.jsx	teams	select	* (por room_id)	Obtener equipos
page.jsx	supabase.channel	eventos	update_match	Suscripción a eventos de juego
page.jsx	supabase.removeChannel	eventos	-	Eliminar canal de eventos
GameLogic.js	game_state	update	{ current_phase: 'dice' }	Cambiar fase a 'dice'
GameLogic.js	supabase.channel	eventos	update_match	Enviar evento de actualización
GameLogic.js	game_state	select	* (por room_id)	Obtener estado de juego
GameLogic.js	teams	select	id (por room_id, ordenados por posición)	Obtener equipos
GameLogic.js	game_state	update	{ current_phase, current_turn_team, current_category, current_word }	Actualizar estado de juego
GameLogic.js	supabase.channel	eventos	update_match	Enviar evento de actualización
Resumen de tablas y datos usados
rooms: code, id, duration, categories
teams: id, name, icon_url, room_id, position, members
game_state: room_id, current_turn_team, current_phase, current_word, current_category, dice_value, is_active, etc.
Resumen de eventos gestionados
team_join: Notifica cuando un equipo se une a la sala.
match_starts: Notifica el inicio de la partida.
update_match: Notifica cambios en el estado de la partida.
roll_dice: Notifica cuando se tira el dado.