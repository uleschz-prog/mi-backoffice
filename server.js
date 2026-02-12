/**
 * ============================================================================
 * SISTEMA RAÍZOMA BACKOFFICE - CORPORATE EDITION V6.0
 * ----------------------------------------------------------------------------
 * Desarrollado para: Gestión de Cuenta Madre y Red de Mercadeo
 * Funciones: 
 * - Registro detallado de Socios (Patrocinador, Dirección, Teléfono)
 * - Lógica de Membresías Dinámicas (VIP $1,750 / Founder $15,000)
 * - Billetera de Comisiones (10% Automático)
 * - Rastreo de Paquetería y Envíos
 * - Base de Datos SQLite3 con persistencia
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARE ---
// Permite procesar datos de formularios y archivos JSON con seguridad
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS (ESTRUCTURA EMPRESARIAL) ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("CRÍTICO: Error al conectar con la base de datos:", err.message);
    } else {
        console.log("CONECTADO: Base de Datos Raízoma lista para operaciones.");
    }
});

db.serialize(() => {
    // Tabla de Socios: Optimizada con campos de contacto y patrocinio
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

    // Tabla de Pedidos: Para la logística de la cuenta madre
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En proceso de envío',
        empresa TEXT DEFAULT 'Estafeta / FedEx',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- INTERFAZ DE LOGIN (DISEÑO PREMIUM) ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Acceso Corporativo</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%); height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; color: white; }
                .login-box { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); padding: 60px; border-radius: 40px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); width: 100%; max-width: 400px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
                h1 { font-size: 40px; margin-bottom: 10px; letter-spacing: -1px; background: linear-gradient(to right, #4ade80, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                input { width: 100%; padding: 16px; margin: 12px 0; border-radius: 15px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white; font-size: 16px; box-sizing: border-box; }
                button { width: 100%; padding: 16px; background: #2ecc71; color: white; border: none; border-radius: 15px; cursor: pointer; font-weight: bold; font-size: 18px; margin-top: 25px; transition: 0.3s; }
                button:hover { background: #27ae60; transform: scale(1.02); }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h1>Raízoma</h1>
                <p style="opacity:0.6; margin-bottom:40px;">GESTIÓN DE CUENTA MADRE</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ACCEDER AL PANEL</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DASHBOARD (EL MOTOR DEL BACKOFFICE) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    
    // Validación de seguridad de la cuenta madre
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, socios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                let totalVentasRed = 0;
                
                // Generación dinámica de la tabla de socios
                let tablaSocios = socios.map(s => {
                    totalVentasRed += s.puntos;
                    return `
                    <tr>
                        <td>
                            <div style="font-weight:bold; color:#1e293b;">${s.nombre}</div>
                            <div style="font-size:11px; color:#64748b;">Patrocinador: <span style="color:#3b82f6; font-weight:bold;">${s.patrocinador_id}</span></div>
                        </td>
                        <td>
                            <div style="font-size:13px;">${s.correo}</div>
                            <div style="font-size:12px; color:#94a3b8;">Tel: ${s.telefono}</div>
                        </td>
                        <td>
                            <div style="font-size:12px; font-weight:bold; color:#1a237e;">${s.membresia}</div>
                            <div style="font-size:10px; color:#64748b; max-width:150px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${s.direccion}</div>
                        </td>
                        <td style="font-weight:bold; color:#10b981;">$${s.puntos.toLocaleString()}</td>
                        <td><span style="background:#f0fdf4; color:#166534; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:bold;">${s.estado}</span></td>
                        <td>
                            <form action="/delete-socio" method="POST" onsubmit="return confirm('¿Confirmas la eliminación definitiva?')">
                                <input type="hidden" name="id" value="${s.id}">
                                <button type="submit" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold;">×</button>
                            </form>
                        </td>
                    </tr>`;
                }).join('');

                // Generación de tarjetas de logística
                let listaLogistica = envios.map(p => `
                    <div style="background:white; padding:20px; border-radius:20px; margin-bottom:15px; border:1px solid #f1f5f9; box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div>
                                <div style="font-weight:bold; font-size:14px; color:#1e293b;">${p.cliente}</div>
                                <div style="font-size:12px; color:#3b82f6; margin-top:4px; font-family:monospace;">GUÍA: ${p.guia}</div>
                            </div>
                            <span style="background:#fff7ed; color:#9a3412; padding:4px 10px; border-radius:10px; font-size:10px; font-weight:bold;">${p.estatus}</span>
                        </div>
                        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #f8fafc; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:11px; color:#94a3b8;">📦 ${p.empresa}</span>
                            <form action="/delete-pedido" method="POST">
                                <input type="hidden" name="id" value="${p.id}">
                                <button type="submit" style="background:none; border:none; color:#cbd5e0; font-size:10px; cursor:pointer;">Archivar</button>
                            </form>
                        </div>
                    </div>
                `).join('');

                res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Panel Administrativo - Raízoma</title>
                    <style>
                        :root { --main-blue: #1a237e; --soft-bg: #f8fafc; --success: #2ecc71; }
                        body { font-family: 'Segoe UI', sans-serif; background: var(--soft-bg); margin: 0; color: #334155; }
                        
                        /* HEADER ESTRUCTURA */
                        .top-bar { background: white; padding: 20px 60px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; position: sticky; top:0; z-index:90; }
                        .top-bar h2 { margin: 0; color: var(--main-blue); letter-spacing: -1px; }

                        .content-wrapper { max-width: 1300px; margin: 40px auto; padding: 0 25px; }

                        /* RESUMEN FINANCIERO */
                        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 25px; margin-bottom: 40px; }
                        .metric-card { background: white; padding: 35px; border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); position: relative; overflow: hidden; }
                        .metric-card.dark { background: #1e293b; color: white; }
                        .metric-card h3 { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; }
                        .metric-card .big-value { font-size: 36px; font-weight: 800; margin: 0; }

                        /* LAYOUT DINÁMICO */
                        .main-grid { display: grid; grid-template-columns: 2.2fr 1fr; gap: 30px; }
                        .white-panel { background: white; border-radius: 30px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }

                        /* TABLAS EMPRESARIALES */
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 12px; border-bottom: 2px solid #f8fafc; text-transform: uppercase; }
                        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; }

                        /* COMPONENTES DE INTERFAZ */
                        input, select, textarea { padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 15px; width: 100%; box-sizing: border-box; font-size: 14px; background: #fcfdfe; transition: 0.3s; }
                        input:focus { border-color: var(--main-blue); outline: none; box-shadow: 0 0 0 4px rgba(26, 35, 126, 0.05); }
                        .btn-primary { background: var(--main-blue); color: white; border: none; padding: 15px 30px; border-radius: 15px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.3s; }
                        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(26, 35, 126, 0.2); }
                        .btn-success { background: var(--success); color: white; border: none; padding: 18px; border-radius: 15px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 20px; }

                        /* MODAL DE INSCRIPCIÓN */
                        #registrationModal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); z-index: 1000; overflow-y: auto; }
                        .modal-container { background: white; width: 100%; max-width: 600px; margin: 50px auto; padding: 50px; border-radius: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.4); }
                    </style>
                </head>
                <body>
                    <div class="top-bar">
                        <h2>RAÍZOMA <span>CORP</span></h2>
                        <div style="display:flex; align-items:center; gap:30px;">
                            <div style="text-align:right;">
                                <div style="font-size:11px; font-weight:bold; color:var(--main-blue);">ESTADO DE RED</div>
                                <div style="width:140px; height:6px; background:#e2e8f0; border-radius:10px; margin-top:5px;"><div style="width:85%; height:100%; background:var(--success); border-radius:10px;"></div></div>
                            </div>
                            <a href="/login" style="color:#64748b; font-weight:bold; text-decoration:none; font-size:14px;">Cerrar Sesión</a>
                        </div>
                    </div>

                    <div class="content-wrapper">
                        <div class="metrics-grid">
                            <div class="metric-card dark">
                                <h3>Volumen Total de Red</h3>
                                <p class="big-value">$${totalVentasRed.toLocaleString()}</p>
                                <div style="font-size:11px; margin-top:15px; opacity:0.6;">OBJETIVO MENSUAL: $50,000</div>
                            </div>
                            <div class="metric-card">
                                <h3 style="color:#94a3b8;">Mi Billetera (Comisión 10%)</h3>
                                <p class="big-value" style="color:var(--main-blue);">$${(totalVentasRed * 0.1).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                <div style="font-size:11px; margin-top:15px; color:var(--success); font-weight:bold;">✓ Disponible para retiro</div>
                            </div>
                            <div class="metric-card" style="display:flex; align-items:center; gap:15px;">
                                <input type="number" placeholder="Monto a retirar ($)" style="flex:1;">
                                <button class="btn-primary">SOLICITAR PAGO</button>
                            </div>
                        </div>

                        <div class="main-grid">
                            <div class="white-panel">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                                    <h2 style="margin:0; font-size:22px;">Gestión de Socios Directos</h2>
                                    <button class="btn-primary" onclick="document.getElementById('registrationModal').style.display='block'">+ INSCRIBIR SOCIO</button>
                                </div>
                                
                                <table>
                                    <thead>
                                        <tr><th>Socio / Patrocinio</th><th>Contacto</th><th>Membresía</th><th>Inversión</th><th>Estado</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        ${tablaSocios || '<tr><td colspan="6" style="text-align:center; padding:60px; color:#94a3b8;">No hay registros activos en la base de datos.</td></tr>'}
                                    </tbody>
                                </table>

                                <div style="margin-top:50px; padding-top:40px; border-top:1px solid #f1f5f9;">
                                    <h3 style="font-size:18px; margin-bottom:25px;">🔗 Configuración de Cuentas para Retiros</h3>
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8; display:block; margin-bottom:8px;">BANCO DE DEPÓSITO</label><input type="text" placeholder="Ej. BBVA México"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8; display:block; margin-bottom:8px;">CLABE INTERBANCARIA</label><input type="text" placeholder="18 dígitos obligatorios"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8; display:block; margin-bottom:8px;">DIRECCIÓN WALLET USDT</label><input type="text" placeholder="Red Tron (TRC20)"></div>
                                        <div><label style="font-size:11px; font-weight:bold; color:#94a3b8; display:block; margin-bottom:8px;">TITULAR DE LA CUENTA</label><input type="text" placeholder="Nombre completo"></div>
                                    </div>
                                    <button class="btn-success" style="width:280px; margin-top:30px;">ACTUALIZAR DATOS DE COBRO</button>
                                </div>
                            </div>

                            <div class="white-panel" style="background:#f1f5f9; border:none;">
                                <h2 style="margin:0 0 30px 0; font-size:18px; color:var(--main-blue); display:flex; align-items:center; gap:12px;">
                                    <span>📦</span> Centro de Logística
                                </h2>
                                
                                <div style="max-height: 550px; overflow-y: auto; padding-right:10px;">
                                    ${listaLogistica || '<div style="text-align:center; padding:30px; color:#94a3b8; font-size:13px;">Sin envíos pendientes por rastrear.</div>'}
                                </div>

                                <div style="background:white; padding:30px; border-radius:25px; margin-top:30px; box-shadow:0 15px 30px rgba(0,0,0,0.05);">
                                    <h4 style="margin:0 0 15px 0; font-size:14px; text-transform:uppercase; color:#64748b;">Nuevo Seguimiento</h4>
                                    <form action="/add-pedido" method="POST">
                                        <input type="text" name="cliente" placeholder="Nombre del Destinatario" required style="margin-bottom:12px; background:#f8fafc;">
                                        <input type="text" name="guia" placeholder="Número de Guía (12-22 dígitos)" required style="margin-bottom:12px; background:#f8fafc;">
                                        <select name="empresa" style="background:#f8fafc;">
                                            <option value="Estafeta">Estafeta</option>
                                            <option value="FedEx">FedEx</option>
                                            <option value="DHL">DHL Express</option>
                                            <option value="Paquetexpress">Paquetexpress</option>
                                        </select>
                                        <button type="submit" class="btn-primary" style="width:100%; margin-top:15px; padding:12px;">ACTIVAR RASTREO</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="registrationModal">
                        <div class="modal-container">
                            <h2 style="margin:0 0 10px 0; color:var(--main-blue); font-size:28px;">Formulario de Inscripción</h2>
                            <p style="color:#94a3b8; margin-bottom:35px; font-size:14px;">Completa los datos oficiales para el registro en la red Raízoma.</p>
                            
                            <form action="/add-socio" method="POST">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                                    <div><label style="font-size:12px; font-weight:700; color:#475569;">ID PATROCINADOR *</label><input type="text" name="patrocinador_id" placeholder="Ej: RZ-500" required></div>
                                    <div><label style="font-size:12px; font-weight:700; color:#475569;">NOMBRE COMPLETO *</label><input type="text" name="nombre" placeholder="Nombre del nuevo socio" required></div>
                                    <div><label style="font-size:12px; font-weight:700; color:#475569;">CORREO ELECTRÓNICO *</label><input type="email" name="correo" placeholder="ejemplo@raizoma.com" required></div>
                                    <div><label style="font-size:12px; font-weight:700; color:#475569;">TELÉFONO DE CONTACTO *</label><input type="text" name="telefono" placeholder="10 dígitos" required></div>
                                </div>
                                
                                <div style="margin-bottom:20px;">
                                    <label style="font-size:12px; font-weight:700; color:#475569;">DIRECCIÓN COMPLETA DE ENVÍO *</label>
                                    <textarea name="direccion" rows="3" placeholder="Calle, Número, Colonia, CP, Ciudad y Estado" required style="font-family:inherit;"></textarea>
                                </div>

                                <div style="margin-bottom:30px;">
                                    <label style="font-size:12px; font-weight:700; color:#475569;">PLAN DE MEMBRESÍA *</label>
                                    <select name="membresia_raw" required style="margin-top:8px; border:2px solid #e2e8f0; height:55px;">
                                        <option value="">Seleccione el nivel de ingreso...</option>
                                        <option value="VIP-1750">Membresía VIP ($1,750 MXN)</option>
                                        <option value="PARTNER-15000">Partner Fundador ($15,000 MXN)</option>
                                    </select>
                                </div>

                                <div style="display:flex; gap:15px;">
                                    <button type="submit" class="btn-success" style="margin:0; flex:2; font-size:16px;">PROCESAR REGISTRO</button>
                                    <button type="button" class="btn-primary" style="flex:1; background:#94a3b8;" onclick="document.getElementById('registrationModal').style.display='none'">CANCELAR</button>
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
        res.send("<script>alert('CREDENCIALES INVÁLIDAS'); window.location='/login';</script>");
    }
});

// --- OPERACIONES DE BASE DE DATOS (API INTERNA) ---

// Inscribir Socio y Calcular Monto
app.post('/add-socio', (req, res) => {
    const { patrocinador_id, nombre, correo, telefono, direccion, membresia_raw } = req.body;
    
    // Desglose de membresía: "PARTNER-15000" -> Nombre: PARTNER, Puntos: 15000
    const parts = membresia_raw.split('-');
    const nombreMem = parts[0];
    const inversion = parseInt(parts[1]);

    const sql = `INSERT INTO socios (patrocinador_id, nombre, correo, telefono, direccion, membresia, puntos) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [patrocinador_id, nombre, correo, telefono, direccion, nombreMem, inversion], (err) => {
        if (err) {
            console.error(err.message);
            res.send("Error al guardar en BD");
        } else {
            res.send(`
                <form id="redirect" action="/dashboard" method="POST">
                    <input type="hidden" name="correo" value="admin@raizoma.com">
                    <input type="hidden" name="password" value="1234">
                </form>
                <script>alert('INSCRIPCIÓN EXITOSA: El socio ha sido agregado a la red.'); document.getElementById('redirect').submit();</script>
            `);
        }
    });
});

// Registrar Guía de Paquetería
app.post('/add-pedido', (req, res) => {
    const { cliente, guia, empresa } = req.body;
    db.run("INSERT INTO pedidos (cliente, guia, empresa) VALUES (?, ?, ?)", [cliente, guia, empresa], () => {
        res.send(`
            <form id="redirect" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('redirect').submit();</script>
        `);
    });
});

// Eliminar Socio de la Red
app.post('/delete-socio', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="redirect" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('redirect').submit();</script>
        `);
    });
});

// Eliminar/Archivar Guía
app.post('/delete-pedido', (req, res) => {
    db.run("DELETE FROM pedidos WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="redirect" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>document.getElementById('redirect').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

// --- INICIO DE SERVIDOR CORPORATIVO ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`🚀 RAÍZOMA BACKOFFICE V6.0 ONLINE EN PUERTO ${PORT}`);
    console.log(`=================================================`);
});