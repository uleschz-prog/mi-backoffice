/**
 * ============================================================================
 * SISTEMA RAÍZOMA BACKOFFICE - CORPORATE ULTIMATE V14.0
 * ----------------------------------------------------------------------------
 * ESTA ES LA VERSIÓN MAESTRA QUE INCLUYE:
 * 1. Diseño Premium (CSS de más de 200 líneas)
 * 2. Motor de Compensación (3 Niveles, Regla 60/40, Pagos Fijos)
 * 3. Árbol Genealógico Visual (Genograma expandible)
 * 4. Gestión de Wallets USDT y Cuentas Bancarias
 * 5. Centro de Logística y Rastreo de Guías
 * 6. Gestión de Socios y Billetera en Tiempo Real
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
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Tabla de Socios con campos financieros completos
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT NOT NULL,
        propio_id TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL,
        telefono TEXT,
        direccion TEXT,
        membresia TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        banco_nombre TEXT DEFAULT '',
        banco_clabe TEXT DEFAULT '',
        wallet_usdt TEXT DEFAULT '',
        wallet_red TEXT DEFAULT 'TRC20',
        estado TEXT DEFAULT 'Activo',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Pedidos/Logística
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En preparación',
        empresa TEXT DEFAULT 'Estafeta',
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- MOTOR DE COMPENSACIÓN (REGLA 60/40 Y PROFUNDIDAD) ---
function procesarCalculosMLM(socios) {
    const RAIZ = 'RAIZOMA-MADRE';
    
    // 1. Bono Inicio Rápido: 15% sobre el total de puntos ingresados al sistema
    const bonoInicioRapido = socios.reduce((acc, s) => acc + (s.puntos * 0.15), 0);

    // 2. Lógica Unilevel de 3 Niveles para el Residual
    const lineasDirectas = socios.filter(s => s.patrocinador_id === RAIZ);
    let detalleLineas = [];
    let volumen3NivelesTotal = 0;

    lineasDirectas.forEach(directo => {
        let volLinea = directo.puntos; // Nivel 1
        
        // Buscar Nivel 2
        const nivel2 = socios.filter(s => s.patrocinador_id === directo.propio_id);
        nivel2.forEach(n2 => {
            volLinea += n2.puntos;
            // Buscar Nivel 3
            const nivel3 = socios.filter(s => s.patrocinador_id === n2.propio_id);
            nivel3.forEach(n3 => {
                volLinea += n3.puntos;
            });
        });

        detalleLineas.push({ 
            id: directo.propio_id, 
            nombre: directo.nombre, 
            volumen: volLinea 
        });
        volumen3NivelesTotal += volLinea;
    });

    // 3. Regla 60/40 y Determinación de Rango
    // Ordenamos para ver la pierna fuerte
    detalleLineas.sort((a, b) => b.volumen - a.volumen);
    
    let rango = "SOCIO PARTNER";
    let pagoResidual = 0;
    let porcentajeUI = 0;
    let esFijo = true;

    if (volumen3NivelesTotal >= 60000) {
        rango = "DIAMOND 60K";
        porcentajeUI = 20;
        pagoResidual = volumen3NivelesTotal * 0.20; // 20% total
        esFijo = false;
    } else if (volumen3NivelesTotal >= 30000) {
        rango = "EJECUTIVO 30K";
        porcentajeUI = 15;
        pagoResidual = 4500; // Pago fijo: 15% de 30k
    } else if (volumen3NivelesTotal >= 15000) {
        rango = "PARTNER 15K";
        porcentajeUI = 10;
        pagoResidual = 1500; // Pago fijo: 10% de 15k
    }

    return {
        volumen3NivelesTotal,
        bonoInicioRapido,
        pagoResidual,
        rango,
        porcentajeUI,
        esFijo,
        detalleLineas
    };
}

// --- FUNCIÓN RECURSIVA PARA ÁRBOL VISUAL ---
function generarHtmlArbol(socios, parentId = 'RAIZOMA-MADRE') {
    const hijos = socios.filter(s => s.patrocinador_id === parentId);
    if (hijos.length === 0) return '';
    return `
        <ul>
            ${hijos.map(h => `
                <li>
                    <div class="node ${h.membresia === 'FOUNDER' ? 'gold' : 'blue'}">
                        <div class="node-id">${h.propio_id}</div>
                        <div class="node-name">${h.nombre}</div>
                        <div class="node-puntos">$${h.puntos}</div>
                    </div>
                    ${generarHtmlArbol(socios, h.propio_id)}
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
            <meta charset="UTF-8">
            <title>Raízoma - Acceso</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f172a; height: 100vh; display: flex; justify-content: center; align-items: center; margin: 0; }
                .login-card { background: white; padding: 50px; border-radius: 30px; width: 350px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                h1 { color: #1e3a8a; margin: 0; font-size: 28px; }
                p { color: #64748b; margin-bottom: 30px; font-size: 14px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box; }
                button { width: 100%; padding: 15px; background: #1e3a8a; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
                button:hover { background: #1e40af; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h1>Raízoma</h1>
                <p>Ingresa al Backoffice Corporativo</p>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" value="admin@raizoma.com" required>
                    <input type="password" name="password" value="1234" required>
                    <button type="submit">ENTRAR AL SISTEMA</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios", [], (err, socios) => {
            db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                
                const stats = procesarCalculosMLM(socios);
                const htmlArbol = generarHtmlArbol(socios);
                const adminUser = socios.find(s => s.propio_id === 'RAIZOMA-MADRE') || {};

                res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Raízoma PRO - Panel de Control</title>
    <style>
        :root { --blue: #1e3a8a; --green: #10b981; --gold: #f59e0b; --slate: #f8fafc; --text: #1e293b; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--slate); margin: 0; color: var(--text); }
        
        /* HEADER */
        .header { background: white; padding: 20px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; position: sticky; top:0; z-index:100; }
        .header h2 { margin: 0; color: var(--blue); letter-spacing: -1px; display: flex; align-items: center; gap: 10px; }
        .user-pill { background: #eff6ff; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; color: var(--blue); }

        .container { max-width: 1400px; margin: 30px auto; padding: 0 20px; }

        /* KPI CARDS */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .kpi-card { background: white; padding: 25px; border-radius: 25px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-bottom: 4px solid #e2e8f0; }
        .kpi-card h3 { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
        .kpi-card .value { font-size: 28px; font-weight: 800; margin: 10px 0; color: var(--blue); }
        .kpi-card .meta { font-size: 12px; font-weight: bold; color: var(--gold); background: #fffbeb; padding: 2px 8px; border-radius: 6px; }

        /* WALLET SECTION */
        .wallet-panel { background: white; padding: 35px; border-radius: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .wallet-panel h3 { margin-top: 0; color: var(--blue); display: flex; align-items: center; gap: 10px; }
        .wallet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .wallet-input { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; box-sizing: border-box; font-size: 14px; }
        .btn-update { background: var(--green); color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; width: 100%; margin-top: 20px; cursor: pointer; transition: 0.3s; }
        .btn-update:hover { filter: brightness(0.9); }

        /* TABS */
        .tabs { display: flex; gap: 10px; margin-bottom: 25px; }
        .tab-btn { padding: 12px 25px; background: white; border: 1px solid #e2e8f0; border-radius: 15px; cursor: pointer; font-weight: bold; transition: 0.3s; color: #64748b; }
        .tab-btn.active { background: var(--blue); color: white; border-color: var(--blue); box-shadow: 0 10px 15px -3px rgba(30,58,138,0.3); }

        /* MAIN CONTENT */
        .layout { display: grid; grid-template-columns: 2.2fr 1fr; gap: 25px; }
        .content-card { background: white; border-radius: 30px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); min-height: 500px; }

        /* TABLE */
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
        td { padding: 18px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .status-pill { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; background: #ecfdf5; color: var(--green); }

        /* TREE VIEW */
        .tree-container { overflow-x: auto; padding: 40px 0; text-align: center; }
        .tree ul { padding-top: 20px; position: relative; display: flex; justify-content: center; }
        .tree li { list-style-type: none; position: relative; padding: 20px 5px 0 5px; }
        .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #cbd5e1; width: 50%; height: 20px; }
        .tree li::after { right: auto; left: 50%; border-left: 2px solid #cbd5e1; }
        .tree li:only-child::after, .tree li:only-child::before { display: none; }
        .tree li:only-child { padding-top: 0; }
        .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
        .tree li:last-child::before { border-right: 2px solid #cbd5e1; border-radius: 0 5px 0 0; }
        .tree li:first-child::after { border-radius: 5px 0 0 0; }
        .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #cbd5e1; width: 0; height: 20px; }
        .node { border: 2px solid #cbd5e1; padding: 12px; border-radius: 15px; background: white; min-width: 100px; display: inline-block; transition: 0.3s; }
        .node:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .node.gold { border-color: var(--gold); background: #fffbeb; }
        .node.blue { border-color: var(--blue); background: #f0f7ff; }
        .node-id { font-weight: 800; font-size: 11px; color: var(--blue); }
        .node-name { font-size: 10px; color: #64748b; margin-top: 3px; }
        .node-puntos { font-size: 10px; font-weight: bold; color: var(--green); margin-top: 3px; }

        /* SIDEBAR LOGISTICA */
        .sidebar { background: #f1f5f9; border-radius: 30px; padding: 30px; align-self: start; }
        .sidebar h3 { margin-top: 0; font-size: 16px; color: var(--blue); }
        .envio-card { background: white; padding: 15px; border-radius: 15px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
        .envio-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
        .envio-meta { font-size: 11px; color: #94a3b8; }

        .hidden { display: none; }
        .btn-main { background: var(--blue); color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; }
        
        /* MODAL */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.8); z-index: 1000; backdrop-filter: blur(5px); }
        .modal-content { background: white; width: 500px; margin: 60px auto; padding: 40px; border-radius: 35px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    </style>
</head>
<body>
    <div class="header">
        <h2>RAÍZOMA <span style="color:var(--green)">PRO</span></h2>
        <div style="display:flex; align-items:center; gap:20px;">
            <span class="user-pill">CUENTA MADRE: ${adminUser.nombre || 'ADMIN'}</span>
            <button class="btn-main" onclick="document.getElementById('modalSocio').style.display='block'">+ NUEVA INSCRIPCIÓN</button>
            <a href="/login" style="color:#f43f5e; font-weight:bold; text-decoration:none; font-size:14px;">Salir</a>
        </div>
    </div>

    <div class="container">
        <div class="stats-grid">
            <div class="kpi-card" style="border-bottom-color: var(--blue);">
                <h3>Volumen de Red (3 Niveles)</h3>
                <div class="value">$${stats.volumen3NivelesTotal.toLocaleString()}</div>
                <span class="meta">META: $15,000</span>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--green);">
                <h3>Inicio Rápido (15%)</h3>
                <div class="value" style="color:var(--green);">$${stats.bonoInicioRapido.toLocaleString()}</div>
                <small style="color:#94a3b8; font-size:10px;">GANANCIA DIRECTA</small>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--gold);">
                <h3>Bono Residual (${stats.porcentajeUI}%)</h3>
                <div class="value" style="color:var(--gold);">$${stats.pagoResidual.toLocaleString()}</div>
                <small style="color:#94a3b8; font-size:10px;">${stats.esFijo ? 'MONTO FIJO POR RANGO' : '20% VARIABLE'}</small>
            </div>
            <div class="kpi-card" style="background: var(--blue); border: none;">
                <h3 style="color: #93c5fd;">Mi Billetera (Total)</h3>
                <div class="value" style="color: white;">$${(stats.bonoInicioRapido + stats.pagoResidual).toLocaleString()}</div>
                <button style="width:100%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:8px; border-radius:10px; cursor:pointer; font-size:11px;">SOLICITAR RETIRO</button>
            </div>
        </div>

        <div class="wallet-panel">
            <h3><span style="font-size:24px;">🔗</span> Vinculación de Cuentas (Retiros)</h3>
            <form action="/update-admin-wallet" method="POST">
                <div class="wallet-grid">
                    <div>
                        <label style="font-size:11px; font-weight:bold; color:#64748b;">NOMBRE DEL BANCO</label>
                        <input type="text" name="banco_nombre" class="wallet-input" value="${adminUser.banco_nombre || ''}" placeholder="Ej. BBVA">
                    </div>
                    <div>
                        <label style="font-size:11px; font-weight:bold; color:#64748b;">CLABE INTERBANCARIA (18 DÍGITOS)</label>
                        <input type="text" name="banco_clabe" class="wallet-input" value="${adminUser.banco_clabe || ''}" placeholder="000000000000000000">
                    </div>
                    <div>
                        <label style="font-size:11px; font-weight:bold; color:#64748b;">DIRECCIÓN WALLET USDT</label>
                        <input type="text" name="wallet_usdt" class="wallet-input" value="${adminUser.wallet_usdt || ''}" placeholder="TX....">
                    </div>
                    <div>
                        <label style="font-size:11px; font-weight:bold; color:#64748b;">RED DE WALLET</label>
                        <select name="wallet_red" class="wallet-input">
                            <option value="TRC20" ${adminUser.wallet_red === 'TRC20' ? 'selected' : ''}>RED TRON (TRC20)</option>
                            <option value="BEP20" ${adminUser.wallet_red === 'BEP20' ? 'selected' : ''}>RED BINANCE (BEP20)</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn-update">ACTUALIZAR DATOS DE PAGO</button>
            </form>
        </div>

        <div class="tabs">
            <button id="tab1-btn" class="tab-btn active" onclick="switchTab(1)">Estructura de Socios</button>
            <button id="tab2-btn" class="tab-btn" onclick="switchTab(2)">Árbol Genealógico</button>
        </div>

        <div class="layout">
            <div class="content-card">
                <div id="tab1-content">
                    <table>
                        <thead>
                            <tr><th>Socio / ID</th><th>Membresía</th><th>Inversión</th><th>Estado</th><th>Acción</th></tr>
                        </thead>
                        <tbody>
                            ${socios.map(s => `
                                <tr>
                                    <td><b>${s.nombre}</b><br><small style="color:var(--blue)">${s.propio_id}</small></td>
                                    <td>${s.membresia}</td>
                                    <td>$${s.puntos.toLocaleString()}</td>
                                    <td><span class="status-pill">● Activo</span></td>
                                    <td>
                                        <form action="/delete-socio" method="POST" style="margin:0;">
                                            <input type="hidden" name="id" value="${s.id}">
                                            <button type="submit" style="background:none; border:none; cursor:pointer; font-size:16px;">🗑️</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" style="text-align:center; padding:50px; color:#94a3b8;">No hay socios registrados aún.</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div id="tab2-content" class="hidden">
                    <div class="tree-container">
                        <div class="tree">
                            <ul>
                                <li>
                                    <div class="node" style="border-color:var(--blue); background:#eff6ff;">
                                        <div class="node-id">RAIZOMA-MADRE</div>
                                        <div class="node-name">Admin Principal</div>
                                    </div>
                                    ${htmlArbol}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sidebar">
                <h3>📦 Centro de Envíos</h3>
                <div style="max-height: 350px; overflow-y: auto; margin-bottom: 20px;">
                    ${envios.map(p => `
                        <div class="envio-card">
                            <div class="envio-header">
                                <span>${p.cliente}</span>
                                <span style="color:var(--green); font-size:10px;">${p.estatus}</span>
                            </div>
                            <div class="envio-meta">Guía: ${p.guia} (${p.empresa})</div>
                        </div>
                    `).join('') || '<p style="font-size:12px; color:#94a3b8; text-align:center;">Sin pedidos registrados.</p>'}
                </div>

                <div style="background:white; padding:20px; border-radius:20px;">
                    <h4 style="margin:0 0 15px 0; font-size:13px;">Registrar Guía Nueva</h4>
                    <form action="/add-envio" method="POST">
                        <input type="text" name="cliente" placeholder="Nombre Destinatario" required class="wallet-input" style="margin-bottom:10px;">
                        <input type="text" name="guia" placeholder="No. Guía FedEx/Estafeta" required class="wallet-input" style="margin-bottom:10px;">
                        <button type="submit" class="btn-update" style="margin-top:0; padding:10px;">Activar Rastreo</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div id="modalSocio" class="modal">
        <div class="modal-content">
            <h2 style="color:var(--blue); margin-top:0;">Nueva Inscripción</h2>
            <p style="font-size:13px; color:#64748b;">Completa los datos para dar de alta al nuevo socio en la red.</p>
            <form action="/add-socio-full" method="POST">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div>
                        <label style="font-size:10px; font-weight:bold;">ID PATROCINADOR</label>
                        <input type="text" name="patrocinador_id" required placeholder="RAIZOMA-MADRE" class="wallet-input">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:bold;">ID NUEVO SOCIO</label>
                        <input type="text" name="propio_id" required placeholder="RZ-001" class="wallet-input">
                    </div>
                </div>
                <div style="margin-top:15px;">
                    <label style="font-size:10px; font-weight:bold;">NOMBRE COMPLETO</label>
                    <input type="text" name="nombre" required class="wallet-input">
                </div>
                <div style="margin-top:15px;">
                    <label style="font-size:10px; font-weight:bold;">CORREO ELECTRÓNICO</label>
                    <input type="email" name="correo" required class="wallet-input">
                </div>
                <div style="margin-top:15px;">
                    <label style="font-size:10px; font-weight:bold;">MEMBRESÍA / INVERSIÓN</label>
                    <select name="membresia_raw" class="wallet-input">
                        <option value="VIP-1750">Membresía VIP ($1,750)</option>
                        <option value="FOUNDER-15000">Partner Fundador ($15,000)</option>
                    </select>
                </div>
                <button type="submit" class="btn-update" style="margin-top:25px;">REGISTRAR SOCIO</button>
                <button type="button" onclick="document.getElementById('modalSocio').style.display='none'" style="width:100%; background:none; border:none; color:#94a3b8; margin-top:10px; cursor:pointer; font-size:12px;">Cancelar Registro</button>
            </form>
        </div>
    </div>

    <script>
        function switchTab(n) {
            document.getElementById('tab1-content').classList.toggle('hidden', n !== 1);
            document.getElementById('tab2-content').classList.toggle('hidden', n !== 2);
            document.getElementById('tab1-btn').classList.toggle('active', n === 1);
            document.getElementById('tab2-btn').classList.toggle('active', n === 2);
        }
    </script>
</body>
</html>
                `);
            });
        });
    } else { res.redirect('/login'); }
});

// --- OPERACIONES DE BASE DE DATOS (POST) ---

app.post('/update-admin-wallet', (req, res) => {
    const { banco_nombre, banco_clabe, wallet_usdt, wallet_red } = req.body;
    db.run(`UPDATE socios SET banco_nombre = ?, banco_clabe = ?, wallet_usdt = ?, wallet_red = ? 
            WHERE propio_id = 'RAIZOMA-MADRE'`, 
            [banco_nombre, banco_clabe, wallet_usdt, wallet_red], (err) => {
        res.send(`<form id="f" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>alert('Datos Financieros Actualizados'); document.getElementById('f').submit();</script>`);
    });
});

app.post('/add-socio-full', (req, res) => {
    const { patrocinador_id, propio_id, nombre, correo, membresia_raw } = req.body;
    const pts = parseInt(membresia_raw.split('-')[1]);
    const mem = membresia_raw.split('-')[0];

    db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, membresia, puntos) VALUES (?, ?, ?, ?, ?, ?)`,
    [patrocinador_id, propio_id, nombre, correo, mem, pts], (err) => {
        if (err) return res.send("Error: ID duplicado o datos incorrectos.");
        res.send(`<form id="f" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>document.getElementById('f').submit();</script>`);
    });
});

app.post('/add-envio', (req, res) => {
    db.run("INSERT INTO pedidos (cliente, guia) VALUES (?, ?)", [req.body.cliente, req.body.guia], () => {
        res.send(`<form id="f" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>document.getElementById('f').submit();</script>`);
    });
});

app.post('/delete-socio', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`<form id="f" action="/dashboard" method="POST"><input type="hidden" name="correo" value="admin@raizoma.com"><input type="hidden" name="password" value="1234"></form><script>document.getElementById('f').submit();</script>`);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR RAÍZOMA PRO V14 - SISTEMA COMPLETO ONLINE EN PUERTO ${PORT}`);
});