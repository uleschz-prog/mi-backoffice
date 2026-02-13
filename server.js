const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// 1. PERSISTENCIA Y BASE DE DATOS (Las 16 Variables)
const dirData = '/data';
if (!fs.existsSync(dirData)) { fs.mkdirSync(dirData); }
const db = new sqlite3.Database(path.join(dirData, 'raizoma_vmax.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, usuario TEXT UNIQUE, password TEXT, 
        whatsapp TEXT, fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP, patrocinador_id TEXT,
        plan TEXT, hash_pago TEXT, direccion TEXT, estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0, puntos INTEGER DEFAULT 0, volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0, solicitud_retiro TEXT DEFAULT 'no', detalles_retiro TEXT
    )`);
    // Cuenta Maestro
    db.run("INSERT OR IGNORE INTO socios (nombre, usuario, password, estado, plan) VALUES ('Admin Maestro', 'ADMINRZ', 'ROOT', 'activo', 'MASTER')");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'rz-master-2026', resave: true, saveUninitialized: true }));

// 2. DISEÑO DEL PANEL ADMINISTRATIVO
const cssAdmin = `<style>
    body { background: #0b0f19; color: #f8fafc; font-family: sans-serif; padding: 20px; }
    .container { max-width: 1100px; margin: auto; }
    .card { background: #161d2f; border: 1px solid #2d3748; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px; }
    th { text-align: left; color: #3b82f6; border-bottom: 2px solid #2d3748; padding: 10px; }
    td { padding: 12px 10px; border-bottom: 1px solid #1e293b; }
    .btn-act { color: #10b981; font-weight: bold; text-decoration: none; border: 1px solid #10b981; padding: 5px 10px; border-radius: 5px; }
    .btn-pag { color: #f59e0b; font-weight: bold; text-decoration: none; border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 5px; }
    .hash { font-family: monospace; font-size: 10px; color: #94a3b8; word-break: break-all; max-width: 150px; display: block; }
</style>`;

// 3. RUTAS DE GESTIÓN
app.get('/admin', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        let tabla = rows.map(r => `
            <tr style="${r.solicitud_retiro === 'si' ? 'background: rgba(239,68,68,0.1)' : ''}">
                <td><b>${r.usuario}</b><br><small>${r.nombre}</small></td>
                <td><a href="https://wa.me/${r.whatsapp}" style="color:#25d366; text-decoration:none;">${r.whatsapp}</a></td>
                <td>${r.plan}<br><span class="hash">${r.hash_pago}</span></td>
                <td><b>${r.puntos} PV</b><br>$${r.balance} MXN</td>
                <td><small>${r.direccion}</small></td>
                <td>
                    ${r.estado === 'pendiente' ? `<a href="/activar/${r.id}" class="btn-act">ACTIVAR</a>` : `<span style="color:#10b981">ACTIVO</span>`}
                    ${r.solicitud_retiro === 'si' ? `<br><br><a href="/pagar/${r.id}" class="btn-pag">PAGAR $${r.balance}</a>` : ''}
                </td>
            </tr>`).join('');

        res.send(`<html>${cssAdmin}<body><div class="container">
            <div class="card"><h2>🛡️ Central de Logística Raízoma</h2><p>Admin: ADMINRZ | Estado: Online</p></div>
            <div class="card"><table><tr><th>Socio</th><th>Contacto</th><th>Plan / Hash</th><th>Finanzas</th><th>Dirección</th><th>Acción</th></tr>${tabla}</table></div>
        </div></body></html>`);
    });
});

// 4. MOTOR DE BONOS (Lógica de $1500, $6000, $12000)
app.get('/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, socio) => {
        if (socio && socio.estado === 'pendiente') {
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                if (socio.patrocinador_id) {
                    // Sumar 100 PV al patrocinador
                    db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [socio.patrocinador_id], () => {
                        db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [socio.patrocinador_id], (err, p) => {
                            let metaMeta = 0;
                            if (p.puntos >= 400) metaMeta = 12000;
                            else if (p.puntos >= 200) metaMeta = 6000;
                            else if (p.puntos >= 100) metaMeta = 1500;

                            let pagoHoy = metaMeta - (p.bono_cobrado || 0);
                            if (pagoHoy > 0) {
                                db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [pagoHoy, pagoHoy, socio.patrocinador_id]);
                            }
                        });
                    });
                }
            });
        }
        res.redirect('/admin');
    });
});

app.get('/pagar/:id', (req, res) => {
    db.run("UPDATE socios SET balance = 0, solicitud_retiro = 'no', detalles_retiro = NULL WHERE id = ?", [req.params.id], () => res.redirect('/admin'));
});

app.listen(port, () => console.log("Admin RZ Online"));
// ==========================================
// BLOQUE 2: INTERFAZ DE USUARIOS (SOCIOS)
// ==========================================

// 5. DISEÑO DEL DASHBOARD USUARIO
const cssUser = `<style>
    :root { --bg: #0b0f19; --card: #161d2f; --blue: #3b82f6; --green: #10b981; --text: #f8fafc; }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .card-user { background: var(--card); border-radius: 20px; padding: 25px; width: 100%; max-width: 600px; margin-bottom: 20px; border: 1px solid #2d3748; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .metric-box { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #1e293b; }
    .val { display: block; font-size: 28px; font-weight: 900; color: var(--blue); }
    .bar-bg { background: #0b0f19; height: 12px; border-radius: 10px; margin: 15px 0; overflow: hidden; border: 1px solid #2d3748; }
    .bar-fill { background: linear-gradient(90deg, var(--blue), var(--green)); height: 100%; transition: 1s; }
    .vmax-input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 12px; border: 1px solid #2d3748; background: #0b0f19; color: white; box-sizing: border-box; }
    .btn-vmax { background: var(--blue); color: white; border: none; padding: 18px; border-radius: 12px; width: 100%; font-weight: bold; cursor: pointer; }
</style>`;

// 6. RUTAS DE ACCESO Y REGISTRO
app.get('/', (req, res) => {
    res.send(`<html>${cssUser}<body><div class="card-user"><h2 style="text-align:center">🌳 RAÍZOMA V.MAX</h2><form action="/login" method="POST"><input name="u" class="vmax-input" placeholder="Usuario" required><input name="p" type="password" class="vmax-input" placeholder="Contraseña" required><button class="btn-vmax">ENTRAR AL SISTEMA</button></form><p style="text-align:center"><a href="/registro" style="color:var(--blue); text-decoration:none; font-size:14px;">¿Aún no eres socio? Regístrate aquí</a></p></div></body></html>`);
});

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.u, req.body.p], (err, row) => {
        if (row) { req.session.socioID = row.id; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Usuario o clave incorrecta'); window.location='/';</script>"); }
    });
});

app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<html>${cssUser}<body><div class="card-user"><h2>Registro de Nuevo Socio</h2><p style="color:var(--green); font-size:12px;">PAGO USDT (TRC20): TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</p><form action="/reg" method="POST">
        <input type="hidden" name="ref" value="${ref}">
        <input name="n" class="vmax-input" placeholder="Nombre Completo" required>
        <input name="w" class="vmax-input" placeholder="WhatsApp (Ej: 521...)" required>
        <input name="u" class="vmax-input" placeholder="Crea un Usuario" required>
        <input name="p" type="password" class="vmax-input" placeholder="Crea una Contraseña" required>
        <select name="pl" class="vmax-input"><option value="RZ Metabolico $300">RZ Metabolico - $300</option><option value="RZ Origen $600">RZ Origen - $600</option><option value="Membresía + Origen $1,700">Membresía + Origen - $1,700</option><option value="PQT Fundador $15,000">PQT Fundador - $15,000</option></select>
        <input name="h" class="vmax-input" placeholder="Hash de Pago / TxID" required>
        <textarea name="d" class="vmax-input" placeholder="Dirección de Envío Completa" required style="height:80px"></textarea>
        <button class="btn-vmax">ENVIAR REGISTRO</button></form></div></body></html>`);
});

app.post('/reg', (req, res) => {
    const b = req.body;
    db.run("INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?,?,?,?,?,?,?,?)", [b.n, b.w, b.u, b.p, b.ref, b.pl, b.h, b.d], (err) => {
        if (err) return res.send("Error: El usuario ya existe.");
        res.send(`<html>${cssUser}<body><div class="card-user"><h2>¡Registro Exitoso!</h2><p>Tu solicitud ha sido enviada. En breve el administrador activará tu cuenta.</p><a href="/" class="btn-vmax" style="text-decoration:none; display:block; text-align:center">VOLVER AL INICIO</a></div></body></html>`);
    });
});

// 7. DASHBOARD DEL SOCIO
app.get('/dashboard', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            let meta = s.puntos >= 400 ? 400 : (s.puntos >= 200 ? 400 : (s.puntos >= 100 ? 200 : 100));
            let porc = (s.puntos / meta) * 100;

            res.send(`<html>${cssUser}<body><div class="card-user">
                <div style="display:flex; justify-content:space-between"><span>Socio: <b>${s.nombre}</b></span><a href="/logout" style="color:red; text-decoration:none; font-size:12px">Cerrar Sesión</a></div>
                <div class="metric-grid">
                    <div class="metric-box"><span class="val">${s.puntos}</span>PV ACUMULADOS</div>
                    <div class="metric-box"><span class="val" style="color:var(--green)">$${s.balance}</span>SALDO MXN</div>
                </div>
                <div class="bar-bg"><div class="bar-fill" style="width:${porc}%"></div></div>
                <p style="text-align:center; font-size:12px; color:#94a3b8">Meta para siguiente bono: ${meta} PV</p>
            </div>
            <div class="card-user">
                <h4>Link de Invitado:</h4>
                <input class="vmax-input" value="https://${req.get('host')}/registro?ref=${s.usuario}" readonly onclick="this.select(); document.execCommand('copy'); alert('Copiado');">
                ${s.balance >= 500 && s.solicitud_retiro === 'no' ? `
                    <form action="/retirar" method="POST" style="margin-top:20px">
                        <textarea name="det" class="vmax-input" placeholder="Datos para depósito (Banco, CLABE, Beneficiario)" required></textarea>
                        <button class="btn-vmax" style="background:var(--green)">SOLICITAR RETIRO</button>
                    </form>` : ''}
                ${s.solicitud_retiro === 'si' ? '<div style="background:rgba(245,158,11,0.1); padding:15px; border-radius:10px; color:var(--gold); text-align:center">Retiro en proceso de validación...</div>' : ''}
            </div>
            <div class="card-user">
                <h4>Mis Invitados Directos (${red.length})</h4>
                <div style="overflow-x:auto"><table><tr><th>Socio</th><th>Plan</th><th>Estado</th></tr>
                ${red.map(i => `<tr><td>${i.nombre}</td><td>${i.plan}</td><td><b style="color:${i.estado === 'activo' ? 'var(--green)' : 'var(--gold)'}">${i.estado}</b></td></tr>`).join('')}
                </table></div>
            </div>
            ${s.usuario === 'ADMINRZ' ? '<a href="/admin" class="btn-vmax" style="background:var(--gold); text-decoration:none; display:block; text-align:center">ABRIR PANEL MAESTRO</a>' : ''}
            </body></html>`);
        });
    });
});

app.post('/retirar', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", [req.body.det, req.session.socioID], () => res.redirect('/dashboard'));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });