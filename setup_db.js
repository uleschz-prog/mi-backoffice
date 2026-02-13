const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base de datos - Para que no falle nada, usamos una ruta local simple
const db = new sqlite3.Database('./raizoma.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red REAL DEFAULT 0
    )`);
});

// MOTOR DE COMISIONES (Lógica de Raízoma)
function calcularBono(vol) {
    if (vol >= 60000) return { monto: vol * 0.20, rango: 'Senior Managing Partner' };
    if (vol >= 30000) return { monto: 4500, rango: 'Director Partner' };
    if (vol >= 15000) return { monto: 1500, rango: 'Asociado Partner' };
    return { monto: 0, rango: 'Socio Activo' };
}

// VISTA: CUENTA MADRE
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`
        <body style="font-family:sans-serif; background:#f0f2f5; padding:20px;">
            <div style="max-width:800px; margin:auto; background:white; padding:30px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                <h1 style="color:#1a237e;">Raízoma: Cuenta Madre</h1>
                <a href="/unete" style="background:#2ecc71; color:white; padding:12px; border-radius:8px; text-decoration:none; float:right; font-weight:bold;">+ NUEVO SOCIO</a>
                <br><br><hr>
                <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                    <tr style="text-align:left; background:#f8fafc;">
                        <th style="padding:10px;">Socio / Logística</th>
                        <th>Volumen Red</th>
                        <th>Bono Gestión</th>
                    </tr>
                    ${rows ? rows.map(s => {
                        const bono = calcularBono(s.volumen_red);
                        return `<tr>
                            <td style="padding:15px; border-bottom:1px solid #eee;">
                                <b>${s.nombre}</b><br><small style="color:#666;">📍 ${s.direccion}</small>
                            </td>
                            <td style="border-bottom:1px solid #eee;">$${s.volumen_red.toLocaleString()}</td>
                            <td style="border-bottom:1px solid #eee; color:#10b981; font-weight:bold;">
                                $${bono.monto.toLocaleString()}<br><small style="color:#3f51b5;">${bono.rango}</small>
                            </td>
                        </tr>`;
                    }).join('') : ''}
                </table>
            </div>
        </body>`);
    });
});

// VISTA: REGISTRO
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#1a237e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/registrar" method="POST" style="background:white; padding:35px; border-radius:20px; width:380px;">
            <h2 style="color:#1a237e; margin-top:0;">Registro Raízoma</h2>
            <input name="nombre" placeholder="Nombre Completo" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <textarea name="direccion" placeholder="Dirección de Envío" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required></textarea>
            <div style="background:#e8f5e9; border:1px dashed #2ecc71; padding:10px; font-size:11px; margin-bottom:15px;">
                <b>Wallet Oficial (USDT TRC20):</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <input name="volumen" type="number" placeholder="Monto enviado ($)" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <button type="submit" style="width:100%; padding:15px; background:#2ecc71; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">REGISTRAR PAGO</button>
        </form>
    </body>`);
});

app.post('/registrar', (req, res) => {
    const { nombre, direccion, volumen } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nombre, direccion, volumen], () => {
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));