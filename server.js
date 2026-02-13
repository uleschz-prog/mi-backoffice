const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma-super-link-2026',
    resave: false,
    saveUninitialized: true
}));

const ADMIN_PASSWORD = "RAIZOMA_MASTER_ADMIN"; 
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        password TEXT,
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

function calcularBonos(monto) {
    const inicio = monto * 0.15;
    const gestion = (monto >= 15000) ? 1500 : 0;
    return { total: inicio + gestion, pv: monto / 1000 };
}

// --- LOGIN ---
app.get('/', (req, res) => {
    res.send(`
    <body style="background:#0b0e11; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0;">
        <div style="text-align:center; background:#181a20; padding:40px; border-radius:24px; border:1px solid #334155; width:320px;">
            <h1 style="color:#3b82f6; margin-bottom:30px;">Raízoma</h1>
            <form action="/login" method="POST">
                <input name="user" placeholder="Usuario" style="width:100%; padding:14px; margin-bottom:15px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white;" required>
                <input type="password" name="pass" placeholder="Contraseña" style="width:100%; padding:14px; margin-bottom:20px; background:#0b0e11; border:1px solid #334155; border-radius:12px; color:white;" required>
                <button style="width:100%; padding:16px; background:#3b82f6; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">ENTRAR</button>
            </form>
            <p style="font-size:12px; color:#94a3b8; margin-top:20px;">¿No tienes cuenta? <a href="/unete" style="color:#3b82f6; text-decoration:none;">Inscríbete aquí</a></p>
        </div>
    </body>`);
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === ADMIN_PASSWORD) {
        req.session.admin = true;
        return res.redirect('/codigo-1-panel');
    }
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) { req.session.socio = row; res.redirect('/dashboard'); } 
        else { res.send('Error. <a href="/">Reintentar</a>'); }
    });
});

// --- BACKOFFICE CON LINK DE REFERIDO ---
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;
    const refLink = `${req.protocol}://${req.get('host')}/unete?ref=${s.usuario}`;

    db.all("SELECT * FROM socios WHERE patrocinador = ?", [s.usuario], (err, equipo) => {
        const bonos = s.estado === 'aprobado' ? calcularBonos(s.volumen) : { total: 0, pv: 0 };
        res.send(`
        <body style="background:#0b0e11; color:white; font-family:sans-serif; padding:20px;">
            <div style="max-width:600px; margin:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Hola, ${s.nombre}</h3>
                    <a href="/logout" style="color:#ef4444; text-decoration:none; font-size:12px;">Salir</a>
                </div>

                <div style="background:#1e293b; padding:15px; border-radius:15px; margin-bottom:20px; border:1px solid #3b82f6;">
                    <small style="color:#94a3b8;">Tu Enlace de Invitación:</small>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <input value="${refLink}" id="refLink" readonly style="flex:1; background:#0b0e11; border:1px solid #334155; color:#3b82f6; padding:8px; border-radius:8px; font-size:11px;">
                        <button onclick="copyLink()" style="background:#3b82f6; color:white; border:none; border-radius:8px; padding:0 15px; cursor:pointer; font-size:11px;">Copiar</button>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg, #1e293b, #0f172a); padding:30px; border-radius:24px; border:1px solid #334155; margin-bottom:20px;">
                    <small style="color:#94a3b8;">Comisiones Raízoma</small>
                    <div style="font-size:38px; font-weight:bold; margin:10px 0;">$${bonos.total.toLocaleString()}</div>
                    <div style="font-size:12px; color:${s.estado === 'aprobado' ? '#2ecc71' : '#f1c40f'}">ESTATUS: ${s.estado.toUpperCase()}</div>
                </div>

                <h4 style="color:#3b82f6;">Mi Equipo Directo (${equipo.length})</h4>
                <div style="background:#181a20; border-radius:18px; border:1px solid #334155; overflow:hidden;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <tr style="background:#1e293b; color:#94a3b8;"><th style="padding:12px; text-align:left;">Socio</th><th>Plan</th><th>Estatus</th></tr>
                        ${equipo.map(e => `
                            <tr style="border-bottom:1px solid #334155;">
                                <td style="padding:12px;">${e.nombre}</td>
                                <td style="text-align:center;">${e.plan}</td>
                                <td style="text-align:center; color:${e.estado === 'aprobado' ? '#2ecc71' : '#f1c40f'}">${e.estado}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
            <script>
                function copyLink() {
                    var copyText = document.getElementById("refLink");
                    copyText.select();
                    document.execCommand("copy");
                    alert("¡Enlace copiado! Envíalo a tu nuevo socio.");
                }
            </script>
        </body>`);
    });
});

// --- REGISTRO CON AUTO-REFERIDO ---
app.get('/unete', (req, res) => {
    const patrocinadorSug = req.query.ref || '';
    res.send(`
    <body style="background:#0b0e11; color:white; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px;">
        <form action="/reg" method="POST" style="background:#181a20; padding:35px; border-radius:24px; width:100%; max-width:400px; border:1px solid #334155;">
            <h2 style="text-align:center;">Nueva Inscripción</h2>
            <input name="user" placeholder="Usuario (ID único)" style="width:100%; margin-bottom:10px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;" required>
            <input type="password" name="pass" placeholder="Contraseña" style="width:100%; margin-bottom:20px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;" required>
            <input name="n" placeholder="Nombre completo" style="width:100%; margin-bottom:10px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;" required>
            <input name="dir" placeholder="Dirección de envío" style="width:100%; margin-bottom:10px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;" required>
            <input name="pat" placeholder="Usuario Patrocinador" value="${patrocinadorSug}" style="width:100%; margin-bottom:10px; padding:12px; background:#0b0e11; border:1px solid #3b82f6; border-radius:10px; color:white;" required>
            <select name="plan_monto" style="width:100%; margin-bottom:15px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;">
                <option value="VIP|1750">Membresía VIP - $1,750</option>
                <option value="Partner|15000">Partner Fundador - $15,000</option>
            </select>
            <input name="hash" placeholder="Hash de Pago (TxID)" style="width:100%; margin-bottom:20px; padding:12px; background:#0b0e11; border:1px solid #334155; border-radius:10px; color:white;" required>
            <button type="submit" style="width:100%; padding:18px; background:#3b82f6; color:white; border:none; border-radius:14px; font-weight:bold; cursor:pointer;">FINALIZAR INSCRIPCIÓN</button>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    const [plan, monto] = req.body.plan_monto.split('|');
    db.run("INSERT INTO socios (usuario, password, nombre, direccion, patrocinador, plan, volumen, hash, fecha) VALUES (?,?,?,?,?,?,?,?,?)", 
    [req.body.user, req.body.pass, req.body.n, req.body.dir, req.body.pat, plan, monto, req.body.hash, new Date().toLocaleDateString()], 
    () => res.send('<body style="background:#0b0e11; color:white; text-align:center; padding-top:100px;"><h2>¡Socio Registrado!</h2><a href="/" style="color:#3b82f6;">Regresar</a></body>'));
});

// --- PANEL CÓDIGO 1 ---
app.get('/codigo-1-panel', (req, res) => {
    if (!req.session.admin) return res.redirect('/');
    db.all("SELECT * FROM socios", (err, rows) => {
        res.send(`
        <body style="background:#0b0e11; color:white; font-family:sans-serif; padding:20px;">
            <h2>Admin Master: Control de Red</h2>
            <table border="1" style="width:100%; border-collapse:collapse; background:#181a20; font-size:12px;">
                <tr style="background:#334155;"><th>Usuario</th><th>Socio</th><th>Patrocinador</th><th>Plan</th><th>Acción</th></tr>
                ${rows.map(r => `
                <tr>
                    <td style="padding:10px;">${r.usuario}</td>
                    <td>${r.nombre}<br><small>${r.direccion}</small></td>
                    <td>${r.patrocinador}</td>
                    <td>${r.plan} ($${r.volumen})</td>
                    <td>${r.estado === 'pendiente' ? `<a href="/activar/${r.id}" style="color:#3b82f6;">[APROBAR]</a>` : '✅ ACTIVO'}</td>
                </tr>`).join('')}
            </table>
            <br><a href="/logout" style="color:white;">Salir</a>
        </body>`);
    });
});

app.get('/activar/:id', (req, res) => {
    if (!req.session.admin) return res.send('No');
    db.run("UPDATE socios SET estado = 'aprobado' WHERE id = ?", [req.params.id], () => res.redirect('/codigo-1-panel'));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Raízoma V10: Link de Referencia Activo'));