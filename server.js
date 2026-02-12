// VERSION FINAL CORREGIDA - RAIZOMA
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

// Lógica de Comisiones topadas (Plan de Recompensas)
function calcularBono(vol) {
    if (vol >= 60000) return vol * 0.20; [cite_start]// Senior Managing Partner [cite: 194]
    if (vol >= 30000) return 4500;       [cite_start]// Director Partner (15% de 30k) [cite: 194]
    if (vol >= 15000) return 1500;       [cite_start]// Asociado Partner (10% de 15k) [cite: 194]
    return 0;
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        res.send(`
        <html><body style="font-family:sans-serif; background:#f5f7fa; padding:40px;">
            <div style="background:white; padding:25px; border-radius:15px; max-width:800px; margin:auto;">
                <a href="/unete" style="float:right; background:#1a237e; color:white; padding:10px; text-decoration:none; border-radius:5px;">+ Nuevo Socio</a>
                <h1>Cuenta Madre Raízoma</h1>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="text-align:left;"><th>Socio</th><th>Volumen</th><th>Bono</th></tr>
                    ${rows.map(s => `
                        <tr>
                            <td style="padding:10px; border-bottom:1px solid #eee;"><b>${s.nombre}</b><br><small>${s.direccion}</small></td>
                            <td>$${s.volumen_red.toLocaleString()}</td>
                            <td style="color:green; font-weight:bold;">$${calcularBono(s.volumen_red).toLocaleString()}</td>
                        </tr>`).join('')}
                </table>
            </div>
        </body></html>`);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
    <html><body style="font-family:sans-serif; background:#1a237e; display:flex; justify-content:center; padding-top:50px;">
        <form action="/registrar" method="POST" style="background:white; padding:30px; border-radius:15px; width:350px;">
            <h2>Registro de Socio</h2>
            <input name="nom" placeholder="Nombre" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <textarea name="dir" placeholder="Dirección de Envío" style="width:100%; margin-bottom:10px; padding:10px;" required></textarea>
            <input name="vol" type="number" placeholder="Inversión Inicial ($)" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <button type="submit" style="width:100%; padding:10px; background:#2ecc71; color:white; border:none; cursor:pointer;">REGISTRAR</button>
        </form>
    </body></html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, vol } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nom, dir, vol], () => res.redirect('/'));
});

// ESCUCHA DE PUERTO PARA RENDER
app.listen(process.env.PORT || 10000);