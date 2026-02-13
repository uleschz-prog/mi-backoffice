/**
 * ============================================================================
 * SISTEMA RAÍZOMA V.MAX INFINITY - EDICIÓN "ORIGEN"
 * IDENTIDAD VISUAL: Teal (#428585), Negro Mate (#121212), Crema (#F5F5DC)
 * ============================================================================
 */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// PERSISTENCIA DE DATOS - /data es donde Render monta el Disk (1GB persistente)
const dirData = process.env.RENDER_DISK_PATH || '/data';
const db = new sqlite3.Database(path.join(dirData, 'raizoma_origen_final.db'));

// ESTRUCTURA COMPLETA + monto_solicitado para solicitudes de retiro
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT, usuario TEXT UNIQUE, password TEXT, whatsapp TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP, patrocinador_id TEXT,
        plan TEXT, hash_pago TEXT, direccion TEXT, estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0, puntos INTEGER DEFAULT 0, volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0, solicitud_retiro TEXT DEFAULT 'no', detalles_retiro TEXT
    )`);
    db.run("ALTER TABLE socios ADD COLUMN monto_solicitado REAL DEFAULT 0", () => {});
    db.run("ALTER TABLE socios ADD COLUMN bono1_cobrado REAL DEFAULT 0", () => {}); // Bono 15%
    db.run("ALTER TABLE socios ADD COLUMN bono2_cobrado REAL DEFAULT 0", () => {});
    db.run("ALTER TABLE socios ADD COLUMN selfie_biometrica TEXT", () => {}); // Base64 selfie
    db.run("INSERT OR IGNORE INTO socios (nombre, usuario, password, estado, plan) VALUES ('Admin Maestro', 'ADMINRZ', 'ROOT', 'activo', 'MASTER')");
});

app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
app.use(bodyParser.json({ limit: '15mb' }));
app.use(session({ secret: 'origen-vmax-secret-2026', resave: true, saveUninitialized: true }));

// TEMÁTICA VISUAL BASADA EN EL PRODUCTO "RAÍZOMA ORIGEN"
const cssOrigen = `<style>
    :root { 
        --teal: #428585; --dark: #121212; --card: #1e1e1e; 
        --cream: #F5F5DC; --text: #e0e0e0; --gold: #d4af37;
    }
    body { background: var(--dark); color: var(--text); font-family: 'Inter', sans-serif; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .card { background: var(--card); border: 1px solid rgba(66, 133, 133, 0.3); padding: 30px; border-radius: 20px; width: 100%; max-width: 650px; margin-bottom: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
    h2, h3 { color: var(--teal); text-transform: uppercase; letter-spacing: 2px; text-align: center; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-box { background: rgba(66, 133, 133, 0.1); border: 1px solid var(--teal); padding: 20px; border-radius: 15px; text-align: center; }
    .val { display: block; font-size: 28px; font-weight: bold; color: var(--cream); margin-bottom: 5px; }
    .label { font-size: 11px; color: var(--teal); text-transform: uppercase; font-weight: bold; }
    .bar-bg { background: #000; height: 14px; border-radius: 7px; margin: 15px 0; border: 1px solid rgba(245, 245, 220, 0.2); overflow: hidden; }
    .bar-fill { background: linear-gradient(90deg, var(--teal), var(--cream)); height: 100%; border-radius: 7px; transition: 1.5s ease; }
    .vmax-btn { background: var(--teal); color: var(--dark); border: none; padding: 16px; border-radius: 12px; width: 100%; font-weight: bold; cursor: pointer; text-transform: uppercase; transition: 0.3s; }
    .vmax-btn:hover { background: var(--cream); transform: translateY(-2px); }
    .vmax-input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; box-sizing: border-box; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; color: var(--teal); padding: 12px; font-size: 12px; border-bottom: 2px solid var(--teal); }
    td { padding: 12px; border-bottom: 1px solid #333; font-size: 14px; }
    .badge { padding: 4px 8px; border-radius: 5px; font-size: 10px; font-weight: bold; }
    .badge-active { background: var(--teal); color: var(--dark); }
    .badge-pending { background: #444; color: #aaa; }
    .copy-btn { background: var(--teal); color: var(--dark); border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold; margin-left: 5px; }
    .copy-btn:hover { background: var(--cream); }
    .link-cell { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
    .link-cell input { flex: 1; min-width: 120px; padding: 6px 10px; font-size: 11px; }
</style>`;

// RUTAS LÓGICAS
app.get('/', (req, res) => {
    res.send(`<html>${cssOrigen}<body><div class="card"><h2>Raízoma V.MAX</h2><form action="/login" method="POST"><input name="u" class="vmax-input" placeholder="Usuario" required><input name="p" type="password" class="vmax-input" placeholder="Contraseña" required><button class="vmax-btn">Entrar al Sistema</button></form><p style="text-align:center; font-size:13px">¿Nuevo socio? <a href="/registro" style="color:var(--teal)">Inscríbete aquí</a></p></div></body></html>`);
});

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.u, req.body.p], (err, row) => {
        if (row) { req.session.socioID = row.id; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Datos Incorrectos'); window.location='/';</script>"); }
    });
});

app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    const msgPatrocinador = ref ? `<p style="text-align:center; color:var(--teal); font-weight:bold; margin-bottom:15px">Patrocinador: <strong>${ref}</strong></p>` : '';
    const biometricScript = `
    <script>
    let stream = null;
    function iniciarCamara() {
        const video = document.getElementById('videoBiometrico');
        const btn = document.getElementById('btnIniciar');
        if (stream) { stream.getTracks().forEach(t=>t.stop()); stream=null; btn.textContent='Iniciar cámara'; video.style.display='none'; return; }
        navigator.mediaDevices.getUserMedia({video:{width:320,height:240}}).then(s=>{
            stream=s; video.srcObject=s; video.style.display='block'; btn.textContent='Detener cámara';
        }).catch(()=>alert('No se pudo acceder a la cámara. Permite el acceso en tu navegador.'));
    }
    function capturarSelfie() {
        const video = document.getElementById('videoBiometrico');
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.7);
        document.getElementById('selfieInput').value = data;
        document.getElementById('previewSelfie').src = data;
        document.getElementById('previewSelfie').style.display = 'block';
        document.getElementById('msgSelfie').textContent = 'Selfie capturada. Verificación biométrica lista.';
    }
    </script>`;
    res.send(`<html>${cssOrigen}${biometricScript}<body><div class="card"><h2>Registro Origen</h2>${msgPatrocinador}<form action="/reg" method="POST" id="formReg"><input type="hidden" name="ref" value="${ref}"><input name="n" class="vmax-input" placeholder="Nombre Completo" required><input name="w" class="vmax-input" placeholder="WhatsApp (52...)" required><input name="u" class="vmax-input" placeholder="Usuario" required><input name="p" type="password" class="vmax-input" placeholder="Contraseña" required><select name="pl" class="vmax-input"><option value="RZ Origen $600">RZ Origen - $600</option><option value="Membresía + Origen $1,700">Membresía + Origen - $1,700</option><option value="PQT Fundador $15,000">PQT Fundador - $15,000</option></select><input name="h" class="vmax-input" placeholder="Hash de Pago / TxID" required><textarea name="d" class="vmax-input" placeholder="Dirección Completa de Envío" required style="height:80px"></textarea><div style="border:1px solid var(--teal); border-radius:10px; padding:15px; margin:15px 0"><h4 style="color:var(--teal); margin:0 0 10px 0">Verificación biométrica (selfie)</h4><p style="font-size:12px; color:#aaa; margin-bottom:10px">Captura tu rostro para verificación de identidad.</p><button type="button" id="btnIniciar" class="vmax-btn" onclick="iniciarCamara()" style="margin-bottom:8px">Iniciar cámara</button><video id="videoBiometrico" autoplay playsinline style="display:none; width:100%; max-width:320px; border-radius:8px; background:#000"></video><br><button type="button" class="vmax-btn" onclick="capturarSelfie()" style="background:var(--gold); color:#000; margin-top:8px">Capturar selfie</button><img id="previewSelfie" style="display:none; max-width:160px; border-radius:8px; margin-top:10px"><p id="msgSelfie" style="font-size:12px; color:var(--teal); margin-top:5px"></p><input type="hidden" name="selfie" id="selfieInput"></div><button type="submit" class="vmax-btn">Enviar Inscripción</button></form></div></body></html>`);
});

app.post('/solicitar_retiro', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    const monto = parseFloat(req.body.monto) || 0;
    db.get("SELECT balance, solicitud_retiro FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        if (!s || s.solicitud_retiro === 'pendiente' || s.solicitud_retiro === 'liberado') return res.redirect('/dashboard');
        const cant = Math.min(monto, s.balance || 0);
        if (cant <= 0) return res.redirect('/dashboard');
        db.run("UPDATE socios SET solicitud_retiro = 'pendiente', monto_solicitado = ?, detalles_retiro = ? WHERE id = ?", [cant, 'Solicitud: $' + cant.toLocaleString(), req.session.socioID], () => res.redirect('/dashboard'));
    });
});

app.post('/reg', (req, res) => {
    const b = req.body;
    const selfie = (b.selfie || '').substring(0, 500000); // Limitar tamaño base64
    db.run("INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion, selfie_biometrica) VALUES (?,?,?,?,?,?,?,?,?)", [b.n, b.w, b.u, b.p, b.ref, b.pl, b.h, b.d, selfie || null], (err) => {
        if (err) return res.send("Error: Usuario duplicado.");
        res.send(`<html>${cssOrigen}<body><div class="card"><h2>¡Recibido!</h2><p>Tu cuenta será activada tras validar el pago.</p><a href="/" class="vmax-btn" style="display:block; text-align:center; text-decoration:none">Volver</a></div></body></html>`);
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.socioID) return res.redirect('/');
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioID], (err, s) => {
        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            let meta = s.puntos >= 60000 ? 60000 : (s.puntos >= 30000 ? 60000 : (s.puntos >= 15000 ? 30000 : 15000));
            let porc = (s.puntos / meta) * 100;
            const linkRef = `https://${req.get('host')}/registro?ref=${s.usuario}`;
            const copyScript = `<script>function copiarLink(){navigator.clipboard.writeText('${linkRef}').then(()=>{const b=document.getElementById('btnCopy');b.textContent='¡Copiado!';setTimeout(()=>b.textContent='Copiar link',1500)})}</script>`;
            const btnSolicitar = (s.balance > 0 && s.solicitud_retiro !== 'pendiente' && s.solicitud_retiro !== 'liberado') ? `<form action="/solicitar_retiro" method="POST" style="margin-top:15px"><input type="hidden" name="monto" value="${s.balance}"><button type="submit" class="vmax-btn" style="background:var(--gold); color:#000">Solicitar retiro de comisiones ($${s.balance.toLocaleString()})</button></form>` : s.solicitud_retiro === 'pendiente' ? `<p style="color:var(--gold); font-size:12px; margin-top:10px">Solicitud pendiente: $${(s.monto_solicitado||s.balance).toLocaleString()}</p>` : '';
            const b1 = s.bono1_cobrado || 0;
            const b2 = s.bono2_cobrado || 0;
            const bonoTotal = (s.bono_cobrado || 0);
            const desgloseBonos = `<div style="background:rgba(66,133,133,0.08); border:1px solid rgba(66,133,133,0.3); border-radius:12px; padding:15px; margin:15px 0"><h4 style="color:var(--teal); margin:0 0 10px 0">Detalle de bonos cobrados</h4><table style="width:100%"><tr><td><strong>Bono 1 (15% directo)</strong></td><td style="color:var(--cream); font-size:18px; text-align:right">$${b1.toLocaleString()}</td></tr><tr><td><strong>Bono 2 (Escalonamiento)</strong></td><td style="color:var(--cream); font-size:18px; text-align:right">$${b2.toLocaleString()}</td></tr><tr><td><strong>Total bonos</strong></td><td style="color:var(--teal); font-size:20px; text-align:right">$${bonoTotal.toLocaleString()}</td></tr></table></div>`;
            const btnLogout = `<a href="/logout" class="vmax-btn" style="background:#555; color:var(--cream); text-decoration:none; display:block; text-align:center; margin-top:10px">Cerrar sesión</a>`;
            res.send(`<html>${cssOrigen}${copyScript}<body><div class="card"><h3>Bienvenido, ${s.nombre}</h3><div class="stat-grid" style="grid-template-columns: repeat(3, 1fr)"><div class="stat-box"><span class="val">${s.puntos.toLocaleString()}</span><span class="label">PV Acumulados</span></div><div class="stat-box"><span class="val">$${s.balance.toLocaleString()}</span><span class="label">Balance MXN</span></div><div class="stat-box"><span class="val">$${bonoTotal.toLocaleString()}</span><span class="label">Bonos cobrados (total)</span></div></div>${desgloseBonos}<div class="bar-bg"><div class="bar-fill" style="width:${porc}%"></div></div><p style="text-align:center; font-size:11px; color:var(--teal)">Progreso hacia bono: ${meta.toLocaleString()} PV</p>${btnSolicitar}${btnLogout}</div><div class="card"><h4>Mi Link de Referido:</h4><div class="link-cell"><input class="vmax-input" value="${linkRef}" readonly style="flex:1; margin-right:8px"><button id="btnCopy" class="copy-btn" onclick="copiarLink()">Copiar link</button></div><h4>Estructura Directa</h4><table><tr><th>Socio</th><th>Plan</th><th>Estado</th></tr>${(red||[]).map(i=>`<tr><td>${i.nombre}</td><td>${i.plan}</td><td><span class="badge ${i.estado==='activo'?'badge-active':'badge-pending'}">${i.estado}</span></td></tr>`).join('')}</table></div>${s.usuario==='ADMINRZ'?'<a href="/admin" class="vmax-btn" style="background:var(--gold); color:#000; text-decoration:none; display:block; text-align:center">Panel Administrativo</a>':''}</body></html>`);
        });
    });
});

app.get('/admin', (req, res) => {
    const host = req.get('host');
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        const solicitudes = (rows || []).filter(r => r.solicitud_retiro === 'pendiente');
        const copyScript = `
        <script>
        function copiarLink(btn, url) {
            navigator.clipboard.writeText(url).then(() => {
                const orig = btn.textContent;
                btn.textContent = '¡Copiado!';
                setTimeout(() => btn.textContent = orig, 1500);
            });
        }
        </script>`;
        const seccionSolicitudes = solicitudes.length > 0 ? `<div class="card" style="max-width:1100px; margin-bottom:20px; border-color:var(--gold)"><h4 style="color:var(--gold)">Solicitudes de retiro pendientes</h4><table><tr><th>Socio</th><th>Monto solicitado</th><th>Acción</th></tr>${solicitudes.map(r=>`<tr><td><b>${r.usuario}</b><br><small>${r.nombre} - ${r.whatsapp||''}</small></td><td><strong style="color:var(--cream); font-size:18px">$${(r.monto_solicitado||r.balance||0).toLocaleString()}</strong></td><td><a href="/liberar_pagos/${r.id}" style="color:var(--teal); font-weight:bold">[LIBERAR PAGOS]</a></td></tr>`).join('')}</table></div>` : '';
        res.send(`<html>${cssOrigen}${copyScript}<body>${seccionSolicitudes}<div class="card" style="max-width:1100px"><h2>Control Maestro</h2><p style="font-size:12px; color:#aaa; margin-bottom:15px">Usuarios nuevos: validar pago (Plan/Hash) antes de activar.</p><table><tr><th>Estado</th><th>Socio / WA</th><th>Plan / Hash</th><th>Dirección</th><th>Solicitud retiro</th><th>Biometría</th><th>Link</th><th>Acción</th></tr>${(rows||[]).map(r=>{
            const linkReg = `https://${host}/registro?ref=${r.usuario}`;
            const solicitudCell = r.solicitud_retiro === 'pendiente' ? `<strong style="color:var(--gold)">$${(r.monto_solicitado||r.balance||0).toLocaleString()}</strong>` : r.solicitud_retiro === 'liberado' ? '<small>Liberado</small>' : '-';
            const acciones = r.estado === 'pendiente'
                ? `<a href="/activar/${r.id}" style="color:var(--teal); font-weight:bold">[ACTIVAR]</a> | <a href="/liberar_pagos/${r.id}" style="color:var(--gold)">[LIBERAR PAGOS]</a>`
                : `<a href="/desactivar/${r.id}" style="color:#e67e22; font-weight:bold">[DESACTIVAR]</a> | <a href="/liberar_pagos/${r.id}" style="color:var(--gold)">[LIBERAR PAGOS]</a>`;
            const selfieLink = r.selfie_biometrica ? `<a href="/ver_selfie/${r.id}" target="_blank" style="color:var(--teal)">Ver selfie</a>` : '<small>-</small>';
            return `<tr><td><span class="badge ${r.estado==='activo'?'badge-active':'badge-pending'}">${r.estado}</span></td><td><b>${r.usuario}</b><br><small>${r.whatsapp||''}</small></td><td>${r.plan||''}<br><small style="color:var(--teal)">${r.hash_pago||'-'}</small></td><td><small>${r.direccion||''}</small></td><td>${solicitudCell}</td><td>${selfieLink}</td><td><div class="link-cell"><input type="text" value="${linkReg}" readonly style="width:140px"><button class="copy-btn" onclick="copiarLink(this,${JSON.stringify(linkReg)})">Copiar</button></div></td><td>${acciones}</td></tr>`;
        }).join('')}</table><br><a href="/dashboard" style="color:var(--cream)">Volver al Dashboard</a> | <a href="/logout" style="color:#888">Cerrar sesión</a></div></body></html>`);
    });
});

app.get('/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado === 'pendiente') {
            const valPlan = parseInt(s.plan.replace(/[^0-9]/g, '')) || 0;
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                if (s.patrocinador_id) {
                    db.run("UPDATE socios SET puntos = puntos + ?, volumen_red = volumen_red + ? WHERE usuario = ?", [valPlan, valPlan, s.patrocinador_id], () => {
                        db.get("SELECT puntos, bono_cobrado, bono1_cobrado, bono2_cobrado FROM socios WHERE usuario = ?", [s.patrocinador_id], (err, p) => {
                            const bono1Add = valPlan * 0.15; // Bono 1: 15% directo por activación
                            const totalBono = p.puntos >= 60000 ? 12000 : (p.puntos >= 30000 ? 6000 : (p.puntos >= 15000 ? 1500 : 0));
                            const bono2Add = Math.max(0, totalBono - (p.bono_cobrado || 0)); // Bono 2: Escalonamiento (por meta PV)
                            const totalAdd = bono1Add + bono2Add;
                            if (totalAdd > 0) db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ?, bono1_cobrado = bono1_cobrado + ?, bono2_cobrado = bono2_cobrado + ? WHERE usuario = ?", [totalAdd, totalAdd, bono1Add, bono2Add, s.patrocinador_id]);
                        });
                    });
                }
                res.redirect('/admin');
            });
        } else res.redirect('/admin');
    });
});

app.get('/desactivar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado === 'activo' && s.usuario !== 'ADMINRZ') {
            db.run("UPDATE socios SET estado = 'pendiente' WHERE id = ?", [req.params.id], () => res.redirect('/admin'));
        } else res.redirect('/admin');
    });
});

app.get('/regresar_pendiente/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s && s.estado === 'activo') {
            db.run("UPDATE socios SET estado = 'pendiente' WHERE id = ?", [req.params.id], () => res.redirect('/admin'));
        } else res.redirect('/admin');
    });
});

app.get('/ver_selfie/:id', (req, res) => {
    db.get("SELECT selfie_biometrica, nombre, usuario FROM socios WHERE id = ?", [req.params.id], (err, row) => {
        if (!row || !row.selfie_biometrica) return res.status(404).send('Sin datos biométricos');
        res.send(`<html><head><title>Selfie - ${row.usuario}</title><style>body{background:#121212;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;padding:20px}h2{color:#428585}img{max-width:100%;border-radius:12px;border:2px solid #428585}</style></head><body><h2>Verificación biométrica: ${row.nombre} (${row.usuario})</h2><img src="${row.selfie_biometrica}" alt="Selfie"></body></html>`);
    });
});

app.get('/liberar_pagos/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, s) => {
        if (s) {
            db.run("UPDATE socios SET solicitud_retiro = 'liberado', detalles_retiro = 'Pagos liberados por admin' WHERE id = ?", [req.params.id], () => res.redirect('/admin'));
        } else res.redirect('/admin');
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.listen(port, () => console.log("Raízoma Origen Online"));