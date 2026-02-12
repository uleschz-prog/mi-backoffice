const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN E INTERFACES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONEXIÓN A BASE DE DATOS ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log("Conectado a la base de datos negocio.db");
});

// Inicialización de tablas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nivel TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- RUTA: LOGIN ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Acceso</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: white; padding: 50px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); width: 350px; text-align: center; }
                .login-card h1 { color: #2e7d32; font-size: 2.5em; margin-bottom: 10px; }
                .login-card p { color: #666; margin-bottom: 30px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border: 2px solid #eee; border-radius: 10px; box-sizing: border-box; font-size: 16px; transition: 0.3s; }
                input:focus { border-color: #2e7d32; outline: none; }
                button { width: 100%; padding: 15px; background: #2e7d32; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 18px; margin-top: 20px; transition: 0.3s; }
                button:hover { background: #1b5e20; transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma</h1>
                <p>Oficina Virtual</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR AL PANEL</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- RUTA: DASHBOARD (PANEL COMPLETO) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    
    if (correo === "admin@raizoma.com" && password === "1234") {
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, rows) => {
            if (err) return res.send("Error en la base de datos");

            let totalPuntos = 0;
            let listadoSocios = rows.map(socio => {
                totalPuntos += socio.puntos;
                return `
                    <tr>
                        <td><strong>#${socio.id}</strong></td>
                        <td>${socio.nombre}</td>
                        <td><span class="badge-nivel">${socio.nivel}</span></td>
                        <td>${socio.puntos} pts</td>
                        <td><span class="status-active">${socio.estado}</span></td>
                        <td>
                            <form action="/delete-socio" method="POST" onsubmit="return confirm('¿Seguro que quieres eliminar a este socio?')">
                                <input type="hidden" name="id" value="${socio.id}">
                                <button type="submit" class="btn-delete">Eliminar</button>
                            </form>
                        </td>
                    </tr>`;
            }).join('');

            res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Raízoma Backoffice</title>
                    <style>
                        :root { --primary: #2e7d32; --bg: #f4f7f6; }
                        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg); margin: 0; }
                        nav { background: var(--primary); color: white; padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
                        
                        /* TARJETAS DE ESTADÍSTICAS */
                        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
                        .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border-top: 5px solid var(--primary); }
                        .card h3 { color: #888; font-size: 14px; text-transform: uppercase; margin: 0; }
                        .card p { font-size: 32px; font-weight: bold; color: var(--primary); margin: 10px 0 0; }

                        /* TABLA */
                        .table-container { background: white; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th { text-align: left; padding: 15px; color: #666; border-bottom: 2px solid #eee; }
                        td { padding: 15px; border-bottom: 1px solid #eee; color: #444; }
                        .badge-nivel { background: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                        .status-active { color: #4caf50; font-weight: bold; }

                        /* BOTONES */
                        .btn-add { background: var(--primary); color: white; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.3s; }
                        .btn-add:hover { background: #1b5e20; box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3); }
                        .btn-delete { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.3s; }
                        .btn-delete:hover { background: #c62828; color: white; }

                        /* MODAL FLOTANTE */
                        #modalRegistro { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; backdrop-filter: blur(5px); }
                        .modal-body { background: white; width: 400px; margin: 5% auto; padding: 40px; border-radius: 20px; position: relative; animation: slideDown 0.4s; }
                        @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    </style>
                </head>
                <body>
                    <nav>
                        <h2 style="margin:0;">RAÍZOMA</h2>
                        <a href="/login" style="color:white; text-decoration:none; font-weight:bold;">Cerrar Sesión</a>
                    </nav>

                    <div class="container">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                            <div>
                                <h1 style="margin:0; color:#333;">Panel de Control</h1>
                                <p style="color:#888; margin:5px 0 0;">Gestión de red y comisiones</p>
                            </div>
                            <button class="btn-add" onclick="document.getElementById('modalRegistro').style.display='block'">+ INSCRIBIR SOCIO</button>
                        </div>

                        <div class="stats-grid">
                            <div class="card"><h3>Socios Activos</h3><p>${rows.length}</p></div>
                            <div class="card"><h3>Puntos Acumulados</h3><p>${totalPuntos} pts</p></div>
                            <div class="card"><h3>Comisión (10%)</h3><p>$${(totalPuntos * 0.1).toFixed(2)}</p></div>
                        </div>

                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre Completo</th>
                                        <th>Rango/Nivel</th>
                                        <th>Puntos</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${listadoSocios || '<tr><td colspan="6" style="text-align:center; padding:50px; color:#999;">No hay socios registrados en la red.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="modalRegistro">
                        <div class="modal-body">
                            <h2 style="color:var(--primary); margin-top:0;">Nuevo Socio</h2>
                            <p style="color:#666; font-size:14px;">Completa los datos para el ingreso a la red.</p>
                            <form action="/add-socio" method="POST">
                                <label style="font-size:12px; font-weight:bold; color:#555;">NOMBRE DEL SOCIO</label>
                                <input type="text" name="nombre" placeholder="Ej. Juan Pérez" required>
                                
                                <label style="font-size:12px; font-weight:bold; color:#555;">RANGO O NIVEL</label>
                                <input type="text" name="nivel" placeholder="Ej. Diamante / Oro" required>
                                
                                <label style="font-size:12px; font-weight:bold; color:#555;">PUNTOS INICIALES</label>
                                <input type="number" name="puntos" placeholder="0" required>
                                
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px;">
                                    <button type="submit" style="margin:0;">GUARDAR</button>
                                    <button type="button" onclick="document.getElementById('modalRegistro').style.display='none'" style="margin:0; background:#eee; color:#333;">CANCELAR</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
    } else {
        res.send("<script>alert('Acceso Denegado'); window.location='/login';</script>");
    }
});

// --- RUTA: AGREGAR SOCIO ---
app.post('/add-socio', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], (err) => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio Registrado con Éxito'); document.getElementById('auto').submit();</script>
        `);
    });
});

// --- RUTA: ELIMINAR SOCIO ---
app.post('/delete-socio', (req, res) => {
    const { id } = req.body;
    db.run("DELETE FROM socios WHERE id = ?", [id], (err) => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio Eliminado'); document.getElementById('auto').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Sistema Raízoma V3.0 - Online en puerto ' + PORT);
});