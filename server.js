const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Configuraciones necesarias
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a la base de datos (se crea si no existe)
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// RUTA DEL LOGIN (El diseño está aquí adentro para que no falle)
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Raízoma - Backoffice</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 350px; text-align: center; }
                h1 { color: #2e7d32; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #2e7d32; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; }
                button:hover { background: #1b5e20; }
                p { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma</h1>
                <p>Ingresa al Backoffice</p>
                <form action="/login" method="POST">
                    <input type="email" name="correo" placeholder="Correo electrónico" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Ruta para procesar el login
app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    // Aquí puedes agregar tu lógica de base de datos después
    if (correo === "admin@raizoma.com" && password === "1234") {
        res.send("<h1>Bienvenido al sistema Raízoma</h1><p>Próximamente el dashboard aquí.</p>");
    } else {
        res.send("<script>alert('Datos incorrectos'); window.location='/login';</script>");
    }
});

// Redirigir siempre al login al entrar a la web
app.get('/', (req, res) => {
    res.redirect('/login');
});

// PUERTO DINÁMICO PARA RENDER (La clave del éxito)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Servidor Raízoma listo en el puerto ' + PORT);
});