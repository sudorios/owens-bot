# 🦾 Owens Bot – Quinielas de Wrestling  

Bot de **Discord** especializado en gestionar **quinielas de wrestling**, con soporte para temporadas, puntuaciones, encuestas comunitarias y ratings de eventos/luchas.  

Construido con:  
- [Node.js](https://nodejs.org/)  
- [Discord.js](https://discord.js.org/)  
- [Prisma ORM](https://www.prisma.io/)  
- [PostgreSQL](https://www.postgresql.org/)  
- [Canvas](https://www.npmjs.com/package/canvas) (Para la generación de banners en imágenes)

---

## 🚀 Características  

- **Usuarios y servidores (Guilds)**: Registro automático al interactuar.  
- **Predicciones (Predictions)**: Cada usuario responde preguntas de eventos.  
- **Eventos (Events)**: Definición de luchas, preguntas y encuestas.  
- **Puntuaciones**:  
  - Por evento (`EventScore`)  
  - Por temporada (`SeasonScore`)  
- **Temporadas (Seasons)**: Reinicio periódico con historial.  
- **Encuestas comunitarias**: Vía `Question` vinculada a mensajes de Discord (`messageId`).  
- **Ratings**:  
  - De eventos (`EventRating`)  
  - De luchas (`MatchRating`)  
- **Generación Visual de Ganadores**:
  - Comando `/close-event` para cerrar eventos y generar un banner gráfico (*Canvas*) celebrando al jugador con la máxima puntuación.

---

## 🛠️ Comandos Disponibles

- `/addquestion`: Crea una pregunta y publica un Poll nativo.
- `/close-event`: Finaliza un evento y muestra el banner del ganador.
- `/donate`: Muestra cómo apoyar el desarrollo de Owens Bot.
- `/event-info`: Muestra una tabla con los eventos de la temporada activa.
- `/event-ratings`: Muestra los eventos rateados en este servidor.
- `/event-winners`: Muestra el ranking de ganadores de eventos.
- `/match-ratings`: Muestra las luchas calificadas en este servidor.
- `/newevent`: Crea un nuevo evento en este servidor.
- `/newseason`: Crea una nueva temporada y cierra la actual (si existe).
- `/ping`: Responde con Pong!
- `/rate-event`: Crea botones para calificar un evento.
- `/rate-match`: Crea una votación para calificar una lucha.
- `/season-info`: Muestra la season activa del servidor.


