/**
 * RAÍZOMA V.MAX INFINITY - FULL VERSION 2026
 * 16 VARIABLES INTEGRADAS + LÓGICA 1 PV = 1 MXN
 */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// 1. BASE DE DATOS PROFESIONAL
const dirData = '/data';
if (!fs.existsSync(dirData)) { fs.mkdirSync(dirData); }
const db = new sqlite3.Database(path.join(dirData, 'raizoma_vmax_final.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        nombre TEXT, usuario TEXT UNIQUE, password TEXT, whatsapp TEXT, 
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP, patrocinador_id TEXT,
        plan TEXT, hash_pago TEXT, direccion TEXT, estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0, puntos INTEGER DEFAULT 0, volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0, solicitud_retiro TEXT DEFAULT 'no', detalles_retiro TEXT
    )`);
    db.run("INSERT OR IGNORE INTO socios (nombre, usuario, password, estado, plan) VALUES ('Admin Maestro', 'ADMINRZ', 'ROOT', 'activo', 'MASTER')");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'rz-infinity-2026', resave: true, saveUninitialized: true }));

// 2. DISEÑO PREMIUM (Inspirado en tus capturas)
const css = `<style>
    :root { --bg: #0b0f19; --card: #161d2f; --blue: #3b82f6; --green: #10b981; --gold: #f59e0b; --text: #f8fafc; }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .card { background: var(--card); border: 1px solid #2d3748; padding: 25px; border-radius: 15px; width: 100%; max-width: 700px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .stat-box { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #1e293b; }
    .val { display: block; font-size: 32px; font-weight: 800; color: var(--blue); }
    .btn { background: var(--blue); color: white; border: none; padding: 15px; border-radius: 12px; width: 100%; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
    .btn-admin { background: var(--gold); margin-top: 10px; color: #000; text-decoration: none; display: block; text-align: center; padding: 15px; border-radius: 10px; font-weight: bold; }
    .bar-bg { background: #0b0f19; height: 12px; border-radius: 6px; margin: 15px 0; overflow: hidden; }
    .bar-fill { background: linear-gradient(90deg, var(--blue), var(--green)); height: 100%; transition: 1.5s ease-in-out; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { text-align: left; color: #64748b; padding: 10px; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px 10px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .input-vmax { width: 100%; padding: 14px; margin: 10px 0; border-radius: 10px; border: 1px solid #2d3748; background: #0b0f19; color: white; box-sizing: border-box; }
</style>`;

// 3. RUTAS DE USUARIO
app.get('/', (req, res) => res.send(`<html>${css}<body><div class="card"><h2 style="text-align:center">🌳 RAÍZOMA V.MAX</h2><form action="/login" method="POST"><input name="u" class="input-vmax" placeholder="Usuario" required><input name="p" type="password" class="input-vmax" placeholder="Clave" required><button class="btn">INICIAR SESIÓN</button></form><p style="text-align:center; font-size:14px;">¿Nuevo aquí? <a href="/registro" style="color:var(--blue)">Crear cuenta</a></p></div></body></html>`));

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.u, req.body.p], (err, row) => {
        if (row) { req.session.socioID = row.id; res.redirect('/dashboard'); }
        else res.send("<script>alert('Error de acceso'); window.location='/';</script>");
    });
});

app.get('/registro', (req, res) => res.send(`<html>${css}<body><div class="card"><h2>Formulario de Inscripción</h2><form action="/reg" method="POST"><input type="hidden" name="ref" value="${req.query.ref||''}"><input name="n" class="input-vmax" placeholder="Nombre Completo" required><input name="w" class="input-vmax" placeholder="WhatsApp" required><input name="u" class="input-vmax" placeholder="Usuario" required><input name="p" type="password" class="input-vmax" placeholder="Contraseña" required><select name="pl" class="input-vmax"><option value="RZ Metabolico $300">RZ Metabolico $300</option><option value="RZ Origen $600">RZ Origen $600</option><option value="PQT Fundador $15000">PQT Fundador $15000</option></select><input name="h" class="input-vmax" placeholder="Hash de Pago / TxID" required><textarea name="d" class="input-vmax" placeholder="Dirección de Envío Completa" required style="height:80px"></textarea><button class="btn">ENVIAR REGISTRO</button></form></div></body></html>`));

app.post('/reg', (req, res) => {
    const b = req.body;
    db.run("INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?,?,?,?,?,?,?,?)", [b.n, b.w, b.u, b.p, b.ref, b.pl, b.h, b.d], () => res.redirect('/'));
});

// 4. DASHBOARD (Basado en tu captura)
app.get('/dashboard', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            let meta = s.puntos >= 60000 ? 60000 : (s.puntos >= 30000 ? 60000 : (s.puntos >= 15000 ? 30000 : 15000));
            let porc = (s.puntos / meta) * 100;
            res.send(`<html>${css}<body><div class="card"><h3>Hola, ${s.nombre}</h3><div class="stat-grid"><div class="stat-box"><span class="val">${s.puntos.toLocaleString()}</span>PV (MXN)</div><div class="stat-box"><span class="val" style="color:var(--green)">$${s.balance.toLocaleString()}</span>SALDO</div></div><div class="bar-bg"><div class="bar-fill" style="width:${porc}%"></div></div><p style="text-align:center; font-size:12px; color:#94a3b8">Meta para siguiente bono: ${meta.toLocaleString()} PV</p></div><div class="card"><h4>Red Directa</h4><table><tr><th>Socio</th><th>Paquete</th><th>Estado</th></tr>${red.map(i=>`<tr><td>${i.nombre}</td><td>${i.plan}</td><td><b style="color:${i.estado==='activo'?'var(--green)':'var(--gold)'}">${i.estado.toUpperCase()}</b></td></tr>`).join('')}</table></div>${s.usuario==='ADMINRZ'?'<a href="/admin" class="btn-admin">PANEL MAESTRO</a>':''}</body></html>`);
        });
    });
});

// 5. PANEL MAESTRO (Para gestión total)
app.get('/admin', (req, res) => {
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        res.send(`<html>${css}<body><div class="card" style="max-width:1000px"><h2>🛡️ Panel Maestro de Logística</h2><table><tr><th>Socio</th><th>Hash/Plan</th><th>Dirección/WhatsApp</th><th>Finanzas</th><th>Acción</th></tr>${rows.map(r=>`<tr><td><b>${r.usuario}</b></td><td><small>${r.hash_pago}</small><br>${r.plan}</td><td><small>${r.direccion}</small><br><b style="color:var(--green)">${r.whatsapp}</b></td><td>${r.puntos.toLocaleString()} PV<br>$${r.balance}</td><td><a href="/activar/${r.id}" style="color:var(--blue)">[ACTIVAR]</a></td></tr>`).join('')}</table><br><a href="/dashboard" style="color:#fff">Volver</a></div></body></html>`);
    });
});

app.get('/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado === 'pendiente') {
            const valorPlan = parseInt(s.plan.replace(/[^0-9]/g, '')) || 0;
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                if (s.patrocinador_id) {
                    db.run("UPDATE socios SET puntos = puntos + ? WHERE usuario = ?", [valorPlan, s.patrocinador_id], () => {
                        db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [s.patrocinador_id], (err, p) => {
                            let bono = p.puntos >= 60000 ? 12000 : (p.puntos >= 30000 ? 6000 : (p.puntos >= 15000 ? 1500 : 0));
                            let pagar = bono - (p.bono_cobrado || 0);
                            if (pagar > 0) db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [pagar, pagar, s.patrocinador_id]);
                        });
                    });
                }
                res.redirect('/admin');
            });
        } else res.redirect('/admin');
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.listen(port, () => console.log("Infinity V.MAX Ready"));