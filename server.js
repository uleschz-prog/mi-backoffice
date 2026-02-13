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
        console.error("*****************************************");
        console.error("ERROR CRÍTICO AL ABRIR LA BASE DE DATOS:");
        console.error(err.message);
        console.error("*****************************************");
    } else {
        console.log("-----------------------------------------");
        console.log("CONEXIÓN EXITOSA: /data/raizoma.db");
        console.log("SISTEMA RAÍZOMA V.MAX DEFINITIVO 2026");
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

    // Asegurar que las columnas existan (Actualización forzada)
    db.run("ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN detalles_retiro TEXT", (err) => {});

    // --- GENERACIÓN DEL ADMIN MAESTRO ---
    const masterUser = 'ADMINRZ';
    const masterPass = 'ROOT'; 
    db.get("SELECT * FROM socios WHERE usuario = ?", [masterUser], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO socios (nombre, usuario, password, estado, plan, balance, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    ['Administrador Maestro', masterUser, masterPass, 'activo', 'MASTER', 0, 0]);
        }
    });
});

// ============================================================
// 3. MIDDLEWARES Y SEGURIDAD DE SESIÓN
// ============================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_super_secret_encryption_key_vmax_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// ============================================================
// 4. DISEÑO CSS PROFESIONAL (EXTENSO Y SIN RECORTES)
// ============================================================
const html_styles = `
    <style>
        :root {
            --bg-deep: #0b0f19;
            --bg-card: #161d2f;
            --bg-input: #0b0f19;
            --accent-blue: #3b82f6;
            --accent-green: #10b981;
            --accent-yellow: #f59e0b;
            --accent-red: #ef4444;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        body {
            background-color: var(--bg-deep);
            color: var(--text-main);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            line-height: 1.6;
        }

        .contenedor-principal {
            width: 100%;
            max-width: 550px;
        }

        .tarjeta {
            background: var(--bg-card);
            border: 1px solid #2d3748;
            border-radius: 24px;
            padding: 28px;
            margin-bottom: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.6);
            transition: transform 0.3s ease;
        }

        .titulo-seccion {
            color: var(--accent-blue);
            font-weight: 800;
            font-size: 22px;
            text-align: center;
            margin-bottom: 25px;
            letter-spacing: -0.5px;
        }

        /* DISEÑO DE CÍRCULOS DE EQUIPO */
        .grid-equipo {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }

        .circulo-stats {
            text-align: center;
            background: rgba(255,255,255,0.03);
            padding: 15px 5px;
            border-radius: 20px;
            border: 1px solid #2d3748;
        }

        .stat-numero {
            display: block;
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 4px;
        }

        .stat-nombre {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 1px;
            color: var(--text-muted);
        }

        /* COLORES DINÁMICOS */
        .color-blue { color: var(--accent-blue); }
        .color-green { color: var(--accent-green); }
        .color-yellow { color: var(--accent-yellow); }

        /* TERMÓMETRO DE PUNTOS */
        .meta-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .progreso-container {
            background: var(--bg-deep);
            border-radius: 50px;
            height: 16px;
            width: 100%;
            border: 1px solid #2d3748;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }

        .progreso-fill {
            background: linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-green) 100%);
            height: 100%;
            border-radius: 50px;
            transition: width 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }

        /* FORMULARIOS Y BOTONES */
        .wallet-banner {
            background: rgba(59, 130, 246, 0.1);
            border: 2px dashed var(--accent-blue);
            padding: 20px;
            border-radius: 18px;
            text-align: center;
            margin-bottom: 25px;
        }

        .input-raizoma {
            background: var(--bg-input);
            color: white;
            border: 1px solid #2d3748;
            padding: 16px;
            border-radius: 14px;
            width: 100%;
            margin-bottom: 18px;
            box-sizing: border-box;
            font-size: 15px;
            transition: border-color 0.3s;
        }

        .input-raizoma:focus {
            border-color: var(--accent-blue);
            outline: none;
        }

        .btn-primario {
            background: var(--accent-blue);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 14px;
            width: 100%;
            font-weight: 800;
            cursor: pointer;
            font-size: 16px;
            text-transform: uppercase;
            transition: 0.3s;
        }

        .btn-primario:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);
        }

        .tabla-backoffice {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .tabla-backoffice th {
            text-align: left;
            color: var(--text-muted);
            font-size: 11px;
            text-transform: uppercase;
            padding: 12px;
            border-bottom: 2px solid #2d3748;
        }

        .tabla-backoffice td {
            padding: 14px 12px;
            border-bottom: 1px solid #1e293b;
            font-size: 14px;
        }

        .badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .badge-activo { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
        .badge-pendiente { background: rgba(245, 158, 11, 0.1); color: var(--accent-yellow); }
    </style>
`;

// ============================================================
// 5. RUTAS DEL SISTEMA
// ============================================================

// --- PÁGINA DE LOGIN ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${html_styles}</head><body>
        <div class="contenedor-principal" style="margin-top: 80px;">
            <div class="tarjeta">
                <h1 class="titulo-seccion">🌳 Raízoma Backoffice</h1>
                <form action="/login" method="POST">
                    <input type="text" name="user" class="input-raizoma" placeholder="Usuario de acceso" required>
                    <input type="password" name="pass" class="input-raizoma" placeholder="Tu contraseña" required>
                    <button type="submit" class="btn-primario">Iniciar Sesión</button>
                </form>
                <div style="text-align:center; margin-top:25px;">
                    <a href="/registro" style="color:var(--text-muted); text-decoration:none; font-size:14px;">¿No tienes cuenta? <span style="color:var(--accent-blue);">Regístrate aquí</span></a>
                </div>
            </div>
        </div>
    </body></html>`);
});

// --- DASHBOARD V.MAX (CONTADORES Y TERMÓMETRO) ---
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    db.all("SELECT nombre, plan, estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        let n_totales = invitados ? invitados.length : 0;
        let n_activos = 0;
        let n_pendientes = 0;
        let equipo_html = "";

        if (invitados) {
            invitados.forEach(inv => {
                if (inv.estado === 'activo') n_activos++;
                else n_pendientes++;
                equipo_html += `<tr>
                    <td>${inv.nombre}</td>
                    <td><small>${inv.plan}</small></td>
                    <td><span class="badge ${inv.estado === 'activo' ? 'badge-activo' : 'badge-pendiente'}">${inv.estado}</span></td>
                </tr>`;
            });
        }

        // LÓGICA DE TERMÓMETRO - META 400 PV
        let pv = s.puntos || 0;
        let meta = 100;
        if (pv >= 400) meta = 400;
        else if (pv >= 200) meta = 400;
        else if (pv >= 100) meta = 200;
        
        let porc = (pv / meta) * 100;
        if (porc > 100) porc = 100;

        res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${html_styles}</head><body>
            <div class="contenedor-principal">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <h2 style="margin:0; font-size:20px;">Bienvenido, <span class="color-blue">${s.nombre}</span></h2>
                    <a href="/logout" style="color:var(--accent-red); text-decoration:none; font-weight:bold; font-size:14px;">CERRAR SESIÓN</a>
                </div>

                <div class="grid-equipo">
                    <div class="circulo-stats"><span class="stat-numero color-blue">${n_totales}</span><span class="stat-nombre">Totales</span></div>
                    <div class="circulo-stats"><span class="stat-numero color-green">${n_activos}</span><span class="stat-nombre">Activos</span></div>
                    <div class="circulo-stats"><span class="stat-numero color-yellow">${n_pendientes}</span><span class="stat-nombre">Espera</span></div>
                </div>

                <div class="tarjeta">
                    <div class="meta-header">
                        <span style="font-size:14px; color:var(--text-muted);">PUNTOS ACUMULADOS</span>
                        <span class="color-blue" style="font-size:20px;">${pv} / ${meta} PV</span>
                    </div>
                    <div class="progreso-container"><div class="progreso-fill" style="width:${porc}%"></div></div>
                    <p style="text-align:center; font-size:12px; color:var(--text-muted); margin-top:10px;">
                        ${pv >= 400 ? '¡Meta Máxima Alcanzada!' : `Te faltan ${meta - pv} puntos para tu siguiente nivel.`}
                    </p>
                </div>

                <div class="tarjeta" style="border-left: 6px solid var(--accent-green);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <small style="color:var(--text-muted); font-weight:bold;">BALANCE PARA COBRO</small>
                            <div style="font-size:32px; font-weight:900; color:var(--accent-green);">$${s.balance} MXN</div>
                        </div>
                        ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? '<a href="#form-retiro" class="badge badge-activo" style="padding:10px 15px; cursor:pointer; text-decoration:none;">SOLICITAR</a>' : ''}
                    </div>
                </div>

                ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? `
                <div id="form-retiro" class="tarjeta">
                    <h3 class="color-green" style="margin-top:0;">Solicitar Pago</h3>
                    <form action="/enviar-solicitud-retiro" method="POST">
                        <label style="font-size:12px; color:var(--text-muted);">Datos Bancarios o Billetera USDT:</label>
                        <textarea name="datos_pago" class="input-raizoma" style="height:100px; margin-top:8px;" placeholder="Banco, CLABE, Nombre del titular..." required></textarea>
                        <button type="submit" class="btn-primario" style="background:var(--accent-green);">Confirmar Solicitud</button>
                    </form>
                </div>` : ''}

                <div class="tarjeta">
                    <h4 style="margin-top:0;">Enlace de Invitación</h4>
                    <input type="text" class="input-raizoma" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly>
                    
                    <h4 style="text-align:center; margin:30px 0 15px 0;">MI RED DIRECTA</h4>
                    <div style="max-height:300px; overflow-y:auto;">
                        <table class="tabla-backoffice">
                            <thead><tr><th>Nombre</th><th>Paquete</th><th>Estado</th></tr></thead>
                            <tbody>${equipo_html || '<tr><td colspan="3" style="text-align:center;">No tienes invitados directos aún.</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>

                ${s.usuario === 'ADMINRZ' ? '<a href="/codigo-1-panel" class="btn-primario" style="background:var(--accent-yellow); margin-top:10px; display:block; text-align:center; text-decoration:none;">ENTRAR AL PANEL MAESTRO</a>' : ''}
            </div>
        </body></html>`);
    });
});

// --- PÁGINA DE REGISTRO (CON WALLET FIJA Y PAQUETES) ---
app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${html_styles}</head><body>
        <div class="contenedor-principal">
            <div class="tarjeta">
                <h2 class="titulo-seccion">Registro de Nuevo Socio</h2>
                
                <div class="wallet-banner">
                    <small style="color:var(--accent-blue); font-weight:bold;">PAGO USDT (TRC20)</small>
                    <div id="w-copy" style="color:var(--accent-green); font-family:monospace; font-size:15px; font-weight:bold; margin:8px 0;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</div>
                    <button onclick="copyW()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px;">[Copiar Dirección]</button>
                </div>

                <form action="/registro" method="POST">
                    <input type="hidden" name="patrocinador" value="${ref}">
                    <input type="text" name="nombre" class="input-raizoma" placeholder="Nombre y Apellido" required>
                    <input type="text" name="usuario" class="input-raizoma" placeholder="Crea un nombre de usuario" required>
                    <input type="password" name="password" class="input-raizoma" placeholder="Contraseña segura" required>
                    
                    <label style="color:var(--text-muted); font-size:12px; padding-left:5px;">Elige tu modalidad:</label>
                    <select name="plan" class="input-raizoma" style="height:60px; margin-top:5px;">
                        <option value="RZ Metabolico Cap. $300">RZ Metabolico Cap. - $300 MXN</option>
                        <option value="RZ Origen $600">RZ Origen - $600 MXN</option>
                        <option value="Membresia + RZ Origen $1,700">Membresia + RZ Origen - $1,700 MXN</option>
                        <option value="PQT Fundador $15,000">PQT Fundador - $15,000 MXN</option>
                    </select>

                    <input type="text" name="hash" class="input-raizoma" placeholder="Hash de Pago / TxID" required>
                    <textarea name="direccion" class="input-raizoma" style="height:80px;" placeholder="Dirección completa para envío de productos" required></textarea>
                    
                    <button type="submit" class="btn-primario">Finalizar Registro</button>
                </form>
            </div>
        </div>
        <script>function copyW(){var r=document.createRange();r.selectNode(document.getElementById("w-copy"));window.getSelection().removeAllRanges();window.getSelection().addRange(r);document.execCommand("copy");alert("Dirección copiada exitosamente.");}</script>
    </body></html>`);
});

// ============================================================
// 6. CONTROLADORES POST
// ============================================================

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) { req.session.socio = row; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Error: Usuario o clave incorrectos.'); window.location='/';</script>"); }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion], (err) => {
            res.send("<body style='background:#0b0f19; color:white; text-align:center; padding-top:100px;'><h1>¡Registro Enviado!</h1><p>Tu cuenta se activará al confirmar el pago en el sistema.</p><a href='/' style='color:#3b82f6;'>Regresar</a></body>");
        });
});

app.post('/enviar-solicitud-retiro', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", [req.body.datos_pago, req.session.socio.id], () => {
        res.send("<script>alert('Solicitud enviada correctamente.'); window.location='/dashboard';</script>");
    });
});

// ============================================================
// 7. PANEL ADMINISTRATIVO (CON BOTÓN DESACTIVAR)
// ============================================================

app.get('/codigo-1-panel', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');
    db.all("SELECT * FROM socios", (err, rows) => {
        let f = "";
        rows.forEach(r => {
            let row_style = r.solicitud_retiro === 'si' ? "background:rgba(239, 68, 68, 0.1);" : "";
            f += `<tr style="${row_style}">
                <td>${r.nombre}<br><small>${r.usuario}</small></td>
                <td><small>${r.plan}</small></td>
                <td class="color-green" style="font-weight:bold;">$${r.balance}</td>
                <td><small style="font-size:10px;">${r.detalles_retiro || 'N/A'}</small></td>
                <td>
                    <a href="/aprobar-socio/${r.id}" style="color:var(--accent-blue); text-decoration:none; font-weight:bold;">ACTIVAR</a><br>
                    <a href="/desactivar-socio/${r.id}" style="color:var(--accent-red); text-decoration:none; font-size:11px;">DESACTIVAR</a><br>
                    <a href="/marcar-pagado/${r.id}" style="color:var(--accent-green); text-decoration:none; font-weight:bold;">PAGADO</a>
                </td>
            </tr>`;
        });
        res.send(`<!DOCTYPE html><html><head>${html_styles}</head><body>
            <div class="tarjeta" style="max-width:950px; margin:auto; width:95%;">
                <h2 class="titulo-seccion">Panel de Administración Raízoma</h2>
                <div style="overflow-x:auto;">
                    <table class="tabla-backoffice">
                        <thead><tr><th>Socio</th><th>Modalidad</th><th>Balance</th><th>Retiro</th><th>Acciones</th></tr></thead>
                        <tbody>${f}</tbody>
                    </table>
                </div>
                <br><a href="/dashboard" class="btn-primario" style="display:block; text-align:center; text-decoration:none;">Cerrar Panel</a>
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

// ============================================================
// 8. LANZAMIENTO
// ============================================================
app.listen(port, () => {
    console.log("==========================================");
    console.log("SERVIDOR RAÍZOMA V.MAX PROTECTED 2026 ACTIVADO");
    console.log(`PUERTO: ${port} | META PV: 400`);
    console.log("==========================================");
});