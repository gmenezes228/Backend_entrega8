const mysql = require('mysql2/promise');

// Configuración de la conexión
const pool = mysql.createPool({
    host: 'localhost',    // Cambia si tu servidor es remoto
    user: 'root',         // Tu usuario de MariaDB
    password: '1241',         // Tu contraseña de MariaDB (si tienes)
    database: 'Ecommerce' // El nombre de tu base de datos
});

module.exports = pool; // Exportamos el pool para usarlo en otras partes del backend
