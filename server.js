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

// Lógica de Negocio: Bonos de Gestión [cite: 194]
function calcularBono(vol) {
    if (vol >= 60000) return vol * 0.20; // Senior: 20% Real [cite: 194]
    if (vol >= 30000) return 4500;       // Director: Fijo 15% de 30k [cite: 194]
    if (vol >= 15000) return 1500;       // Asociado: Fijo 10% de 15k [cite: 194]
    return 0;
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        res.send(`
        <html>
        <head>
            <style>
                body { font-family: sans-serif; background: #f5f7fa; padding: 40px; }
                .card { background: white; padding: 25px; border-radius: 15px; max-width: 800px; margin: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
                .btn { background: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; float: right; }
            </style>
        </head>
        <body>
            <div class="card">
                <a href="/unete" class="btn">+ Nuevo Socio</a>
                <h1>Cuenta Madre</h1>
                <table>
                    <tr><th>Socio / Dirección</th><th>Volumen</th><th>Bono Proyectado</th></tr>
                    ${rows.map(s => `
                        <tr>
                            <td><b>${s.nombre}</b><br><small>${s.direccion}</small></td>
                            <td>$${s.volumen_red.toLocaleString()}</td>
                            <td style="color:green; font-weight:bold;">$${calcularBono(s.volumen_red).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </body>
        </html>`);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
    <html>
    <body style="font-family:sans-serif; background:#1a237e; display:flex; justify-content:center; align-items:center; height:100vh;">
        <form action="/registrar" method="POST" style="background:white; padding:30px; border-radius:15px; width:350px;">
            <h2>Registro Raízoma</h2>
            <input name="nom" placeholder="Nombre" style="width:100%; margin-bottom:10px; padding:8px;" required>
            <textarea name="dir" placeholder="Dirección de Envío" style="width:100%; margin-bottom:10px; padding:8px;" required></textarea>
            <input name="vol" type="number" placeholder="Volumen Inicial ($)" style="width:100%; margin-bottom:10px; padding:8px;" required>
            <p style="font-size:10px; color:gray;">Wallet TRC20: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</p>
            <button type="submit" style="width:100%; padding:10px; background:#2ecc71; color:white; border:none; border-radius:5px;">REGISTRAR</button>
        </form>
    </body>
    </html>`);
});

app.post('/registrar', (req, res) => {
    const { nom, dir, vol } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [nom, dir, vol], () => {
        res.redirect('/');
    });
});

// CAMBIO CRÍTICO: Dejar que Render asigne el puerto automáticamente
app.listen(process.env.PORT || 10000);