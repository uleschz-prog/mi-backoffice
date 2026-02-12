// ACTUALIZACION FORZADA RAIZOMA V2.1
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base de datos persistente para Render
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/raizoma.db' 
    : path.join(__dirname, 'raizoma.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red INTEGER DEFAULT 0
    )`);
});

// Lógica de Comisiones Raízoma (Escalones topados)
function calcularBono(vol) {
    if (vol >= 60000) return vol * 0.20; // Senior Managing Partner: 20% Real
    if (vol >= 30000) return 4500;       // Director Partner: Fijo 15% de 30k
    if (vol >= 15000) return 1500;       // Asociado Partner: Fijo 10% de 15k
    return 0;
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        res.send(`
        <html><body style="font-family:sans-serif; background:#f5f7fa; padding:40px;">
            <div style="background:white; padding:25px; border-radius:15px; max-width:800px; margin:auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <a href="/unete" style="float:right; background:#1a237e; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">+ Nuevo Socio</a>
                <h1 style="color:#1a237e;">Cuenta Madre Raízoma</h1>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="text-align:left; color:#666;"><th>Socio / Logística</th><th>Volumen</th><th>Bono Proyectado</th></tr>
                    ${rows.map(s => `
                        <tr>
                            <td style="padding:15px 0; border-bottom:1px solid #eee;">
                                <b>${s.nombre}</b><br><small style="color:#888;">${s.direccion}</small>
                            </td>
                            <td style="border-bottom:1px solid #eee;">$${s.volumen_red.toLocaleString()}</td>
                            <td style="color:#10b981; font-weight:bold; border-bottom:1px solid #eee;">$${calcularBono(s.volumen_red).toLocaleString()}</td>
                        </tr>`).join('') || '<tr><td colspan="3" style="padding:20px; text-align:center;">No hay socios registrados</td></tr>'}
                </table>
            </div>
        </body></html>`);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
    <html><body style="font-family:sans-serif; background:#1a237e; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/registrar" method="POST" style="background:white; padding:35px; border-radius:15px; width:380px;">
            <h2 style="color:#1a237e; margin-top:0;">Registro de Socio</h2>
            <label style="font-size:12px; color:#666;">Nombre Completo</label>
            <input name="nom" style="width:100%; margin-bottom:15px; padding:10px; border:1px solid #ddd; border-radius:5px;" required>
            <label style="font-size:12px; color:#666;">Dirección de Envío</label>
            <textarea name="dir" style="width:100%; margin-bottom:15px; padding:10px; border:1px solid #ddd; border-radius:5px;" rows="3" required></textarea>
            <label style="font-size:12px; color:#666;">Volumen de Compra ($)</label>
            <input name="vol" type="number" style="width:100%; margin-bottom:15px; padding:10px; border:1px solid #ddd; border-radius:5px;" required>
            <div style="background:#f0fdf4; border:1px dashed #22c55e; padding:10px; font-size:11px; margin-bottom:15px;">
                <b>Wallet TRC20:</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <button type="submit" style="width:100%; padding:12px; background:#2ecc71; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">CONFIRMAR REGISTRO</button>
        </form>
    </body></html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, vol } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nom, dir, vol], () => res.redirect('/'));
});

// Puerto dinámico para evitar error 502 en Render
app.listen(process.env.PORT || 10000);