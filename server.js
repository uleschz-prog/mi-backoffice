/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO - CORPORATE EDITION V15.2
 * ----------------------------------------------------------------------------
 * OPTIMIZADO PARA: Render Starter Plan ($7 USD) + Persistent Disk
 * INCLUYE: 
 * - Motor de Compensación 60/40 (3 Niveles)
 * - Interfaz de Wallets USDT (TRC20/BEP20)
 * - Gestión de Cuentas Bancarias (CLABE)
 * - Árbol Genealógico Visual (CSS Connectors)
 * - Centro de Logística y Envíos
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS (PERSISTENCIA $7 USD) ---
// Detecta si está en el disco de Render o en local
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error crítico de DB:", err.message);
    } else {
        // Optimizaciones para el disco persistente
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA auto_vacuum = FULL;");
        db.run("PRAGMA synchronous = NORMAL;");
    }
});

// --- INICIALIZACIÓN DE ESQUEMA ---
db.serialize(() => {
    // Tabla Maestra de Socios
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT NOT NULL,
        propio_id TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        telefono TEXT DEFAULT '',
        membresia TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        banco_nombre TEXT DEFAULT '',
        banco_clabe TEXT DEFAULT '',
        wallet_usdt TEXT DEFAULT '',
        wallet_red TEXT DEFAULT 'TRC20',
        estado TEXT DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Logística
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        empresa TEXT DEFAULT 'Estafeta',
        estatus TEXT DEFAULT 'En proceso',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- MOTOR DE CÁLCULOS (MLM CORE) ---
function procesarFinanzas(socios) {
    const RAIZ_ID = 'RAIZOMA-MADRE';
    let volumenTotalRed = 0;
    
    // Lógica Unilevel 3 Niveles
    const directos = socios.filter(s => s.patrocinador_id === RAIZ_ID);
    
    directos.forEach(d => {
        volumenTotalRed += d.puntos; // Nivel 1
        const nivel2 = socios.filter(s => s.patrocinador_id === d.propio_id);
        nivel2.forEach(n2 => {
            volumenTotalRed += n2.puntos; // Nivel 2
            const nivel3 = socios.filter(s => s.patrocinador_id === n2.propio_id);
            nivel3.forEach(n3 => {
                volumenTotalRed += n3.puntos; // Nivel 3
            });
        });
    });

    // Definición de Rangos y Pagos Fijos
    let rangoActual = "SOCIO ACTIVO";
    let pagoResidual = 0;
    let colorRango = "#94a3b8";

    if (volumenTotalRed >= 60000) {
        rangoActual = "DIAMOND 60K";
        pagoResidual = volumenTotalRed * 0.20; // 20% Variable
        colorRango = "#1e3a8a";
    } else if (volumenTotalRed >= 30000) {
        rangoActual = "EJECUTIVO 30K";
        pagoResidual = 4500; // Pago Fijo
        colorRango = "#10b981";
    } else if (volumenTotalRed >= 15000) {
        rangoActual = "PARTNER 15K";
        pagoResidual = 1500; // Pago Fijo
        colorRango = "#f59e0b";
    }

    return {
        volumenTotalRed,
        rangoActual,
        pagoResidual,
        inicioRapido: volumenTotalRed * 0.15,
        colorRango
    };
}

// --- GENERADOR DE ÁRBOL GENEALÓGICO ---
function renderTree(socios, pId = 'RAIZOMA-MADRE') {
    const children = socios.filter(s => s.patrocinador_id === pId);
    if (children.length === 0) return '';
    return `
        <ul>
            ${children.map(c => `
                <li>
                    <div class="tree-node ${c.membresia === 'FOUNDER' ? 'node-gold' : 'node-blue'}">
                        <span class="node-id">${c.propio_id}</span>
                        <span class="node-name">${c.nombre}</span>
                        <span class="node-pts">$${c.puntos.toLocaleString()}</span>
                    </div>
                    ${renderTree(socios, c.propio_id)}
                </li>
            `).join('')}
        </ul>
    `;
}

// --- VISTAS DEL SISTEMA ---

app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Acceso Corporativo - Raízoma</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 25px; width: 320px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #1e3a8a; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
                button:hover { background: #1e40af; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color:#1e3a8a">Raízoma Admin</h2>
                <form action="/dashboard" method="POST">
                    <input type="email" name="user" value="admin@raizoma.com">
                    <input type="password" name="pass" value="1234">
                    <button type="submit">ENTRAR AL PANEL</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/dashboard', (req, res) => {
    const { user, pass } = req.body;
    if (user !== "admin@raizoma.com" || pass !== "1234") return res.redirect('/login');

    db.all("SELECT * FROM socios", [], (err, socios) => {
        db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
            
            const stats = procesarFinanzas(socios);
            const treeHtml = renderTree(socios);
            const admin = socios.find(s => s.propio_id === 'RAIZOMA-MADRE') || {};

            res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Raízoma Pro - Dashboard</title>
    <style>
        :root { --blue: #1e3a8a; --green: #10b981; --gold: #f59e0b; --bg: #f8fafc; --text: #1e293b; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: var(--text); }
        
        /* HEADER PRINCIPAL */
        .header { background: white; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; position: sticky; top:0; z-index:100; }
        .logo { font-size: 24px; font-weight: 800; color: var(--blue); letter-spacing: -1px; }
        .logo span { color: var(--green); }
        .user-info { background: #eff6ff; padding: 8px 15px; border-radius: 12px; font-size: 13px; font-weight: bold; color: var(--blue); }

        .container { max-width: 1400px; margin: 30px auto; padding: 0 20px; }

        /* KPI CARDS (Captura 1) */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-bottom: 4px solid #e2e8f0; }
        .kpi-card small { color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .kpi-card .val { font-size: 28px; font-weight: 800; margin: 10px 0; color: var(--blue); }
        .kpi-card .badge { font-size: 10px; background: #f1f5f9; padding: 3px 8px; border-radius: 5px; color: #64748b; }

        /* WALLET & VINCULACIÓN (Captura 1) */
        .wallet-panel { background: white; padding: 30px; border-radius: 25px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .wallet-panel h3 { margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center; gap: 10px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group label { display: block; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 8px; }
        .input-group input, .input-group select { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box; }
        .btn-save { background: var(--green); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; width: 100%; margin-top: 20px; cursor: pointer; transition: 0.3s; }
        .btn-save:hover { filter: brightness(0.95); transform: translateY(-2px); }

        /* TABS SECTOR */
        .tabs { display: flex; gap: 10px; margin-bottom: 25px; }
        .tab-btn { padding: 12px 25px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; font-weight: bold; color: #64748b; transition: 0.3s; }
        .tab-btn.active { background: var(--blue); color: white; border-color: var(--blue); box-shadow: 0 10px 20px rgba(30,58,138,0.2); }

        /* MAIN CONTENT LAYOUT */
        .layout { display: grid; grid-template-columns: 2.2fr 1fr; gap: 30px; }
        .content-box { background: white; padding: 35px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); min-height: 500px; }

        /* TABLA DE SOCIOS */
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f8fafc; }
        td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 14px; }
        .pill { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; }
        .pill-active { background: #ecfdf5; color: var(--green); }

        /* ÁRBOL GENEALÓGICO VISUAL (Captura 3) */
        .tree-container { overflow-x: auto; padding: 40px 0; }
        .tree ul { padding-top: 20px; position: relative; transition: all 0.5s; display: flex; justify-content: center; }
        .tree li { list-style-type: none; position: relative; padding: 20px 5px 0 5px; transition: all 0.5s; }
        .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #cbd5e1; width: 50%; height: 20px; }
        .tree li::after { right: auto; left: 50%; border-left: 2px solid #cbd5e1; }
        .tree li:only-child::after, .tree li:only-child::before { display: none; }
        .tree li:only-child { padding-top: 0; }
        .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
        .tree li:last-child::before { border-right: 2px solid #cbd5e1; border-radius: 0 5px 0 0; }
        .tree li:first-child::after { border-radius: 5px 0 0 0; }
        .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #cbd5e1; width: 0; height: 20px; }
        .tree-node { border: 2px solid #cbd5e1; padding: 10px; border-radius: 12px; display: inline-block; background: white; min-width: 110px; transition: 0.3s; }
        .tree-node:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .node-gold { border-color: var(--gold); background: #fffbeb; }
        .node-blue { border-color: var(--blue); background: #eff6ff; }
        .node-id { display: block; font-weight: 800; font-size: 10px; color: var(--blue); }
        .node-name { display: block; font-size: 10px; color: #64748b; }
        .node-pts { display: block; font-size: 10px; font-weight: bold; color: var(--green); margin-top: 3px; }

        /* LOGÍSTICA (Captura 3) */
        .sidebar { background: #f1f5f9; padding: 30px; border-radius: 25px; align-self: start; }
        .sidebar h4 { margin: 0 0 20px 0; color: var(--blue); display: flex; align-items: center; gap: 8px; }
        .envio-card { background: white; padding: 15px; border-radius: 15px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
        .envio-card b { font-size: 13px; color: var(--blue); }
        .envio-card p { margin: 5px 0 0 0; font-size: 11px; color: #64748b; }

        .hidden { display: none; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.8); z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; width: 450px; margin: 50px auto; padding: 40px; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">RAÍZOMA <span>PRO</span></div>
        <div style="display:flex; gap:15px; align-items:center;">
            <div class="user-info">ADMIN: ${admin.nombre || 'CORPORATIVO'}</div>
            <button onclick="document.getElementById('m').style.display='block'" style="background:var(--blue); color:white; border:none; padding:10px 20px; border-radius:10px; font-weight:bold; cursor:pointer;">+ NUEVO SOCIO</button>
            <a href="/login" style="color:#ef4444; font-weight:bold; text-decoration:none; font-size:13px;">SALIR</a>
        </div>
    </div>

    <div class="container">
        <div class="stats-row">
            <div class="kpi-card" style="border-bottom-color: var(--blue);">
                <small>Volumen Red (3 Niveles)</small>
                <div class="val">$${stats.volumenTotalRed.toLocaleString()}</div>
                <div class="badge">RANGO: ${stats.rangoActual}</div>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--green);">
                <small>Inicio Rápido (15%)</small>
                <div class="val" style="color:var(--green)">$${stats.inicioRapido.toLocaleString()}</div>
                <div class="badge">PAGO DIRECTO</div>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--gold);">
                <small>Bono Residual (10-20%)</small>
                <div class="val" style="color:var(--gold)">$${stats.pagoResidual.toLocaleString()}</div>
                <div class="badge">CARTERA MENSUAL</div>
            </div>
            <div class="kpi-card" style="background: var(--blue); border:none; color:white;">
                <small style="color:rgba(255,255,255,0.6)">Billetera Total</small>
                <div class="val" style="color:white">$${(stats.inicioRapido + stats.pagoResidual).toLocaleString()}</div>
                <button style="width:100%; padding:8px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:8px; cursor:pointer; font-size:11px;">SOLICITAR RETIRO</button>
            </div>
        </div>

        <div class="wallet-panel">
            <h3><span style="font-size:22px;">🔗</span> Vinculación de Cuentas para Retiros</h3>
            <form action="/update-admin-finanzas" method="POST">
                <div class="form-grid">
                    <div class="input-group">
                        <label>NOMBRE DEL BANCO</label>
                        <input type="text" name="banco_nombre" value="${admin.banco_nombre || ''}" placeholder="Ej. BBVA">
                    </div>
                    <div class="input-group">
                        <label>CLABE INTERBANCARIA (18 DÍGITOS)</label>
                        <input type="text" name="banco_clabe" value="${admin.banco_clabe || ''}" placeholder="000000000000000000">
                    </div>
                    <div class="input-group">
                        <label>DIRECCIÓN WALLET USDT</label>
                        <input type="text" name="wallet_usdt" value="${admin.wallet_usdt || ''}" placeholder="0x... o TX...">
                    </div>
                    <div class="input-group">
                        <label>RED DE RETIRO</label>
                        <select name="wallet_red">
                            <option value="TRC20" ${admin.wallet_red === 'TRC20' ? 'selected' : ''}>TRON (TRC20)</option>
                            <option value="BEP20" ${admin.wallet_red === 'BEP20' ? 'selected' : ''}>BINANCE (BEP20)</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn-save">ACTUALIZAR DATOS DE PAGO</button>
            </form>
        </div>

        <div class="tabs">
            <button id="bt1" class="tab-btn active" onclick="tab(1)">Estructura de Socios</button>
            <button id="bt2" class="tab-btn" onclick="tab(2)">Árbol Genealógico</button>
        </div>

        <div class="layout">
            <div class="content-box">
                <div id="tab1">
                    <table>
                        <thead>
                            <tr><th>Socio / ID</th><th>Membresía</th><th>Inversión</th><th>Estado</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            ${socios.map(s => `
                                <tr>
                                    <td><b>${s.nombre}</b><br><small style="color:var(--blue)">${s.propio_id}</small></td>
                                    <td><span class="pill" style="background:#f1f5f9; color:#64748b">${s.membresia}</span></td>
                                    <td><b>$${s.puntos.toLocaleString()}</b></td>
                                    <td><span class="pill pill-active">● Activo</span></td>
                                    <td>
                                        <form action="/del" method="POST" style="margin:0;">
                                            <input type="hidden" name="id" value="${s.id}">
                                            <button style="background:none; border:none; cursor:pointer; font-size:16px;">🗑️</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div id="tab2" class="hidden">
                    <div class="tree-container">
                        <div class="tree">
                            <ul>
                                <li>
                                    <div class="tree-node" style="border-color:var(--blue); background:#eff6ff;">
                                        <span class="node-id">RAIZOMA-MADRE</span>
                                        <span class="node-name">Admin Principal</span>
                                    </div>
                                    ${treeHtml}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar">
                <h4>📦 Centro de Envíos</h4>
                <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
                    ${envios.map(e => `
                        <div class="envio-card">
                            <b>${e.cliente}</b>
                            <p>No. Guía: ${e.guia} (${e.empresa})</p>
                            <div style="font-size:9px; color:var(--green); font-weight:bold; margin-top:5px;">${e.estatus.toUpperCase()}</div>
                        </div>
                    `).join('') || '<p style="font-size:12px; color:#94a3b8;">No hay guías activas.</p>'}
                </div>

                <div style="background:white; padding:20px; border-radius:15px;">
                    <h5 style="margin:0 0 15px 0;">Registrar Guía Nueva</h5>
                    <form action="/add-guia" method="POST">
                        <input type="text" name="c" placeholder="Destinatario" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px; box-sizing:border-box;">
                        <input type="text" name="g" placeholder="No. Guía" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px; box-sizing:border-box;">
                        <button type="submit" class="btn-save" style="margin:0; padding:10px; font-size:12px;">ACTIVAR RASTREO</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div id="m" class="modal">
        <div class="modal-content">
            <h2 style="margin-top:0; color:var(--blue)">Inscripción de Socio</h2>
            <form action="/add-socio-corp" method="POST">
                <div class="form-grid">
                    <div class="input-group">
                        <label>ID PATROCINADOR</label>
                        <input type="text" name="pat" value="RAIZOMA-MADRE" required>
                    </div>
                    <div class="input-group">
                        <label>ID NUEVO SOCIO</label>
                        <input type="text" name="id_p" placeholder="RZ-001" required>
                    </div>
                </div>
                <div class="input-group" style="margin-top:15px;">
                    <label>NOMBRE COMPLETO</label>
                    <input type="text" name="nom" required>
                </div>
                <div class="input-group" style="margin-top:15px;">
                    <label>TIPO DE MEMBRESÍA</label>
                    <select name="mem">
                        <option value="VIP-1750">Membresía VIP ($1,750)</option>
                        <option value="FOUNDER-15000">Partner Fundador ($15,000)</option>
                    </select>
                </div>
                <button type="submit" class="btn-save" style="margin-top:30px;">FINALIZAR REGISTRO</button>
                <button type="button" onclick="document.getElementById('m').style.display='none'" style="width:100%; background:none; border:none; color:#94a3b8; margin-top:10px; cursor:pointer;">Cancelar</button>
            </form>
        </div>
    </div>

    <script>
        function tab(n) {
            document.getElementById('tab1').classList.toggle('hidden', n !== 1);
            document.getElementById('tab2').classList.toggle('hidden', n !== 2);
            document.getElementById('bt1').classList.toggle('active', n === 1);
            document.getElementById('bt2').classList.toggle('active', n === 2);
        }
    </script>
</body>
</html>
            `);
        });
    });
});

// --- OPERACIONES BACKEND ---

app.post('/update-admin-finanzas', (req, res) => {
    const { banco_nombre, banco_clabe, wallet_usdt, wallet_red } = req.body;
    db.run(`UPDATE socios SET banco_nombre = ?, banco_clabe = ?, wallet_usdt = ?, wallet_red = ? 
            WHERE propio_id = 'RAIZOMA-MADRE'`, 
            [banco_nombre, banco_clabe, wallet_usdt, wallet_red], () => {
        res.send(`<form id="f" action="/dashboard" method="POST"><input type="hidden" name="user" value="admin@raizoma.com"><input type="hidden" name="pass" value="1234"></form><script>alert('Datos de Pago Actualizados en Disco Persistente'); document.getElementById('f').submit();</script>`);
    });
});

app.post('/add-socio-corp', (req, res) => {
    const { pat, id_p, nom, mem } = req.body;
    const pts = parseInt(mem.split('-')[1]);
    const m_type = mem.split('-')[0];

    db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, membresia, puntos) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [pat, id_p, nom, 'socio@raizoma.com', m_type, pts], (err) => {
        res.redirect(307, '/dashboard'); // Mantiene el login activo
    });
});

app.post('/add-guia', (req, res) => {
    db.run("INSERT INTO pedidos (cliente, guia) VALUES (?, ?)", [req.body.c, req.body.g], () => {
        res.redirect(307, '/dashboard');
    });
});

app.post('/del', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.redirect(307, '/dashboard');
    });
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR RAÍZOMA V15.2 - DISCO PERSISTENTE ACTIVADO EN PUERTO ${PORT}`);
});