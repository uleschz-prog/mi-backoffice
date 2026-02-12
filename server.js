/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V22.0 - CORE BUSINESS ENGINE
 * ----------------------------------------------------------------------------
 * - ÁRBOL GENEALÓGICO: Visualización de 3 niveles de profundidad.
 * - REGLA 60/40: Lógica de volumen para calificación de rangos.
 * - CICLO 30 DÍAS: Reinicio automático de puntos por socio.
 * - FX LIVE: Conversión MXN a USDT en tiempo real.
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE (PERSISTENCIA RENDER) ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// --- MOTOR DE TIPO DE CAMBIO ---
let tcMXN = 18.50;
function updateFX() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => { tcMXN = JSON.parse(data).rates.MXN; });
    });
}
setInterval(updateFX, 3600000); updateFX();

// --- ESTRUCTURA DE TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT, 
        propio_id TEXT UNIQUE,
        nombre TEXT,
        membresia TEXT,
        puntos_mxn INTEGER,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT,
        nombre TEXT,
        paquete_mxn INTEGER,
        monto_usd REAL,
        hash TEXT
    )`);
});

// --- LÓGICA DE CALIFICACIÓN (EL CORAZÓN DEL NEGOCIO) ---
function procesarRed(socios) {
    const hoy = new Date();
    
    return socios.map(socio => {
        // 1. Calcular Ciclo de 30 días
        const dias = Math.floor((hoy - new Date(socio.fecha_reg)) / (1000*60*60*24));
        socio.diasRestantes = Math.max(0, 30 - dias);
        
        // Si el ciclo venció, sus puntos personales para la red son 0
        const puntosEfectivos = socio.diasRestantes > 0 ? socio.puntos_mxn : 0;

        // 2. Construir Niveles (3 profundidades)
        const nivel1 = socios.filter(s => s.patrocinador_id === socio.propio_id);
        const nivel2 = socios.filter(s => nivel1.some(n1 => s.patrocinador_id === n1.propio_id));
        const nivel3 = socios.filter(s => nivel2.some(n2 => s.patrocinador_id === n2.propio_id));

        // 3. Calcular Volumen Total
        const volN1 = nivel1.reduce((sum, s) => sum + s.puntos_mxn, 0);
        const volN2 = nivel2.reduce((sum, s) => sum + s.puntos_mxn, 0);
        const volN3 = nivel3.reduce((sum, s) => sum + s.puntos_mxn, 0);
        
        socio.volumenRed = volN1 + volN2 + volN3;
        socio.hijosDirectos = nivel1.length;

        // 4. Regla 60/40 (Simplificada para visualización)
        // Buscamos la pierna más fuerte
        const volPorPierna = nivel1.map(directo => {
            const descendencia = socios.filter(s => s.patrocinador_id === directo.propio_id); // Nivel 2 de la pierna
            return directo.puntos_mxn + descendencia.reduce((a,b) => a + b.puntos_mxn, 0);
        });
        
        const maxPierna = Math.max(0, ...volPorPierna);
        socio.piernaFuertePct = socio.volumenRed > 0 ? ((maxPierna / socio.volumenRed) * 100).toFixed(1) : 0;
        socio.cumple6040 = socio.piernaFuertePct <= 60;

        return socio;
    });
}

// --- ESTILOS ---
const CSS = `
<style>
    :root { --p:#1e3a8a; --a:#10b981; --d:#ef4444; --w:#f59e0b; }
    body { font-family: sans-serif; background: #f1f5f9; margin:0; }
    .nav { background: var(--p); color:white; padding:1rem 2rem; display:flex; justify-content:space-between; align-items:center; }
    .card { background:white; padding:1.5rem; border-radius:1rem; box-shadow:0 4px 6px -1px #00000010; margin-bottom:1rem; }
    table { width:100%; border-collapse:collapse; background:white; border-radius:1rem; overflow:hidden; }
    th { background:#f8fafc; padding:1rem; text-align:left; font-size:0.7rem; color:#64748b; }
    td { padding:1rem; border-bottom:1px solid #f1f5f9; }
    .badge { padding:0.3rem 0.6rem; border-radius:0.5rem; font-size:0.7rem; font-weight:bold; }
    .b-ok { background:#ecfdf5; color:#065f46; }
    .b-alert { background:#fee2e2; color:#b91c1c; }
</style>`;

// --- RUTAS ---

app.get('/unete', (req, res) => {
    const usd = (1750 / tcMXN).toFixed(2);
    res.send(`<html><head>${CSS}</head><body style="display:flex; justify-content:center; padding:2rem;">
        <div class="card" style="width:400px;">
            <h2 style="color:var(--p)">Registro Raízoma</h2>
            <p>1 USD = $${tcMXN} MXN</p>
            <form action="/registrar" method="POST">
                <input name="pat" placeholder="ID Patrocinador (RZ-000001)" required style="width:100%; margin-bottom:1rem; padding:0.8rem;">
                <input name="nom" placeholder="Tu Nombre" required style="width:100%; margin-bottom:1rem; padding:0.8rem;">
                <select name="pkg" style="width:100%; margin-bottom:1rem; padding:0.8rem;">
                    <option value="1750">Membresía VIP ($1,750 MXN)</option>
                    <option value="15000">Paquete Fundador ($15,000 MXN)</option>
                </select>
                <div style="background:#f1f5f9; padding:1rem; border-radius:0.5rem; text-align:center; margin-bottom:1rem;">
                    Pagar: <b style="color:var(--a); font-size:1.2rem;">$${usd} USDT</b>
                    <input type="hidden" name="usd" value="${usd}">
                </div>
                <input name="hash" placeholder="Hash de Transacción" required style="width:100%; margin-bottom:1rem; padding:0.8rem;">
                <button type="submit" style="width:100%; padding:1rem; background:var(--p); color:white; border:none; border-radius:0.5rem; cursor:pointer;">ENVIAR PAGO</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/dashboard', (req, res) => {
    if (req.body.user === "admin@raizoma.com" && req.body.pass === "1234") {
        db.all("SELECT * FROM socios", (err, rows) => {
            const red = procesarRed(rows);
            db.all("SELECT * FROM pendientes", (err, pends) => {
                res.send(`<html><head>${CSS}</head><body>
                    <div class="nav"><b>RAÍZOMA MADRE</b> <span>TC: $${tcMXN}</span></div>
                    <div style="padding:2rem;">
                        <div class="card" style="border-left:5px solid var(--w)">
                            <h3>📥 Pagos por Validar (${pends.length})</h3>
                            <table>
                                <thead><tr><th>Socio</th><th>Monto USDT</th><th>Hash</th><th>Acción</th></tr></thead>
                                <tbody>
                                    ${pends.map(p => `<tr>
                                        <td>${p.nombre} (Pat: ${p.patrocinador_id})</td>
                                        <td><b>$${p.monto_usd}</b></td>
                                        <td><code>${p.hash}</code></td>
                                        <td><form action="/aprobar" method="POST"><input type="hidden" name="id" value="${p.id}"><button style="background:var(--a); color:white; border:none; padding:0.5rem; border-radius:0.3rem;">APROBAR</button></form></td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="card">
                            <h3>👥 Árbol de Red y Volumen (3 Niveles)</h3>
                            <table>
                                <thead><tr><th>Socio</th><th>Directos</th><th>Vol. Red</th><th>Pierna Fuerte</th><th>Ciclo</th><th>Acción</th></tr></thead>
                                <tbody>
                                    ${red.map(s => `<tr>
                                        <td><b>${s.propio_id}</b><br>${s.nombre}</td>
                                        <td>${s.hijosDirectos}</td>
                                        <td>$${s.volumenRed.toLocaleString()} MXN</td>
                                        <td><span class="badge ${s.cumple6040 ? 'b-ok' : 'b-alert'}">${s.piernaFuertePct}%</span></td>
                                        <td><span class="badge ${s.diasRestantes < 5 ? 'b-alert' : 'b-ok'}">⏳ ${s.diasRestantes} días</span></td>
                                        <td>
                                            <form action="/borrar" method="POST" onsubmit="return confirm('¿Eliminar socio?')">
                                                <input type="hidden" name="id" value="${s.id}"><button style="color:var(--d); border:none; background:none; cursor:pointer;">Borrar</button>
                                            </form>
                                        </td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </body></html>`);
            });
        });
    } else res.redirect('/login');
});

// --- ACCIONES CORE ---
app.post('/aprobar', (req, res) => {
    db.get("SELECT * FROM pendientes WHERE id=?", [req.body.id], (err, p) => {
        db.get("SELECT COUNT(*) as t FROM socios", (err, row) => {
            const nID = "RZ-" + (row.t + 1).toString().padStart(6, '0');
            db.run("INSERT INTO socios (patrocinador_id, propio_id, nombre, membresia, puntos_mxn) VALUES (?,?,?,?,?)",
            [p.patrocinador_id, nID, p.nombre, 'SOCIO', p.paquete_mxn], () => {
                db.run("DELETE FROM pendientes WHERE id=?", [req.body.id], () => res.redirect(307, '/dashboard'));
            });
        });
    });
});

app.post('/registrar', (req, res) => {
    db.run("INSERT INTO pendientes (patrocinador_id, nombre, paquete_mxn, monto_usd, hash) VALUES (?,?,?,?,?)",
    [req.body.pat, req.body.nom, req.body.pkg, req.body.usd, req.body.hash], () => res.send("<h1>Pago enviado a revisión</h1>"));
});

app.post('/borrar', (req, res) => {
    db.run("DELETE FROM socios WHERE id=?", [req.body.id], () => res.redirect(307, '/dashboard'));
});

app.get('/login', (req, res) => res.send(`<form action="/dashboard" method="POST" style="text-align:center; margin-top:100px;">
    <h2>RAÍZOMA LOGIN</h2>
    <input name="user" value="admin@raizoma.com"><br><br>
    <input name="pass" type="password" value="1234"><br><br>
    <button>ENTRAR</button></form>`));

app.get('/', (req, res) => res.redirect('/login'));
app.listen(process.env.PORT || 10000);