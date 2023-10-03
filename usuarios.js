const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configura el middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json());

// Ruta para guardar los datos en la base de datos
app.post('/api/guardarDatos', (req, res) => {
  const { username, cantCorrectas, tiempoTotal } = req.body;

  const sql = 'INSERT INTO bestscores (username, cantCorrectas, tiempoTotal) VALUES (?, ?, ?)';
  const values = [username, cantCorrectas, tiempoTotal];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error al guardar los datos en la base de datos:', err);
      res.status(500).json({ error: 'Error al guardar los datos' });
      return;
    }
    console.log('Datos guardados en la base de datos');
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
