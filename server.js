/**
 * RAIZOMA CORE SYSTEM v3.0 - LANZAMIENTO
 * Diseñado para: Ulises | Wallet: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// BASE DE DATOS (Configuración para persistencia en Render)
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/negocio_raizoma.db' 
    : path.join(__dirname, 'negocio_raizoma.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red REAL DEFAULT 0,
        hash_pago TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// MOTOR DE CÁLCULO DE COMISIONES (Basado en PDF Raízoma)
function calcularComisiones(vol) {
    let pago = 0;
    let rango = "Socio Activo";
    
    if (vol >= 60000) {
        pago = vol * 0.20; // 20% Real a partir de 60k
        rango = "Senior Managing Partner";
    } else if (vol >= 30000) {
        pago = 4500; // 15% de 30k (Fijo)
        rango = "Director Partner";
    } else if (vol >= 15000) {
        pago = 1500; // 10% de 15k (Fijo)
        rango = "Asociado Partner";
    }
    
    return { pago, rango };
}

// RUTA 1: CUENTA MADRE (DASHBOARD)
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma | Cuenta Madre</title>
            <style>
                :root { --blue: #1a237e; --green: #10b981; --gray: #64748b; }
                body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                .container { max-width: 1100px; margin: auto; }
                .header { background: var(--blue); color: white; padding: 30px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                .btn { background: var(--green); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
                .card { background: white; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; transition: transform 0.2s; }
                .card:hover { transform: translateY(-5px); }
                .rango { font-size: 11px; font-weight: bold; color: var(--blue); text-transform: uppercase; background: #e0e7ff; padding: 4px 8px; border-radius: 5px; }
                .pago { font-size: 24px; font-weight: bold; color: var(--green); margin: 10px 0; }
                .details { font-size: 13px; color: var(--gray); line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1 style="margin:0;">Raízoma Core</h1>
                        <p style="margin:5px 0 0; opacity:0.8;">Panel General de Administración</p>
                    </div>
                    <a href="/unete" class="btn">Registrar Nuevo Socio</a>
                </div>

                <div class="grid">
                    ${rows.map(s => {
                        const { pago, rango } = calcularComisiones(s.volumen_red);
                        return `
                        <div class="card">
                            <span class="rango">${rango}</span>
                            <h3 style="margin:15px 0 5px;">${s.nombre}</h3>
                            <div class="pago">$${pago.toLocaleString()} <small style="font-size:12px; color:gray;">Bono Gestión</small></div>
                            <div class="details">
                                <b>Volumen:</b> $${s.volumen_red.toLocaleString()}<br>
                                <b>Logística:</b> ${s.direccion}<br>
                                <b>Hash:</b> <code style="font-size:10px;">${s.hash_pago}</code>
                            </div>
                        </div>`;
                    }).join('') || '<p>No hay socios registrados aún.</p>'}
                </div>
            </div>
        </body>
        </html>
        `);
    });
});

// RUTA 2: FORMULARIO DE REGISTRO
app.get('/unete', (req, res) => {
    res.send(`
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: sans-serif; background: #1a237e; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .box { background: white; padding: 40px; border-radius: 25px; width: 100%; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            input, textarea { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #d1d5db; border-radius: 10px; box-sizing: border-box; }
            .wallet { background: #ecfdf5; border: 2px dashed #10b981; padding: 15px; border-radius: 12px; font-size: 12px; margin: 15px 0; word-break: break-all; }
            button { width: 100%; padding: 16px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class="box">
            <h2 style="text-align:center; color:#1a237e; margin-top:0;">Registro Raízoma</h2>
            <form action="/enviar" method="POST">
                <input name="nombre" placeholder="Nombre completo" required>
                <textarea name="direccion" placeholder="Dirección de envío completa (Calle, CP, Ciudad)" required rows="3"></textarea>
                
                <div class="wallet">
                    <b>ENVÍA USDT (TRC20) A:</b><br>
                    TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
                </div>

                <input name="volumen" type="number" placeholder="Monto enviado ($)" required>
                <input name="hash" placeholder="Hash de transacción (TXID)" required>
                <button type="submit">NOTIFICAR PAGO</button>
            </form>
        </div>
    </body>
    </html>
    `);
});

app.post('/enviar', (req, res) => {
    const { nombre, direccion, volumen, hash } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red, hash_pago) VALUES (?,?,?,?)", 
    [nombre, direccion, volumen, hash], () => res.redirect('/'));
});

// PUERTO DINÁMICO
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Raízoma operando en puerto ${PORT}`));{
  "name": "raizoma-backoffice",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6"
  }
}
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base de datos (Usa memoria si falla el disco para que SIEMPRE funcione)
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) console.error("Error BD:", err);
});

db.serialize(() => {
    db.run("CREATE TABLE socios (id INTEGER PRIMARY KEY, nombre TEXT, direccion TEXT, vol REAL, hash TEXT)");
});

// LÓGICA DE NEGOCIO RAIZOMA
function calcularBono(v) {
    if (v >= 60000) return { p: v * 0.20, r: "Senior Managing Partner" };
    if (v >= 30000) return { p: 4500, r: "Director Partner" };
    if (v >= 15000) return { p: 1500, r: "Asociado Partner" };
    return { p: 0, r: "Socio" };
}

// VISTA DASHBOARD
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        res.send(`
        <body style="font-family:sans-serif; background:#f0f2f5; padding:20px;">
            <div style="max-width:800px; margin:auto; background:white; padding:30px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                <h1 style="color:#1a237e;">Raízoma: Cuenta Madre</h1>
                <a href="/unete" style="background:#2ecc71; color:white; padding:10px; border-radius:5px; text-decoration:none; float:right;">+ Nuevo Socio</a>
                <br><br>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="background:#f8fafc; text-align:left;"><th>Socio / Logística</th><th>Volumen</th><th>Bono Gestión</th></tr>
                    ${rows.map(s => {
                        const b = calcularBono(s.vol);
                        return `<tr>
                            <td style="padding:10px; border-bottom:1px solid #eee;"><b>${s.nombre}</b><br><small>${s.direccion}</small></td>
                            <td style="border-bottom:1px solid #eee;">$${s.vol}</td>
                            <td style="color:green; font-weight:bold; border-bottom:1px solid #eee;">$${b.p} <br><small style="color:blue;">${b.r}</small></td>
                        </tr>`;
                    }).join('')}
                </table>
            </div>
        </body>`);
    });
});

// VISTA REGISTRO
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#1a237e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
        <form action="/reg" method="POST" style="background:white; padding:30px; border-radius:15px; width:350px;">
            <h2>Registro Raízoma</h2>
            <input name="n" placeholder="Nombre" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <textarea name="d" placeholder="Dirección de Envío" style="width:100%; margin-bottom:10px; padding:10px;" required></textarea>
            <div style="background:#e8f5e9; padding:10px; font-size:11px; margin-bottom:10px;">
                <b>Wallet TRC20:</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <input name="v" type="number" placeholder="Monto ($)" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <button type="submit" style="width:100%; padding:10px; background:#2ecc71; color:white; border:none; cursor:pointer;">REGISTRAR</button>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios (nombre, direccion, vol) VALUES (?,?,?)", [req.body.n, req.body.d, req.body.v], () => res.redirect('/'));
});

app.listen(process.env.PORT || 10000, '0.0.0.0');