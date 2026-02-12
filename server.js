/**
 * ============================================================================
 * SISTEMA RAÍZOMA BACKOFFICE - VISUAL ELITE V9.0
 * ----------------------------------------------------------------------------
 * AJUSTE: Animaciones Premium, Iconografía y Desglose de Bonos (15% + 10%)
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- BASE DE DATOS ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
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

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En preparación',
        empresa TEXT DEFAULT 'Estafeta'
    )`);
});

// --- LOGIN CON ANIMACIÓN ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Raízoma - Acceso Corporativo</title>
            <style>
                @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; overflow: hidden; }
                .login-card { background: white; padding: 60px; border-radius: 40px; width: 380px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); animation: slideIn 0.8s ease-out; }
                h1 { color: #1e3a8a; font-size: 38px; margin-bottom: 5px; letter-spacing: -1px; }
                .accent { color: #2ecc71; }
                input { width: 100%; padding: 16px; margin: 12px 0; border-radius: 15px; border: 1px solid #e2e8f0; font-size: 16px; transition: 0.3s; }
                input:focus { border-color: #1e3a8a; outline: none; box-shadow: 0 0 0 4px rgba(30,58,138,0.1); }
                button { width: 100%; padding: 16px; background: #1e3a8a; color: white; border: none; border-radius: 15px; cursor: pointer; font-weight: bold; font-size: 18px; margin-top: 20px; transition: 0.3s; }
                button:hover { background: #312e81; transform: scale(1.02); }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma<span class="accent">.</span></h1>
                <p style="color:#64748b; margin-bottom:35px;">Gestión de Capital y Red</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="Admin Email" required>
                    <input type="password" name="password" placeholder="••••••••" required>
                    <button type="submit">Iniciar Sesión</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DASHBOARD (EL MOTOR VISUAL) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, socios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                let capitalTotal = 0;
                let bonoInicioRapido = 0; 
                let bonoResiduo = 0;      

                let htmlSocios = socios.map(s => {
                    capitalTotal += s.puntos;
                    bonoInicioRapido += (s.puntos * 0.15);
                    bonoResiduo += (s.puntos * 0.10);
                    
                    return `
                    <tr class="row-hover">
                        <td>
                            <div style="font-weight:bold; color:#1e293b;">${s.nombre}</div>
                            <div style="font-size:10px; color:#3b82f6; font-weight:bold;">ID: ${s.patrocinador_id}</div>
                        </td>
                        <td><div style="font-size:12px; color:#475569;">${s.correo}</div><div style="font-size:11px; color:#94a3b8;">${s.telefono}</div></td>
                        <td><span class="badge-mem">${s.membresia}</span></td>
                        <td style="font-weight:800; color:#1e293b;">$${s.puntos.toLocaleString()}</td>
                        <td><div class="dot-status"></div> Activo</td>
                        <td>
                            <form action="/delete-socio" method="POST">
                                <input type="hidden" name="id" value="${s.id}">
                                <button type="submit" class="btn-del">🗑️</button>
                            </form>
                        </td>
                    </tr>`;
                }).join('');

                let htmlEnvios = envios.map(p => `
                    <div class="shipping-card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; font-size:14px;">${p.cliente}</span>
                            <img src="https://cdn-icons-png.flaticon.com/512/649/649730.png" width="20" style="opacity:0.5;">
                        </div>
                        <div style="font-size:11px; color:#64748b; margin:8px 0;">Guía: <b style="color:#1e293b;">${p.guia}</b></div>
                        <div class="ship-badge">${p.estatus}</div>
                    </div>
                `).join('');

                res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Raízoma ELITE</title>
                    <style>
                        :root { --blue: #1a237e; --green: #10b981; --gold: #f59e0b; }
                        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; color: #1e293b; }
                        
                        /* ANIMACIONES */
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
                        
                        .navbar { background: white; padding: 20px 60px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
                        .container { max-width: 1400px; margin: 40px auto; padding: 0 30px; animation: fadeIn 1s ease; }

                        /* DASHBOARD CARDS */
                        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; margin-bottom: 40px; }
                        .card-stat { background: white; padding: 30px; border-radius: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); transition: 0.3s; border-bottom: 4px solid transparent; }
                        .card-stat:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.06); }
                        .card-stat h3 { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; }
                        .card-stat .price { font-size: 28px; font-weight: 800; margin: 0; }
                        
                        .blue-border { border-color: #3b82f6; }
                        .green-border { border-color: var(--green); }
                        .gold-border { border-color: var(--gold); background: #fffbeb; }

                        .main-layout { display: grid; grid-template-columns: 2.2fr 1fr; gap: 30px; }
                        .panel { background: white; border-radius: 35px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }

                        /* TABLA Y COMPONENTES */
                        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f8fafc; }
                        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 13px; }
                        .badge-mem { background: #eff6ff; color: #1e40af; padding: 6px 12px; border-radius: 12px; font-weight: bold; font-size: 11px; }
                        .dot-status { height: 8px; width: 8px; background: var(--green); border-radius: 50%; display: inline-block; margin-right: 5px; animation: pulse 2s infinite; }
                        
                        .btn-main { background: var(--blue); color: white; border: none; padding: 14px 28px; border-radius: 16px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                        .btn-main:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(26,35,126,0.2); }
                        
                        .shipping-card { background: #f1f5f9; padding: 20px; border-radius: 20px; margin-bottom: 15px; transition: 0.3s; }
                        .shipping-card:hover { background: #e2e8f0; }
                        .ship-badge { display: inline-block; background: white; color: var(--blue); padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; }

                        /* MODAL */
                        #modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.8); backdrop-filter: blur(10px); z-index: 1000; }
                        .modal-box { background: white; width: 550px; margin: 50px auto; padding: 50px; border-radius: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
                        input, select, textarea { width: 100%; padding: 14px; margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <div class="navbar">
                        <h2 style="color:var(--blue); margin:0;">RAÍZOMA <span style="color:var(--green)">PRO</span></h2>
                        <div style="display:flex; align-items:center; gap:20px;">
                            <div style="text-align:right;">
                                <div style="font-size:10px; font-weight:bold; color:#94a3b8;">SISTEMA ACTIVO</div>
                                <div style="font-size:12px; font-weight:bold;">CUENTA MADRE</div>
                            </div>
                            <div style="width:45px; height:45px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">AD</div>
                        </div>
                    </div>

                    <div class="container">
                        <div class="stats-grid">
                            <div class="card-stat">
                                <h3>Ventas Totales</h3>
                                <p class="price">$${capitalTotal.toLocaleString()}</p>
                            </div>
                            <div class="card-stat blue-border">
                                <h3>Inicio Rápido (15%)</h3>
                                <p class="price" style="color:#3b82f6;">$${bonoInicioRapido.toLocaleString()}</p>
                                <span style="font-size:10px; color:#3b82f6;">Ganancia Directa</span>
                            </div>
                            <div class="card-stat green-border">
                                <h3>Residual (10%)</h3>
                                <p class="price" style="color:var(--green);">$${bonoResiduo.toLocaleString()}</p>
                                <span style="font-size:10px; color:var(--green);">Cartera Mensual</span>
                            </div>
                            <div class="card-stat gold-border">
                                <h3>Mi Billetera</h3>
                                <p class="price" style="color:var(--gold);">$${(bonoInicioRapido + bonoResiduo).toLocaleString()}</p>
                                <span style="font-size:10px; color:var(--gold); font-weight:bold;">TOTAL DISPONIBLE</span>
                            </div>
                        </div>

                        <div class="main-layout">
                            <div class="panel">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h2 style="margin:0; font-size:24px; letter-spacing:-0.5px;">Estructura de Socios</h2>
                                    <button class="btn-main" onclick="document.getElementById('modal').style.display='block'">+ Nueva Inscripción</button>
                                </div>
                                <table>
                                    <thead>
                                        <tr><th>Socio / ID</th><th>Contacto</th><th>Membresía</th><th>Inversión</th><th>Estado</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        ${htmlSocios || '<tr><td colspan="6" style="text-align:center; padding:50px; color:#94a3b8;">No hay registros disponibles</td></tr>'}
                                    </tbody>
                                </table>
                            </div>

                            <div class="panel" style="background:#f1f5f9; border:none;">
                                <h3 style="margin:0 0 25px 0; color:var(--blue); font-size:18px;">📦 Centro de Envíos</h3>
                                <div style="max-height: 450px; overflow-y: auto; padding-right:10px;">
                                    ${htmlEnvios || '<p style="text-align:center; color:#94a3b8; font-size:12px;">Sin pedidos</p>'}
                                </div>
                                <div style="margin-top:30px; background:white; padding:25px; border-radius:25px; box-shadow:0 10px 20px rgba(0,0,0,0.05);">
                                    <h4 style="margin:0 0 15px 0; font-size:13px;">Registrar Guía Nueva</h4>
                                    <form action="/add-pedido" method="POST">
                                        <input type="text" name="cliente" placeholder="Nombre Destinatario" required>
                                        <input type="text" name="guia" placeholder="No. Guía FedEx/Estafeta" required style="margin-top:10px;">
                                        <button type="submit" class="btn-main" style="width:100%; margin-top:15px; background:var(--green);">Activar Rastreo</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="modal">
                        <div class="modal-box">
                            <h2 style="margin:0; color:var(--blue); font-size:28px;">Nueva Inscripción</h2>
                            <p style="color:#94a3b8; font-size:14px; margin-bottom:30px;">Completa los datos oficiales para el alta en red.</p>
                            <form action="/add-socio" method="POST">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                                    <div><label style="font-size:11px; font-weight:bold;">ID PATROCINADOR</label><input type="text" name="patrocinador_id" required placeholder="RZ-100"></div>
                                    <div><label style="font-size:11px; font-weight:bold;">NOMBRE COMPLETO</label><input type="text" name="nombre" required placeholder="Juan Pérez"></div>
                                    <div><label style="font-size:11px; font-weight:bold;">CORREO</label><input type="email" name="correo" required placeholder="socio@email.com"></div>
                                    <div><label style="font-size:11px; font-weight:bold;">TELÉFONO</label><input type="text" name="telefono" required placeholder="10 dígitos"></div>
                                </div>
                                <div style="margin-top:15px;">
                                    <label style="font-size:11px; font-weight:bold;">DIRECCIÓN DE ENVÍO</label>
                                    <textarea name="direccion" rows="2" placeholder="Calle, Ciudad, CP..."></textarea>
                                </div>
                                <div style="margin-top:15px;">
                                    <label style="font-size:11px; font-weight:bold;">MEMBRESÍA</label>
                                    <select name="membresia_raw" required>
                                        <option value="VIP-1750">Membresía VIP ($1,750)</option>
                                        <option value="FOUNDER-15000">Partner Fundador ($15,000)</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn-main" style="width:100%; margin-top:30px; font-size:16px; background:var(--green);">Finalizar Registro</button>
                                <button type="button" onclick="document.getElementById('modal').style.display='none'" style="width:100%; background:none; border:none; color:#94a3b8; margin-top:15px; font-weight:bold; cursor:pointer;">Cancelar</button>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
                `);
            });
        });
    } else { res.send("<script>alert('Acceso denegado'); window.location='/login';</script>"); }
});

// --- OPERACIONES ---
app.post('/add-socio', (req, res) => {
    const { patrocinador_id, nombre, correo, telefono, direccion, membresia_raw } = req.body;
    const parts = membresia_raw.split('-');
    db.run("INSERT INTO socios (patrocinador_id, nombre, correo, telefono, direccion, membresia, puntos) VALUES (?, ?, ?, ?, ?, ?, ?)", 
    [patrocinador_id, nombre, correo, telefono, direccion, parts[0], parseInt(parts[1])], () => {
        res.send(`<form id="r" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>alert('¡Socio Registrado con Éxito!'); document.getElementById('r').submit();</script>`);
    });
});

app.post('/add-pedido', (req, res) => {
    const { cliente, guia } = req.body;
    db.run("INSERT INTO pedidos (cliente, guia) VALUES (?, ?)", [cliente, guia], () => {
        res.send(`<form id="r" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>document.getElementById('r').submit();</script>`);
    });
});

app.post('/delete-socio', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`<form id="r" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>document.getElementById('r').submit();</script>`);
    });
});

app.get('/', (req, res) => res.redirect('/login'));
app.listen(process.env.PORT || 10000, '0.0.0.0', () => console.log('🚀 Raízoma Visual Elite V9 Ready'));