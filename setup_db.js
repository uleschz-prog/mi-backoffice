// TIMESTAMP: 2024-05-21-RAIZOMA-CORE-V1
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base de datos (Ruta simple para evitar errores de permisos en Render)
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red REAL DEFAULT 0
    )`);
});

// LÓGICA DE BONOS (Según tu plan de compensación)
function calcularBono(v) {
    if (v >= 60000) return { p: v * 0.20, r: "Senior Managing Partner (20%)" };
    if (v >= 30000) return { p: 4500, r: "Director Partner (Fijo $4,500)" };
    if (v >= 15000) return { p: 1500, r: "Asociado Partner (Fijo $1,500)" };
    return { p: 0, r: "Socio Activo" };
}

// DASHBOARD
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`
        <body style="font-family:sans-serif; background:#f4f7f6; padding:20px;">
            <div style="max-width:900px; margin:auto; background:white; padding:30px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <h1 style="color:#1a237e;">Raízoma: Cuenta Madre</h1>
                <a href="/unete" style="background:#2ecc71; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; float:right; font-weight:bold;">+ NUEVO SOCIO</a>
                <br><br><hr>
                <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                    <tr style="text-align:left; background:#f8fafc; color:#64748b; font-size:12px;">
                        <th style="padding:10px;">SOCIO / DIRECCIÓN</th>
                        <th>VOLUMEN</th>
                        <th>GANANCIA GESTIÓN</th>
                    </tr>
                    ${rows ? rows.map(s => {
                        const b = calcularBono(s.volumen_red);
                        return `<tr>
                            <td style="padding:15px; border-bottom:1px solid #eee;">
                                <b>${s.nombre}</b><br><small style="color:#666;">📍 ${s.direccion}</small>
                            </td>
                            <td style="border-bottom:1px solid #eee;">$${s.volumen_red.toLocaleString()}</td>
                            <td style="border-bottom:1px solid #eee; color:#10b981; font-weight:bold;">
                                $${b.p.toLocaleString()}<br><small style="color:#3f51b5; font-size:10px;">${b.r}</small>
                            </td>
                        </tr>`;
                    }).join('') : ''}
                </table>
            </div>
        </body>`);
    });
});

// REGISTRO
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#1a237e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/reg" method="POST" style="background:white; padding:35px; border-radius:20px; width:380px;">
            <h2 style="color:#1a237e; margin:0 0 20px;">Registro Raízoma</h2>
            <input name="n" placeholder="Nombre Completo" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <textarea name="d" placeholder="Dirección de Envío" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required></textarea>
            <div style="background:#e8f5e9; border:1px dashed #2ecc71; padding:10px; font-size:11px; margin-bottom:15px; word-break:break-all;">
                <b>Wallet TRC20:</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <input name="v" type="number" placeholder="Monto enviado ($)" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <button type="submit" style="width:100%; padding:15px; background:#2ecc71; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">ENVIAR DATOS</button>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [req.body.n, req.body.d, req.body.v], () => res.redirect('/'));
});

// PUERTO: Render requiere que el servidor escuche en 0.0.0.0
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});