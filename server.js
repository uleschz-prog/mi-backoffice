/**
 * ============================================================================
 * SISTEMA RAÍZOMA BACKOFFICE - CORPORATE ULTIMATE V7.0
 * ----------------------------------------------------------------------------
 * ESTE ES EL CÓDIGO COMPLETO (450 LÍNEAS). NO BORRAR NINGUNA SECCIÓN.
 * Incluye: Gestión de Socios, Membresías, Billetera y Logística.
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error DB:", err.message);
});

db.serialize(() => {
    // Tabla de Socios con todos los campos solicitados
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        telefono TEXT NOT NULL,
        direccion TEXT NOT NULL,
        membresia TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Pedidos para paquetería
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En preparación',
        empresa TEXT DEFAULT 'Estafeta',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- VISTA DE ACCESO (LOGIN) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Acceso</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
                .login-card { background: white; padding: 50px; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); width: 350px; text-align: center; }
                h1 { color: #1a237e; margin-bottom: 10px; font-size: 32px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box; font-size: 16px; }
                button { width: 100%; padding: 15px; background: #1a237e; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 18px; transition: 0.3s; }
                button:hover { background: #312e81; transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma</h1>
                <p style="color:#64748b; margin-bottom:30px;">Panel Administrativo</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- PANEL DE CONTROL (DASHBOARD) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, socios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                let totalRed = 0;
                
                // Construcción de filas de socios
                let tablaSocios = socios.map(s => {
                    totalRed += s.puntos;
                    return `
                    <tr>
                        <td>
                            <div style="font-weight:bold;">${s.nombre}</div>
                            <div style="font-size:10px; color:#3b82f6;">Patroc: ${s.patrocinador_id}</div>
                        </td>
                        <td>
                            <div style="font-size:12px;">${s.correo}</div>
                            <div style="font-size:11px; color:#64748b;">${s.telefono}</div>
                        </td>
                        <td>
                            <div style="font-weight:bold; color:#1e293b; font-size:12px;">${s.membresia}</div>
                            <div style="font-size:10px; color:#94a3b8; width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.direccion}</div>
                        </td>
                        <td style="font-weight:bold;">$${s.puntos.toLocaleString()}</td>
                        <td><span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:bold;">${s.estado}</span></td>
                        <td>
                            <form action="/delete-socio" method="POST" onsubmit="return confirm('¿Eliminar socio?')">
                                <input type="hidden" name="id" value="${s.id}">
                                <button type="submit" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold;">×</button>
                            </form>
                        </td>
                    </tr>`;
                }).join('');

                // Construcción de lista de envíos
                let listaEnvios = envios.map(p => `
                    <div style="background:#f8fafc; padding:15px; border-radius:15px; margin-bottom:10px; border:1px solid #e2e8f0;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; font-size:13px;">${p.cliente}</span>
                            <span style="font-size:10px; background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:8px; font-weight:bold;">${p.estatus}</span>
                        </div>
                        <div style="font-size:11px; color:#64748b; margin-top:5px;">Guía: <span style="color:#1e293b; font-family:monospace;">${p.guia}</span></div>
                        <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:10px; color:#94a3b8;">${p.empresa}</span>
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
                    <title>Cuenta Madre - Raízoma Backoffice</title>
                    <style>
                        :root { --blue: #1a237e; --bg: #f8fafc; --success: #2ecc71; }
                        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #1e293b; }
                        
                        /* BARRA SUPERIOR */
                        .navbar { background: white; padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; position: sticky; top:0; z-index:100; }
                        .navbar h2 { margin: 0; color: var(--blue); letter-spacing: -1px; }

                        .main-content { max-width: 1300px; margin: 30px auto; padding: 0 20px; }

                        /* TARJETAS DE DINERO */
                        .stats-row { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 30px; }
                        .stat-card { background: white; padding: 30px; border-radius: 25px; box-shadow: 0 10px 20px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; }
                        .stat-card.dark { background: #1e293b; color: white; border: none; }
                        .stat-card h3 { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px; }
                        .stat-card .value { font-size: 32px; font-weight: 800; margin: 0; }

                        /* LAYOUT PRINCIPAL */
                        .dashboard-grid { display: grid; grid-template-columns: 2.2fr 1fr; gap: 25px; }
                        .panel { background: white; border-radius: 25px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }

                        /* TABLAS */
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f8fafc; }
                        td { padding: 18px 15px; border-bottom: 1px solid #f8fafc; font-size: 13px; }

                        /* BOTONES Y FORMS */
                        .btn-blue { background: var(--blue); color: white; border: none; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                        .btn-blue:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(26,35,126,0.2); }
                        .btn-green { background: var(--success); color: white; border: none; padding: 15px; border-radius: 12px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 20px; }
                        input, select, textarea { padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 12px; width: 100%; box-sizing: border-box; font-size: 14px; margin-top: 5px; background: #fcfdfe; }
                        
                        /* MODAL */
                        #modalInscripcion { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.7); backdrop-filter: blur(5px); z-index: 200; }
                        .modal-content { background: white; width: 550px; margin: 60px auto; padding: 45px; border-radius: 35px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
                    </style>
                </head>
                <body>
                    <div class="navbar">
                        <h2>RAÍZOMA <span>ADMIN</span></h2>
                        <div style="display:flex; gap:20px; align-items:center;">
                            <span style="font-size:13px; color:#64748b;">Cuenta Madre Conectada</span>
                            <a href="/login" style="color:#f43f5e; font-weight:bold; text-decoration:none; font-size:13px;">Salir</a>
                        </div>
                    </div>

                    <div class="main-content">
                        <div class="stats-row">
                            <div class="stat-card dark">
                                <h3>Volumen Total Red</h3>
                                <p class="value">$${totalRed.toLocaleString()}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Mi Billetera (10%)</h3>
                                <p class="value" style="color:var(--blue);">$${(totalRed * 0.1).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                            <div class="stat-card" style="display:flex; align-items:center; gap:15px;">
                                <input type="number" placeholder="Monto a retirar ($)">
                                <button class="btn-blue">RETIRAR</button>
                            </div>
                        </div>

                        <div class="dashboard-grid">
                            <div class="panel">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h2 style="margin:0; font-size:20px;">Socios en Red Directa</h2>
                                    <button class="btn-blue" onclick="document.getElementById('modalInscripcion').style.display='block'">+ INSCRIBIR SOCIO</button>
                                </div>
                                
                                <table>
                                    <thead>
                                        <tr><th>Socio / Patrocinador</th><th>Contacto</th><th>Membresía</th><th>Inversión</th><th>Estado</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        ${tablaSocios || '<tr><td colspan="6" style="text-align:center; padding:50px; color:#94a3b8;">No hay socios registrados.</td></tr>'}
                                    </tbody>
                                </table>

                                <div style="margin-top:40px; border-top:1px solid #f1f5f9; padding-top:30px;">
                                    <h3 style="font-size:16px; margin-bottom:20px;">Configuración de Pagos</h3>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                                        <input type="text" placeholder="Banco">
                                        <input type="text" placeholder="CLABE Interbancaria">
                                        <input type="text" placeholder="Wallet USDT (TRC20)">
                                        <button class="btn-blue" style="margin-top:5px;">Actualizar Datos</button>
                                    </div>
                                </div>
                            </div>

                            <div class="panel" style="background:#f1f5f9; border:none;">
                                <h3 style="margin:0 0 25px 0; font-size:16px; color:var(--blue); display:flex; align-items:center; gap:10px;">
                                    <span>📦</span> Centro de Envíos
                                </h3>
                                
                                <div style="max-height: 500px; overflow-y: auto;">
                                    ${listaEnvios || '<p style="text-align:center; color:#94a3b8; font-size:12px;">Sin pedidos registrados.</p>'}
                                </div>

                                <div style="background:white; padding:25px; border-radius:20px; margin-top:25px; box-shadow:0 10px 20px rgba(0,0,0,0.05);">
                                    <h4 style="margin:0 0 15px 0; font-size:12px; color:#64748b;">NUEVA GUÍA DE RASTREO</h4>
                                    <form action="/add-pedido" method="POST">
                                        <input type="text" name="cliente" placeholder="Nombre del Cliente" required style="margin-bottom:10px;">
                                        <input type="text" name="guia" placeholder="Número de Guía" required style="margin-bottom:10px;">
                                        <select name="empresa" style="margin-bottom:15px;">
                                            <option value="Estafeta">Estafeta</option>
                                            <option value="FedEx">FedEx</option>
                                            <option value="DHL">DHL</option>
                                        </select>
                                        <button type="submit" class="btn-blue" style="width:100%; padding:10px;">REGISTRAR</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="modalInscripcion">
                        <div class="modal-content">
                            <h2 style="margin:0 0 10px 0; color:var(--blue);">Inscribir Nuevo Socio</h2>
                            <p style="color:#94a3b8; font-size:13px; margin-bottom:25px;">Ingresa los datos oficiales para el registro en Raízoma.</p>
                            
                            <form action="/add-socio" method="POST">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                                    <div><label style="font-size:11px; font-weight:bold; color:#64748b;">ID PATROCINADOR *</label><input type="text" name="patrocinador_id" placeholder="Ej: RZ-500" required></div>
                                    <div><label style="font-size:11px; font-weight:bold; color:#64748b;">NOMBRE COMPLETO *</label><input type="text" name="nombre" placeholder="Nombre del socio" required></div>
                                    <div><label style="font-size:11px; font-weight:bold; color:#64748b;">CORREO ELECTRÓNICO *</label><input type="email" name="correo" placeholder="email@ejemplo.com" required></div>
                                    <div><label style="font-size:11px; font-weight:bold; color:#64748b;">TELÉFONO *</label><input type="text" name="telefono" placeholder="10 dígitos" required></div>
                                </div>
                                
                                <div style="margin-bottom:15px;">
                                    <label style="font-size:11px; font-weight:bold; color:#64748b;">DIRECCIÓN COMPLETA *</label>
                                    <textarea name="direccion" rows="3" placeholder="Calle, Número, Colonia, CP, Ciudad y Estado" required style="width:100%; border-radius:12px; border:1px solid #e2e8f0; padding:10px; font-family:inherit;"></textarea>
                                </div>

                                <div style="margin-bottom:25px;">
                                    <label style="font-size:11px; font-weight:bold; color:#64748b;">PLAN DE INGRESO *</label>
                                    <select name="membresia_raw" required style="height:50px; border:2px solid #e2e8f0;">
                                        <option value="">-- Elige una membresía --</option>
                                        <option value="VIP-1750">Membresía VIP ($1,750)</option>
                                        <option value="FOUNDER-15000">Partner Fundador ($15,000)</option>
                                    </select>
                                </div>

                                <div style="display:flex; gap:15px;">
                                    <button type="submit" class="btn-green" style="margin:0; flex:2;">FINALIZAR INSCRIPCIÓN</button>
                                    <button type="button" class="btn-blue" style="flex:1; background:#94a3b8;" onclick="document.getElementById('modalInscripcion').style.display='none'">CANCELAR</button>
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
        res.send("<script>alert('Error de acceso'); window.location='/login';</script>");
    }
});

// --- OPERACIONES (POST) ---

// Agregar Socio (con lógica de dinero)
app.post('/add-socio', (req, res) => {
    const { patrocinador_id, nombre, correo, telefono, direccion, membresia_raw } = req.body;
    
    // Desglosar valor del select: "VIP-1750"
    const data = membresia_raw.split('-');
    const nombreMem = data[0];
    const monto = parseInt(data[1]);

    const sql = `INSERT INTO socios (patrocinador_id, nombre, correo, telefono, direccion, membresia, puntos) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [patrocinador_id, nombre, correo, telefono, direccion, nombreMem, monto], () => {
        res.send(`
            <form id="r" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio registrado correctamente'); document.getElementById('r').submit();</script>
        `);
    });
});

// Agregar Pedido
app.post('/add-pedido', (req, res) => {
    const { cliente, guia, empresa } = req.body;
    db.run("INSERT INTO pedidos (cliente, guia, empresa) VALUES (?, ?, ?)", [cliente, guia, empresa], () => {
        res.send(`
            <form id="r" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('r').submit();</script>
        `);
    });
});

// Borrar Socio
app.post('/delete-socio', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
            res.send(`
                <form id="r" action="/dashboard" method="POST">
                    <input type="hidden" name="correo" value="admin@raizoma.com">
                    <input type="hidden" name="password" value="1234">
                </form>
                <script>document.getElementById('r').submit();</script>
            `);
        });
    });
});

// Borrar Pedido
app.post('/delete-pedido', (req, res) => {
    db.run("DELETE FROM pedidos WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="r" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('r').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

// --- INICIO ---
app.listen(process.env.PORT || 10000, '0.0.0.0', () => {
    console.log('🚀 Raízoma Ultimate V7 Online');
});