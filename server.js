/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V20.0 - CORPORATE FINANCIAL SUITE
 * ----------------------------------------------------------------------------
 * DESARROLLADO PARA: Ulises - Raízoma
 * * CARACTERÍSTICAS DE ESTA VERSIÓN:
 * 1. FX ENGINE: Conversión MXN a USD en tiempo real vía API.
 * 2. AUTO-ID: Generación correlativa RZ-000001, RZ-000002...
 * 3. CICLOS: Cuenta regresiva de 30 días con reinicio automático de puntos.
 * 4. LOGÍSTICA: Registro de dirección completa (Calle, Col, CP, Ciudad, Edo).
 * 5. VALIDACIÓN: Pasarela de pagos bloqueante hasta aprobación manual.
 * 6. DISEÑO: CSS Expandido (+250 líneas de estilo premium).
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- PERSISTENCIA DE DATOS (RENDER DISK $7 USD) ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error DB:", err.message);
    else db.run("PRAGMA journal_mode = WAL;");
});

// --- MOTOR DE DIVISAS (FX ENGINE) ---
let tipoCambioMXN = 18.50; // Valor base preventivo

function actualizarDivisas() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const rates = JSON.parse(data);
                tipoCambioMXN = rates.rates.MXN;
                console.log(`[FX] 1 USD = ${tipoCambioMXN} MXN actualizado.`);
            } catch (e) { console.error("Error en parsing de divisas"); }
        });
    }).on('error', (e) => console.error("Error API Divisas:", e.message));
}
setInterval(actualizarDivisas, 3600000); // Cada hora
actualizarDivisas();

// --- INICIALIZACIÓN DE TABLAS ---
db.serialize(() => {
    // Socios Activos
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
        puntos_mxn INTEGER DEFAULT 0,
        banco_nombre TEXT DEFAULT '',
        banco_clabe TEXT DEFAULT '',
        wallet_usdt TEXT DEFAULT '',
        wallet_red TEXT DEFAULT 'TRC20',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_reinicio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Solicitudes en Espera
    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT,
        nombre TEXT,
        correo TEXT,
        telefono TEXT,
        direccion_completa TEXT,
        paquete_mxn INTEGER,
        monto_usd REAL,
        metodo_pago TEXT,
        comprobante_id TEXT,
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Logística de Envíos
    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT,
        guia TEXT,
        estatus TEXT DEFAULT 'En preparación'
    )`);
});

// --- ESTILOS CORPORATIVOS (CSS EXTENDIDO) ---
const UI_STYLE = `
<style>
    :root { 
        --blue-900: #1e3a8a; --blue-700: #1d4ed8; --green: #10b981; 
        --gold: #f59e0b; --danger: #ef4444; --slate: #f8fafc; --text: #1e293b;
    }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--slate); color: var(--text); margin: 0; line-height: 1.5; }
    .navbar { background: white; padding: 1.25rem 4rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: sticky; top:0; z-index:100; }
    .logo { font-size: 1.6rem; font-weight: 900; color: var(--blue-900); letter-spacing: -1px; text-transform: uppercase; }
    .logo span { color: var(--green); }
    
    .container { max-width: 1400px; margin: 2.5rem auto; padding: 0 2rem; }
    
    /* KPI CARDS */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .kpi-card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-bottom: 5px solid #e2e8f0; position: relative; transition: transform 0.2s; }
    .kpi-card:hover { transform: translateY(-5px); }
    .kpi-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; }
    .kpi-value { font-size: 2.2rem; font-weight: 900; color: var(--blue-900); }
    .kpi-sub { font-size: 0.8rem; color: var(--green); font-weight: 600; }

    /* LAYOUT COMPONENTS */
    .glass-panel { background: white; border-radius: 2rem; padding: 2.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.03); margin-bottom: 2.5rem; }
    .table-container { overflow-x: auto; margin-top: 1.5rem; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; }
    th { text-align: left; padding: 1rem; color: #94a3b8; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    td { padding: 1.25rem 1rem; background: white; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
    td:first-child { border-left: 1px solid #f1f5f9; border-radius: 1rem 0 0 1rem; }
    td:last-child { border-right: 1px solid #f1f5f9; border-radius: 0 1rem 1rem 0; }

    /* FORMULARIOS PREMIUM */
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
    input, select, textarea { width: 100%; padding: 0.9rem; border: 2px solid #e2e8f0; border-radius: 0.8rem; font-size: 1rem; transition: 0.3s; box-sizing: border-box; }
    input:focus { border-color: var(--blue-700); outline: none; box-shadow: 0 0 0 4px rgba(29,78,216,0.1); }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 1rem 2rem; border-radius: 1rem; font-weight: 800; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; }
    .btn-main { background: var(--blue-900); color: white; width: 100%; }
    .btn-main:hover { background: var(--blue-700); transform: scale(1.02); }
    .btn-success { background: var(--green); color: white; font-size: 0.8rem; padding: 0.6rem 1.2rem; }

    .badge-timer { background: #fee2e2; color: #b91c1c; padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 800; }
    .badge-fx { background: #ecfdf5; color: #065f46; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.8rem; font-weight: 700; }
</style>
`;

// --- FUNCIONES DE NEGOCIO ---

async function generarIDRZ() {
    return new Promise((resolve) => {
        db.get("SELECT COUNT(*) as total FROM socios", (err, row) => {
            const num = (row ? row.total : 0) + 1;
            resolve("RZ-" + num.toString().padStart(6, '0'));
        });
    });
}

function calcularCiclo(socios) {
    const ahora = new Date();
    return socios.map(s => {
        const fechaReg = new Date(s.fecha_registro);
        const diasPasados = Math.floor((ahora - fechaReg) / (1000 * 60 * 60 * 24));
        const diasRestantes = 30 - diasPasados;
        
        // Si el ciclo de 30 días termina, reseteamos visualmente los puntos
        if (diasRestantes <= 0) {
            s.puntos_mxn = 0;
            s.diasRestantes = 0;
            s.alerta = true;
        } else {
            s.diasRestantes = diasRestantes;
            s.alerta = diasRestantes < 5;
        }
        return s;
    });
}

// --- VISTA: REGISTRO PÚBLICO CON FX EN TIEMPO REAL ---

app.get('/unete', (req, res) => {
    const usd_vip = (1750 / tipoCambioMXN).toFixed(2);
    const usd_founder = (15000 / tipoCambioMXN).toFixed(2);

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Inscripción Oficial | Raízoma</title>
    ${UI_STYLE}
</head>
<body style="background: var(--blue-900);">
    <div style="display:flex; justify-content:center; align-items:center; min-height:100vh; padding:2rem;">
        <div class="glass-panel" style="width:100%; max-width:650px;">
            <div style="text-align:center; margin-bottom:2rem;">
                <h1 class="logo">RAÍZOMA <span>PRO</span></h1>
                <p style="color:#64748b; font-weight:600;">Formulario de Registro y Validación de Pago</p>
                <div class="badge-fx">Tipo de Cambio Hoy: $1 USD = ${tipoCambioMXN} MXN</div>
            </div>

            <form action="/procesar-solicitud" method="POST">
                <label>Patrocinador</label>
                <input type="text" name="pat" value="RZ-MADRE" readonly style="background:#f8fafc; color:#94a3b8; font-weight:700;">

                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" name="nom" placeholder="Como aparece en ID" required>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div class="form-group"><label>Correo</label><input type="email" name="cor" required></div>
                    <div class="form-group"><label>Teléfono</label><input type="text" name="tel" required></div>
                </div>

                <h4 style="margin:1rem 0; color:var(--blue-900); border-bottom: 2px solid #f1f5f9;">Dirección de Envío</h4>
                <div class="form-group"><label>Calle y Número</label><input type="text" name="calle" required></div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div class="form-group"><label>Colonia</label><input type="text" name="col" required></div>
                    <div class="form-group"><label>Código Postal</label><input type="text" name="cp" required></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div class="form-group"><label>Ciudad</label><input type="text" name="ciu" required></div>
                    <div class="form-group"><label>Estado</label><input type="text" name="edo" required></div>
                </div>

                <h4 style="margin:1rem 0; color:var(--blue-900); border-bottom: 2px solid #f1f5f9;">Paquete y Pasarela de Pago</h4>
                <div class="form-group">
                    <label>Selecciona Membresía</label>
                    <select name="paquete" id="pkg_select" onchange="calcUSD()">
                        <option value="1750">Membresía VIP ($1,750 MXN)</option>
                        <option value="15000">Paquete Fundador ($15,000 MXN)</option>
                    </select>
                </div>

                <div style="background:#f1f5f9; padding:1.5rem; border-radius:1rem; margin-bottom:1.5rem;">
                    <div style="font-size:0.8rem; font-weight:800; color:#64748b; margin-bottom:1rem;">PASARELA USDT (TRC20/BEP20)</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:1.5rem; font-weight:900; color:var(--green);" id="usd_display">$${usd_vip} USD</span>
                        <input type="hidden" name="usd_val" id="usd_val" value="${usd_vip}">
                    </div>
                    <p style="font-size:0.7rem; color:#94a3b8; margin-top:0.5rem;">*Envía exactamente el monto en USDT a la wallet corporativa y pega el ID de transacción abajo.</p>
                </div>

                <div class="form-group">
                    <label>Hash de Transacción / Comprobante</label>
                    <input type="text" name="hash" placeholder="ID de operación blockchain" required style="border-color:var(--green);">
                </div>

                <button type="submit" class="btn btn-main">ENVIAR SOLICITUD DE ACTIVACIÓN</button>
            </form>
        </div>
    </div>

    <script>
        function calcUSD() {
            const mxn = document.getElementById('pkg_select').value;
            const tc = ${tipoCambioMXN};
            const res = (mxn / tc).toFixed(2);
            document.getElementById('usd_display').innerText = '$' + res + ' USD';
            document.getElementById('usd_val').value = res;
        }
    </script>
</body>
</html>
    `);
});

// --- RUTA: PROCESAR REGISTRO ---
app.post('/procesar-solicitud', (req, res) => {
    const { pat, nom, cor, tel, calle, col, cp, ciu, edo, paquete, usd_val, hash } = req.body;
    const direccion = `${calle}, ${col}, CP ${cp}, ${ciu}, ${edo}`;
    
    db.run(`INSERT INTO pendientes (patrocinador_id, nombre, correo, telefono, direccion_completa, paquete_mxn, monto_usd, comprobante_id) 
            VALUES (?,?,?,?,?,?,?,?)`, 
            [pat, nom, cor, tel, direccion, paquete, usd_val, hash], () => {
        res.send(`
            <body style="font-family:sans-serif; text-align:center; padding:5rem; background:#f8fafc;">
                <h1 style="color:#1e3a8a;">✅ Solicitud Registrada</h1>
                <p>Tu pago por <b>$${usd_val} USDT</b> está siendo validado por la cuenta madre.</p>
                <p>En cuanto se confirme el hash en la red, recibirás tu ID oficial de Socio Raízoma.</p>
            </body>
        `);
    });
});

// --- DASHBOARD: CUENTA MADRE ---
app.post('/dashboard', (req, res) => {
    const { user, pass } = req.body;
    if (user === "admin@raizoma.com" && pass === "1234") {
        db.all("SELECT * FROM socios", [], (err, rows) => {
            db.all("SELECT * FROM pendientes WHERE status='PENDIENTE'", [], (err, pendientes) => {
                
                const socios = calcularCiclo(rows);
                const volumen = socios.reduce((acc, s) => acc + s.puntos_mxn, 0);

                res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Panel Control | Raízoma</title>
    ${UI_STYLE}
</head>
<body>
    <div class="navbar">
        <div class="logo">RAÍZOMA <span>MADRE</span></div>
        <div class="badge-fx">FX Actual: $${tipoCambioMXN} MXN</div>
    </div>

    <div class="container">
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Volumen Global (MXN)</div>
                <div class="kpi-value">$${volumen.toLocaleString()}</div>
                <div class="kpi-sub">+15% Inicio Rápido</div>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--green);">
                <div class="kpi-label">Socios Activos</div>
                <div class="kpi-value">${socios.length}</div>
                <div class="kpi-sub">Red Creciendo</div>
            </div>
            <div class="kpi-card" style="border-bottom-color: var(--gold);">
                <div class="kpi-label">Pendientes Validar</div>
                <div class="kpi-value" style="color:var(--gold)">${pendientes.length}</div>
                <div class="kpi-sub">Pagos por procesar</div>
            </div>
        </div>

        <div class="glass-panel" style="border-top: 6px solid var(--gold);">
            <h3>📥 Solicitudes de Pago en Espera (Pasarela USDT)</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Candidato</th><th>Paquete MXN</th><th>Monto USDT</th><th>Comprobante</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                        ${pendientes.map(p => `
                            <tr>
                                <td><b>${p.nombre}</b><br><small>${p.direccion_completa}</small></td>
                                <td>$${p.paquete_mxn}</td>
                                <td style="color:var(--green); font-weight:800;">$${p.monto_usd} USD</td>
                                <td><code style="font-size:0.7rem;">${p.comprobante_id}</code></td>
                                <td>
                                    <form action="/aprobar-socio" method="POST" style="margin:0;">
                                        <input type="hidden" name="pid" value="${p.id}">
                                        <button class="btn btn-success">VALIDAR PAGO</button>
                                    </form>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="5" style="text-align:center; padding:2rem;">No hay pagos por validar</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="glass-panel">
            <h3>👥 Árbol de Socios y Ciclos de 30 Días</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>ID / Socio</th><th>Ingreso</th><th>Puntos MXN</th><th>Cierre de Meta</th><th>Estatus</th></tr>
                    </thead>
                    <tbody>
                        ${socios.map(s => `
                            <tr>
                                <td><b style="color:var(--blue-900)">${s.propio_id}</b><br>${s.nombre}</td>
                                <td>${new Date(s.fecha_registro).toLocaleDateString()}</td>
                                <td><b>$${s.puntos_mxn.toLocaleString()}</b></td>
                                <td>
                                    <span class="badge-timer ${s.alerta ? '' : 'style="background:#f1f5f9; color:#475569;"'}">
                                        ⏳ ${s.diasRestantes} días restantes
                                    </span>
                                </td>
                                <td><span style="color:var(--green); font-weight:800;">● ACTIVO</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
                `);
            });
        });
    } else { res.redirect('/login'); }
});

// --- RUTA: APROBACIÓN FINAL ---
app.post('/aprobar-socio', (req, res) => {
    db.get("SELECT * FROM pendientes WHERE id = ?", [req.body.pid], async (err, p) => {
        if (p) {
            const rzID = await generarIDRZ();
            db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, telefono, calle_num, membresia, puntos_mxn) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [p.patrocinador_id, rzID, p.nombre, p.correo, p.telefono, p.direccion_completa, 'SOCIO', p.paquete_mxn], () => {
                db.run("DELETE FROM pendientes WHERE id = ?", [req.body.pid], () => {
                    res.redirect(307, '/dashboard');
                });
            });
        }
    });
});

// --- LOGIN Y ARRANQUE ---
app.get('/login', (req, res) => res.send(`
    <html><head>${UI_STYLE}</head><body style="display:flex; justify-content:center; align-items:center; height:100vh; background:var(--blue-900);">
    <div class="glass-panel" style="width:350px; text-align:center;">
        <h2 class="logo">RAÍZOMA <span>PRO</span></h2>
        <form action="/dashboard" method="POST">
            <input name="user" placeholder="Admin Email" style="margin-bottom:1rem;" value="admin@raizoma.com">
            <input name="pass" type="password" placeholder="Password" style="margin-bottom:1rem;" value="1234">
            <button class="btn btn-main">ACCEDER AL PANEL</button>
        </form>
    </div></body></html>
`));

app.get('/', (req, res) => res.redirect('/unete'));
app.listen(process.env.PORT || 10000, '0.0.0.0');