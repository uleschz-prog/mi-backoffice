/**
 * SISTEMA RAÍZOMA PRO V26.0 - READY FOR RENDER
 * WALLET: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Configuración de lectura de datos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIGURACIÓN DE BASE DE DATOS PARA RENDER
// En Render, los archivos se borran al reiniciar a menos que uses un disco montado.
// Esta ruta detecta si estás en la nube o en tu Mac.
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/raizoma.db' 
    : path.join(__dirname, 'raizoma.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red INTEGER DEFAULT 0,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

[cite_start]// LÓGICA DE COMISIONES (BONO DE GESTIÓN) [cite: 10]
[cite_start]// Asociado Partner ($15k-$29k) -> Fijo $1,500 [cite: 10]
[cite_start]// Director Partner ($30k-$59k) -> Fijo $4,500 [cite: 10]
[cite_start]// Senior Managing Partner ($60k+) -> 20% Real [cite: 10]
function calcularBonoGestion(vol) {
    if (vol >= 60000) return vol * 0.20; 
    if (vol >= 30000) return 4500;            
    if (vol >= 15000) return 1500;            
    return 0;
}

// INTERFAZ: CUENTA MADRE
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`
        <html>
        <head>
            <title>Raízoma - Cuenta Madre</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
                .container { max-width: 1000px; margin: auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                .btn { background: #1a237e; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                th { text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase; padding: 15px; }
                td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
                .rango-tag { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Cuenta Madre</h1>
                    <a href="/unete" class="btn">+ Nuevo Socio</a>
                </div>
                <table>
                    <thead>
                        <tr><th>Socio / Dirección</th><th>Volumen Red</th><th>Bono Gestión</th></tr>
                    </thead>
                    <tbody>
                        ${rows.map(s => `
                            <tr>
                                <td>
                                    <b>${s.nombre}</b><br>
                                    <small style="color:#64748b">${s.direccion}</small>
                                </td>
                                <td>$${s.volumen_red.toLocaleString()}</td>
                                <td style="color:#10b981; font-weight:bold;">$${calcularBonoGestion(s.volumen_red).toLocaleString()}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="3" style="text-align:center">No hay registros</td></tr>'}
                    </tbody>
                </table>
            </div>
        </body>
        </html>`);
    });
});

[cite_start]// INTERFAZ: REGISTRO (LOGÍSTICA Y WALLET) [cite: 12]
app.get('/unete', (req, res) => {
    res.send(`
    <html>
    <head><style>
        body { font-family: sans-serif; background: #1a237e; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .form-card { background: white; padding: 40px; border-radius: 20px; width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        input, textarea { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
        .wallet { background: #f0fdf4; border: 1px dashed #22c55e; padding: 15px; font-size: 12px; margin: 15px 0; word-break: break-all; }
        button { width: 100%; background: #2ecc71; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    </style></head>
    <body>
        <div class="form-card">
            <h2 style="text-align:center; color:#1a237e">Registro Raízoma</h2>
            <form action="/registrar" method="POST">
                <input name="nom" placeholder="Nombre Completo" required>
                <textarea name="dir" placeholder="Dirección de Envío Completa" required rows="3"></textarea>
                <div class="wallet">
                    <b>Pagar USDT (TRC20) a:</b><br>
                    TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
                </div>
                <input name="vol" type="number" placeholder="Inversión Inicial ($)" required>
                <button type="submit">NOTIFICAR PAGO</button>
            </form>
        </div>
    </body>
    </html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, vol } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nom, dir, vol], () => {
        res.redirect('/');
    });
});

// PUERTO DINÁMICO PARA RENDER (Soluciona el error 502)
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Raízoma Live en puerto ${PORT}`);
});