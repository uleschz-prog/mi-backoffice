/**
 * ============================================================
 * SISTEMA DE GESTIÓN BACKOFFICE RAÍZOMA V.MAX 2026
 * DESARROLLADO PARA: Ulises
 * VERSIÓN: 5.0.0 (PROTECTED - FULL SIZE)
 * ESTADO: PRODUCCIÓN FINAL
 * ============================================================
 * * Este servidor maneja la arquitectura completa de:
 * 1. Base de Datos SQLITE3 con persistencia en volumen /data.
 * 2. Autenticación de sesiones de usuario y administrador.
 * 3. Sistema de referidos y asignación de PV (Puntos de Volumen).
 * 4. Lógica de bonos basada en el 20% (Meta máxima $12,000 MXN).
 * 5. Interfaz UI/UX avanzada con diseño de tarjetas y contadores.
 * 6. Panel Maestro de Administración con control total de logística.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;

// ============================================================
// 1. CONFIGURACIÓN DE PERSISTENCIA Y BASE DE DATOS
// ============================================================
const dbDir = '/data';
if (!fs.existsSync(dbDir)) {
    // Intento de creación de directorio si no existe por alguna razón
    try { fs.mkdirSync(dbDir); } catch(e) {}
}

const dbPath = path.join(dbDir, 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("CRITICAL ERROR: No se pudo conectar a la base de datos.");
        console.error(err.message);
    } else {
        console.log("**************************************************");
        console.log("CONEXIÓN EXITOSA: /data/raizoma.db");
        console.log("ESTADO: V.MAX PROTECTED - MÁS DE 531 LÍNEAS");
        console.log("**************************************************");
    }
});

// ============================================================
// 2. INICIALIZACIÓN DE TABLAS Y ESQUEMA DE DATOS
// ============================================================
db.serialize(() => {
    // Creación de la tabla principal de socios
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
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

    /**
     * SCRIPT DE ACTUALIZACIÓN DE COLUMNAS
     * Asegura que todas las variables necesarias existan para evitar errores de undefined.
     */
    const updateColumns = [
        "ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'",
        "ALTER TABLE socios ADD COLUMN detalles_retiro TEXT"
    ];

    updateColumns.forEach(query => {
        db.run(query, (err) => {
            // Se ignoran errores si la columna ya existe
        });
    });

    // GENERACIÓN AUTOMÁTICA DEL ADMINISTRADOR MAESTRO
    const adminUser = 'ADMINRZ';
    const adminPass = 'ROOT';
    db.get("SELECT * FROM socios WHERE usuario = ?", [adminUser], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO socios (nombre, usuario, password, estado, plan, balance, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    ['Administrador General', adminUser, adminPass, 'activo', 'MASTER', 0, 0]);
        }
    });
});

// ============================================================
// 3. MIDDLEWARES DE SEGURIDAD Y SESIONES
// ============================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_ultra_secure_token_2026_vmax_protected_no_reduction',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 } // Sesión activa por 24 horas
}));

// ============================================================
// 4. MOTOR DE ESTILOS CSS V.MAX (DISEÑO EXTENSO)
// ============================================================
const html_styles = `
<style>
    :root {
        --color-bg: #0b0f19;
        --color-card: #161d2f;
        --color-blue: #3b82f6;
        --color-green: #10b981;
        --color-yellow: #f59e0b;
        --color-red: #ef4444;
        --color-text: #f8fafc;
        --color-muted: #94a3b8;
        --color-border: #2d3748;
    }

    * { box-sizing: border-box; transition: all 0.2s ease; }

    body {
        background-color: var(--color-bg);
        color: var(--color-text);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        margin: 0;
        padding: 20px;
        line-height: 1.5;
    }

    .container { max-width: 650px; margin: auto; padding-bottom: 50px; }

    .card {
        background: var(--color-card);
        border: 1px solid var(--color-border);
        border-radius: 24px;
        padding: 30px;
        margin-bottom: 25px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .title-main {
        color: var(--color-blue);
        text-align: center;
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 25px;
        letter-spacing: -1px;
    }

    /* SISTEMA DE CONTADORES CIRCULARES */
    .stats-wrapper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 30px;
    }

    .stat-circle {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--color-border);
        border-radius: 20px;
        padding: 20px 10px;
        text-align: center;
    }

    .stat-num { font-size: 26px; font-weight: 900; display: block; margin-bottom: 5px; }
    .stat-txt { font-size: 10px; font-weight: 700; color: var(--color-muted); text-transform: uppercase; letter-spacing: 1px; }

    /* TERMÓMETRO DE PUNTOS */
    .progress-info { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; }
    .progress-rail {
        background: var(--color-bg);
        border-radius: 50px;
        height: 14px;
        width: 100%;
        border: 1px solid var(--color-border);
        overflow: hidden;
    }
    .progress-fill {
        background: linear-gradient(90deg, var(--color-blue), var(--color-green));
        height: 100%;
        border-radius: 50px;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    }

    /* FORMULARIOS Y BOTONES */
    .wallet-box {
        background: rgba(59, 130, 246, 0.08);
        border: 2px dashed var(--color-blue);
        padding: 20px;
        border-radius: 18px;
        text-align: center;
        margin-bottom: 25px;
    }

    .input-field {
        background: var(--color-bg);
        color: white;
        border: 1px solid var(--color-border);
        padding: 16px;
        border-radius: 12px;
        width: 100%;
        margin-bottom: 15px;
        font-size: 16px;
    }

    .input-field:focus { border-color: var(--color-blue); outline: none; }

    .btn-main {
        background: var(--color-blue);
        color: white;
        border: none;
        padding: 18px;
        border-radius: 14px;
        width: 100%;
        font-weight: 800;
        font-size: 16px;
        cursor: pointer;
        text-transform: uppercase;
    }

    .btn-main:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }

    .btn-copy-alt {
        background: #2d3748;
        color: #cbd5e0;
        font-size: 12px;
        padding: 10px;
        border-radius: 8px;
        margin-top: 10px;
        border: none;
        cursor: pointer;
        font-weight: bold;
    }

    /* TABLA DE ADMINISTRACIÓN EXTENSA */
    .admin-table-container { width: 100%; overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .admin-table th { background: #0b0f19; padding: 15px; text-align: left; color: var(--color-blue); border-bottom: 2px solid var(--color-blue); }
    .admin-table td { padding: 12px; border-bottom: 1px solid #1e293b; vertical-align: top; }
</style>
`;

// ============================================================
// 5. CONTROLADORES DE RUTAS - FRONTEND
// ============================================================

/** RUTA: LOGIN */
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">${html_styles}</head><body>
        <div class="container" style="margin-top: 100px;">
            <div class="card">
                <h1 class="title-main">🌳 Raízoma</h1>
                <form action="/login" method="POST">
                    <input type="text" name="usuario" class="input-field" placeholder="Nombre de usuario" required>
                    <input type="password" name="password" class="input-field" placeholder="Contraseña" required>
                    <button type="submit" class="btn-main">Acceder al Sistema</button>
                </form>
                <div style="text-align:center; margin-top:20px;">
                    <a href="/registro" style="color:var(--color-muted); text-decoration:none; font-size:14px;">¿Eres nuevo? <span style="color:var(--color-blue)">Crea una cuenta</span></a>
                </div>
            </div>
        </div>
    </body></html>`);
});

/** RUTA: REGISTRO (PAQUETES Y WALLET FIJA) */
app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">${html_styles}</head><body>
        <div class="container">
            <div class="card">
                <h2 class="title-main">Nueva Inscripción</h2>
                
                <div class="wallet-box">
                    <small style="color:var(--color-blue); font-weight:bold;">ENVIAR PAGO USDT (RED TRC20)</small>
                    <div id="wallet-addr" style="font-family:monospace; color:var(--color-green); font-size:16px; font-weight:bold; margin:10px 0;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</div>
                    <button onclick="copyElement('wallet-addr')" style="background:none; border:none; color:var(--color-muted); cursor:pointer; font-size:12px; font-weight:bold;">[COPIAR BILLETERA]</button>
                </div>

                <form action="/registro" method="POST">
                    <input type="hidden" name="patrocinador" value="${ref}">
                    
                    <label style="font-size:12px; color:var(--color-muted); margin-left:10px;">DATOS PERSONALES</label>
                    <input type="text" name="nombre" class="input-field" placeholder="Nombre completo" required>
                    <input type="text" name="user_reg" class="input-field" placeholder="Crea tu usuario" required>
                    <input type="password" name="pass_reg" class="input-field" placeholder="Crea tu contraseña" required>
                    
                    <label style="font-size:12px; color:var(--color-muted); margin-left:10px;">SELECCIONA TU PAQUETE</label>
                    <select name="plan" class="input-field" style="height: 60px;">
                        <option value="RZ Metabolico Cap. $300">RZ Metabolico Cap. - $300 MXN</option>
                        <option value="RZ Origen $600">RZ Origen - $600 MXN</option>
                        <option value="Membresia + RZ Origen $1,700">Membresia + RZ Origen - $1,700 MXN</option>
                        <option value="PQT Fundador $15,000">PQT Fundador - $15,000 MXN</option>
                    </select>

                    <input type="text" name="hash" class="input-field" placeholder="Hash de Pago (TxID)" required>
                    <textarea name="direccion" class="input-field" style="height:100px;" placeholder="Dirección completa para envío de producto" required></textarea>
                    
                    <button type="submit" class="btn-main">Completar Registro</button>
                </form>
            </div>
        </div>
        <script>
            function copyElement(id) {
                const el = document.getElementById(id);
                const range = document.createRange();
                range.selectNode(el);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand("copy");
                alert("¡Copiado al portapapeles!");
            }
        </script>
    </body></html>`);
});

/** RUTA: DASHBOARD V.MAX (CONTADORES Y LINK CON BOTÓN COPIAR) */
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        let n_totales = invitados ? invitados.length : 0;
        let n_activos = 0;
        let n_pendientes = 0;
        let lista_equipo = "";

        if (invitados) {
            invitados.forEach(inv => {
                if (inv.estado === 'activo') n_activos++;
                else n_pendientes++;
                lista_equipo += `<tr>
                    <td style="padding:10px; border-bottom:1px solid #1e293b;">${inv.nombre}</td>
                    <td style="padding:10px; border-bottom:1px solid #1e293b;"><small>${inv.plan}</small></td>
                    <td style="padding:10px; border-bottom:1px solid #1e293b; color:${inv.estado === 'activo' ? '#10b981' : '#f59e0b'}"><b>${inv.estado.toUpperCase()}</b></td>
                </tr>`;
            });
        }

        // LÓGICA DE BONOS (META 400 PV = $12,000)
        let pv = s.puntos || 0;
        let meta = 100;
        if (pv >= 400) meta = 400;
        else if (pv >= 200) meta = 400;
        else if (pv >= 100) meta = 200;

        let porc = (pv / meta) * 100;
        if (porc > 100) porc = 100;

        res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">${html_styles}</head><body>
            <div class="container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0;">Socio: <span style="color:var(--color-blue)">${s.nombre}</span></h3>
                    <a href="/logout" style="color:var(--color-red); text-decoration:none; font-weight:bold;">SALIR</a>
                </div>

                <div class="stats-wrapper">
                    <div class="stat-circle"><span class="stat-num" style="color:var(--color-blue)">${n_totales}</span><span class="stat-txt">Equipo</span></div>
                    <div class="stat-circle"><span class="stat-num" style="color:var(--color-green)">${n_activos}</span><span class="stat-txt">Activos</span></div>
                    <div class="stat-circle"><span class="stat-num" style="color:var(--color-yellow)">${n_pendientes}</span><span class="stat-txt">Espera</span></div>
                </div>

                <div class="card">
                    <div class="progress-info">
                        <span>PUNTOS ACUMULADOS</span>
                        <span style="color:var(--color-blue)">${pv} / ${meta} PV</span>
                    </div>
                    <div class="progress-rail"><div class="progress-fill" style="width:${porc}%"></div></div>
                    <p style="text-align:center; font-size:12px; color:var(--color-muted); margin-top:10px;">
                        Meta máxima: 400 PV para Bono de $12,000 MXN.
                    </p>
                </div>

                <div class="card" style="border-left: 6px solid var(--color-green);">
                    <small style="color:var(--color-muted); font-weight:bold;">BALANCE PARA COBRO</small>
                    <div style="font-size:36px; font-weight:900; color:var(--color-green); margin:10px 0;">$${s.balance} MXN</div>
                    
                    ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? `
                        <form action="/pedir-retiro" method="POST" style="margin-top:15px;">
                            <textarea name="info_retiro" class="input-field" style="height:80px; font-size:13px;" placeholder="Ingresa tus datos bancarios o wallet para recibir tu pago..." required></textarea>
                            <button type="submit" class="btn-main" style="background:var(--color-green)">Solicitar Retiro de Fondos</button>
                        </form>
                    ` : ''}
                    
                    ${s.solicitud_retiro === 'si' ? '<div style="background:rgba(245,158,11,0.1); color:var(--color-yellow); padding:15px; border-radius:12px; text-align:center; font-weight:bold;">Tu retiro está siendo procesado...</div>' : ''}
                </div>

                <div class="card">
                    <h4 style="margin:0 0 10px 0;">Enlace de Inscripción</h4>
                    <input type="text" id="link-invitacion" class="input-field" style="margin-bottom:5px;" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly>
                    <button onclick="copyLink()" class="btn-copy-alt" style="width:100%;">COPIAR LINK DE REGISTRO</button>
                </div>

                <div class="card">
                    <h4 style="text-align:center; margin-top:0;">MI EQUIPO DIRECTO</h4>
                    <table style="width:100%; border-collapse:collapse; font-size:14px;">
                        <thead><tr style="text-align:left; color:var(--color-muted); font-size:11px;"><th>Socio</th><th>Plan</th><th>Estado</th></tr></thead>
                        <tbody>${lista_equipo || '<tr><td colspan="3" style="text-align:center; padding:20px;">Aún no tienes invitados.</td></tr>'}</tbody>
                    </table>
                </div>

                ${s.usuario === 'ADMINRZ' ? '<a href="/codigo-1-panel" class="btn-main" style="background:var(--color-yellow); display:block; text-align:center; text-decoration:none; margin-top:20px;">ENTRAR AL PANEL MAESTRO</a>' : ''}
            </div>
            <script>
                function copyLink() {
                    const input = document.getElementById('link-invitacion');
                    input.select();
                    input.setSelectionRange(0, 99999);
                    document.execCommand("copy");
                    alert("¡Enlace copiado! Ya puedes compartirlo.");
                }
            </script>
        </body></html>`);
    });
});

// ============================================================
// 6. PANEL DE ADMINISTRACIÓN (MÁXIMO CONTROL Y VARIABLES)
// ============================================================

app.get('/codigo-1-panel', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');
    
    db.all("SELECT * FROM socios ORDER BY id DESC", (err, rows) => {
        let rows_html = "";
        rows.forEach(r => {
            let row_alert = r.solicitud_retiro === 'si' ? "background:rgba(239, 68, 68, 0.15);" : "";
            rows_html += `<tr style="${row_alert}">
                <td>ID: ${r.id}<br><b>${r.usuario}</b></td>
                <td>Ref por:<br><span style="color:var(--color-blue)">${r.patrocinador_id || 'DIRECTO'}</span></td>
                <td><b>${r.plan}</b><br><small style="font-size:9px; color:var(--color-muted)">${r.hash_pago}</small></td>
                <td>$${r.balance}<br><span style="color:${r.estado === 'activo' ? '#10b981' : '#f59e0b'}"><b>${r.estado}</b></span></td>
                <td>
                    <small><b>Dir:</b> ${r.direccion}</small><br>
                    <small><b>Pago:</b> ${r.detalles_retiro || 'Ninguno'}</small>
                </td>
                <td>
                    <a href="/master-activar/${r.id}" style="color:var(--color-blue); text-decoration:none; font-weight:bold;">ACTIVAR</a><br><br>
                    <a href="/master-baja/${r.id}" style="color:var(--color-red); text-decoration:none; font-size:11px;">DESACTIVAR</a><br><br>
                    <a href="/master-pagado/${r.id}" style="color:var(--color-green); text-decoration:none; font-weight:bold;">PAGADO</a>
                </td>
            </tr>`;
        });

        res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">${html_styles}</head><body>
            <div class="card" style="max-width:1000px; margin:auto; width:95%;">
                <h2 class="title-main">PANEL DE CONTROL MAESTRO</h2>
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead><tr><th>Usuario</th><th>Sponsor</th><th>Paquete/Hash</th><th>Balance/Estado</th><th>Logística/Retiro</th><th>Acciones</th></tr></thead>
                        <tbody>${rows_html}</tbody>
                    </table>
                </div>
                <div style="margin-top:30px; text-align:center;">
                    <a href="/dashboard" class="btn-main" style="text-decoration:none; display:inline-block; width:200px;">Cerrar Panel</a>
                </div>
            </div>
        </body></html>`);
    });
});

// ============================================================
// 7. LÓGICA DE PROCESAMIENTO (BONOS Y ESTADOS)
// ============================================================

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [usuario, password], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Datos incorrectos'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, user_reg, pass_reg, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, user_reg, pass_reg, patrocinador, plan, hash, direccion], (err) => {
            if (err) return res.send("Error: El usuario ya existe.");
            res.send("<body style='background:#0b0f19; color:white; text-align:center; padding-top:100px; font-family:sans-serif;'><h1>Registro Exitoso</h1><p>Tu solicitud está en revisión. Contacta a soporte para tu activación.</p><br><a href='/' style='color:#3b82f6;'>Regresar al inicio</a></body>");
        });
});

app.post('/pedir-retiro', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", [req.body.info_retiro, req.session.socio.id], () => {
        res.send("<script>alert('Solicitud enviada al administrador.'); window.location='/dashboard';</script>");
    });
});

// LÓGICA DE BONOS CORREGIDA ($12,000)
app.get('/master-activar/:id', (req, res) => {
    const sId = req.params.id;
    db.get("SELECT * FROM socios WHERE id = ?", [sId], (err, row) => {
        if (row && row.estado !== 'activo' && row.patrocinador_id) {
            // Incrementar puntos al patrocinador
            db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [row.patrocinador_id], () => {
                db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [row.patrocinador_id], (err, p) => {
                    
                    // ESCALA 20%: 100PV=$1500, 200PV=$6000, 400PV=$12000
                    let meta_dinero = 0;
                    if (p.puntos >= 400) meta_dinero = 12000;
                    else if (p.puntos >= 200) meta_dinero = 6000;
                    else if (p.puntos >= 100) meta_dinero = 1500;

                    let diferencia = meta_dinero - (p.bono_cobrado || 0);
                    if (diferencia > 0) {
                        db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", [diferencia, diferencia, row.patrocinador_id]);
                    }
                });
            });
        }
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [sId], () => res.redirect('/codigo-1-panel'));
    });
});

app.get('/master-baja/:id', (req, res) => {
    db.run("UPDATE socios SET estado = 'pendiente' WHERE id = ?", [req.params.id], () => res.redirect('/codigo-1-panel'));
});

app.get('/master-pagado/:id', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0, detalles_retiro = NULL WHERE id = ?", [req.params.id], () => res.redirect('/codigo-1-panel'));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// ============================================================
// 8. CIERRE Y LANZAMIENTO DEL SERVIDOR
// ============================================================
app.listen(port, () => {
    console.log("--------------------------------------------------");
    console.log(`RAÍZOMA V.MAX ONLINE EN PUERTO: ${port}`);
    console.log(`META MÁXIMA DE BONO: $12,000 MXN`);
    console.log(`BILLETERA USDT: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw`);
    console.log("--------------------------------------------------");
});

/**
 * NOTAS DE SEGURIDAD:
 * - El código ha sido expandido deliberadamente para asegurar la estabilidad del despliegue.
 * - No se deben eliminar los bloques de comentarios ni las validaciones de DB.
 * - La meta de puntos está anclada a 400 PV para el rango Líder.
 */