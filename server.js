/**
 * SISTEMA RAÍZOMA BACKOFFICE - VERSIÓN ULTIMATE V5.0
 * Incluye: Gestión de Socios, Billetera Automática, Rastreo de Pedidos y Vinculación Bancaria.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS ---
// Se crean dos tablas: una para la red de mercadeo y otra para el seguimiento logístico.
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos Raízoma.");
    }
});

db.serialize(() => {
    // Tabla de Socios: Almacena la estructura de la red
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nivel TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Pedidos: Almacena el rastreo de paquetería
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En preparación',
        empresa TEXT DEFAULT 'Estafeta/FedEx',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- INTERFAZ DE LOGIN (ESTILO RAÍZOMA) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Acceso Administrativo</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a237e 0%, #000051 100%); height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; color: white; }
                .login-container { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 50px; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); width: 100%; max-width: 400px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
                h1 { font-size: 36px; margin-bottom: 10px; letter-spacing: 2px; }
                p { opacity: 0.7; margin-bottom: 30px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 12px; border: none; background: rgba(255,255,255,0.9); font-size: 16px; color: #1a237e; box-sizing: border-box; }
                button { width: 100%; padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 18px; margin-top: 20px; transition: all 0.3s ease; }
                button:hover { background: #27ae60; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4); }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h1>Raízoma</h1>
                <p>GESTIÓN DE CUENTA MADRE</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">INICIAR SESIÓN</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DASHBOARD PRINCIPAL (EL CORAZÓN DEL SISTEMA) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;

    // Validación de acceso
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        // Ejecutar consultas en paralelo para Socios y Pedidos
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, rowsSocios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, rowsPedidos) => {
                
                let totalInversion = 0;
                // Construcción de la tabla de socios
                let htmlSocios = rowsSocios.map(s => {
                    totalInversion += s.puntos;
                    return `
                    <tr>
                        <td><div style="font-weight:bold;">${s.nombre}</div><div style="font-size:11px; color:#94a3b8;">ID: #00${s.id}</div></td>
                        <td>${s.nivel}</td>
                        <td style="font-weight:bold; color:#1a237e;">$${s.puntos}</td>
                        <td><span style="background:#e8fdf0; color:#2ecc71; padding:5px 12px; border-radius:15px; font-size:11px; font-weight:bold;">${s.estado}</span></td>
                        <td>
                            <form action="/delete-socio" method="POST" style="display:inline;">
                                <input type="hidden" name="id" value="${s.id}">
                                <button type="submit" onclick="return confirm('¿Borrar socio?')" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:12px;">Eliminar</button>
                            </form>
                        </td>
                    </tr>`;
                }).join('');

                // Construcción del área de Rastreo de Paquetería
                let htmlPedidos = rowsPedidos.map(p => `
                    <div style="background:white; padding:18px; border-radius:18px; margin-bottom:15px; border:1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: 0.3s;">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <div style="font-weight:bold; color:#1e293b; margin-bottom:4px;">${p.cliente}</div>
                                <div style="font-size:12px; color:#64748b;">Guía: <span style="color:#3b82f6; font-family:monospace;">${p.guia}</span></div>
                            </div>
                            <span style="background:#fefcbf; color:#92400e; padding:4px 10px; border-radius:20px; font-size:10px; font-weight:bold;">${p.estatus}</span>
                        </div>
                        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:11px; color:#94a3b8;">🚛 ${p.empresa}</span>
                            <form action="/delete-pedido" method="POST">
                                <input type="hidden" name="id" value="${p.id}">
                                <button type="submit" style="background:none; border:none; color:#cbd5e0; font-size:10px; cursor:pointer;">Limpiar</button>
                            </form>
                        </div>
                    </div>
                `).join('');

                res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Panel de Administración - Raízoma</title>
                    <style>
                        :root { --blue: #1a237e; --bg: #f8fafc; --green: #2ecc71; }
                        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #334155; }
                        
                        /* NAVEGACIÓN */
                        .navbar { background: white; padding: 20px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf2f7; }
                        .navbar h2 { margin: 0; color: var(--blue); letter-spacing: 1px; }

                        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }

                        /* HEADER DASHBOARD */
                        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                        .user-profile h1 { margin: 0; font-size: 28px; color: var(--blue); }
                        .badge-partner { background: #e0e7ff; color: #4338ca; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-top: 5px; }

                        /* TARJETAS DE MÉTRICAS */
                        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 25px; margin-bottom: 40px; }
                        .card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.02); }
                        .card-dark { background: #1e293b; color: white; }
                        .card h3 { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
                        .card .value { font-size: 32px; font-weight: bold; margin: 0; }

                        /* LAYOUT PRINCIPAL */
                        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                        .content-section { background: white; border-radius: 25px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }

                        /* TABLAS */
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 13px; border-bottom: 2px solid #f8fafc; }
                        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 14px; }

                        /* FORMULARIOS Y BOTONES */
                        input, select { padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 12px; width: 100%; box-sizing: border-box; font-size: 14px; outline: none; transition: 0.3s; }
                        input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.1); }
                        .btn-main { background: var(--blue); color: white; border: none; padding: 14px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                        .btn-success { background: var(--green); color: white; border: none; padding: 15px; border-radius: 12px; width: 100%; cursor: pointer; font-weight: bold; font-size: 14px; margin-top: 15px; }
                        
                        /* MODAL */
                        #modalNew { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter: blur(5px); z-index: 1000; }
                        .modal-box { background: white; width: 400px; margin: 100px auto; padding: 40px; border-radius: 30px; position: relative; }
                    </style>
                </head>
                <body>
                    <div class="navbar">
                        <h2>RAÍZOMA</h2>
                        <div style="display:flex; align-items:center; gap:20px;">
                            <span style="font-size:14px; color:#64748b;">Bienvenido, <strong>Admin</strong></span>
                            <a href="/login" style="color:#e74c3c; text-decoration:none; font-size:14px; font-weight:bold;">Salir</a>
                        </div>
                    </div>

                    <div class="container">
                        <div class="dashboard-header">
                            <div class="user-profile">
                                <h1>Cuenta Madre Backoffice</h1>
                                <span class="badge-partner">ASOCIADO PARTNER GOLD</span>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:bold; color:var(--blue); font-size:13px; margin-bottom:8px;">PRÓXIMO CIERRE DE CICLO</div>
                                <div style="width:200px; height:8px; background:#e2e8f0; border-radius:10px; overflow:hidden;">
                                    <div style="width:75%; height:100%; background:var(--blue);"></div>
                                </div>
                                <div style="font-size:11px; color:#94a3b8; margin-top:5px;">Faltan 22 días hábiles</div>
                            </div>
                        </div>

                        <div class="stats-grid">
                            <div class="card card-dark">
                                <h3>Volumen de Red</h3>
                                <p class="value">$${totalInversion.toLocaleString()}</p>
                                <p style="font-size:11px; opacity:0.6; margin-top:10px;">META ACTUAL: $15,000</p>
                            </div>
                            <div class="card">
                                <h3 style="color:#94a3b8;">Mi Billetera</h3>
                                <p class="value" style="color:var(--blue);">$${(totalInversion * 0.1).toFixed(2)}</p>
                                <p style="font-size:11px; color:var(--green); margin-top:10px;">● 10% Comisión Directa</p>
                            </div>
                            <div class="card" style="display:flex; align-items:center; gap:15px;">
                                <input type="number" placeholder="Monto $" style="flex:1;">
                                <button class="btn-main">RETIRAR</button>
                            </div>
                        </div>

                        <div class="main-grid">
                            <div class="content-section">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                    <h2 style="margin:0; font-size:20px;">Socios Registrados</h2>
                                    <button class="btn-main" onclick="document.getElementById('modalNew').style.display='block'">+ NUEVO SOCIO</button>
                                </div>
                                
                                <table>
                                    <thead>
                                        <tr><th>Información Socio</th><th>Usuario</th><th>Inversión</th><th>Estado</th><th>Acciones</th></tr>
                                    </thead>
                                    <tbody>
                                        ${htmlSocios || '<tr><td colspan="5" style="text-align:center; padding:50px; color:#94a3b8;">No hay socios registrados en tu red todavía.</td></tr>'}
                                    </tbody>
                                </table>

                                <div style="margin-top:40px; border-top: 1px solid #f1f5f9; padding-top:30px;">
                                    <h3 style="font-size:16px; margin-bottom:20px;">🔗 Configuración de Cobros</h3>
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8;">BANCO</label><input type="text" placeholder="Ej. BBVA / Santander"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8;">CLABE INTERBANCARIA</label><input type="text" placeholder="18 dígitos"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8;">WALLET USDT</label><input type="text" placeholder="Dirección TRC20"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8;">RED</label><select><option>TRON (TRC20)</option><option>ETHEREUM (ERC20)</option></select></div>
                                    </div>
                                    <button class="btn-success" style="width:250px;">ACTUALIZAR DATOS</button>
                                </div>
                            </div>

                            <div class="content-section" style="background:#f1f5f9; border:none;">
                                <h2 style="margin:0 0 25px 0; font-size:18px; color:var(--blue); display:flex; align-items:center; gap:10px;">
                                    <span>📦</span> Rastreo de Envíos
                                </h2>
                                
                                <div style="max-height: 500px; overflow-y: auto; padding-right:5px;">
                                    ${htmlPedidos || '<p style="text-align:center; color:#94a3b8; font-size:13px; padding:20px;">No hay pedidos en tránsito.</p>'}
                                </div>

                                <div style="background:white; padding:25px; border-radius:20px; margin-top:30px; box-shadow:0 10px 20px rgba(0,0,0,0.05);">
                                    <h4 style="margin:0 0 15px 0; font-size:14px;">REGISTRAR NUEVA GUÍA</h4>
                                    <form action="/add-pedido" method="POST">
                                        <input type="text" name="cliente" placeholder="Nombre del Cliente" required style="margin-bottom:10px; background:#f8fafc;">
                                        <input type="text" name="guia" placeholder="Número de Seguimiento" required style="margin-bottom:10px; background:#f8fafc;">
                                        <select name="empresa" style="margin-bottom:15px; background:#f8fafc;">
                                            <option value="Estafeta">Estafeta</option>
                                            <option value="FedEx">FedEx</option>
                                            <option value="DHL">DHL</option>
                                        </select>
                                        <button type="submit" class="btn-main" style="width:100%; font-size:13px;">GENERAR RASTREO</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="modalNew">
                        <div class="modal-box">
                            <h2 style="margin-top:0; color:var(--blue);">Nuevo Registro de Socio</h2>
                            <p style="font-size:13px; color:#94a3b8; margin-bottom:25px;">Ingresa los datos del nuevo integrante de tu red.</p>
                            <form action="/add-socio" method="POST">
                                <div style="margin-bottom:15px;">
                                    <label style="font-size:12px; font-weight:bold; color:#64748b; display:block; margin-bottom:5px;">NOMBRE COMPLETO</label>
                                    <input type="text" name="nombre" placeholder="Ej. Carlos Slim" required>
                                </div>
                                <div style="margin-bottom:15px;">
                                    <label style="font-size:12px; font-weight:bold; color:#64748b; display:block; margin-bottom:5px;">CORREO / USUARIO</label>
                                    <input type="text" name="nivel" placeholder="usuario@ejemplo.com" required>
                                </div>
                                <div style="margin-bottom:25px;">
                                    <label style="font-size:12px; font-weight:bold; color:#64748b; display:block; margin-bottom:5px;">MONTO DE INVERSIÓN ($)</label>
                                    <input type="number" name="puntos" placeholder="Monto inicial" required>
                                </div>
                                <div style="display:flex; gap:10px;">
                                    <button type="submit" class="btn-success" style="margin:0; flex:2;">FINALIZAR REGISTRO</button>
                                    <button type="button" class="btn-main" style="flex:1; background:#94a3b8;" onclick="document.getElementById('modalNew').style.display='none'">CERRAR</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
                `);
            });
        });
    } else {
        res.send("<script>alert('Acceso Denegado'); window.location='/login';</script>");
    }
});

// --- RUTAS DE PROCESAMIENTO (POST) ---

// Agregar Socio
app.post('/add-socio', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], (err) => {
        res.send(`
            <form id="back" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio registrado con éxito'); document.getElementById('back').submit();</script>
        `);
    });
});

// Agregar Pedido/Guía
app.post('/add-pedido', (req, res) => {
    const { cliente, guia, empresa } = req.body;
    db.run("INSERT INTO pedidos (cliente, guia, empresa) VALUES (?, ?, ?)", [cliente, guia, empresa], (err) => {
        res.send(`
            <form id="back" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('back').submit();</script>
        `);
    });
});

// Eliminar Socio
app.post('/delete-socio', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="back" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('back').submit();</script>
        `);
    });
});

// Eliminar Pedido
app.post('/delete-pedido', (req, res) => {
    db.run("DELETE FROM pedidos WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="back" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('back').submit();</script>
        `);
    });
});

// Ruta por defecto
app.get('/', (req, res) => res.redirect('/login'));

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SERVIDOR RAÍZOMA V5.0 - SISTEMA COMPLETO ONLINE');
});