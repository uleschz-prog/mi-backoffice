/**
 * SISTEMA OFICIAL RAÍZOMA PRO - VERSION LANZAMIENTO
 * Lógica: Bono de Gestión (Escalones topados) y Logística de Envío
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. CONFIGURACIÓN DE BASE DE DATOS (RENDER COMPATIBLE)
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/raizoma_v1.db' 
    : path.join(__dirname, 'raizoma_v1.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        direccion TEXT NOT NULL,
        volumen_red INTEGER DEFAULT 0,
        billetera_usdt TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 2. MOTOR DE CÁLCULO (BONO 2 - GESTIÓN DE RENTAS DIGITALES)
function obtenerComision(vol) {
    // Escala basada en la presentación de Raízoma
    if (vol >= 60000) return { monto: vol * 0.20, rango: 'Senior Managing Partner', pct: '20%' };
    if (vol >= 30000) return { monto: 4500, rango: 'Director Partner', pct: '15% (Fijo)' };
    if (vol >= 15000) return { monto: 1500, rango: 'Asociado Partner', pct: '10% (Fijo)' };
    return { monto: 0, rango: 'Socio en Crecimiento', pct: '0%' };
}

// 3. VISTA: CUENTA MADRE (DASHBOARD)
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        const globalVol = rows.reduce((s, row) => s + row.volumen_red, 0);
        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                :root { --p: #1a237e; --s: #2ecc71; --accent: #3f51b5; }
                body { font-family: 'Segoe UI', sans-serif; background: #f4f7f6; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 1100px; margin: auto; }
                .header { background: var(--p); color: white; padding: 30px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                .btn-new { background: var(--s); color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: 0.3s; }
                .btn-new:hover { background: #27ae60; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
                .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 5px solid var(--accent); }
                .volumen { font-size: 24px; font-weight: bold; color: var(--p); }
                .comision { font-size: 20px; color: var(--s); font-weight: bold; }
                .rango { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
                .dir { font-size: 13px; color: #888; margin-top: 10px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1 style="margin:0;">Raízoma: Cuenta Madre</h1>
                        <p style="margin:5px 0 0 0;">Volumen Total de Red: $${globalVol.toLocaleString()} MXN</p>
                    </div>
                    <a href="/registro" class="btn-new">+ REGISTRAR SOCIO</a>
                </div>
                
                <div class="grid">
                    ${rows.map(s => {
                        const info = obtenerComision(s.volumen_red);
                        return `
                        <div class="card">
                            <div class="rango">${info.rango}</div>
                            <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">${s.nombre}</div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <small>Volumen:</small>
                                    <div class="volumen">$${s.volumen_red.toLocaleString()}</div>
                                </div>
                                <div style="text-align:right;">
                                    <small>Bono Gestión (${info.pct}):</small>
                                    <div class="comision">$${info.monto.toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="dir">📍 ${s.direccion}</div>
                        </div>`;
                    }).join('') || '<p style="text-align:center; width:100%;">No hay socios registrados.</p>'}
                </div>
            </div>
        </body>
        </html>`);
    });
});

// 4. VISTA: REGISTRO (LOGÍSTICA Y WALLET)
app.get('/registro', (req, res) => {
    res.send(`
    <html>
    <head>
        <style>
            body { font-family: sans-serif; background: #1a237e; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .form { background: white; padding: 40px; border-radius: 20px; width: 400px; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
            input, textarea { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
            .wallet-box { background: #e8f5e9; border: 2px dashed #2ecc71; padding: 15px; border-radius: 10px; font-size: 12px; word-break: break-all; margin: 15px 0; }
            button { width: 100%; padding: 15px; background: #2ecc71; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class="form">
            <h2 style="color:#1a237e; margin:0 0 20px 0; text-align:center;">Inscripción Raízoma</h2>
            <form action="/add-socio" method="POST">
                <input name="nom" placeholder="Nombre Completo del Socio" required>
                <textarea name="dir" placeholder="Dirección de Envío (Calle, CP, Ciudad, Estado)" required rows="3"></textarea>
                
                <p style="margin:0; font-weight:bold; font-size:13px;">Wallet Oficial para envío USDT (TRC20):</p>
                <div class="wallet-box">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</div>
                
                <input name="vol" type="number" placeholder="Monto de Inscripción / Volumen ($)" required>
                <button type="submit">ACTIVAR SOCIO</button>
            </form>
        </div>
    </body>
    </html>`);
});

// 5. PROCESAMIENTO
app.post('/add-socio', (req, res) => {
    const { nom, dir, vol } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nom, dir, vol], () => {
        res.redirect('/');
    });
});

// 6. LANZAMIENTO
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor Raízoma en línea en el puerto ${PORT}`);
});