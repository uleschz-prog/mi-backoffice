const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// BASE DE DATOS ACTUALIZADA
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, patrocinador TEXT, plan TEXT, volumen REAL, hash TEXT, estado TEXT DEFAULT 'pendiente')");
});

// LÓGICA DE BONOS RAIZOMA MEJORADA
function calcularComision(plan, monto) {
    // Bono 1: 15% de Inicio Rápido
    const bonoInicio = monto * 0.15;
    
    // Bono 2: Gestión (Solo para Partner Fundador de $15,000)
    let bonoGestion = 0;
    if (monto >= 15000) {
        bonoGestion = 1500; 
    }
    
    return bonoInicio + bonoGestion;
}

// 1. DASHBOARD PRINCIPAL
app.get('/', (req, res) => {
    db.all("SELECT * FROM socios WHERE estado = 'aprobado'", (err, rows) => {
        const gananciaTotal = rows.reduce((acc, s) => acc + calcularComision(s.plan, s.volumen), 0);

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root { --bg: #0f172a; --card: #1e293b; --accent: #3b82f6; --text: #f8fafc; }
                body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; padding-bottom: 100px; }
                .dashboard { max-width: 600px; margin: auto; }
                .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 25px; border: 1px solid #334155; margin-top: 20px; }
                .nav-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(10px); padding: 15px 40px; border-radius: 30px; display: flex; gap: 50px; border: 1px solid #475569; }
                .nav-item { text-align: center; font-size: 11px; color: #94a3b8; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>Oficina <span style="color:var(--accent)">Raízoma</span></h1>
                <div class="card">
                    <div style="color:#94a3b8;">💰 Comisiones Acumuladas</div>
                    <div style="font-size:35px; font-weight:800; margin:10px 0;">$${gananciaTotal.toLocaleString()} <small style="font-size:14px;">MXN</small></div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px;">
                    <div class="card" style="padding:15px;"><h4>Socios</h4><div style="font-size:24px;">${rows.length}</div></div>
                    <div class="card" style="padding:15px;"><h4>Estatus</h4><div style="color:#2ecc71;">Activo</div></div>
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

// 2. REGISTRO CON DIRECCIÓN Y PLANES (PASO A PASO)
app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#0f172a; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; padding:20px;">
        <div style="background:#1e293b; padding:30px; border-radius:24px; width:100%; max-width:450px; border:1px solid #334155;">
            <h2 style="text-align:center; margin-bottom:25px;">Nueva Inscripción</h2>
            <form action="/reg" method="POST">
                <label style="font-size:11px; color:#3b82f6;">INFORMACIÓN PERSONAL</label>
                <input name="n" placeholder="Nombre completo" style="width:100%; margin:8px 0 15px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:10px; color:white; box-sizing:border-box;" required>
                <input name="dir" placeholder="Dirección de envío completa" style="width:100%; margin-bottom:15px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:10px; color:white; box-sizing:border-box;" required>
                <input name="pat" placeholder="ID del Patrocinador" style="width:100%; margin-bottom:20px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:10px; color:white; box-sizing:border-box;" required>

                <label style="font-size:11px; color:#3b82f6;">SELECCIONA TU PLAN</label>
                <select name="plan_monto" style="width:100%; margin:8px 0 20px; padding:12px; background:#0f172a; border:1px solid #3b82f6; border-radius:10px; color:white;" required>
                    <option value="Membresía VIP|1750">Membresía VIP - $1,750 MXN</option>
                    <option value="Partner Fundador|15000">Partner Fundador - $15,000 MXN</option>
                </select>

                <label style="font-size:11px; color:#3b82f6;">PAGO USDT (TRC20)</label>
                <div style="background:#0f172a; padding:12px; border-radius:10px; border:1px dashed #2ecc71; margin:8px 0 15px; font-size:10px; word-break:break-all;">
                    <code>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</code>
                </div>
                <input name="hash" placeholder="Hash de Pago (TxID)" style="width:100%; margin-bottom:20px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:10px; color:white; box-sizing:border-box;" required>
                
                <button type="submit" style="width:100%; padding:16px; background:#3b82f6; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">FINALIZAR REGISTRO</button>
            </form>
        </div>
    </body>`);
});

app.post('/reg', (req, res) => {
    const [planNombre, monto] = req.body.plan_monto.split('|');
    db.run("INSERT INTO socios (nombre, direccion, patrocinador, plan, volumen, hash) VALUES (?,?,?,?,?,?)", 
    [req.body.n, req.body.dir, req.body.pat, planNombre, monto, req.body.hash], 
    () => res.send('<body style="background:#0f172a; color:white; text-align:center; padding:50px; font-family:sans-serif;"><h1>✅ Registro Enviado</h1><p>Estamos validando tu pago en la blockchain.</p><a href="/" style="color:#3b82f6;">Volver al Inicio</a></body>'));
});

// 3. PANEL ADMIN PARA VER DIRECCIONES Y APROBAR
app.get('/admin-raizoma', (req, res) => {
    db.all("SELECT rowid AS id, * FROM socios WHERE estado = 'pendiente'", (err, rows) => {
        res.send(`
        <body style="background:#0f172a; color:white; font-family:sans-serif; padding:20px;">
            <h2>Pendientes por Activar y Enviar</h2>
            <div style="overflow-x:auto;">
                <table border="1" style="width:100%; border-collapse:collapse; min-width:800px;">
                    <tr style="background:#1e293b;"><th>Nombre</th><th>Plan</th><th>Patrocinador</th><th>Dirección de Envío</th><th>Hash</th><th>Acción</th></tr>
                    ${rows.map(r => `
                        <tr>
                            <td>${r.nombre}</td>
                            <td>${r.plan}</td>
                            <td>${r.patrocinador}</td>
                            <td style="font-size:12px;">${r.direccion}</td>
                            <td><small>${r.hash}</small></td>
                            <td><a href="/aprobar/${r.id}" style="color:#2ecc71;">[APROBAR PAGO]</a></td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            <p><a href="/" style="color:white;">Volver al Dashboard</a></p>
        </body>`);
    });
});

app.get('/aprobar/:id', (req, res) => {
    db.run("UPDATE socios SET estado = 'aprobado' WHERE rowid = ?", [req.params.id], () => res.redirect('/admin-raizoma'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Raizoma V5 Listo'));