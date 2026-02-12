const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Configuración de Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONEXIÓN A LA BASE DE DATOS
// Usamos path.join para que Render encuentre el archivo sin errores
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al abrir la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
    }
});

// --- RUTAS DE TU SISTEMA ---

// Ruta principal (Login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ejemplo de ruta de autenticación (ajústala a tu lógica)
app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    const query = `SELECT * FROM usuarios WHERE correo = ? AND password = ?`;
    
    db.get(query, [correo, password], (err, row) => {
        if (err) {
            res.status(500).send("Error en el servidor");
        } else if (row) {
            res.redirect('/dashboard'); // O a donde redirija tu sistema
        } else {
            res.send("Usuario o contraseña incorrectos");
        }
    });
});

// --- CONFIGURACIÓN FINAL PARA RENDER (PUERTO) ---

// Render asigna un puerto dinámico en la variable process.env.PORT
// Si no existe (como en tu Mac), usa el 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Raízoma corriendo en el puerto ${PORT}`);
});