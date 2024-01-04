const express = require('express');
const axios = require('axios');
const mysql = require('mysql');

const app = express();
const port = 8290;

// Configuración de conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'clientes_isp2'
});

db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos');
  }
});

// Ruta para obtener datos de georreferenciación
app.get('/datos/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  // Consultar la ciudad del usuario en la base de datos
  db.query('SELECT ciudad FROM clientes_isp2.clientes WHERE usuario = ?', [usuario], async (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }

    if (results.length === 0) {
        console.error(`Usuario '${usuario}' no encontrado en la base de datos`);
      res.status(404).send('Usuario no encontrado');
      return;
    }

    const ciudad = results[0].ciudad;

    // Consultar la georreferenciación utilizando el API de Geocode.xyz
    try {
      const response = await axios.get(`https://geocode.xyz/${ciudad}?json=1&auth=587409135294191706253x65590`);
      // Actualizar el campo 'json' en la tabla 'ciudad'
      db.query('UPDATE clientes_isp2.ciudades SET json = ? WHERE ciudad = ?', [JSON.stringify(response.data), ciudad], (updateErr) => {
        if (updateErr) {
          console.error('Error al actualizar la base de datos:', updateErr);
          res.status(500).send('Error interno del servidor update');
        } else {
          res.json(response.data);
        }
      });
    } catch (error) {
      console.error('Error al consultar el API de Geocode.xyz:', error.message);
      res.status(500).send('Error interno del servidor');
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
