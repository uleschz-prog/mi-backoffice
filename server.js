const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// Base de datos en memoria para velocidad y evitar errores de disco en Render
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, volumen REAL)");
});

// LÓGICA DE BONOS RAIZOMA
function obtenerBono(v) {
    if (v >= 60000) return { monto: v * 0.20, rango: "Senior Managing Partner (20%)" };
    if (v >= 30000) return { monto: 4500, rango: "Director Partner ($4,500)" };
    if (v >= 15000) return { monto: 1500, rango: "Asociado Partner ($1,500)" };
    return { monto: 0, rango: "Socio Activo" };
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        let tabla = rows.map(s => {
            const bono = obtenerBono(s.volumen);
            return `<tr>
                <td style="padding:10px; border-bottom:1px solid #ddd;"><b>${s.nombre}</b><br><small>${s.direccion}</small></td>
                <td style="padding:10px; border-bottom:1px solid #ddd;">$${s.volumen.toLocaleString()}</td>
                <td style="padding:10px; border-bottom:1px solid #ddd; color:green;"><b>$${bono.monto.toLocaleString()}</b><br><small>${bono.rango}</small></td>
            </tr>`;
        }).join('');

        res.send(`
            <body style="font-family:sans-serif; padding:40px; background:#f4f7f6;">
                <div style="max-width:800px; margin:auto; background:white; padding:30px; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h1 style="color:#1a237e;">Raízoma: Cuenta Madre</h1>
                    <a href="/unete" style="background:#2ecc71; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold; float:right;">+ NUEVO SOCIO</a>
                    <br><br><table style="width:100%; border-collapse:collapse; margin-top:20px;">
                        <tr style="text-align:left; background:#eee;"><th>Socio / Logística</th><th>Volumen</th><th>Bono Gestión</th></tr>
                        ${tabla || '<tr><td colspan="3" style="text-align:center; padding:20px;">No hay socios registrados</td></tr>'}
                    </table>
                </div>
            </body>
        `);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
        <body style="background:#1a237e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
            <form action="/reg" method="POST" style="background:white; padding:40px; border-radius:15px; width:300px;">
                <h2 style="color:#1a237e;">Registro Raízoma</h2>
                <input name="n" placeholder="Nombre completo" style="width:100%; margin-bottom:10px; padding:10px;" required>
                <textarea name="d" placeholder="Dirección de envío" style="width:100%; margin-bottom:10px; padding:10px;" required></textarea>
                <div style="background:#e8f5e9; padding:10px; font-size:11px; margin-bottom:10px; border:1px dashed green;">
                    <b>Wallet TRC20:</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
                </div>
                <input name="v" type="number" placeholder="Monto ($)" style="width:100%; margin-bottom:10px; padding:10px;" required>
                <button type="submit" style="width:100%; background:#2ecc71; color:white; border:none; padding:10px; font-weight:bold; cursor:pointer;">REGISTRAR</button>
            </form>
        </body>
    `);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios VALUES (?,?,?)", [req.body.n, req.body.d, req.body.v], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Servidor Raízoma en puerto ' + PORT));