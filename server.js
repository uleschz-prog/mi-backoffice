/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V23.0 - LOGÍSTICA Y PAGOS
 * ----------------------------------------------------------------------------
 * - WALLET CORPORATIVA: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
 * - ENVÍOS: Captura de dirección completa para logística.
 * - BONOS: Lógica de volumen 60/40 integrada para cálculo de comisiones.
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// --- MOTOR DE TIPO DE CAMBIO ---
let tcMXN = 18.50;
function actualizarTC() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => { try { tcMXN = JSON.parse(data).rates.MXN; } catch(e){} });
    });
}
setInterval(actualizarTC, 3600000); actualizarTC();

// --- TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propio_id TEXT UNIQUE,
        nombre TEXT,
        direccion TEXT,
        inversion INTEGER,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT, 
        direccion TEXT,
        paquete_mxn INTEGER, 
        monto_usd REAL, 
        hash TEXT
    )`);
});

const CSS = `
<style>
    :root { --blue: #1a237e; --green: #2ecc71; --bg: #f5f7fa; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: auto; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .wallet-box { background: #f8fafc; border: 2px dashed var(--green); padding: 15px; border-radius: 12px; margin: 20px 0; word-break: break-all; }
    input, select, textarea { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; width: 100%; box-sizing: border-box; margin-bottom: 15px; font-family: inherit; }
    .btn { background: var(--blue); color: white; padding: 15px; border: none; border-radius: 8px; width: 100%; font-weight: bold; cursor: pointer; }
    .badge { color: var(--green); font-weight: bold; font-size: 1.2rem; }
</style>`;

app.get('/unete', (req, res) => {
    const usd = (1750 / tcMXN).toFixed(2);
    res.send(`
<html><head><title>Registro Raízoma</title>${CSS}</head>
<body>
    <div class="container">
        <h2 style="color:var(--blue); text-align:center;">Inscripción Oficial</h2>
        <form action="/registrar" method="POST">
            <label>Nombre Completo</label>
            <input name="nom" required>
            
            <label>Dirección de Envío (Calle, Num, Col, CP, Ciudad)</label>
            <textarea name="dir" rows="3" required placeholder="Ej. Av. Reforma 123, Col. Centro, CP 06000, CDMX"></textarea>
            
            <label>Paquete</label>
            <select name="pkg" id="pkg" onchange="calc()">
                <option value="1750">Membresía VIP ($1,750 MXN)</option>
                <option value="15000">Paquete Fundador ($15,000 MXN)</option>
            </select>

            <div class="wallet-box">
                <small style="color:#64748b; font-weight:bold;">ENVIAR USDT (RED TRC20) A:</small><br>
                <b style="color:var(--blue); font-size:14px;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</b>
            </div>

            <div style="text-align:center; margin-bottom:20px;">
                Monto exacto: <span class="badge" id="val">$${usd} USD</span>
                <input type="hidden" name="usd_val" id="usd_val" value="${usd}">
            </div>

            <input name="hash" placeholder="Hash de Transacción / Comprobante" required>
            <button class="btn">ENVIAR SOLICITUD DE ACTIVACIÓN</button>
        </form>
    </div>
    <script>
        function calc() {
            const p = document.getElementById('pkg').value;
            const res = (p / ${tcMXN}).toFixed(2);
            document.getElementById('val').innerText = '$' + res + ' USD';
            document.getElementById('usd_val').value = res;
        }
    </script>
</body></html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, pkg, usd_val, hash } = req.body;
    db.run("INSERT INTO pendientes (nombre, direccion, paquete_mxn, monto_usd, hash) VALUES (?,?,?,?,?)",
    [nom, dir, pkg, usd_val, hash], () => {
        res.send("<script>alert('Recibido. Tu cuenta será activada tras validar el pago.'); window.location.href='/unete';</script>");
    });
});

app.listen(process.env.PORT || 10000, '0.0.0.0');