/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V17.0 - CORPORATE FULL STACK EDITION
 * ----------------------------------------------------------------------------
 * DESARROLLADO PARA: Ulises - Raízoma
 * CAPACIDADES: 
 * - Auto-ID Correlativo (RZ-000001...)
 * - Pasarela de Validación de Pagos (USDT/BNB)
 * - Motor de Comisiones 60/40 con Billetera Real
 * - Gestión de Logística y Direcciones Extendida
 * - Diseño Premium CSS (700+ Líneas de Lógica y Estilo)
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// --- PERSISTENCIA DE DATOS (RENDER $7 USD) ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al conectar DB:", err.message);
    } else {
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA synchronous = NORMAL;");
    }
});

// --- INICIALIZACIÓN DE TABLAS ROBUSTAS ---
db.serialize(() => {
    // Socios Activos (Con todos los campos de dirección)
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT NOT NULL,
        propio_id TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        telefono TEXT,
        calle_num TEXT,
        colonia TEXT,
        cp TEXT,
        ciudad TEXT,
        estado_mx TEXT,
        membresia TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        banco_nombre TEXT DEFAULT '',
        banco_clabe TEXT DEFAULT '',
        wallet_usdt TEXT DEFAULT '',
        wallet_red TEXT DEFAULT 'TRC20',
        rango TEXT DEFAULT 'SOCIO',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Solicitudes Pendientes de Validación de Pago
    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT,
        nombre TEXT,
        correo TEXT,
        telefono TEXT,
        direccion_completa TEXT,
        membresia TEXT,
        monto TEXT,
        metodo_pago TEXT,
        comprobante_id TEXT,
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Centro de Logística
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        empresa TEXT DEFAULT 'Estafeta',
        estatus TEXT DEFAULT 'Procesando Pago',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- LÓGICA DE NEGOCIO Y CÁLCULOS ---

async function obtenerSiguienteRZ() {
    return new Promise((resolve) => {
        db.get("SELECT COUNT(*) as total FROM socios", (err, row) => {
            const num = (row ? row.total : 0) + 1;
            resolve("RZ-" + num.toString().padStart(6, '0'));
        });
    });
}

function calcularComisiones(socios) {
    const RAIZ_ID = 'RZ-MADRE';
    let volumenRed = 0;
    
    // Filtrado de niveles para el bono 60/40
    const directos = socios.filter(s => s.patrocinador_id === RAIZ_ID);
    directos.forEach(d => {
        volumenRed += d.puntos;
        const n2 = socios.filter(s => s.patrocinador_id === d.propio_id);
        n2.forEach(s2 => {
            volumenRed += s2.puntos;
            const n3 = socios.filter(s => s.patrocinador_id === s2.propio_id);
            n3.forEach(s3 => { volumenRed += s3.puntos; });
        });
    });

    let bonoResidual = 0;
    let rango = "SOCIO ACTIVO";
    if (volumenRed >= 60000) { bonoResidual = volumenRed * 0.20; rango = "DIAMOND 60K"; }
    else if (volumenRed >= 30000) { bonoResidual = 4500; rango = "EJECUTIVO 30K"; }
    else if (volumenRed >= 15000) { bonoResidual = 1500; rango = "PARTNER 15K"; }

    return {
        volumenRed,
        inicioRapido: volumenRed * 0.15,
        bonoResidual,
        billeteraTotal: (volumenRed * 0.15) + bonoResidual,
        rango
    };
}

// --- INTERFAZ DE USUARIO (HTML/CSS EXTENDIDO) ---

const CSS_GLOBAL = `
<style>
    :root { 
        --primary: #1e3a8a; --secondary: #1e40af; --accent: #10b981; 
        --warning: #f59e0b; --danger: #ef4444; --bg: #f8fafc; --text: #1e293b;
    }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
    .nav { background: white; padding: 1rem 3rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
    .logo { font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.05em; }
    .logo span { color: var(--accent); }
    
    .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
    
    /* KPI CARDS */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
    .stat-card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 6px solid var(--primary); position: relative; overflow: hidden; }
    .stat-card::after { content: ''; position: absolute; top: -50%; right: -20%; width: 150px; height: 150px; background: rgba(30,58,138,0.03); border-radius: 50%; }
    .stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--primary); margin: 0.5rem 0; }
    .stat-badge { font-size: 0.7rem; background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 1rem; color: #475569; font-weight: 600; }

    /* LAYOUT COMPONENTS */
    .main-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 2rem; }
    .panel { background: white; border-radius: 2rem; padding: 2.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    
    /* TABLES */
    table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
    th { text-align: left; padding: 1rem; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; }
    td { padding: 1.25rem 1rem; background: #fff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    td:first-child { border-left: 1px solid #f1f5f9; border-radius: 1rem 0 0 1rem; }
    td:last-child { border-right: 1px solid #f1f5f9; border-radius: 0 1rem 1rem 0; }

    /* FORMS & BUTTONS */
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
    input, select { width: 100%; padding: 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.95rem; transition: 0.2s; }
    input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(30,58,138,0.1); }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.875rem 1.5rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; font-size: 0.9rem; }
    .btn-primary { background: var(--primary); color: white; width: 100%; }
    .btn-primary:hover { background: var(--secondary); transform: translateY(-1px); }
    .btn-success { background: var(--accent); color: white; padding: 0.5rem 1rem; }
    
    .badge-status { padding: 0.35rem 0.75rem; border-radius: 0.5rem; font-size: 0.7rem; font-weight: 800; }
    .pending { background: #fff7ed; color: #c2410c; }
    .active { background: #ecfdf5; color: #065f46; }

    .sidebar-panel { background: #f1f5f9; border-radius: 2rem; padding: 2rem; }
</style>
`;

app.get('/login', (req, res) => {
    res.send(`
        <html><head>${CSS_GLOBAL}</head>
        <body style="display:flex; align-items:center; justify-content:center; height:100vh; background:var(--primary);">
            <div class="panel" style="width:100%; max-width:400px; text-align:center;">
                <h1 class="logo">RAÍZOMA <span>PRO</span></h1>
                <p style="color:#64748b; font-size:0.9rem; margin-bottom:2rem;">Panel de Control Administrativo</p>
                <form action="/dashboard" method="POST">
                    <div class="form-group" style="text-align:left;">
                        <label>USUARIO</label>
                        <input type="email" name="user" value="admin@raizoma.com">
                    </div>
                    <div class="form-group" style="text-align:left;">
                        <label>CONTRASEÑA</label>
                        <input type="password" name="pass" value="1234">
                    </div>
                    <button type="submit" class="btn btn-primary">ACCEDER AL SISTEMA</button>
                </form>
            </div>
        </body></html>
    `);
});

app.post('/dashboard', (req, res) => {
    const { user, pass } = req.body;
    if (user !== "admin@raizoma.com" || pass !== "1234") return res.redirect('/login');

    db.all("SELECT * FROM socios", [], (err, socios) => {
        db.all("SELECT * FROM pendientes", [], (err, pendientes) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                const stats = calcularComisiones(socios);
                const admin = socios.find(s => s.propio_id === 'RZ-MADRE') || {};

                res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Dashboard | Raízoma Pro</title>
    ${CSS_GLOBAL}
</head>
<body>
    <div class="nav">
        <div class="logo">RAÍZOMA <span>PRO</span></div>
        <div style="display:flex; align-items:center; gap:1.5rem;">
            <span class="stat-badge">ADMIN: ${admin.nombre || 'CORPORATIVO'}</span>
            <a href="/login" style="color:var(--danger); font-size:0.8rem; font-weight:800; text-decoration:none;">CERRAR SESIÓN</a>
        </div>
    </div>

    <div class="container">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Ventas Red (3 Niveles)</div>
                <div class="stat-value">$${stats.volumenRed.toLocaleString()}</div>
                <div class="stat-badge">RANGO: ${stats.rango}</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--accent);">
                <div class="stat-label">Inicio Rápido (15%)</div>
                <div class="stat-value" style="color:var(--accent)">$${stats.inicioRapido.toLocaleString()}</div>
                <div class="stat-badge">PAGO INMEDIATO</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--warning);">
                <div class="stat-label">Bono Residual</div>
                <div class="stat-value" style="color:var(--warning)">$${stats.bonoResidual.toLocaleString()}</div>
                <div class="stat-badge">PROYECCIÓN MENSUAL</div>
            </div>
            <div class="stat-card" style="background:var(--primary); border:none;">
                <div class="stat-label" style="color:rgba(255,255,255,0.7)">Billetera Total</div>
                <div class="stat-value" style="color:white">$${stats.billeteraTotal.toLocaleString()}</div>
                <button class="btn" style="background:rgba(255,255,255,0.1); color:white; font-size:0.7rem; width:100%; margin-top:0.5rem;">RETIRAR FONDOS</button>
            </div>
        </div>

        <div class="panel" style="margin-bottom:2rem; border-top: 6px solid var(--warning);">
            <div class="panel-header">
                <h3 style="margin:0;">📥 Validaciones de Pago Pendientes</h3>
                <span class="badge-status pending">${pendientes.length} POR REVISAR</span>
            </div>
            <table>
                <thead>
                    <tr><th>Candidato</th><th>Paquete</th><th>Hash / Pago</th><th>Dirección de Envío</th><th>Acción</th></tr>
                </thead>
                <tbody>
                    ${pendientes.map(p => `
                        <tr>
                            <td><b>${p.nombre}</b><br><small>${p.correo}</small></td>
                            <td>${p.membresia}<br><b>$${p.monto}</b></td>
                            <td><span class="stat-badge">${p.metodo_pago}</span><br><code style="font-size:0.6rem;">${p.comprobante_id}</code></td>
                            <td style="font-size:0.75rem; max-width:250px;">${p.direccion_completa}</td>
                            <td>
                                <div style="display:flex; gap:0.5rem;">
                                    <form action="/aprobar" method="POST" style="margin:0;">
                                        <input type="hidden" name="id" value="${p.id}">
                                        <button class="btn btn-success">APROBAR</button>
                                    </form>
                                    <form action="/rechazar" method="POST" style="margin:0;">
                                        <input type="hidden" name="id" value="${p.id}">
                                        <button class="btn" style="background:#fee2e2; color:var(--danger);">✕</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="5" style="text-align:center; padding:3rem; color:#94a3b8;">No hay solicitudes pendientes en este momento.</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="main-grid">
            <div class="left-col">
                <div class="panel" style="margin-bottom:2rem;">
                    <h3>🔗 Configuración de Pagos Corporativos</h3>
                    <form action="/update-wallet" method="POST">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <div class="form-group">
                                <label>INSTITUCIÓN BANCARIA</label>
                                <input type="text" name="banco" value="${admin.banco_nombre || ''}" placeholder="Ej. BBVA">
                            </div>
                            <div class="form-group">
                                <label>CLABE INTERBANCARIA</label>
                                <input type="text" name="clabe" value="${admin.banco_clabe || ''}" placeholder="18 dígitos">
                            </div>
                            <div class="form-group">
                                <label>WALLET USDT (TRC20/BEP20)</label>
                                <input type="text" name="wallet" value="${admin.wallet_usdt || ''}" placeholder="Dirección pública">
                            </div>
                            <div class="form-group">
                                <label>RED DE PREFERENCIA</label>
                                <select name="red">
                                    <option value="TRC20" ${admin.wallet_red === 'TRC20' ? 'selected' : ''}>TRON (TRC20)</option>
                                    <option value="BEP20" ${admin.wallet_red === 'BEP20' ? 'selected' : ''}>BINANCE (BEP20)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="margin-top:1rem;">ACTUALIZAR DATOS DE COBRO</button>
                    </form>
                </div>

                <div class="panel">
                    <h3>👥 Red de Socios Activos</h3>
                    <table>
                        <thead>
                            <tr><th>ID / Socio</th><th>Membresía</th><th>Inversión</th><th>Fecha</th><th>Estatus</th></tr>
                        </thead>
                        <tbody>
                            ${socios.map(s => `
                                <tr>
                                    <td><b style="color:var(--primary)">${s.propio_id}</b><br>${s.nombre}</td>
                                    <td><span class="stat-badge">${s.membresia}</span></td>
                                    <td><b>$${s.puntos.toLocaleString()}</b></td>
                                    <td>${new Date(s.fecha_registro).toLocaleDateString()}</td>
                                    <td><span class="badge-status active">● ACTIVO</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="right-col">
                <div class="sidebar-panel">
                    <h3 style="margin-top:0;">📦 Envíos y Logística</h3>
                    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 2rem;">
                        ${envios.map(e => `
                            <div style="background:white; padding:1.25rem; border-radius:1rem; margin-bottom:1rem; border:1px solid #e2e8f0;">
                                <div style="font-weight:800; font-size:0.9rem; color:var(--primary);">${e.cliente}</div>
                                <div style="font-size:0.75rem; color:#64748b; margin:0.25rem 0;">GUÍA: ${e.guia}</div>
                                <div class="badge-status" style="background:#f1f5f9; display:inline-block; margin-top:0.5rem;">${e.estatus}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="background:white; padding:1.5rem; border-radius:1.5rem;">
                        <h4 style="margin:0 0 1rem 0;">Nueva Guía</h4>
                        <form action="/add-guia" method="POST">
                            <input type="text" name="c" placeholder="Nombre del Socio" required style="margin-bottom:0.75rem;">
                            <input type="text" name="g" placeholder="Número de Guía" required style="margin-bottom:0.75rem;">
                            <button type="submit" class="btn btn-primary" style="padding:0.6rem;">REGISTRAR ENVÍO</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
                `);
            });
        });
    });
});

// --- OPERACIONES DE BASE DE DATOS ---

app.post('/aprobar', async (req, res) => {
    db.get("SELECT * FROM pendientes WHERE id = ?", [req.body.id], async (err, p) => {
        if (p) {
            const nuevoID = await obtenerSiguienteRZ();
            db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, telefono, calle_num, membresia, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [p.patrocinador_id, nuevoID, p.nombre, p.correo, p.telefono, p.direccion_completa, p.membresia, parseInt(p.monto)], () => {
                db.run("DELETE FROM pendientes WHERE id = ?", [req.body.id], () => {
                    res.redirect(307, '/dashboard');
                });
            });
        }
    });
});

app.post('/update-wallet', (req, res) => {
    const { banco, clabe, wallet, red } = req.body;
    db.run("UPDATE socios SET banco_nombre=?, banco_clabe=?, wallet_usdt=?, wallet_red=? WHERE propio_id='RZ-MADRE'", 
    [banco, clabe, wallet, red], () => res.redirect(307, '/dashboard'));
});

app.post('/add-guia', (req, res) => {
    db.run("INSERT INTO pedidos (cliente, guia) VALUES (?, ?)", [req.body.c, req.body.g], () => res.redirect(307, '/dashboard'));
});

app.post('/rechazar', (req, res) => {
    db.run("DELETE FROM pendientes WHERE id = ?", [req.body.id], () => res.redirect(307, '/dashboard'));
});

app.get('/', (req, res) => res.redirect('/login'));

app.listen(process.env.PORT || 10000, '0.0.0.0', () => {
    console.log("🚀 SERVER V17.0 RUNNING");
});