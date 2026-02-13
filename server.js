const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Configuración básica
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Base de Datos (Persistente en Render o Local en Mac)
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/var/lib/data/raizoma_sistema.db' 
    : path.join(__dirname, 'raizoma_sistema.db');
const db = new sqlite3.Database(dbPath);

// Crear tabla de socios con los campos de tu presentación
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        direccion TEXT,
        volumen_red INTEGER DEFAULT 0,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- MOTOR DE COMISIONES (Lógica de Diapositivas) ---
function calcularBonoGestion(vol) {
    // Si el volumen es 60,000 o más -> 20% de lo generado en el mes
    if (vol >= 60000) return vol * 0.20; 
    // Si está entre 30,000 y 59,999 -> Fijo $4,500 (15% de 30k)
    if (vol >= 30000) return 4500;            
    // Si está entre 15,000 y 29,999 -> Fijo $1,500 (10% de 15k)
    if (vol >= 15000) return 1500;            
    // Menos de 15,000 no califica para Bono de Gestión
    return 0;
}

// --- VISTA PRINCIPAL: CUENTA MADRE ---
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        const totalVolumen = rows.reduce((sum, s) => sum + s.volumen_red, 0);
        
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Raízoma | Cuenta Madre</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                :root { --p: #1a237e; --s: #2ecc71; --txt: #334155; }
                body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: var(--txt); margin: 0; padding: 20px; }
                .container { max-width: 1000px; margin: auto; }
                .header { background: var(--p); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 12px; color: #64748b; }
                td { padding: 15px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                .monto { font-weight: bold; color: var(--p); }
                .bono { color: var(--s); font-weight: bold; }
                .btn { background: var(--s); color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; }
                .badge { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1 style="margin:0;">Raízoma: Gestión de Red</h1>
                        <p style="margin:5px 0 0 0; opacity: 0.8;">Volumen Global: $${totalVolumen.toLocaleString()} MXN</p>
                    </div>
                    <a href="/unete" class="btn">+ Registrar Socio</a>
                </div>

                <div class="card">
                    <h3>Socios Activos y Logística de Envío</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>SOCIO / DIRECCIÓN</th>
                                <th>VOLUMEN DE RED</th>
                                <th>BONO DE GESTIÓN (3 NIV)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(s => `
                                <tr>
                                    <td>
                                        <div style="font-weight:bold; font-size:16px;">${s.nombre}</div>
                                        <div style="font-size:12px; color:#64748b; margin-top:4px;">📍 ${s.direccion}</div>
                                    </td>
                                    <td class="monto">$${s.volumen_red.toLocaleString()}</td>
                                    <td class="bono">$${calcularBonoGestion(s.volumen_red).toLocaleString()}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3" style="text-align:center; padding:40px; color:#94a3b8;">No hay socios registrados aún.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `);
    });
});

// --- RUTA TEMPORAL DE REGISTRO PARA PRUEBAS ---
app.get('/unete', (req, res) => {
    res.send(`
    <html><body style="font-family:sans-serif; background:#f1f5f9; display:flex; justify-content:center; align-items:center; height:100vh;">
        <form action="/add" method="POST" style="background:white; padding:30px; border-radius:15px; width:350px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
            <h2>Nuevo Socio</h2>
            <input name="n" placeholder="Nombre Completo" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <textarea name="d" placeholder="Dirección de Envío" style="width:100%; margin-bottom:10px; padding:10px;" required></textarea>
            <input name="v" type="number" placeholder="Volumen Mensual ($)" style="width:100%; margin-bottom:10px; padding:10px;" required>
            <button type="submit" style="width:100%; padding:10px; background:#1a237e; color:white; border:none; border-radius:5px; cursor:pointer;">Guardar en Red</button>
        </form>
    </body></html>`);
});

app.post('/add', (req, res) => {
    const { n, d, v } = req.body;
    db.run("INSERT INTO socios (nombre, direccion, volumen_red) VALUES (?,?,?)", [n, d, v], () => res.redirect('/'));
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Raízoma activo en puerto ${PORT}`));