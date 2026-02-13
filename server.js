/**
 * RAÍZOMA V.MAX INFINITY - ESCALA 1 PV = 1 MXN
 */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

const dirData = '/data';
if (!fs.existsSync(dirData)) { fs.mkdirSync(dirData); }
const db = new sqlite3.Database(path.join(dirData, 'raizoma_vmax_volumen.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, usuario TEXT UNIQUE, password TEXT, 
        whatsapp TEXT, fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP, patrocinador_id TEXT,
        plan TEXT, hash_pago TEXT, direccion TEXT, estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0, puntos INTEGER DEFAULT 0, volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0, solicitud_retiro TEXT DEFAULT 'no', detalles_retiro TEXT
    )`);
    db.run("INSERT OR IGNORE INTO socios (nombre, usuario, password, estado, plan) VALUES ('Admin Maestro', 'ADMINRZ', 'ROOT', 'activo', 'MASTER')");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'rz-vmax-volumen-2026', resave: true, saveUninitialized: true }));

const css = `<style>
    :root { --bg: #0b0f19; --card: #161d2f; --blue: #3b82f6; --green: #10b981; --text: #f8fafc; --gold: #f59e0b; }
    body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .card { background: var(--card); border: 1px solid #2d3748; padding: 25px; border-radius: 15px; width: 100%; max-width: 650px; margin-bottom: 20px; }
    .btn { background: var(--blue); color: white; border: none; padding: 15px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; }
    .input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #2d3748; background: #0b0f19; color: white; box-sizing: border-box; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .stat-box { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #1e293b; }
    .val { display: block; font-size: 24px; font-weight: bold; color: var(--blue); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #2d3748; }
    .bar-bg { background: #0b0f19; height: 10px; border-radius: 5px; margin: 10px 0; }
    .bar-fill { background: var(--blue); height: 10px; border-radius: 5px; transition: 1s; }
</style>`;

// RUTAS DE ACCESO
app.get('/', (req, res) => res.send(`<html>${css}<body><div class="card"><h2 style="text-align:center">🌳 RAÍZOMA V.MAX</h2><form action="/login" method="POST"><input name="u" class="input" placeholder="Usuario" required><input name="p" type="password" class="input" placeholder="Clave" required><button class="btn">ENTRAR</button></form><p style="text-align:center"><a href="/registro" style="color:var(--blue)">Registrarse</a></p></div></body></html>`));

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.u, req.body.p], (err, row) => {
        if (row) { req.session.socioID = row.id; res.redirect('/dashboard'); }
        else res.send("<script>alert('Error'); window.location='/';</script>");
    });
});

app.get('/registro', (req, res) => res.send(`<html>${css}<body><div class="card"><h2>Nuevo Socio</h2><form action="/reg" method="POST"><input type="hidden" name="ref" value="${req.query.ref||''}"><input name="n" class="input" placeholder="Nombre" required><input name="w" class="input" placeholder="WhatsApp" required><input name="u" class="input" placeholder="Usuario" required><input name="p" type="password" class="input" placeholder="Clave" required><select name="pl" class="input"><option value="RZ Metabolico $300">RZ Metabolico $300</option><option value="RZ Origen $600">RZ Origen $600</option><option value="PQT Fundador $15000">PQT Fundador $15000</option></select><input name="h" class="input" placeholder="Hash de Pago" required><textarea name="d" class="input" placeholder="Dirección Envío" required></textarea><button class="btn">REGISTRARME</button></form></div></body></html>`));

app.post('/reg', (req, res) => {
    const b = req.body;
    db.run("INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?,?,?,?,?,?,?,?)", [b.n, b.w, b.u, b.p, b.ref, b.pl, b.h, b.d], () => res.redirect('/'));
});

// DASHBOARD USUARIO
app.get('/dashboard', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            // METAS AJUSTADAS: 15k, 30k, 60k
            let meta = s.puntos >= 60000 ? 60000 : (s.puntos >= 30000 ? 60000 : (s.puntos >= 15000 ? 30000 : 15000));
            let porc = (s.puntos / meta) * 100;
            res.send(`<html>${css}<body><div class="card"><h3>Hola, ${s.nombre}</h3><div class="stat-grid"><div class="stat-box"><span class="val">${s.puntos.toLocaleString()}</span>PV (MXN)</div><div class="stat-box"><span class="val" style="color:var(--green)">$${s.balance.toLocaleString()}</span>SALDO</div></div><div class="bar-bg"><div class="bar-fill" style="width:${porc}%"></div></div><p style="font-size:11px; text-align:center">Meta para siguiente bono: ${meta.toLocaleString()} PV</p></div><div class="card"><h4>Red Directa</h4><table><tr><th>Socio</th><th>Paquete</th><th>Estado</th></tr>${red.map(i=>`<tr><td>${i.nombre}</td><td>${i.plan}</td><td>${i.estado}</td></tr>`).join('')}</table></div>${s.usuario==='ADMINRZ'?'<a href="/admin" class="btn" style="background:var(--gold)">PANEL MAESTRO</a>':''}</body></html>`);
        });
    });
});

// PANEL ADMIN
app.get('/admin', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`<html>${css}<body><div class="card" style="max-width:900px"><h2>Admin Logística</h2><table><tr><th>Socio</th><th>Plan/Hash</th><th>PV Acumulado</th><th>Acción</th></tr>${rows.map(r=>`<tr><td>${r.usuario}<br>${r.whatsapp}</td><td>${r.plan}<br><small>${r.hash_pago}</small></td><td>${r.puntos.toLocaleString()} PV</td><td><a href="/activar/${r.id}">[ACT]</a> | <a href="/pagar/${r.id}">[PAG]</a></td></tr>`).join('')}</table></div></body></html>`);
    });
});

// LÓGICA DE ACTIVACIÓN: 1 PV = 1 MXN
app.get('/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado === 'pendiente') {
            // El valor del plan se convierte directamente en PV (Ej: Plan $15,000 = 15,000 PV)
            const valorPlan = parseInt(s.plan.replace(/[^0-9]/g, '')) || 0;
            
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                if (s.patrocinador_id) {
                    // Sumar el valor del plan a los PV del patrocinador
                    db.run("UPDATE socios SET puntos = puntos + ? WHERE usuario = ?", [valorPlan, s.patrocinador_id], () => {
                        db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [s.patrocinador_id], (err, p) => {
                            let bonoTotal = 0;
                            if (p.puntos >= 60000) bonoTotal = 12000;
                            else if (p.puntos >= 30000) bonoTotal = 6000;
                            else if (p.puntos >= 15000) bonoTotal = 1500;

                            let pagoNeto = bonoTotal - (p.bono_cobrado || 0);
                            if (pagoNeto > 0) {
                                db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [pagoNeto, pagoNeto, s.patrocinador_id]);
                            }
                        });
                    });
                }
                res.redirect('/admin');
            });
        } else res.redirect('/admin');
    });
});

app.get('/pagar/:id', (req, res) => db.run("UPDATE socios SET balance = 0, solicitud_retiro = 'no' WHERE id = ?", [req.params.id], () => res.redirect('/admin')));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.listen(port, () => console.log("V.MAX 1:1 Online"));