const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// ============================================================
// 1. CONFIGURACIÓN DE LA BASE DE DATOS (PERSISTENCIA TOTAL)
// ============================================================
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("ERROR CRÍTICO AL ABRIR LA BASE DE DATOS:");
        console.error(err.message);
    } else {
        console.log("-----------------------------------------");
        console.log("CONEXIÓN EXITOSA: /data/raizoma.db");
        console.log("SISTEMA RAÍZOMA V.MAX ACTUALIZADO");
        console.log("-----------------------------------------");
    }
});

// ============================================================
// 2. ESTRUCTURA DE TABLAS Y CONFIGURACIÓN INICIAL
// ============================================================
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        usuario TEXT UNIQUE,
        password TEXT,
        patrocinador_id TEXT,
        plan TEXT,
        hash_pago TEXT,
        direccion TEXT,
        estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0,
        puntos INTEGER DEFAULT 0,
        bono_cobrado REAL DEFAULT 0,
        solicitud_retiro TEXT DEFAULT 'no',
        detalles_retiro TEXT
    )`);

    // Asegurar que las columnas existan
    db.run("ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN detalles_retiro TEXT", (err) => {});

    // --- GENERACIÓN DEL ADMINRZ ---
    const masterUser = 'ADMINRZ';
    const masterPass = 'ROOT'; 
    db.get("SELECT * FROM socios WHERE usuario = ?", [masterUser], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO socios (nombre, usuario, password, estado, plan, balance, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    ['Administrador General', masterUser, masterPass, 'activo', 'MASTER', 0, 0]);
        }
    });
});

// ============================================================
// 3. MIDDLEWARES Y SEGURIDAD
// ============================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_ultra_secure_encryption_2026',
    resave: false,
    saveUninitialized: true
}));

// ============================================================
// 4. DISEÑO CSS PERSONALIZADO (EXTENSO)
// ============================================================
const html_styles = `
    <style>
        body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .contenedor {
            max-width: 600px;
            margin: 0 auto;
        }
        .tarjeta-raizoma {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .titulo-principal {
            color: #3b82f6;
            text-align: center;
            font-weight: 800;
        }
        .wallet-box {
            background-color: #0f172a;
            border: 2px dashed #3b82f6;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 20px;
        }
        .wallet-address {
            color: #10b981;
            font-family: monospace;
            font-size: 16px;
            word-break: break-all;
            font-weight: bold;
        }
        .input-form {
            background-color: #0f172a;
            color: white;
            border: 1px solid #334155;
            padding: 14px;
            border-radius: 12px;
            width: 100%;
            margin-bottom: 18px;
            font-size: 15px;
            box-sizing: border-box;
        }
        .btn-accion {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            width: 100%;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
        }
        .btn-accion:hover { background-color: #2563eb; }
        .barra-progreso-bg {
            background-color: #0f172a;
            border-radius: 50px;
            height: 20px;
            width: 100%;
            border: 1px solid #334155;
            margin: 15px 0;
            overflow: hidden;
        }
        .barra-progreso-fill {
            background: linear-gradient(90deg, #3b82f6, #10b981);
            height: 100%;
            transition: width 1s ease;
        }
        .tabla-estilizada {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        .tabla-estilizada th, .tabla-estilizada td {
            padding: 12px;
            border-bottom: 1px solid #334155;
            text-align: left;
        }
        .badge-activo { color: #10b981; font-weight: bold; }
        .badge-pendiente { color: #f59e0b; font-weight: bold; }
    </style>
`;

// ============================================================
// 5. RUTAS DE NAVEGACIÓN Y REGISTRO ACTUALIZADO
// ============================================================

// --- LOGIN ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>${html_styles}</head><body style="display:flex; align-items:center; justify-content:center; height:90vh;">
        <div class="tarjeta-raizoma" style="width:380px;">
            <h1 class="titulo-principal">🌳 Raízoma</h1>
            <form action="/login" method="POST">
                <input type="text" name="user" class="input-form" placeholder="Usuario" required>
                <input type="password" name="pass" class="input-form" placeholder="Contraseña" required>
                <button type="submit" class="btn-accion">ENTRAR</button>
            </form>
            <p style="text-align:center; margin-top:20px;"><a href="/registro" style="color:#64748b; text-decoration:none;">Crear cuenta nueva</a></p>
        </div>
    </body></html>`);
});

// --- REGISTRO ACTUALIZADO CON PAQUETES Y WALLET FIJA ---
app.get('/registro', (req, res) => {
    const ref_code = req.query.ref || '';
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro - Raízoma</title>
            ${html_styles}
        </head>
        <body>
            <div class="contenedor">
                <div class="tarjeta-raizoma">
                    <h2 class="titulo-principal">Inscripción Raízoma</h2>
                    
                    <div class="wallet-box">
                        <small style="color: #3b82f6; font-weight: bold; display: block; margin-bottom: 5px;">PAGO EN USDT (RED TRC20)</small>
                        <div class="wallet-address" id="wallet">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</div>
                        <button onclick="copyWallet()" style="background:none; border:none; color:#64748b; font-size:12px; cursor:pointer; margin-top:5px;">[Copiar Wallet]</button>
                    </div>

                    <form action="/registro" method="POST">
                        <input type="hidden" name="patrocinador" value="${ref_code}">
                        
                        <label style="color:#94a3b8; font-size:13px;">Nombre Completo</label>
                        <input type="text" name="nombre" class="input-form" required>
                        
                        <label style="color:#94a3b8; font-size:13px;">Nombre de Usuario</label>
                        <input type="text" name="usuario" class="input-form" required>
                        
                        <label style="color:#94a3b8; font-size:13px;">Contraseña</label>
                        <input type="password" name="password" class="input-form" required>
                        
                        <label style="color:#94a3b8; font-size:13px;">Selecciona tu Modalidad:</label>
                        <select name="plan" class="input-form">
                            <option value="RZ Metabolico Cap. $300">RZ Metabolico Cap. - $300 MXN</option>
                            <option value="RZ Origen $600">RZ Origen - $600 MXN</option>
                            <option value="Membresia + RZ Origen $1,700">Membresia + RZ Origen - $1,700 MXN</option>
                            <option value="PQT Fundador $15,000">PQT Fundador - $15,000 MXN</option>
                        </select>
                        
                        <label style="color:#94a3b8; font-size:13px;">Hash de Pago (TxID)</label>
                        <input type="text" name="hash" class="input-form" placeholder="Ingresa el comprobante de red" required>
                        
                        <label style="color:#94a3b8; font-size:13px;">Dirección de Envío</label>
                        <textarea name="direccion" class="input-form" style="height: 80px;" required></textarea>
                        
                        <button type="submit" class="btn-accion">ENVIAR INSCRIPCIÓN</button>
                    </form>
                </div>
            </div>
            <script>
                function copyWallet() {
                    var range = document.createRange();
                    range.selectNode(document.getElementById("wallet"));
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    alert("Wallet copiada!");
                }
            </script>
        </body>
        </html>
    `);
});

// --- DASHBOARD (MANTENIDO) ---
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    db.all("SELECT nombre, plan, estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        let total_inv = invitados ? invitados.length : 0;
        let activos_inv = 0;
        let lista_html = "";

        if (invitados) {
            for (let i = 0; i < invitados.length; i++) {
                if (invitados[i].estado === 'activo') activos_inv++;
                lista_html += `<tr><td>${invitados[i].nombre}</td><td>${invitados[i].plan}</td><td class="${invitados[i].estado === 'activo' ? 'badge-activo' : 'badge-pendiente'}">${invitados[i].estado}</td></tr>`;
            }
        }

        let pv = s.puntos || 0;
        let meta = pv >= 400 ? 400 : (pv >= 200 ? 400 : (pv >= 100 ? 200 : 100));
        let porc = (pv / meta) * 100;

        res.send(`<!DOCTYPE html><html><head>${html_styles}</head><body><div class="contenedor">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3>Socio: <span style="color:#3b82f6;">${s.nombre}</span></h3>
                <a href="/logout" style="color:#ef4444; text-decoration:none;">Salir</a>
            </div>

            <div class="tarjeta-raizoma">
                <div style="display:flex; justify-content:space-between;"><span>Progreso de Bono</span><b>${pv} / ${meta} PV</b></div>
                <div class="barra-progreso-bg"><div class="barra-progreso-fill" style="width:${porc}%;"></div></div>
            </div>

            <div class="tarjeta-raizoma" style="border-left: 5px solid #10b981;">
                <small>Balance para Cobro</small>
                <div style="font-size:28px; font-weight:bold; color:#10b981;">$${s.balance} MXN</div>
                ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? '<a href="#form-retiro" class="btn-accion" style="display:block; text-align:center; text-decoration:none; margin-top:10px;">SOLICITAR PAGO</a>' : ''}
                ${s.solicitud_retiro === 'si' ? '<p class="badge-pendiente">Retiro en proceso...</p>' : ''}
            </div>

            ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? `
            <div id="form-retiro" class="tarjeta-raizoma">
                <h4>Solicitud de Retiro</h4>
                <form action="/enviar-solicitud-retiro" method="POST">
                    <textarea name="datos_pago" class="input-form" placeholder="Datos bancarios o Wallet USDT..." required></textarea>
                    <button type="submit" class="btn-accion" style="background:#10b981;">ENVIAR SOLICITUD</button>
                </form>
            </div>` : ''}

            <div class="tarjeta-raizoma">
                <small>Enlace de Referido</small>
                <input type="text" class="input-form" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly>
                <h4 style="margin-top:20px; text-align:center;">Mi Equipo (${total_inv})</h4>
                <table class="tabla-estilizada">
                    <thead><tr><th>Socio</th><th>Plan</th><th>Estado</th></tr></thead>
                    <tbody>${lista_html || '<tr><td colspan="3">Sin invitados</td></tr>'}</tbody>
                </table>
            </div>

            ${s.usuario === 'ADMINRZ' ? '<a href="/codigo-1-panel" class="btn-accion" style="display:block; text-align:center; text-decoration:none; background:#f59e0b;">PANEL ADMIN</a>' : ''}
        </div></body></html>`);
    });
});

// ============================================================
// 6. PROCESAMIENTO Y PANEL ADMIN
// ============================================================

app.post('/login', (req, res) => {
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [req.body.user, req.body.pass], (err, row) => {
        if (row) { req.session.socio = row; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Error'); window.location='/';</script>"); }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion], (err) => {
            res.send("<body style='background:#0f172a; color:white; text-align:center; padding-top:50px;'><h1>Registro Recibido</h1><p>En espera de activación.</p><a href='/'>Volver</a></body>");
        });
});

app.post('/enviar-solicitud-retiro', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", [req.body.datos_pago, req.session.socio.id], () => {
        res.send("<script>alert('Enviado'); window.location='/dashboard';</script>");
    });
});

app.get('/codigo-1-panel', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');
    db.all("SELECT * FROM socios", (err, rows) => {
        let f = "";
        for (let j = 0; j < rows.length; j++) {
            let r = rows[j];
            let bg = r.solicitud_retiro === 'si' ? "background:#450a0a;" : "";
            f += `<tr style="${bg}">
                <td>${r.nombre}<br><small>${r.usuario}</small></td>
                <td>${r.plan}</td>
                <td>$${r.balance}</td>
                <td>${r.estado}</td>
                <td>
                    <a href="/aprobar-socio/${r.id}" style="color:#3b82f6;">Activar</a> | 
                    <a href="/desactivar-socio/${r.id}" style="color:#ef4444;">Baja</a> | 
                    <a href="/marcar-pagado/${r.id}" style="color:#10b981;">Pagado</a>
                </td>
            </tr>`;
        }
        res.send(`<!DOCTYPE html><html><head>${html_styles}</head><body>
            <div class="tarjeta-raizoma" style="max-width:900px; margin:auto;">
                <h2>Panel Maestro</h2>
                <table class="tabla-estilizada">
                    <thead><tr><th>Socio</th><th>Plan</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody>${f}</tbody>
                </table>
                <br><a href="/dashboard">Cerrar Panel</a>
            </div>
        </body></html>`);
    });
});

app.get('/aprobar-socio/:id', (req, res) => {
    const sId = req.params.id;
    db.get("SELECT patrocinador_id, estado FROM socios WHERE id = ?", [sId], (err, row) => {
        if (row && row.estado !== 'activo' && row.patrocinador_id) {
            db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [row.patrocinador_id], () => {
                db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [row.patrocinador_id], (err, p) => {
                    let meta = p.puntos >= 400 ? 9000 : (p.puntos >= 200 ? 4500 : (p.puntos >= 100 ? 1500 : 0));
                    let dif = meta - p.bono_cobrado;
                    if (dif > 0) db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [dif, dif, row.patrocinador_id]);
                });
            });
        }
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [sId], () => res.redirect('/codigo-1-panel'));
    });
});

app.get('/desactivar-socio/:id', (req, res) => {
    db.run("UPDATE socios SET estado = 'pendiente' WHERE id = ?", [req.params.id], () => res.redirect('/codigo-1-panel'));
});

app.get('/marcar-pagado/:id', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0, detalles_retiro = NULL WHERE id = ?", [req.params.id], () => res.redirect('/codigo-1-panel'));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.listen(port, () => console.log(`Raízoma V.MODALIDADES en puerto ${port}`));