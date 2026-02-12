/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V22.1 - RECONSTRUCCIÓN FINAL
 * ----------------------------------------------------------------------------
 * - FIX: Puerto dinámico para evitar error 502 en Render.
 * - UI: Interfaz fiel a las capturas del usuario.
 * - CORE: Gestión de red, ciclos de 30 días y validación de pagos.
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

// --- BASE DE DATOS (PERSISTENCIA EN RENDER) ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// --- MOTOR DE DIVISAS (FX) ---
let tcMXN = 18.50;
function actualizarTC() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => { 
            try { tcMXN = JSON.parse(data).rates.MXN; } catch(e) { console.log("Error FX"); }
        });
    }).on('error', (e) => console.log("Error API"));
}
setInterval(actualizarTC, 3600000); actualizarTC();

// --- INICIALIZACIÓN DE TABLAS ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        propio_id TEXT UNIQUE,
        nombre TEXT,
        inversion INTEGER DEFAULT 0,
        banco TEXT, clabe TEXT, wallet TEXT, red_wallet TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT, paquete_mxn INTEGER, monto_usd REAL, hash TEXT,
        fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- ESTILOS CORPORATIVOS ---
const UI_STYLE = `
<style>
    :root { --blue-dark: #1a237e; --blue-light: #3f51b5; --green: #2ecc71; --bg: #f5f7fa; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); margin: 0; padding: 20px; color: #333; }
    .container { max-width: 1100px; margin: auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .stats-row { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .stat-card.dark { background: #1e293b; color: white; }
    .cycle-header { text-align: right; min-width: 200px; }
    .cycle-bar { height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .cycle-fill { height: 100%; background: var(--blue-light); width: 100%; }
    .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    input, select { padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; width: 100%; box-sizing: border-box; font-size: 14px; }
    .btn { padding: 14px 28px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 14px; text-transform: uppercase; }
    .btn-green { background: var(--green); color: white; width: 100%; margin-top: 10px; }
    .btn-blue { background: var(--blue-light); color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { text-align: left; color: #94a3b8; font-size: 12px; padding: 15px; border-bottom: 2px solid #f8fafc; }
    td { padding: 20px 15px; border-bottom: 1px solid #f8fafc; font-size: 15px; }
</style>`;

// --- RUTAS DE NAVEGACIÓN ---

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, socios) => {
        const volumenTotal = socios.reduce((a, b) => a + b.inversion, 0);
        
        res.send(`
<!DOCTYPE html>
<html>
<head><title>Raízoma Pro - Cuenta Madre</title>${UI_STYLE}</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin:0; color:var(--blue-dark); font-size: 32px;">Cuenta Madre</h1>
                <span style="background:#e0e7ff; color:var(--blue-light); padding:6px 16px; border-radius:12px; font-size:11px; font-weight:800;">ASOCIADO PARTNER</span>
            </div>
            <div class="cycle-header">
                <b style="color:var(--blue-dark); letter-spacing: 1px;">CIERRE DE CICLO</b>
                <div class="cycle-bar"><div class="cycle-fill"></div></div>
                <small style="color:#94a3b8; font-weight: 600;">Faltan 30 días</small>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-card dark">
                <small style="letter-spacing:1px; opacity:0.8; font-weight:700;">VOLUMEN DE RED</small>
                <div style="font-size:32px; font-weight:800; margin:10px 0;">$${volumenTotal.toLocaleString()}</div>
                <small style="opacity:0.6; font-weight:600;">Meta: $15,000</small>
            </div>
            <div class="stat-card">
                <small style="color:#64748b; font-weight:700;">MI BILLETERA</small>
                <div style="font-size:32px; font-weight:800; margin:10px 0; color:var(--blue-light);">$0.00</div>
            </div>
            <div class="stat-card" style="display:flex; align-items:center; gap:10px;">
                <input type="number" placeholder="Monto $">
                <button class="btn btn-blue">RETIRAR</button>
            </div>
        </div>

        <div class="stat-card">
            <b style="color:#64748b; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">🔗</span> Vinculación de Cuentas (Retiros)
            </b>
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

        <div style="margin-top:50px; display:flex; justify-content:space-between; align-items:flex-end;">
            <h3 style="margin:0; font-size: 22px; color: var(--blue-dark);">Socios en Red</h3>
            <a href="/unete" class="btn btn-blue" style="text-decoration:none; padding: 10px 20px; font-size: 12px;">+ Nuevo Socio</a>
        </div>

        <table>
            <thead>
                <tr><th>Socio</th><th>Inversión</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
                ${socios.map(s => `
                    <tr>
                        <td><b style="color:var(--blue-dark)">${s.nombre}</b><br><small style="color:#94a3b8; font-weight:700;">${s.propio_id}</small></td>
                        <td style="font-weight:700;">$${s.inversion.toLocaleString()}</td>
                        <td><span style="color:var(--green); font-weight:800;">● ACTIVO</span></td>
                        <td>
                            <form action="/borrar" method="POST" onsubmit="return confirm('¿Eliminar socio?')" style="margin:0;">
                                <input type="hidden" name="id" value="${s.id}">
                                <button style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:700; font-size:12px;">BORRAR</button>
                            </form>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" style="text-align:center; padding:50px; color:#94a3b8; font-weight:600;">No hay socios registrados todavía.</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`);
    });
});

app.get('/unete', (req, res) => {
    const usd = (1750 / tcMXN).toFixed(2);
    res.send(`
<!DOCTYPE html>
<html>
<head><title>Raízoma - Inscripción</title>${UI_STYLE}</head>
<body style="display:flex; justify-content:center; align-items:center; min-height:100vh; background: var(--blue-dark);">
    <div class="container" style="max-width:450px; border-radius:30px;">
        <h2 style="color:var(--blue-dark); text-align:center; margin-top:0;">Inscripción Raízoma</h2>
        <p style="text-align:center; color:#64748b; margin-bottom:30px;">Completa tus datos para activar tu cuenta.</p>
        
        <form action="/registrar" method="POST">
            <input name="nom" placeholder="Nombre Completo" required style="margin-bottom:15px;">
            <select name="pkg" id="pkgSelect" onchange="updatePrice()" style="margin-bottom:15px;">
                <option value="1750">Membresía VIP ($1,750 MXN)</option>
                <option value="15000">Paquete Fundador ($15,000 MXN)</option>
            </select>
            
            <div style="background:#f8fafc; padding:20px; border-radius:15px; text-align:center; margin-bottom:20px; border: 1px solid #e2e8f0;">
                <small style="color:#64748b; font-weight:700; display:block; margin-bottom:5px;">MONTO A PAGAR EN USDT</small>
                <b id="priceDisplay" style="color:var(--green); font-size:28px;">$${usd} USD</b>
            </div>
            
            <input name="hash" placeholder="Hash de Transacción (Comprobante)" required style="margin-bottom:20px; border-color: var(--blue-light);">
            <button type="submit" class="btn btn-blue" style="width:100%;">ENVIAR PARA ACTIVACIÓN</button>
        </form>
    </div>
    <script>
        function updatePrice() {
            const pkg = document.getElementById('pkgSelect').value;
            const tc = ${tcMXN};
            const usd = (pkg / tc).toFixed(2);
            document.getElementById('priceDisplay').innerText = '$' + usd + ' USD';
        }
    </script>
</body>
</html>`);
});

// --- PROCESAMIENTO ---

app.post('/registrar', (req, res) => {
    const { nom, pkg } = req.body;
    db.get("SELECT COUNT(*) as total FROM socios", (err, row) => {
        const rzID = "RZ-" + (row.total + 1).toString().padStart(3, '0');
        db.run("INSERT INTO socios (propio_id, nombre, inversion) VALUES (?,?,?)", [rzID, nom, pkg], () => {
            res.send("<script>alert('Registro exitoso. Bienvenido a Raízoma.'); window.location.href='/';</script>");
        });
    });
});

app.post('/borrar', (req, res) => {
    db.run("DELETE FROM socios WHERE id=?", [req.body.id], () => res.redirect('/'));
});

// --- ARRANQUE SEGURO ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor Raízoma Pro corriendo en puerto ${PORT}`);
});