/**
 * ============================================================================
 * SISTEMA RAÍZOMA PRO V16.0 - CORPORATE & VALIDATION EDITION
 * ----------------------------------------------------------------------------
 * - Auto-ID: Generación automática RZ-000001, RZ-000002...
 * - Dirección Completa: Calle, Col, CP, Ciudad, Estado.
 * - Pasarela de Pago: Registro bloqueado hasta validación manual (Cuenta Madre).
 * - Persistencia: Configurado para /var/lib/data (Render $7).
 * ============================================================================
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- CONFIGURACIÓN DE BASE DE DATOS ---
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio.db' 
    : path.join(__dirname, 'negocio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (!err) {
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA auto_vacuum = FULL;");
    }
});

// --- ESQUEMA DE BASE DE DATOS ACTUALIZADO ---
db.serialize(() => {
    // Tabla de Socios (Solo los aprobados)
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
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Solicitudes Pendientes (Pasarela de Pago)
    db.run(`CREATE TABLE IF NOT EXISTS pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patrocinador_id TEXT,
        nombre TEXT,
        correo TEXT,
        telefono TEXT,
        direccion_completa TEXT,
        membresia TEXT,
        monto TEXT,
        metodo_pago TEXT, -- USDT TRX o BNB
        comprobante_id TEXT, -- Hash de transacción
        status TEXT DEFAULT 'PENDIENTE'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT NOT NULL,
        guia TEXT NOT NULL,
        estatus TEXT DEFAULT 'En ruta'
    )`);
});

// --- FUNCIONES DE APOYO ---

// Generador de ID Automático: RZ-000001
async function generarSiguienteID() {
    return new Promise((resolve) => {
        db.get("SELECT COUNT(*) as total FROM socios", (err, row) => {
            const siguiente = (row ? row.total : 0) + 1;
            resolve("RZ-" + siguiente.toString().padStart(6, '0'));
        });
    });
}

// --- RUTAS DE REGISTRO (PÚBLICAS) ---

app.get('/registro', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Inscripción Raízoma</title>
    <style>
        body { font-family: sans-serif; background: #f1f5f9; padding: 20px; }
        .form-card { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        input, select, textarea { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
        .btn-pay { background: #10b981; color: white; border: none; padding: 15px; width: 100%; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        .payment-info { background: #eff6ff; padding: 15px; border-radius: 10px; margin-top: 15px; font-size: 13px; border-left: 5px solid #1e3a8a; }
    </style>
</head>
<body>
    <div class="form-card">
        <h2 style="color:#1e3a8a; margin-top:0;">Formulario de Inscripción</h2>
        <form action="/solicitar-registro" method="POST">
            <input type="text" name="pat" value="RZ-MADRE" placeholder="ID Patrocinador">
            <input type="text" name="nom" placeholder="Nombre Completo" required>
            <div class="grid">
                <input type="email" name="cor" placeholder="Correo Electrónico" required>
                <input type="text" name="tel" placeholder="Teléfono" required>
            </div>
            
            <h4 style="margin-bottom:5px;">Dirección de Envío</h4>
            <input type="text" name="calle" placeholder="Calle y Número" required>
            <div class="grid">
                <input type="text" name="col" placeholder="Colonia" required>
                <input type="text" name="cp" placeholder="Código Postal" required>
            </div>
            <div class="grid">
                <input type="text" name="ciu" placeholder="Ciudad" required>
                <input type="text" name="est" placeholder="Estado" required>
            </div>

            <h4>Paquete de Inicio</h4>
            <select name="paquete" required>
                <option value="VIP-1750">Membresía VIP ($1,750 USD)</option>
                <option value="FOUNDER-15000">Paquete Fundador ($15,000 USD)</option>
            </select>

            <div class="payment-info">
                <strong>Pasarela de Pago (Crypto):</strong><br>
                TRC20 (USDT): <code>T-DIRECCION-DE-TU-WALLET-AQUI</code><br>
                BEP20 (BNB): <code>0x-DIRECCION-DE-TU-WALLET-AQUI</code>
            </div>

            <select name="metodo" required style="margin-top:15px; border-color:#10b981;">
                <option value="">Selecciona tu método de pago usado</option>
                <option value="USDT_TRX">USDT vía RED TRON (TRX)</option>
                <option value="USDT_BNB">USDT vía RED BINANCE (BNB)</option>
            </select>
            <input type="text" name="hash" placeholder="ID de Transacción (Hash / Comprobante)" required>

            <button type="submit" class="btn-pay">ENVIAR PARA VALIDACIÓN</button>
        </form>
    </div>
</body>
</html>
    `);
});

app.post('/solicitar-registro', (req, res) => {
    const { pat, nom, cor, tel, calle, col, cp, ciu, est, paquete, metodo, hash } = req.body;
    const direccion = `${calle}, Col. ${col}, CP ${cp}, ${ciu}, ${est}`;
    const monto = paquete.split('-')[1];

    db.run(`INSERT INTO pendientes (patrocinador_id, nombre, correo, telefono, direccion_completa, membresia, monto, metodo_pago, comprobante_id) 
            VALUES (?,?,?,?,?,?,?,?,?)`, 
            [pat, nom, cor, tel, direccion, paquete.split('-')[0], monto, metodo, hash], () => {
        res.send("<h1>Solicitud Enviada</h1><p>Tu registro está en espera. La cuenta madre validará tu pago en breve para activarte en el árbol.</p>");
    });
});

// --- DASHBOARD CUENTA MADRE (VALIDACIONES) ---

app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        db.all("SELECT * FROM socios", [], (err, socios) => {
            db.all("SELECT * FROM pendientes WHERE status = 'PENDIENTE'", [], (err, pendientes) => {
                db.all("SELECT * FROM pedidos ORDER BY id DESC", [], (err, envios) => {
                    
                    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Panel Raízoma Madre</title>
    <style>
        :root { --blue: #1e3a8a; --green: #10b981; --bg: #f8fafc; }
        body { font-family: sans-serif; background: var(--bg); margin: 0; }
        .header { background: var(--blue); color: white; padding: 20px 50px; display: flex; justify-content: space-between; }
        .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
        .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; color: #64748b; font-size: 12px; padding: 10px; border-bottom: 2px solid #eee; }
        td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f8fafc; }
        .btn-approve { background: var(--green); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
        .btn-reject { background: #ef4444; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
        .badge-pago { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h2>RAÍZOMA <span style="color:var(--green)">PRO V16</span></h2>
        <div>MODO: <strong>CUENTA MADRE</strong></div>
    </div>

    <div class="container">
        <div class="card" style="border-top: 5px solid #f59e0b;">
            <h3>📥 Solicitudes de Registro Pendientes</h3>
            <table>
                <thead>
                    <tr>
                        <th>CANDIDATO</th>
                        <th>PAQUETE / MONTO</th>
                        <th>MÉTODO / HASH</th>
                        <th>DIRECCIÓN</th>
                        <th>ACCIÓN</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendientes.map(p => `
                        <tr>
                            <td><b>${p.nombre}</b><br><small>${p.correo}</small></td>
                            <td>${p.membresia}<br><b>$${p.monto}</b></td>
                            <td><span class="badge-pago">${p.metodo_pago}</span><br><small style="font-size:10px;">${p.comprobante_id}</small></td>
                            <td style="font-size:11px; max-width:200px;">${p.direccion_completa}</td>
                            <td>
                                <div style="display:flex; gap:5px;">
                                    <form action="/aprobar-socio" method="POST">
                                        <input type="hidden" name="id" value="${p.id}">
                                        <button class="btn-approve">VALIDAR PAGO</button>
                                    </form>
                                    <form action="/rechazar-socio" method="POST">
                                        <input type="hidden" name="id" value="${p.id}">
                                        <button class="btn-reject">✕</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay pagos por validar</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h3>👥 Árbol de Socios Activos</h3>
            <table>
                <thead>
                    <tr><th>ID ASIGNADO</th><th>NOMBRE</th><th>PATROCINADOR</th><th>PUNTOS</th></tr>
                </thead>
                <tbody>
                    ${socios.map(s => `
                        <tr>
                            <td><b style="color:var(--blue)">${s.propio_id}</b></td>
                            <td>${s.nombre}</td>
                            <td>${s.patrocinador_id}</td>
                            <td>$${s.puntos.toLocaleString()}</td>
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
        });
    } else { res.redirect('/login'); }
});

// --- LÓGICA DE APROBACIÓN ---

app.post('/aprobar-socio', async (req, res) => {
    const idPendiente = req.body.id;
    
    db.get("SELECT * FROM pendientes WHERE id = ?", [idPendiente], async (err, p) => {
        if (p) {
            const nuevoID = await generarSiguienteID();
            
            // Insertar en tabla definitiva de socios
            db.run(`INSERT INTO socios (patrocinador_id, propio_id, nombre, correo, telefono, calle_num, membresia, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [p.patrocinador_id, nuevoID, p.nombre, p.correo, p.telefono, p.direccion_completa, p.membresia, parseInt(p.monto)], () => {
                
                // Borrar de pendientes
                db.run("DELETE FROM pendientes WHERE id = ?", [idPendiente], () => {
                    res.redirect(307, '/dashboard');
                });
            });
        }
    });
});

app.post('/rechazar-socio', (req, res) => {
    db.run("DELETE FROM pendientes WHERE id = ?", [req.body.id], () => res.redirect(307, '/dashboard'));
});

// --- LOGIN Y ARRANQUE ---
app.get('/login', (req, res) => res.send('<body style="background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;"><form action="/dashboard" method="POST" style="background:white; padding:40px; border-radius:20px;"><h2>Raízoma Admin</h2><input name="correo" value="admin@raizoma.com" style="display:block; margin-bottom:10px;"><input name="password" type="password" value="1234" style="display:block; margin-bottom:10px;"><button style="width:100%; padding:10px; background:#1e3a8a; color:white; border:none; border-radius:5px;">Entrar</button></form></body>'));
app.get('/', (req, res) => res.redirect('/login'));

app.listen(process.env.PORT || 10000, '0.0.0.0');