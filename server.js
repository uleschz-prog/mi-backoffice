/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V18.0 - GESTIÓN DE CICLOS Y REGISTRO EXTENDIDO
 * ----------------------------------------------------------------------------
 * - CICLO 30 DÍAS: Reinicio automático de puntos tras 30 días de inactividad.
 * - REGISTRO PÚBLICO: Formulario completo con dirección y validación de pago.
 * - AUTO-ID: Formato RZ-000000.
 * - PERSISTENCIA: Render /var/lib/data.
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- DATABASE CONFIG ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');

const db = new sqlite3.Database(dbPath);

// --- ESQUEMA CON FECHAS Y REGISTRO ---
db.serialize(() => {
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
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_reinicio DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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
});

// --- MOTOR DE CICLOS (REINICIO 30 DÍAS) ---
function verificarCiclos(socios) {
    const hoy = new Date();
    socios.forEach(s => {
        const registro = new Date(s.fecha_registro);
        const diasTranscurridos = Math.floor((hoy - registro) / (1000 * 60 * 60 * 24));
        
        // Si pasaron 30 días, se reinician los puntos en la visualización
        if (diasTranscurridos >= 30) {
            s.puntos = 0; 
            s.diasRestantes = 0;
        } else {
            s.diasRestantes = 30 - diasTranscurridos;
        }
    });
    return socios;
}

// --- VISTA: REGISTRO PÚBLICO (NUEVA) ---
app.get('/unete', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro | Raízoma Pro</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; padding: 40px; }
        .card { background: white; color: #1e293b; padding: 40px; border-radius: 24px; width: 100%; max-width: 650px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        input, select { width: 100%; padding: 12px; margin: 8px 0; border: 1.5px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; }
        .btn { background: #1e3a8a; color: white; border: none; padding: 16px; width: 100%; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 16px; }
        .payment { background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px dashed #cbd5e1; margin: 15px 0; }
        h2 { margin: 0 0 10px 0; color: #1e3a8a; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Únete a Raízoma Pro</h2>
        <p style="color:#64748b; font-size:14px;">Completa tu registro y sube tu comprobante de pago para activación.</p>
        
        <form action="/solicitar" method="POST">
            <label>ID Patrocinador</label>
            <input type="text" name="pat" value="RZ-MADRE" readonly style="background:#f1f5f9;">
            
            <input type="text" name="nom" placeholder="Nombre Completo" required>
            <div class="grid">
                <input type="email" name="cor" placeholder="Correo Electrónico" required>
                <input type="text" name="tel" placeholder="Teléfono / WhatsApp" required>
            </div>

            <h4 style="margin:20px 0 5px 0;">Dirección de Envío</h4>
            <input type="text" name="calle" placeholder="Calle y Número" required>
            <div class="grid">
                <input type="text" name="col" placeholder="Colonia" required>
                <input type="text" name="cp" placeholder="Código Postal" required>
            </div>
            <div class="grid">
                <input type="text" name="ciu" placeholder="Ciudad" required>
                <input type="text" name="est" placeholder="Estado" required>
            </div>

            <h4 style="margin:20px 0 5px 0;">Paquete y Pago</h4>
            <select name="paquete" required>
                <option value="VIP-1750">Membresía VIP ($1,750 USD)</option>
                <option value="FOUNDER-15000">Paquete Fundador ($15,000 USD)</option>
            </select>

            <div class="payment">
                <strong>Pagar a Wallets Corporativas:</strong><br>
                <small>USDT (TRC20): T-EjemploDireccion12345</small><br>
                <small>BNB (BEP20): 0x-EjemploDireccion67890</small>
            </div>

            <input type="text" name="hash" placeholder="Hash de Transacción / Comprobante" required>
            <button type="submit" class="btn">ENVIAR SOLICITUD DE ACTIVACIÓN</button>
        </form>
    </div>
</body>
</html>
    `);
});

// --- PROCESAR SOLICITUD ---
app.post('/solicitar', (req, res) => {
    const { pat, nom, cor, tel, calle, col, cp, ciu, est, paquete, hash } = req.body;
    const direccion = `${calle}, ${col}, CP ${cp}, ${ciu}, ${est}`;
    const monto = paquete.split('-')[1];

    db.run(`INSERT INTO pendientes (patrocinador_id, nombre, correo, telefono, direccion_completa, membresia, monto, comprobante_id) 
            VALUES (?,?,?,?,?,?,?,?)`, 
            [pat, nom, cor, tel, direccion, paquete.split('-')[0], monto, hash], () => {
        res.send("<body style='font-family:sans-serif; text-align:center; padding:50px;'><h1>✅ Solicitud Recibida</h1><p>Tu pago está siendo validado por la cuenta madre. En breve recibirás tu ID de socio.</p></body>");
    });
});

// --- DASHBOARD ADMIN (CON REINICIO DE PUNTOS) ---
app.post('/dashboard', (req, res) => {
    const { user, pass } = req.body;
    if (user === "admin@raizoma.com" && pass === "1234") {
        db.all("SELECT * FROM socios", [], (err, rows) => {
            const sociosConCiclo = verificarCiclos(rows); // Aplicar lógica de 30 días
            db.all("SELECT * FROM pendientes", [], (err, pendientes) => {
                
                res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Admin Raízoma Pro</title>
    <style>
        body { font-family: sans-serif; background: #f8fafc; margin: 0; }
        .nav { background: #1e3a8a; color: white; padding: 20px 50px; display: flex; justify-content: space-between; }
        .container { max-width: 1200px; margin: 30px auto; padding: 20px; }
        .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 12px; color: #64748b; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .timer { color: #e11d48; font-weight: bold; font-size: 12px; }
        .btn-check { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="nav"><h2>RAÍZOMA PRO</h2> <span>ADMINISTRADOR</span></div>
    <div class="container">
        
        <div class="card" style="border-left: 5px solid #f59e0b;">
            <h3>📥 Pagos por Validar</h3>
            <table>
                <thead><tr><th>Socio</th><th>Monto</th><th>Hash</th><th>Acción</th></tr></thead>
                <tbody>
                    ${pendientes.map(p => `
                        <tr>
                            <td><b>${p.nombre}</b><br><small>${p.direccion_completa}</small></td>
                            <td>$${p.monto}</td>
                            <td><code>${p.comprobante_id}</code></td>
                            <td><form action="/aprobar" method="POST"><input type="hidden" name="id" value="${p.id}"><button class="btn-check">APROBAR</button></form></td>
                        </tr>
                    `).join('') || '<td>No hay pendientes</td>'}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h3>👥 Red Activa (Ciclo de 30 Días)</h3>
            <table>
                <thead><tr><th>ID</th><th>Nombre</th><th>Puntos Actuales</th><th>Días para Cierre</th></tr></thead>
                <tbody>
                    ${sociosConCiclo.map(s => `
                        <tr>
                            <td><b>${s.propio_id}</b></td>
                            <td>${s.nombre}</td>
                            <td style="color:${s.puntos > 0 ? '#10b981' : '#94a3b8'}"><b>$${s.puntos.toLocaleString()}</b></td>
                            <td><span class="timer">⏳ ${s.diasRestantes} días restantes</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

    </div>
</body>
</html>
                `);
            });
        });
    } else { res.redirect('/login'); }
});

// --- LÓGICA DE APROBACIÓN ---
async function generarID() {
    return new Promise(r => db.get("SELECT COUNT(*) as t FROM socios", (e, row) => r("RZ-" + (row.t + 1).toString().padStart(6, '0'))));
}

app.post('/aprobar', async (req, res) => {
    db.get("SELECT * FROM pendientes WHERE id = ?", [req.body.id], async (err, p) => {
        if (p) {
            const nID = await generarID();
            db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, telefono, calle_num, membresia, puntos) 
                    VALUES (?,?,?,?,?,?,?,?)`, 
                    [p.patrocinador_id, nID, p.nombre, p.correo, p.telefono, p.direccion_completa, p.membresia, p.monto], () => {
                db.run("DELETE FROM pendientes WHERE id = ?", [req.body.id], () => res.redirect(307, '/dashboard'));
            });
        }
    });
});

app.get('/login', (req, res) => res.send('<form action="/dashboard" method="POST"><input name="user" value="admin@raizoma.com"><input name="pass" type="password" value="1234"><button>Entrar</button></form>'));
app.get('/', (req, res) => res.redirect('/unete'));

app.listen(process.env.PORT || 10000);