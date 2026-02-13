/**
 * SISTEMA RAIZOMA PRO - CÓDIGO MAESTRO DE LANZAMIENTO
 * ---------------------------------------------------
 * Variables integradas: 
 * - Wallet: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
 * - Bonos: 10% ($15k), 15% ($30k), 20% (Real > $60k)
 * - Logística: Captura de Dirección de Envío
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. BASE DE DATOS (Compatible con Render y Local)
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/raizoma_oficial.db' 
    : path.join(__dirname, 'raizoma_oficial.db');

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

// 2. MOTOR DE CÁLCULO DE COMISIONES (Lógica exacta de diapositivas)
function calcularComision(vol) {
    if (vol >= 60000) return { monto: vol * 0.20, rango: 'Senior Managing Partner', pct: '20%' };
    if (vol >= 30000) return { monto: 4500, rango: 'Director Partner', pct: '15% (Fijo)' };
    if (vol >= 15000) return { monto: 1500, rango: 'Asociado Partner', pct: '10% (Fijo)' };
    return { monto: 0, rango: 'Socio Activo', pct: '0%' };
}

// 3. VISTA: CUENTA MADRE (DASHBOARD)
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Raízoma | Panel de Control</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
                .main-card { max-width: 1000px; margin: auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f2f5; padding-bottom: 20px; margin-bottom: 20px; }
                .btn { background: #1a237e; color: white; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; color: #64748b; font-size: 13px; padding: 10px; background: #f8fafc; }
                td { padding: 15px 10px; border-bottom: 1px solid #f1f5f9; }
                .tag { padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: bold; background: #e0e7ff; color: #3730a3; }
                .comision-text { color: #10b981; font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="main-card">
                <div class="header">
                    <h1 style="color: #1a237e; margin: 0;">Raízoma: Gestión de Red</h1>
                    <a href="/unete" class="btn">+ Registrar Socio</a>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>DATOS DEL SOCIO / LOGÍSTICA</th>
                            <th>VOLUMEN MENSUAL</th>
                            <th>ESTADO / COMISIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(s => {
                            const info = calcularComision(s.volumen_red);
                            return `
                            <tr>
                                <td>
                                    <span class="tag">${info.rango}</span><br>
                                    <div style="margin-top:8px;"><b>${s.nombre}</b></div>
                                    <div style="font-size:12px; color:#64748b; margin-top:4px;">📍 ${s.direccion}</div>
                                </td>
                                <td style="font-weight:bold; font-size:18px; color:#1a237e;">$${s.volumen_red.toLocaleString()}</td>
                                <td>
                                    <small style="color:#64748b;">Bono Gestión ${info.pct}</small><br>
                                    <span class="comision-text">$${info.monto.toLocaleString()}</span>
                                </td>
                            </tr>`;
                        }).join('') || '<tr><td colspan="3" style="text-align:center; padding:50px; color:#94a3b8;">No hay registros todavía.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </body>
        </html>`);
    });
});

// 4. VISTA: FORMULARIO DE REGISTRO
app.get('/unete', (req, res) => {
    res.send(`
    <html>
    <head>
        <style>
            body { font-family: sans-serif; background: #1a237e; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .form-box { background: white; padding: 40px; border-radius: 20px; width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
            input, textarea { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
            .wallet-info { background: #f0fdf4; border: 1px dashed #22c55e; padding: 15px; border-radius: 10px; font-size: 12px; margin: 15px 0; }
            button { width: 100%; background: #2ecc71; color: white; border: none; padding: 15px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class="form-box">
            <h2 style="color: #1a237e; text-align: center; margin-bottom: 25px;">Registro de Socio</h2>
            <form action="/procesar" method="POST">
                <input name="n" placeholder="Nombre Completo" required>
                <textarea name="d" placeholder="Dirección de Envío Completa (Calle, CP, Ciudad)" required rows="3"></textarea>
                <div class="wallet-info">
                    <b>ENVIAR USDT (TRC20) A:</b><br>
                    TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
                </div>
                <input name="v" type="number" placeholder="Monto de Inversión / Volumen ($)" required>
                <button type="submit">ACTIVAR SOCIO</button>
            </form>
        </div>
    </body>
    </html>`);
});

// 5. PROCESAMIENTO DE DATOS
app.post('/procesar', (req, res) => {
    const { n, d, v } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [n, d, v], () => {
        res.redirect('/');
    });
});

// 6. ARRANQUE (Compatible con el puerto de Render)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Raízoma en línea: puerto ${PORT}`));