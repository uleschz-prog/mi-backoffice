/**
 * SISTEMA RAÍZOMA PRO V24.0
 * WALLET: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
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

// MOTOR DE TIPO DE CAMBIO
let tcMXN = 18.50;
function actualizarTC() {
    https.get('https://api.exchangerate-api.com/v4/latest/USD', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => { try { tcMXN = JSON.parse(data).rates.MXN; } catch(e){} });
    });
}
actualizarTC();

// ESTRUCTURA DE TABLAS (Incluye Dirección)
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

// VISTA DE REGISTRO CON WALLET OFICIAL
app.get('/unete', (req, res) => {
    const usd = (1750 / tcMXN).toFixed(2);
    res.send(`
    <html>
    <head>
        <style>
            body { font-family: sans-serif; background: #f5f7fa; padding: 20px; }
            .card { max-width: 450px; margin: auto; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            .wallet { background: #e0f2f1; padding: 15px; border-radius: 10px; border: 2px dashed #00897b; word-break: break-all; margin: 15px 0; }
            input, textarea { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
            button { width: 100%; padding: 15px; background: #1a237e; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2 style="color:#1a237e; text-align:center;">Inscripción Raízoma</h2>
            <form action="/registrar" method="POST">
                <input name="nom" placeholder="Nombre Completo" required>
                <textarea name="dir" placeholder="Dirección Completa de Envío (Calle, CP, Ciudad, Estado)" required rows="3"></textarea>
                
                <p><b>Enviar pago USDT (TRC20) a:</b></p>
                <div class="wallet">
                    TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
                </div>
                
                <p>Monto: <span style="color:green; font-weight:bold;">$${usd} USD</span></p>
                <input name="hash" placeholder="Hash de Transacción" required>
                <button type="submit">NOTIFICAR PAGO</button>
            </form>
        </div>
    </body>
    </html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, hash } = req.body;
    db.run("INSERT INTO pendientes (nombre, direccion, hash) VALUES (?,?,?)", [nom, dir, hash], () => {
        res.send("<script>alert('Recibido. Activaremos tu cuenta pronto.'); window.location.href='/unete';</script>");
    });
});

app.listen(process.env.PORT || 10000, '0.0.0.0');