/**
 * RAÍZOMA V.MAX INFINITY - SISTEMA INTEGRAL 2026
 * 16 VARIABLES: ID, Nombre, Usuario, Pass, WhatsApp, Fecha, Sponsor, Plan, Hash, Dirección, Estado, Balance, PV, Vol_Red, Bono_Cob, Retiro.
 */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// PERSISTENCIA RENDER
const dirData = '/data';
if (!fs.existsSync(dirData)) { fs.mkdirSync(dirData); }
const dbPath = path.join(dirData, 'raizoma_infinity_final.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, usuario TEXT UNIQUE, password TEXT, whatsapp TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP, patrocinador_id TEXT, plan TEXT, hash_pago TEXT, direccion TEXT, 
        estado TEXT DEFAULT 'pendiente', balance REAL DEFAULT 0, puntos INTEGER DEFAULT 0, volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0, solicitud_retiro TEXT DEFAULT 'no', detalles_retiro TEXT
    )`);
    db.run("INSERT OR IGNORE INTO socios (nombre, usuario, password, estado, plan) VALUES ('Admin', 'ADMINRZ', 'ROOT', 'activo', 'MASTER')");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'raizoma-infinity-secret', resave: true, saveUninitialized: true }));

const css = `<style>
    :root { --bg: #0b0f19; --card: #161d2f; --blue: #3b82f6; --green: #10b981; --text: #f8fafc; }
    body { background: var(--bg); color: var(--text); font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    .card { background: var(--card); border-radius: 15px; padding: 25px; width: 100%; max-width: 650px; margin-bottom: 20px; border: 1px solid #2d3748; }
    .btn { background: var(--blue); color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; cursor: pointer; font-weight: bold; }
    .input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #2d3748; background: #0b0f19; color: white; box-sizing: border-box; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; }
    .stat-box { background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #2d3748; }
</style>`;

app.get('/', (req, res) => res.send(`<html>${css}<body><div class="card"><h2>🌳 RAÍZOMA LOGIN</h2><form action="/login" method="POST"><input name="u" class="input" placeholder="Usuario" required><input name="p" type="password" class="input" placeholder="Clave" required><button class="btn">ENTRAR</button></form><br><a href="/registro" style="color:var(--blue)">Registrarse</a></div></body></html>`));

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.u, req.body.p], (err, row) => {
        if (row) { req.session.socioID = row.id; res.redirect('/dashboard'); }
        else res.send("<script>alert('Error'); window.location='/';</script>");
    });
});

app.get('/registro', (req, res) => res.send(`<html>${css}<body><div class="card"><h2>Registro</h2><form action="/reg" method="POST"><input name="ref" class="input" placeholder="Usuario Patrocinador" value="${req.query.ref||''}"><input name="n" class="input" placeholder="Nombre" required><input name="w" class="input" placeholder="WhatsApp" required><input name="u" class="input" placeholder="Usuario" required><input name="p" type="password" class="input" placeholder="Clave" required><select name="pl" class="input"><option value="RZ Metabolico $300">RZ Metabolico $300</option><option value="RZ Origen $600">RZ Origen $600</option><option value="PQT Fundador $15000">PQT Fundador $15000</option></select><input name="h" class="input" placeholder="Hash de Pago" required><textarea name="d" class="input" placeholder="Dirección Envío" required></textarea><button class="btn">REGISTRARME</button></form></div></body></html>`));

app.post('/reg', (req, res) => {
    const b = req.body;
    db.run("INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?,?,?,?,?,?,?,?)", [b.n, b.w, b.u, b.p, b.ref, b.pl, b.h, b.d], () => res.redirect('/'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            res.send(`<html>${css}<body><div class="card"><h3>Socio: ${s.nombre}</h3><div class="stat-grid"><div class="stat-box"><b>${s.puntos}</b><br>PV</div><div class="stat-box"><b>$${s.balance}</b><br>Balance</div><div class="stat-box"><b>${red.length}</b><br>Red</div></div><p>Link: <small>https://${req.get('host')}/registro?ref=${s.usuario}</small></p><a href="/logout" style="color:red">Salir</a></div><div class="card"><h4>Red Directa</h4><table><tr><th>Socio</th><th>Plan</th><th>Estado</th></tr>${red.map(i=>`<tr><td>${i.nombre}</td><td>${i.plan}</td><td>${i.estado}</td></tr>`).join('')}</table></div>${s.usuario==='ADMINRZ'?'<a href="/admin" class="btn">ADMIN</a>':''}</body></html>`);
        });
    });
});

app.get('/admin', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`<html>${css}<body><div class="card" style="max-width:850px"><h2>Admin</h2><table><tr><th>Socio</th><th>Plan/Hash</th><th>PV/Bal</th><th>Acción</th></tr>${rows.map(r=>`<tr><td>${r.usuario}<br>${r.whatsapp}</td><td>${r.plan}<br><small>${r.hash_pago}</small></td><td>${r.puntos} / $${r.balance}</td><td><a href="/activar/${r.id}">[ACT]</a> | <a href="/pagar/${r.id}">[PAG]</a></td></tr>`).join('')}</table><br><a href="/dashboard">Volver</a></div></body></html>`);
    });
});

app.get('/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado !== 'activo') {
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                if (s.patrocinador_id) {
                    db.run("UPDATE socios SET puntos = puntos + 100, volumen_red = volumen_red + 1 WHERE usuario = ?", [s.patrocinador_id], () => {
                        db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [s.patrocinador_id], (err, p) => {
                            let meta = p.puntos >= 400 ? 12000 : (p.puntos >= 200 ? 6000 : (p.puntos >= 100 ? 1500 : 0));
                            let dif = meta - p.bono_cobrado;
                            if (dif > 0) db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [dif, dif, s.patrocinador_id]);
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
app.listen(port, () => console.log("V.MAX Online"));