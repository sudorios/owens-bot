# 🦾 Owens Bot – Quinielas de Wrestling  

Bot de **Discord** especializado en gestionar **quinielas de wrestling**, con soporte para temporadas, puntuaciones, encuestas comunitarias y ratings de eventos/luchas.  

Construido con:  
- [Node.js](https://nodejs.org/)  
- [Discord.js](https://discord.js.org/)  
- [Prisma ORM](https://www.prisma.io/)  
- [PostgreSQL](https://www.postgresql.org/)  

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
