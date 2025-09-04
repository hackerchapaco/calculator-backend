const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Ruta para obtener todos los usuarios
router.get("/", (req, res) => {
  const query = "SELECT * FROM usuarios";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error obteniendo usuarios:", err);
      res.status(500).json({ error: "Error obteniendo usuarios" });
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
