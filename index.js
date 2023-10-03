const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const mysql = require('mysql');
const port = process.env.PORT || 4000;

// Configura la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'usuarios_db',
});

// Conecta a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  }
  console.log('Conexión a la base de datos MySQL exitosa');
});

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Ruta para verificar la disponibilidad del nombre de usuario

app.get('/api/top-20-users', (req, res) => {
  const sql = 'SELECT * FROM bestscores ORDER BY cantCorrectas DESC, tiempoTotal ASC LIMIT 20';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener los mejores usuarios:', err);
      res.status(500).json({ error: 'Error al obtener los mejores usuarios' });
    } else {
      res.json(results);
    }
  });
});
// Ruta para obtener datos de la API
app.get('/api/data', (req, res) => {
  const apiUrl = "https://restcountries.com/v3.1/all?fields=name,flags,capital,translations";

  // Realiza la solicitud a la API utilizando axios
  axios.get(apiUrl)
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener datos de la API' });
    });
});

// Ruta para servir la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'));
});

// Ruta para insertar datos en la base de datos
app.post('/api/insert', (req, res) => {
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
    res.json({ message: 'Datos insertados con éxito' });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
