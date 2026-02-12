/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO - RECONSTRUCCIÓN CORE
 * ----------------------------------------------------------------------------
 * - DASHBOARD: Cuenta Madre con vinculación de retiros.
 * - CICLO: 30 días exactos para calificar metas.
 * - RED: Visualización de inversión y estado de socios.
 * - PAGOS: Conversión automática MXN a USDT.
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// --- TIPO DE CAMBIO EN VIVO ---
let tcMXN = 18.50;
function updateFX() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => { 
            try { tcMXN = JSON.parse(data).rates.MXN; } catch(e){}
        });
    });
}
setInterval(updateFX, 3600000); updateFX();

// --- TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propio_id TEXT UNIQUE,
        nombre TEXT,
        inversion INTEGER,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP,
        banco TEXT, clabe TEXT, wallet TEXT, red_wallet TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT, paquete_mxn INTEGER, monto_usd REAL, hash TEXT
    )`);
});

// --- ESTILOS (Inspirados en tus capturas) ---
const CSS = `
<style>
    :root { --blue-dark: #1a237e; --blue-light: #3f51b5; --green: #2ecc71; --bg: #f5f7fa; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1000px; margin: auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .stats-row { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 15px; border: 1px solid #eee; }
    .stat-card.dark { background: #1e293b; color: white; }
    .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    input, select { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%; box-sizing: border-box; }
    .btn { padding: 12px 25px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; }
    .btn-green { background: var(--green); color: white; width: 100%; }
    .btn-blue { background: var(--blue-light); color: white; }
    .cycle-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 10px; }
    .cycle-progress { height: 100%; background: var(--blue-light); width: 75%; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase; padding: 10px; }
    td { padding: 15px 10px; border-top: 1px solid #f1f5f9; }
</style>`;

// --- VISTAS ---

app.get('/dashboard', (req, res) => {
    db.all("SELECT * FROM socios", (err, socios) => {
        const volumenTotal = socios.reduce((a, b) => a + b.inversion, 0);
        
        res.send(`
<html><head>${CSS}</head><body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin:0; color:var(--blue-dark);">Cuenta Madre</h1>
                <span style="background:#e0e7ff; color:var(--blue-light); padding:4px 12px; border-radius:10px; font-size:12px; font-weight:bold;">ASOCIADO PARTNER</span>
            </div>
            <div style="text-align:right;">
                <b style="color:var(--blue-dark); text-transform:uppercase;">Cierre de Ciclo</b>
                <div class="cycle-bar"><div class="cycle-progress"></div></div>
                <small style="color:#94a3b8;">Faltan 30 días</small>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-card dark">
                <small>VOLUMEN DE RED</small>
                <div style="font-size:24px; font-weight:bold; margin:5px 0;">$${volumenTotal.toLocaleString()}</div>
                <small style="opacity:0.7;">Meta: $15,000</small>
            </div>
            <div class="stat-card">
                <small>MI BILLETERA</small>
                <div style="font-size:24px; font-weight:bold; margin:5px 0; color:var(--blue-light);">$0.00</div>
            </div>
            <div class="stat-card" style="display:flex; align-items:center; gap:10px;">
                <input type="number" placeholder="Monto $">
                <button class="btn btn-blue">RETIRAR</button>
            </div>
        </div>

        <div class="stat-card">
            <b style="color:#64748b; font-size:14px;">🔗 Vinculación de Cuentas (Retiros)</b>
            <div class="input-grid">
                <input type="text" placeholder="Nombre del Banco">
                <input type="text" placeholder="CLABE Interbancaria (18 dígitos)">
                <input type="text" placeholder="Dirección Wallet USDT">
                <select>
                    <option>RED TRON (TRC20)</option>
                    <option>RED BINANCE (BEP20)</option>
                </select>
            </div>
            <button class="btn btn-green">ACTUALIZAR DATOS DE PAGO</button>
        </div>

        <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:center;">
            <h3>Socios en Red</h3>
            <a href="/unete" class="btn btn-blue" style="text-decoration:none;">+ Nuevo Socio</a>
        </div>

        <table>
            <thead>
                <tr><th>Socio</th><th>Inversión</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
                ${socios.map(s => `
                    <tr>
                        <td><b>${s.nombre}</b><br><small style="color:#94a3b8;">${s.propio_id}</small></td>
                        <td>$${s.inversion.toLocaleString()}</td>
                        <td><span style="color:var(--green)">● Activo</span></td>
                        <td>
                            <form action="/borrar" method="POST" style="margin:0;">
                                <input type="hidden" name="id" value="${s.id}">
                                <button style="color:red; border:none; background:none; cursor:pointer;">Borrar</button>
                            </form>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" style="text-align:center; padding:40px; color:#94a3b8;">No hay socios registrados</td></tr>'}
            </tbody>
        </table>
    </div>
</body></html>`);
    });
});

app.get('/unete', (req, res) => {
    const usd = (1750 / tcMXN).toFixed(2);
    res.send(`<html><head>${CSS}</head><body style="display:flex; justify-content:center; align-items:center; height:100vh;">
        <div class="container" style="max-width:450px;">
            <h2 style="color:var(--blue-dark); text-align:center;">Unirse a Raízoma</h2>
            <form action="/registrar" method="POST">
                <input name="nom" placeholder="Nombre Completo" required style="margin-bottom:15px;">
                <select name="pkg" style="margin-bottom:15px;">
                    <option value="1750">VIP ($1,750 MXN)</option>
                    <option value="15000">Fundador ($15,000 MXN)</option>
                </select>
                <div style="background:#f1f5f9; padding:15px; border-radius:10px; text-align:center; margin-bottom:15px;">
                    Pagar: <b style="color:var(--green); font-size:1.2rem;">$${usd} USDT</b>
                    <input type="hidden" name="usd" value="${usd}">
                </div>
                <input name="hash" placeholder="Hash de Pago" required style="margin-bottom:15px;">
                <button type="submit" class="btn btn-blue" style="width:100%;">ENVIAR SOLICITUD</button>
            </form>
        </div>
    </body></html>`);
});

// --- LÓGICA DE REGISTRO ---
app.post('/registrar', (req, res) => {
    const { nom, pkg, usd, hash } = req.body;
    db.run("INSERT INTO pendientes (nombre, paquete_mxn, monto_usd, hash) VALUES (?,?,?,?)",
    [nom, pkg, usd, hash], () => {
        res.send("<script>alert('Solicitud enviada. Espera activación de la Cuenta Madre.'); window.location.href='/dashboard';</script>");
    });
});

app.post('/borrar', (req, res) => {
    db.run("DELETE FROM socios WHERE id=?", [req.body.id], () => res.redirect('/dashboard'));
});

app.get('/', (req, res) => res.redirect('/dashboard'));
app.listen(process.env.PORT || 10000);