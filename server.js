const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// Base de datos en memoria (Garantiza que Render no dé errores de escritura)
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, volumen REAL)");
});

// LÓGICA DE BONOS RAIZOMA (Basada en tu Plan de Negocios)
function calcularBono(v) {
    if (v >= 60000) return { p: v * 0.20, r: "Senior Managing Partner (20%)" };
    if (v >= 30000) return { p: 4500, r: "Director Partner (Fijo $4,500)" };
    if (v >= 15000) return { p: 1500, r: "Asociado Partner (Fijo $1,500)" };
    return { p: 0, r: "Socio Activo" };
}

// VISTA: CUENTA MADRE
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        const listado = rows.map(s => {
            const b = calcularBono(s.volumen);
            return `
            <tr>
                <td style="padding:15px; border-bottom:1px solid #eee;">
                    <b>${s.nombre}</b><br><small style="color:#666;">📍 ${s.direccion}</small>
                </td>
                <td style="padding:15px; border-bottom:1px solid #eee;">$${s.volumen.toLocaleString()}</td>
                <td style="padding:15px; border-bottom:1px solid #eee; color:#10b981;">
                    <b>$${b.p.toLocaleString()}</b><br><small style="color:#1a237e;">${b.r}</small>
                </td>
            </tr>`;
        }).join('');

        res.send(`
        <body style="font-family:sans-serif; background:#f4f7f6; padding:40px;">
            <div style="max-width:900px; margin:auto; background:white; padding:40px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                <h1 style="color:#1a237e; margin:0;">Raízoma: Backoffice</h1>
                <p style="color:#64748b;">Gestión de Red y Bonos de Gestión</p>
                <a href="/unete" style="background:#2ecc71; color:white; padding:12px 25px; border-radius:10px; text-decoration:none; float:right; font-weight:bold;">+ REGISTRAR SOCIO</a>
                <br><br><table style="width:100%; border-collapse:collapse; margin-top:30px;">
                    <tr style="text-align:left; background:#f8fafc; color:#64748b;">
                        <th style="padding:10px;">SOCIO / LOGÍSTICA</th>
                        <th>VOLUMEN</th>
                        <th>BONO ASIGNADO</th>
                    </tr>
                    ${listado || '<tr><td colspan="3" style="text-align:center; padding:40px; color:#94a3b8;">No hay socios registrados.</td></tr>'}
                </table>
            </div>
        </body>`);
    });
});

// VISTA: REGISTRO DE SOCIOS
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#1a237e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/reg" method="POST" style="background:white; padding:40px; border-radius:20px; width:350px;">
            <h2 style="color:#1a237e; margin-bottom:25px; text-align:center;">Alta de Socio</h2>
            <input name="n" placeholder="Nombre completo" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <textarea name="d" placeholder="Dirección de envío completa" style="width:100%; margin-bottom:15px; padding:12px; border:1px solid #ddd; border-radius:8px;" required></textarea>
            <div style="background:#e8f5e9; padding:15px; border-radius:10px; font-size:12px; margin-bottom:15px; border:1px dashed #2ecc71;">
                <b>PAGO USDT (TRC20):</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <input name="v" type="number" placeholder="Monto enviado ($)" style="width:100%; margin-bottom:20px; padding:12px; border:1px solid #ddd; border-radius:8px;" required>
            <button type="submit" style="width:100%; padding:15px; background:#2ecc71; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">ACTIVAR SOCIO</button>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios VALUES (?,?,?)", [req.body.n, req.body.d, req.body.v], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Raizoma Live on Port ' + PORT));