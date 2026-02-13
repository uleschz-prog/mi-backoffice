const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// BASE DE DATOS PROFESIONAL (Añadido campo 'hash' y 'estado')
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, volumen REAL, hash TEXT, estado TEXT DEFAULT 'pendiente')");
});

// LÓGICA DE BONOS RAIZOMA (15% Inicio + Gestión)
function calcularTodo(v) {
    const bonoInicio = v * 0.15;
    let bonoGestion = 0;
    let rango = "Socio Activo";
    
    if (v >= 60000) { bonoGestion = v * 0.20; rango = "Senior Partner"; }
    else if (v >= 30000) { bonoGestion = 4500; rango = "Director Partner"; }
    else if (v >= 15000) { bonoGestion = 1500; rango = "Asociado Partner"; }
    
    return { total: bonoInicio + bonoGestion, rango: rango };
}

// 1. DASHBOARD PRINCIPAL (VISTA DE SOCIO)
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios WHERE estado = 'aprobado'", (err, rows) => {
        const stats = rows.reduce((acc, s) => {
            const c = calcularTodo(s.volumen);
            return { vol: acc.vol + s.volumen, gan: acc.gan + c.total };
        }, { vol: 0, gan: 0 });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root { --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; --text: #f8fafc; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; padding-bottom: 100px; }
                .dashboard { max-width: 800px; margin: auto; }
                .ganancias-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; border: 1px solid #334155; margin-top: 20px; }
                .amount { font-size: 38px; font-weight: 800; color: white; margin: 10px 0; }
                .residual-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px; }
                .stat-box { background: var(--card); padding: 20px; border-radius: 18px; border: 1px solid #334155; }
                .nav-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(10px); padding: 15px 40px; border-radius: 30px; display: flex; gap: 50px; border: 1px solid #475569; }
                .nav-item { text-align: center; font-size: 11px; color: #94a3b8; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1 style="font-size:22px;">Mi Oficina <span style="color:var(--accent)">Raízoma</span></h1>
                <div class="ganancias-card">
                    <div style="color:#94a3b8; font-size:14px;">💰 Disponible (Bonos 1 y 2)</div>
                    <div class="amount">$${stats.gan.toLocaleString()}</div>
                    <a href="#" style="color:var(--accent); text-decoration:none; font-weight:bold; font-size:14px;">Solicitar Retiro ></a>
                </div>
                <div class="residual-grid">
                    <div class="stat-box"><small style="color:#94a3b8">Socios Activos</small><div style="font-size:22px; font-weight:700;">${rows.length}</div></div>
                    <div class="stat-box"><small style="color:#94a3b8">Volumen PV</small><div style="font-size:22px; font-weight:700;">${stats.vol / 1000} PV</div></div>
                </div>
                <div class="nav-bar">
                    <a href="/" class="nav-item" style="color:white;">🏠<br>Inicio</a>
                    <a href="/unete" class="nav-item">👤<br>Registrar</a>
                </div>
            </div>
        </body>
        </html>`);
    });
});

// 2. PASARELA DE PAGO (ÚNETE)
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#0f172a; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; padding:20px;">
        <div style="background:#1e293b; padding:35px; border-radius:24px; width:100%; max-width:400px; border:1px solid #334155;">
            <h2 style="text-align:center; margin-top:0;">Activar Cuenta</h2>
            <form action="/reg" method="POST">
                <input name="n" placeholder="Nombre completo" style="width:100%; margin-bottom:15px; padding:14px; background:#0f172a; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                <div style="background:#0f172a; padding:15px; border-radius:12px; border:1px dashed #3b82f6; margin-bottom:15px; font-size:11px;">
                    <span style="color:#94a3b8;">DEPÓSITO USDT (TRC20):</span><br>
                    <code style="color:#2ecc71;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</code>
                </div>
                <input name="v" type="number" placeholder="Monto ($)" style="width:100%; margin-bottom:15px; padding:14px; background:#0f172a; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                <input name="hash" placeholder="Hash de Pago (TxID)" style="width:100%; margin-bottom:20px; padding:14px; background:#0f172a; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                <button type="submit" style="width:100%; padding:18px; background:#3b82f6; color:white; border:none; border-radius:14px; font-weight:bold; cursor:pointer;">ENVIAR VERIFICACIÓN</button>
            </form>
        </div>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios (nombre, volumen, hash) VALUES (?,?,?)", [req.body.n, req.body.v, req.body.hash], () => res.send('<h1>Pago Enviado</h1><p>Tu cuenta será activada tras verificar el Hash.</p><a href="/">Volver</a>'));
});

// 3. PANEL DE ADMIN SECRETO (Para aprobar pagos)
app.get('/admin-raizoma', (req, res) => {
    db.all("SELECT rowid AS id, * FROM socios WHERE estado = 'pendiente'", (err, rows) => {
        res.send(`
        <body style="background:#0f172a; color:white; font-family:sans-serif; padding:20px;">
            <h2>Panel de Control: Validar Pagos</h2>
            <table border="1" style="width:100%; border-collapse:collapse;">
                <tr><th>Nombre</th><th>Monto</th><th>Hash (TxID)</th><th>Acción</th></tr>
                ${rows.map(r => `
                    <tr>
                        <td>${r.nombre}</td>
                        <td>$${r.volumen}</td>
                        <td><small>${r.hash}</small></td>
                        <td><a href="/aprobar/${r.id}" style="color:#2ecc71;">[APROBAR]</a></td>
                    </tr>
                `).join('')}
            </table>
        </body>`);
    });
});

app.get('/aprobar/:id', (req, res) => {
    db.run("UPDATE socios SET estado = 'aprobado' WHERE rowid = ?", [req.params.id], () => res.redirect('/admin-raizoma'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Raizoma Master V4 Online'));