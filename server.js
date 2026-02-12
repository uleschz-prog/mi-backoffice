const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIONES INICIALES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS (SOCIOS Y PEDIDOS) ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al conectar DB:", err.message);
});

db.serialize(() => {
    // Tabla de Socios: Maneja la red y puntos
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nivel TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'Activo',
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Pedidos: Maneja el rastreo de envíos
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En Camino',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- DISEÑO: PANTALLA DE ACCESO (LOGIN) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Acceso Seguro</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a237e 0%, #283593 100%); height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
                .login-card { background: white; padding: 50px; border-radius: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 380px; text-align: center; }
                .login-card h1 { color: #1a237e; font-size: 32px; margin-bottom: 10px; }
                .login-card p { color: #7f8c8d; margin-bottom: 30px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border: 2px solid #f1f2f6; border-radius: 12px; box-sizing: border-box; font-size: 16px; }
                button { width: 100%; padding: 15px; background: #1a237e; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 18px; transition: 0.3s; }
                button:hover { background: #3949ab; transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma</h1>
                <p>Gestión de Cuentas Madre</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR AL SISTEMA</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DISEÑO: PANEL DE CONTROL (DASHBOARD PREMIUM) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    
    // Validación de seguridad sencilla
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        // Consultar Socios y Pedidos simultáneamente
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, socios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                let totalPuntos = 0;
                // Generar filas de la tabla de socios
                let tablaSocios = socios.map(s => {
                    totalPuntos += s.puntos;
                    return `
                    <tr>
                        <td><strong>${s.nombre}</strong><br><small style="color:#94a3b8">${s.nivel}</small></td>
                        <td style="font-weight:bold;">$${s.puntos}</td>
                        <td><span style="color:#2ecc71; background:#e8fdf0; padding:4px 10px; border-radius:15px; font-size:12px;">${s.estado}</span></td>
                        <td>
                            <form action="/delete-socio" method="POST" onsubmit="return confirm('¿Eliminar socio?')">
                                <input type="hidden" name="id" value="${s.id}">
                                <button type="submit" style="background:none; border:none; color:#e74c3c; cursor:pointer;">&times; Borrar</button>
                            </form>
                        </td>
                    </tr>`;
                }).join('');

                // Generar lista de rastreo de pedidos
                let listaRastreo = envios.map(p => `
                    <div style="background:white; padding:15px; border-radius:15px; margin-bottom:12px; border:1px solid #edf2f7; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:bold; color:#2d3748; font-size:14px;">${p.cliente}</div>
                            <div style="font-size:12px; color:#718096;">Guía: <span style="color:#3182ce">${p.guia}</span></div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:#fefcbf; color:#b7791f; padding:3px 10px; border-radius:10px; font-size:10px; font-weight:bold;">${p.estatus}</span>
                            <form action="/delete-pedido" method="POST" style="margin-top:5px;">
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
                    <title>Cuenta Madre - Raízoma Backoffice</title>
                    <style>
                        :root { --blue: #1a237e; --bg: #f7fafc; }
                        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #2d3748; }
                        .top-nav { background: white; padding: 15px 60px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
                        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
                        
                        /* HEADER CUENTA MADRE */
                        .header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                        .main-title h1 { margin: 0; color: var(--blue); font-size: 32px; }
                        .status-pill { background: #e0e7ff; color: #4338ca; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }

                        /* TARJETAS DE BILLETERA */
                        .grid-stats { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 40px; }
                        .stat-card { background: white; padding: 25px; border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                        .dark-card { background: #1e293b; color: white; }
                        
                        /* SECCIONES DIVIDIDAS */
                        .content-layout { display: grid; grid-template-columns: 1.8fr 1fr; gap: 30px; }
                        .white-box { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }

                        /* TABLAS Y BOTONES */
                        table { width: 100%; border-collapse: collapse; }
                        th { text-align: left; padding: 12px; color: #a0aec0; font-size: 13px; text-transform: uppercase; }
                        td { padding: 16px 12px; border-top: 1px solid #f1f5f9; }
                        .btn-primary { background: var(--blue); color: white; padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; }
                        .btn-success { background: #2ecc71; color: white; padding: 12px; border: none; border-radius: 12px; cursor: pointer; width: 100%; font-weight: bold; }

                        /* MODAL */
                        #modalSocio { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; backdrop-filter: blur(4px); }
                        .modal-content { background:white; width:380px; margin:8% auto; padding:40px; border-radius:30px; }
                    </style>
                </head>
                <body>
                    <div class="top-nav">
                        <h2 style="color:var(--blue); margin:0;">RAÍZOMA</h2>
                        <a href="/login" style="text-decoration:none; color:#718096; font-weight:bold;">Cerrar Sesión</a>
                    </div>

                    <div class="container">
                        <div class="header-flex">
                            <div class="main-title">
                                <h1>Cuenta Madre</h1>
                                <span class="status-pill">ASOCIADO PARTNER</span>
                            </div>
                            <div style="text-align:right">
                                <span style="font-weight:bold; color:var(--blue)">CIERRE DE CICLO</span><br>
                                <div style="width:160px; height:6px; background:#e2e8f0; border-radius:10px; margin:8px 0;"><div style="width:75%; height:100%; background:#3b82f6; border-radius:10px;"></div></div>
                                <span style="font-size:12px; color:#a0aec0">Faltan 30 días</span>
                            </div>
                        </div>

                        <div class="grid-stats">
                            <div class="stat-card dark-card">
                                <span style="font-size:12px; opacity:0.7">VOLUMEN DE RED</span>
                                <p style="font-size:32px; margin:15px 0; font-weight:bold;">$${totalPuntos}</p>
                                <span style="font-size:11px; opacity:0.5">META MENSUAL: $15,000</span>
                            </div>
                            <div class="stat-card">
                                <span style="font-size:12px; color:#a0aec0">MI BILLETERA</span>
                                <p style="font-size:32px; margin:15px 0; font-weight:bold; color:var(--blue)">$${(totalPuntos * 0.1).toFixed(2)}</p>
                                <span style="font-size:11px; color:#2ecc71">Comisión disponible (10%)</span>
                            </div>
                            <div class="stat-card" style="display:flex; flex-direction:column; justify-content:center;">
                                <div style="display:flex; gap:10px;">
                                    <input type="number" placeholder="Monto a retirar" style="flex:1; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
                                    <button class="btn-primary">RETIRAR</button>
                                </div>
                            </div>
                        </div>

                        <div class="content-layout">
                            <div class="white-box">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                    <h3 style="margin:0;">Socios de Red Directa</h3>
                                    <button class="btn-primary" onclick="document.getElementById('modalSocio').style.display='block'">+ INSCRIBIR</button>
                                </div>
                                <table>
                                    <thead><tr><th>Socio / Usuario</th><th>Inversión</th><th>Estado</th><th>Acción</th></tr></thead>
                                    <tbody>
                                        ${tablaSocios || '<tr><td colspan="4" style="text-align:center; padding:40px; color:#a0aec0;">No hay socios registrados</td></tr>'}
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <div class="white-box" style="margin-bottom:20px; background:#f8fafc;">
                                    <h3 style="margin:0 0 20px 0; font-size:16px;">📦 Rastreo de Pedidos</h3>
                                    ${listaRastreo || '<p style="color:#a0aec0; font-size:13px;">No hay envíos activos</p>'}
                                    <form action="/add-pedido" method="POST" style="margin-top:20px;">
                                        <input type="text" name="cliente" placeholder="Cliente" required style="width:100%; margin-bottom:8px; padding:10px; font-size:13px;">
                                        <input type="text" name="guia" placeholder="Número de Guía" required style="width:100%; margin-bottom:8px; padding:10px; font-size:13px;">
                                        <button type="submit" style="width:100%; padding:10px; background:var(--blue); color:white; border:none; border-radius:8px; cursor:pointer; font-size:12px;">REGISTRAR ENVÍO</button>
                                    </form>
                                </div>

                                <div class="white-box">
                                    <h3 style="margin:0 0 15px 0; font-size:16px;">🔗 Vinculación de Cobro</h3>
                                    <input type="text" placeholder="Banco" style="width:100%; margin-bottom:10px; padding:10px;">
                                    <input type="text" placeholder="CLABE Interbancaria" style="width:100%; margin-bottom:10px; padding:10px;">
                                    <input type="text" placeholder="Wallet USDT (TRC20)" style="width:100%; margin-bottom:15px; padding:10px;">
                                    <button class="btn-success">ACTUALIZAR DATOS</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="modalSocio">
                        <div class="modal-content">
                            <h2 style="color:var(--blue); margin-top:0;">Inscribir Socio</h2>
                            <form action="/add-socio" method="POST">
                                <label style="font-size:12px; font-weight:bold; color:#718096;">NOMBRE COMPLETO</label>
                                <input type="text" name="nombre" placeholder="Ej. Juan Pérez" required style="width:100%;">
                                <label style="font-size:12px; font-weight:bold; color:#718096;">USUARIO O EMAIL</label>
                                <input type="text" name="nivel" placeholder="usuario123" required style="width:100%;">
                                <label style="font-size:12px; font-weight:bold; color:#718096;">INVERSIÓN INICIAL ($)</label>
                                <input type="number" name="puntos" placeholder="500" required style="width:100%;">
                                <div style="display:flex; gap:10px; margin-top:20px;">
                                    <button type="submit" class="btn-success">GUARDAR</button>
                                    <button type="button" onclick="document.getElementById('modalSocio').style.display='none'" style="flex:1; background:#edf2f7; border:none; border-radius:12px; cursor:pointer;">CANCELAR</button>
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
        res.send("<script>alert('Credenciales incorrectas'); window.location='/login';</script>");
    }
});

// --- RUTA: AGREGAR SOCIO ---
app.post('/add-socio', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], () => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio registrado correctamente'); document.getElementById('auto').submit();</script>
        `);
    });
});

// --- RUTA: AGREGAR PEDIDO (RASTREO) ---
app.post('/add-pedido', (req, res) => {
    const { cliente, guia } = req.body;
    db.run("INSERT INTO pedidos (cliente, guia) VALUES (?, ?)", [cliente, guia], () => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('auto').submit();</script>
        `);
    });
});

// --- RUTA: ELIMINAR SOCIO ---
app.post('/delete-socio', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('auto').submit();</script>
        `);
    });
});

// --- RUTA: ELIMINAR PEDIDO ---
app.post('/delete-pedido', (req, res) => {
    db.run("DELETE FROM pedidos WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="auto" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('auto').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Raízoma Ultimate V4.0 Online');
});