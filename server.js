const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// BASE DE DATOS TOTAL (Mantiene TODO lo anterior + nuevos campos)
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE socios (
        nombre TEXT, 
        direccion TEXT, 
        patrocinador TEXT, 
        plan TEXT, 
        volumen REAL, 
        hash TEXT, 
        estado TEXT DEFAULT 'pendiente',
        fecha TEXT
    )`);
});

// LÓGICA DE BONOS INTEGRADA (Bono 1: 15% + Bono 2: Gestión)
function calcularBonos(monto) {
    const bonoInicio = monto * 0.15;
    let bonoGestion = 0;
    let rango = "Socio Activo";

    if (monto >= 15000) {
        bonoGestion = 1500;
        rango = "Partner Fundador";
    } else if (monto >= 1750) {
        rango = "Membresía VIP";
    }
    
    return { 
        total: bonoInicio + bonoGestion, 
        inicio: bonoInicio, 
        gestion: bonoGestion, 
        rango: rango,
        pv: monto / 1000 
    };
}

// 1. DASHBOARD PROFESIONAL (Mantiene el diseño que te encantó)
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios WHERE estado = 'aprobado'", (err, rows) => {
        const stats = rows.reduce((acc, s) => {
            const c = calcularBonos(s.volumen);
            return {
                vol: acc.vol + s.volumen,
                gan: acc.gan + c.total,
                pv: acc.pv + c.pv,
                nuevos: acc.nuevos + (s.plan === 'Partner Fundador' ? 1 : 0)
            };
        }, { vol: 0, gan: 0, pv: 0, nuevos: 0 });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root { --bg: #0b0e11; --card: #181a20; --accent: #3b82f6; --text: #eaecef; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; padding-bottom: 100px; }
                .dashboard { max-width: 800px; margin: auto; }
                .ganancias-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; border: 1px solid #334155; margin-bottom: 25px; }
                .residual-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .stat-box { background: var(--card); padding: 20px; border-radius: 18px; border: 1px solid #334155; }
                .nav-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(24, 26, 32, 0.9); backdrop-filter: blur(10px); padding: 15px 40px; border-radius: 30px; display: flex; gap: 50px; border: 1px solid #475569; }
                .nav-item { text-align: center; font-size: 11px; color: #94a3b8; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h2 style="font-size:20px; margin-bottom:20px;">Oficina <span style="color:var(--accent)">Raízoma</span></h2>
                
                <div style="color:#94a3b8; font-size:14px; margin-bottom:10px;">Tus Ganancias</div>
                <div class="ganancias-card">
                    <div style="color:#94a3b8; font-size:14px;">💰 Disponible</div>
                    <div style="font-size:38px; font-weight:800; color:white; margin:10px 0;">$${stats.gan.toLocaleString()}.<small>00</small></div>
                    <a href="#" style="color:var(--accent); text-decoration:none; font-weight:bold; font-size:14px;">Retirar ></a>
                </div>

                <div style="color:#94a3b8; font-size:14px; margin-bottom:10px;">Tu Bono Residual</div>
                <div class="residual-grid">
                    <div class="stat-box"><small style="color:#94a3b8">Total Activos</small><div style="font-size:24px; font-weight:700;">${rows.length}</div></div>
                    <div class="stat-box"><small style="color:#94a3b8">Total Nuevos</small><div style="font-size:24px; font-weight:700;">${stats.nuevos}</div></div>
                    <div class="stat-box"><small style="color:#94a3b8">Total Volumen PV</small><div style="font-size:24px; font-weight:700;">${stats.pv} <small style="font-size:12px; color:#94a3b8;">PV</small></div></div>
                    <div class="stat-box"><small style="color:#94a3b8">Estatus</small><div style="font-size:18px; color:#2ecc71; font-weight:bold;">ACTIVO ✅</div></div>
                </div>

                <div class="nav-bar">
                    <a href="/" class="nav-item" style="color:white;">🏠<br>Mi Oficina</a>
                    <a href="/unete" class="nav-item">👤<br>Registrar</a>
                </div>
            </div>
        </body>
        </html>`);
    });
});

// 2. REGISTRO COMPLETO (Dirección, Patrocinador y Planes Fijos)
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#0b0e11; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; padding:20px;">
        <div style="background:#181a20; padding:35px; border-radius:24px; width:100%; max-width:420px; border:1px solid #334155;">
            <h2 style="text-align:center; margin-top:0;">Inscripción Raízoma</h2>
            <form action="/reg" method="POST">
                <input name="n" placeholder="Nombre completo" style="width:100%; margin-bottom:15px; padding:14px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                <input name="dir" placeholder="Dirección de envío completa" style="width:100%; margin-bottom:15px; padding:14px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                <input name="pat" placeholder="ID de Patrocinador" style="width:100%; margin-bottom:15px; padding:14px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                
                <label style="font-size:12px; color:var(--accent);">SELECCIONA TU PLAN:</label>
                <select name="plan_monto" style="width:100%; margin:10px 0 20px; padding:14px; background:#0b0e11; border:1px solid #3b82f6; border-radius:12px; color:white;" required>
                    <option value="Membresía VIP|1750">Membresía VIP - $1,750 MXN</option>
                    <option value="Partner Fundador|15000">Partner Fundador - $15,000 MXN</option>
                </select>

                <div style="background:#0b0e11; padding:15px; border-radius:12px; border:1px dashed #2ecc71; margin-bottom:15px; font-size:10px;">
                    <span style="color:#94a3b8;">USDT TRC20:</span><br>
                    <code style="color:#2ecc71;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</code>
                </div>
                <input name="hash" placeholder="Hash de Pago (TxID)" style="width:100%; margin-bottom:20px; padding:14px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white; box-sizing:border-box;" required>
                
                <button type="submit" style="width:100%; padding:18px; background:#3b82f6; color:white; border:none; border-radius:14px; font-weight:bold; cursor:pointer;">ENVIAR REGISTRO</button>
            </form>
        </div>
    </body>`);
});

app.post('/reg', (req, res) => {
    const [plan, monto] = req.body.plan_monto.split('|');
    db.run("INSERT INTO socios (nombre, direccion, patrocinador, plan, volumen, hash, fecha) VALUES (?,?,?,?,?,?,?)", 
    [req.body.n, req.body.dir, req.body.pat, plan, monto, req.body.hash, new Date().toLocaleDateString()], 
    () => res.send('<body style="background:#0b0e11; color:white; text-align:center; padding-top:100px; font-family:sans-serif;"><h1>✅ ¡Listo!</h1><p>Tu pago está siendo verificado.</p><a href="/" style="color:#3b82f6;">Regresar</a></body>'));
});

// 3. ADMIN PRIVADO (Ver direcciones y activar bonos)
app.get('/admin-raizoma', (req, res) => {
    db.all("SELECT rowid AS id, * FROM socios WHERE estado = 'pendiente'", (err, rows) => {
        res.send(`
        <body style="background:#0b0e11; color:white; font-family:sans-serif; padding:20px;">
            <h2>Panel de Activación Raízoma</h2>
            <table border="1" style="width:100%; border-collapse:collapse; background:#181a20;">
                <tr><th>Socio</th><th>Plan</th><th>Dirección de Envío</th><th>Hash</th><th>Acción</th></tr>
                ${rows.map(r => `
                    <tr>
                        <td>${r.nombre}<br><small>Patr: ${r.patrocinador}</small></td>
                        <td>$${r.volumen}</td>
                        <td style="font-size:11px;">${r.direccion}</td>
                        <td><small>${r.hash}</small></td>
                        <td><a href="/aprobar/${r.id}" style="color:#2ecc71;">[APROBAR]</a></td>
                    </tr>
                `).join('')}
            </table>
            <br><a href="/" style="color:white;">Dashboard</a>
        </body>`);
    });
});

app.get('/aprobar/:id', (req, res) => {
    db.run("UPDATE socios SET estado = 'aprobado' WHERE rowid = ?", [req.params.id], () => res.redirect('/admin-raizoma'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Sistema Raízoma 100% Completo'));