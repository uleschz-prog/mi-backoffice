const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. BASE DE DATOS
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        nivel TEXT,
        puntos INTEGER,
        estado TEXT DEFAULT 'Activo'
    )`);
});

// 2. PANTALLA DE LOGIN (Diseño limpio)
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Login</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #e8f5e9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); width: 320px; text-align: center; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #2e7d32; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1 style="color: #2e7d32;">Raízoma</h1>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="1234" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 3. DASHBOARD (Con botón de apertura forzada)
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, rows) => {
            let totalPuntos = 0;
            let filas = rows.map(s => {
                totalPuntos += s.puntos;
                return `<tr><td>${s.nombre}</td><td>${s.nivel}</td><td>${s.puntos} pts</td><td>${s.estado}</td></tr>`;
            }).join('');

            res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Panel Raízoma</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f0f2f5; }
                        header { background: #2e7d32; color: white; padding: 15px 30px; display: flex; justify-content: space-between; }
                        .container { padding: 30px; max-width: 1000px; margin: auto; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                        .stat-card { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                        table { width: 100%; background: white; border-collapse: collapse; border-radius: 10px; overflow: hidden; }
                        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
                        .btn-new { background: #2e7d32; color: white; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
                        
                        /* MODAL */
                        #modalSocio { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 999; }
                        .modal-content { background: white; width: 350px; margin: 10% auto; padding: 30px; border-radius: 15px; }
                    </style>
                </head>
                <body>
                    <header><h2>Raízoma</h2><a href="/login" style="color:white; text-decoration:none;">Salir</a></header>
                    <div class="container">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <h3>Mi Red</h3>
                            <button type="button" class="btn-new" onclick="document.getElementById('modalSocio').style.display='block'">+ NUEVO SOCIO</button>
                        </div>
                        <div class="stats">
                            <div class="stat-card"><h3>Socios</h3><p>${rows.length}</p></div>
                            <div class="stat-card"><h3>Puntos</h3><p>${totalPuntos}</p></div>
                            <div class="stat-card"><h3>Comisión</h3><p>$${(totalPuntos * 0.1).toFixed(2)}</p></div>
                        </div>
                        <table>
                            <thead><tr><th>Nombre</th><th>Nivel</th><th>Puntos</th><th>Estado</th></tr></thead>
                            <tbody>${filas || '<tr><td colspan="4" style="text-align:center;">Sin registros</td></tr>'}</tbody>
                        </table>
                    </div>

                    <div id="modalSocio">
                        <div class="modal-content">
                            <h2 style="color:#2e7d32;">Nuevo Registro</h2>
                            <form action="/add" method="POST">
                                <input type="text" name="nombre" placeholder="Nombre" required style="width:100%; padding:10px; margin:8px 0;">
                                <input type="text" name="nivel" placeholder="Nivel" required style="width:100%; padding:10px; margin:8px 0;">
                                <input type="number" name="puntos" placeholder="Puntos" required style="width:100%; padding:10px; margin:8px 0;">
                                <button type="submit" style="width:100%; background:#2e7d32; color:white; padding:10px; border:none; border-radius:5px; margin-top:10px; cursor:pointer;">GUARDAR</button>
                                <button type="button" onclick="document.getElementById('modalSocio').style.display='none'" style="width:100%; background:#999; color:white; padding:10px; border:none; border-radius:5px; margin-top:5px; cursor:pointer;">CANCELAR</button>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
    } else {
        res.send("<script>alert('Error'); window.location='/login';</script>");
    }
});

// 4. GUARDAR Y RECARGAR
app.post('/add', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], () => {
        res.send(`
            <form id="f" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Registrado'); document.getElementById('f').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('🚀 Raízoma Full System Online'));