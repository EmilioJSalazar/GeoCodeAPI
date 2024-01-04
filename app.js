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

app.get('/datos/:usuario', async (req, res) => {
    const usuario = req.params.usuario;
  
    // Consultar la ciudad y el id de la tabla 'clientes'
    db.query('SELECT id, ciudad FROM clientes_isp2.clientes WHERE usuario = ?', [usuario], async (err, results) => {
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
  
      const clienteId = results[0].id;
      const ciudad = results[0].ciudad;
  
      // Consultar la georreferenciación utilizando el API de Geocode.xyz
      try {
        const response = await axios.get(`https://geocode.xyz/${ciudad}?json=1&auth=587409135294191706253x65590`);
  
        // Crear o actualizar el registro en la tabla 'ciudades'
        db.query(
          'INSERT INTO clientes_isp2.ciudades (ciudad, json) VALUES (?, ?) ON DUPLICATE KEY UPDATE json = ?',
          [ciudad, JSON.stringify(response.data), JSON.stringify(response.data)],
          (insertUpdateErr) => {
            if (insertUpdateErr) {
              console.error('Error al insertar o actualizar la base de datos:', insertUpdateErr);
              res.status(500).send('Error interno del servidor');
            } else {
              res.json(response.data);
            }
          }
        );
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