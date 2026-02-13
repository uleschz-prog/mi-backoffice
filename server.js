const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, volumen REAL)");
});

// LÓGICA DE BONOS RAIZOMA
function calcularTodo(v) {
    // 1. Bono de Inicio Rápido (15%)
    const bonoInicio = v * 0.15;
    
    // 2. Bono de Gestión (Niveles)
    let bonoGestion = 0;
    let rango = "Socio Activo";
    
    if (v >= 60000) {
        bonoGestion = v * 0.20;
        rango = "Senior Managing Partner";
    } else if (v >= 30000) {
        bonoGestion = 4500;
        rango = "Director Partner";
    } else if (v >= 15000) {
        bonoGestion = 1500;
        rango = "Asociado Partner";
    }
    
    return { total: bonoInicio + bonoGestion, inicio: bonoInicio, gestion: bonoGestion, rango: rango };
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        const statsGlobales = rows.reduce((acc, s) => {
            const calculo = calcularTodo(s.volumen);
            return {
                vol: acc.vol + s.volumen,
                ganancia: acc.ganancia + calculo.total
            };
        }, { vol: 0, ganancia: 0 });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root { --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; --text: #f8fafc; --success: #2ecc71; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; padding-bottom: 100px; }
                .dashboard { max-width: 1000px; margin: auto; }
                .section-title { font-size: 16px; font-weight: bold; margin: 25px 0 15px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                
                .ganancias-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; border: 1px solid #334155; position: relative; overflow: hidden; }
                .ganancias-card::after { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: var(--accent); filter: blur(80px); opacity: 0.2; }
                .label { color: #94a3b8; font-size: 14px; margin-bottom: 10px; }
                .amount { font-size: 38px; font-weight: 800; color: white; }
                .retirar { color: var(--accent); text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block; margin-top: 15px; }

                .residual-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .stat-box { background: var(--card); padding: 20px; border-radius: 18px; border: 1px solid #334155; }
                .stat-box h4 { margin: 0; color: #94a3b8; font-size: 12px; }
                .stat-val { font-size: 22px; font-weight: 700; margin-top: 10px; }
                
                .nav-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(10px); padding: 15px 40px; border-radius: 30px; display: flex; gap: 50px; border: 1px solid #475569; }
                .nav-item { text-align: center; font-size: 11px; color: #94a3b8; text-decoration: none; }
                .active { color: var(--accent); font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h1 style="font-size:22px; margin:0;">Mi Oficina <span style="color:var(--accent)">Raízoma</span></h1>
                    <a href="/unete" style="background:var(--accent); color:white; padding:8px 16px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:13px;">+ NUEVO</a>
                </div>
                
                <div class="section-title">Tus Ganancias (Bono 1 + Bono 2)</div>
                <div class="ganancias-card">
                    <div class="label">💰 Disponible para Retiro</div>
                    <div class="amount">$${statsGlobales.ganancia.toLocaleString()}</div>
                    <a href="#" class="retirar">Solicitar Retiro ></a>
                </div>

                <div class="section-title">Tu Volumen de Red</div>
                <div class="residual-grid">
                    <div class="stat-box"><h4>Total Activos</h4><div class="stat-val">${rows.length}</div></div>
                    <div class="stat-box"><h4>Volumen Total</h4><div class="stat-val">$${statsGlobales.vol.toLocaleString()}</div></div>
                    <div class="stat-box"><h4>Puntos PV</h4><div class="stat-val">${statsGlobales.vol / 1000} <small style="color:#94a3b8">PV</small></div></div>
                    <div class="stat-box"><h4>Estatus</h4><div class="stat-val" style="font-size:14px; color:var(--success)">Activo ✅</div></div>
                </div>

                <div class="nav-bar">
                    <a href="/" class="nav-item active">🏠<br>Inicio</a>
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
        <form action="/reg" method="POST" style="background:#1e293b; padding:40px; border-radius:24px; width:300px; border:1px solid #334155;">
            <h2 style="margin-top:0; font-size:20px;">Alta de Socio</h2>
            <p style="font-size:12px; color:#94a3b8; margin-bottom:25px;">Registra el volumen para calcular bonos.</p>
            <input name="n" placeholder="Nombre" style="width:100%; margin-bottom:15px; padding:14px; background:#0f172a; border:1px solid #334155; border-radius:12px; color:white;" required>
            <input name="v" type="number" placeholder="Inversión ($)" style="width:100%; margin-bottom:20px; padding:14px; background:#0f172a; border:1px solid #334155; border-radius:12px; color:white;" required>
            <button type="submit" style="width:100%; padding:16px; background:#3b82f6; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">ACTIVAR SOCIO</button>
            <a href="/" style="color:#94a3b8; text-decoration:none; font-size:12px; display:block; text-align:center; margin-top:20px;">Cancelar</a>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios (nombre, volumen) VALUES (?,?)", [req.body.n, req.body.v], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Raizoma Pro Online'));