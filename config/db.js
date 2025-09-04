const mysql = require("mysql2");



//base de datos en internet 
const db = mysql.createConnection({
  host: "yamabiko.proxy.rlwy.net",          // Host de Railway
  port: 20739,                              // Puerto de Railway
  user: "root",                              // Usuario
  password: "rNIqEiNAfDFKKDGRVUTxnvgjyaqGfqjj", // Contraseña
  database: "railway",                       // Nombre de la base de datos
});

//base de datos local
/*
const db = mysql.createConnection({
  host: "localhost",   // Cambia si usas un servidor remoto
  user: "root",        // Usuario de tu MySQL
  password: "",        // Contraseña de tu MySQL
  database: "prestamos", // Nombre de la base de datos
});
*/
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1);
  } else {
    console.log("Conectado a la base de datos");
  }
});

module.exports = db;
