const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// Base de datos profesional
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, volumen REAL)");
});

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        const totalVolumen = rows.reduce((acc, curr) => acc + curr.volumen, 0);
        // PV es Volumen / 1000 (simulado para el estilo de la imagen)
        const totalPV = totalVolumen / 1000; 

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root { --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; --text: #f8fafc; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
                .dashboard { max-width: 1000px; margin: auto; }
                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                
                /* Estilo de Tarjetas de Ganancias */
                .ganancias-card { background: var(--card); border-radius: 16px; padding: 25px; margin-bottom: 25px; border-left: 4px solid var(--accent); }
                .label { color: #94a3b8; font-size: 14px; display: flex; align-items: center; gap: 8px; }
                .amount { font-size: 32px; font-weight: 800; margin: 10px 0; }
                .retirar { color: var(--accent); text-decoration: none; font-size: 14px; font-weight: bold; }

                /* Grid de Bono Residual */
                .residual-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                .stat-box { background: var(--card); padding: 20px; border-radius: 16px; position: relative; }
                .stat-box h4 { margin: 0; color: #94a3b8; font-size: 13px; font-weight: 400; }
                .stat-val { font-size: 24px; font-weight: 700; margin-top: 10px; }
                
                .nav-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; padding: 10px 30px; border-radius: 20px; display: flex; gap: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .nav-item { text-align: center; font-size: 10px; color: #94a3b8; text-decoration: none; }
                .active { color: white; }
                .btn-add { background: var(--accent); color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <a href="/unete" class="btn-add">+ REGISTRAR</a>
                
                <div class="section-title">Tus Ganancias</div>
                <div class="ganancias-card">
                    <div class="label">💰 Disponible</div>
                    <div class="amount">$${(totalVolumen * 0.1).toLocaleString()}.<small>00</small></div>
                    <a href="#" class="retirar">Retirar ></a>
                </div>

                <div class="section-title">Tu Bono Residual</div>
                <div class="residual-grid">
                    <div class="stat-box"><h4>Total Activos</h4><div class="stat-val">${rows.length}</div></div>
                    <div class="stat-box"><h4>Total Nuevos</h4><div class="stat-val">${rows.filter(r => r.volumen > 0).length}</div></div>
                    <div class="stat-box"><h4>Total Volumen PV</h4><div class="stat-val">${totalPV} <small style="font-size:12px; color:#94a3b8;">PV</small></div></div>
                    <div class="stat-box"><h4>Volumen Extras PV</h4><div class="stat-val">0 <small style="font-size:12px; color:#94a3b8;">PV</small></div></div>
                </div>

                <div class="nav-bar">
                    <a href="/" class="nav-item active">🏠<br>Mi Oficina</a>
                    <a href="/unete" class="nav-item">👤<br>Registrar</a>
                </div>
            </div>
        </body>
        </html>
        `);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#0f172a; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/reg" method="POST" style="background:#1e293b; padding:35px; border-radius:20px; width:320px;">
            <h2 style="margin-top:0;">Nuevo Registro</h2>
            <input name="n" placeholder="Nombre" style="width:100%; margin-bottom:15px; padding:12px; background:#0f172a; border:none; border-radius:10px; color:white;" required>
            <input name="v" type="number" placeholder="Monto ($)" style="width:100%; margin-bottom:20px; padding:12px; background:#0f172a; border:none; border-radius:10px; color:white;" required>
            <button type="submit" style="width:100%; padding:15px; background:#3b82f6; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">ACTIVAR CUENTA</button>
            <br><br><a href="/" style="color:#94a3b8; text-decoration:none; font-size:12px; display:block; text-align:center;">Volver al Dashboard</a>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios (nombre, volumen) VALUES (?,?)", [req.body.n, req.body.v], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Dashboard Raizoma OK'));