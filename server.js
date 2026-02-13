/**
 * =========================================================================================
 * SISTEMA DE GESTIÓN BACKOFFICE RAÍZOMA V.MAX - VERSIÓN DE ALTA DISPONIBILIDAD
 * =========================================================================================
 * @autor: Ulises
 * @proyecto: Raízoma Multinivel
 * @version: 12.5.0 (ULTRA-EXTENDED)
 * -----------------------------------------------------------------------------------------
 * DESCRIPCIÓN TÉCNICA:
 * Este archivo contiene la lógica completa del servidor, gestión de base de datos SQLite,
 * sistema de sesiones persistentes y el motor de cálculo de bonos automáticos.
 * * LÓGICA DE BONOS (SISTEMA DE PUNTOS PV):
 * - 100 PV acumulados = Bono de $1,500 MXN.
 * - 200 PV acumulados = Bono de $6,000 MXN.
 * - 400 PV acumulados = Bono de $12,000 MXN.
 * * SEGURIDAD:
 * Se implementan capas de validación para evitar duplicidad de cobros y asegurar
 * que el balance se refresque en tiempo real en el dashboard del socio.
 * =========================================================================================
 */

// =========================================================================================
// 1. IMPORTACIÓN DE MÓDULOS DEL NÚCLEO
// =========================================================================================
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

/**
 * Inicialización de la aplicación Express
 */
const app = express();

/**
 * Puerto dinámico para Render o local
 */
const port = process.env.PORT || 10000;

// =========================================================================================
// 2. CONFIGURACIÓN DE PERSISTENCIA Y BASE DE DATOS
// =========================================================================================

/**
 * Directorio persistente /data obligatorio para entornos como Render.
 * Sin esto, los datos se borran cada vez que el servidor entra en reposo.
 */
const directorioData = '/data';

if (!fs.existsSync(directorioData)) {
    try {
        fs.mkdirSync(directorioData);
        console.log("LOG: Directorio /data creado para persistencia de base de datos.");
    } catch (err) {
        console.error("ALERTA: Error al crear el directorio de datos:", err);
    }
}

/**
 * Ruta de la base de datos SQLite3
 */
const dbPath = path.join(directorioData, 'raizoma_vmax_final.db');

/**
 * Conexión y creación de la estructura de tablas.
 */
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("ERROR DB:", err.message);
    } else {
        console.log("CONECTADO: Base de datos activa en " + dbPath);
    }
});

db.serialize(() => {
    /**
     * Tabla Maestra de Socios.
     * Incluye todas las métricas necesarias para el cálculo de volumen y bonos.
     */
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        whatsapp TEXT,
        fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP,
        patrocinador_id TEXT,
        plan TEXT,
        hash_pago TEXT,
        direccion TEXT,
        estado TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0,
        puntos INTEGER DEFAULT 0,
        volumen_red REAL DEFAULT 0,
        bono_cobrado REAL DEFAULT 0,
        solicitud_retiro TEXT DEFAULT 'no',
        detalles_retiro TEXT
    )`);

    /**
     * Script de actualización de columnas (Migración Automática).
     * Previene errores si el archivo de base de datos ya existía previamente.
     */
    const scriptsMigracion = [
        "ALTER TABLE socios ADD COLUMN whatsapp TEXT",
        "ALTER TABLE socios ADD COLUMN volumen_red REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'",
        "ALTER TABLE socios ADD COLUMN detalles_retiro TEXT",
        "ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0"
    ];

    scriptsMigracion.forEach((sql) => {
        db.run(sql, (err) => { /* Ignorar si la columna ya existe */ });
    });

    /**
     * Registro del Usuario Administrador Maestro (ROOT).
     */
    db.get("SELECT * FROM socios WHERE usuario = 'ADMINRZ'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO socios (nombre, usuario, password, estado, plan, balance, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    ['Administrador General', 'ADMINRZ', 'ROOT', 'activo', 'MASTER', 0, 0]);
            console.log("CONFIG: Usuario ADMINRZ inicializado correctamente.");
        }
    });
});

// =========================================================================================
// 3. MIDDLEWARES DE SESIÓN Y PARSEO
// =========================================================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * Gestión de sesiones de usuario.
 */
app.use(session({
    secret: 'raizoma_vmax_ultra_secure_2026',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// =========================================================================================
// 4. MOTOR DE ESTILOS CSS V.MAX PREMIUM (70+ LÍNEAS DE DISEÑO)
// =========================================================================================
const cssPremium = `
<style>
    /* VARIABLES DE MARCA */
    :root {
        --color-primario: #3b82f6;
        --color-exito: #10b981;
        --color-alerta: #f59e0b;
        --color-error: #ef4444;
        --fondo-profundo: #0b0f19;
        --fondo-tarjeta: #161d2f;
        --texto-principal: #f8fafc;
        --texto-muted: #94a3b8;
        --borde: #2d3748;
    }

    /* ESTILOS GLOBALES */
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    
    body { 
        background-color: var(--fondo-profundo); 
        color: var(--texto-principal); 
        padding: 20px; 
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
    }

    .contenedor-app { width: 100%; max-width: 750px; animation: fadeIn 0.8s ease-in; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* TARJETAS ELITE */
    .tarjeta-vmax {
        background: var(--fondo-tarjeta);
        border: 1px solid var(--borde);
        border-radius: 24px;
        padding: 35px;
        margin-bottom: 25px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        position: relative;
    }

    .tarjeta-vmax::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
        background: linear-gradient(90deg, var(--color-primario), var(--color-exito));
        border-radius: 24px 24px 0 0;
    }

    .titulo-seccion {
        color: var(--color-primario);
        font-weight: 800;
        font-size: 26px;
        text-align: center;
        margin-bottom: 30px;
        text-transform: uppercase;
        letter-spacing: -0.5px;
    }

    /* MÉTRICAS CIRCULARES Y GRID */
    .grid-metricas {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 35px;
    }

    .bloque-metrica {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--borde);
        border-radius: 20px;
        padding: 20px 10px;
        text-align: center;
    }

    .metrica-valor { display: block; font-size: 28px; font-weight: 900; }
    .metrica-etiqueta { font-size: 10px; color: var(--texto-muted); font-weight: bold; text-transform: uppercase; }

    /* TERMÓMETRO DE PROGRESO */
    .contenedor-progreso { margin-bottom: 25px; }
    .progreso-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; }
    .barra-base {
        background: #080b12;
        border-radius: 50px;
        height: 16px;
        width: 100%;
        overflow: hidden;
        border: 1px solid var(--borde);
    }
    .barra-relleno {
        background: linear-gradient(90deg, var(--color-primario), var(--color-exito));
        height: 100%;
        border-radius: 50px;
        transition: width 1.2s ease-out;
    }

    /* FORMULARIOS V.MAX */
    .input-vmax {
        background: var(--fondo-profundo);
        color: white;
        border: 1px solid var(--borde);
        padding: 18px;
        border-radius: 16px;
        width: 100%;
        margin-bottom: 15px;
        font-size: 16px;
        outline: none;
    }

    .input-vmax:focus { border-color: var(--color-primario); }

    .boton-vmax {
        background: var(--color-primario);
        color: white;
        border: none;
        padding: 18px;
        border-radius: 16px;
        width: 100%;
        font-weight: 800;
        cursor: pointer;
        font-size: 16px;
        text-transform: uppercase;
        transition: 0.3s;
    }

    .boton-vmax:hover { transform: scale(1.02); filter: brightness(1.1); }

    /* TABLAS DE DATOS */
    .tabla-responsive { width: 100%; overflow-x: auto; }
    .tabla-vmax { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .tabla-vmax th { text-align: left; color: var(--texto-muted); font-size: 11px; padding: 15px; border-bottom: 1px solid var(--borde); }
    .tabla-vmax td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }

    /* COLORES DE UTILIDAD */
    .txt-azul { color: var(--color-primario); }
    .txt-verde { color: var(--color-exito); }
    .txt-oro { color: var(--color-alerta); }
    .txt-rojo { color: var(--color-error); }
</style>
`;

// =========================================================================================
// 5. RUTAS DE ACCESO PÚBLICO
// =========================================================================================

/**
 * PÁGINA DE LOGIN
 */
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso | Raízoma V.MAX</title>
        ${cssPremium}
    </head>
    <body>
        <div class="contenedor-app" style="margin-top: 80px;">
            <div class="tarjeta-vmax">
                <h1 class="titulo-seccion">🌳 Acceso Socios</h1>
                <form action="/auth/login" method="POST">
                    <input type="text" name="usuario" class="input-vmax" placeholder="Nombre de usuario" required>
                    <input type="password" name="password" class="input-vmax" placeholder="Tu contraseña" required>
                    <button type="submit" class="boton-vmax">Entrar al Panel</button>
                </form>
                <div style="text-align:center; margin-top:25px;">
                    <a href="/registro" style="color:var(--texto-muted); text-decoration:none; font-size:14px;">¿No tienes cuenta? <span class="txt-azul">Regístrate</span></a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

/**
 * PÁGINA DE REGISTRO
 */
app.get('/registro', (req, res) => {
    const patrocinador = req.query.ref || '';
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inscripción | Raízoma</title>
        ${cssPremium}
    </head>
    <body>
        <div class="contenedor-app">
            <div class="tarjeta-vmax">
                <h2 class="titulo-seccion">Registro de Socio</h2>
                <div style="background:rgba(16,185,129,0.1); border:1px dashed var(--color-exito); padding:20px; border-radius:15px; margin-bottom:25px; text-align:center;">
                    <small style="color:var(--color-exito); font-weight:bold;">PAGO USDT (TRC20):</small><br>
                    <b style="word-break:break-all; font-family:monospace; font-size:14px;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</b>
                </div>
                <form action="/auth/register" method="POST">
                    <input type="hidden" name="sponsor" value="${patrocinador}">
                    <input type="text" name="nombre" class="input-vmax" placeholder="Nombre completo" required>
                    <input type="text" name="whatsapp" class="input-vmax" placeholder="WhatsApp (Ej: 521...)" required>
                    <input type="text" name="user_reg" class="input-vmax" placeholder="Crea un usuario" required>
                    <input type="password" name="pass_reg" class="input-vmax" placeholder="Crea una clave" required>
                    <select name="plan" class="input-vmax" style="height:60px;">
                        <option value="RZ Metabolico $300">RZ Metabolico - $300 MXN</option>
                        <option value="RZ Origen $600">RZ Origen - $600 MXN</option>
                        <option value="PQT Fundador $15,000">PQT Fundador - $15,000 MXN</option>
                    </select>
                    <input type="text" name="hash" class="input-vmax" placeholder="Hash de Pago (TxID)" required>
                    <textarea name="direccion" class="input-vmax" style="height:100px;" placeholder="Dirección de envío completa..." required></textarea>
                    <button type="submit" class="boton-vmax">Enviar Inscripción</button>
                </form>
            </div>
        </div>
    </body>
    </html>
    `);
});

// =========================================================================================
// 6. DASHBOARD (REFRESCO DE BALANCE EN TIEMPO REAL)
// =========================================================================================

app.get('/dashboard', (req, res) => {
    if (!req.session.socioId) return res.redirect('/');

    /**
     * IMPORTANTE: Consultamos la DB en cada carga para reflejar bonos activados
     * por el Administrador al instante.
     */
    db.get("SELECT * FROM socios WHERE id = ?", [req.session.socioId], (err, s) => {
        if (err || !s) return res.redirect('/');

        db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red) => {
            let total = red ? red.length : 0;
            let activos = 0;
            let tablaHTML = "";

            if (red) {
                red.forEach(i => {
                    if (i.estado === 'activo') activos++;
                    tablaHTML += `<tr><td>${i.nombre}</td><td>${i.plan}</td><td><b class="${i.estado === 'activo' ? 'txt-verde' : 'txt-oro'}">${i.estado.toUpperCase()}</b></td></tr>`;
                });
            }

            // Lógica de Metas de Puntos
            let puntos = s.puntos || 0;
            let proximaMeta = 100;
            if (puntos >= 400) proximaMeta = 400;
            else if (puntos >= 200) proximaMeta = 400;
            else if (puntos >= 100) proximaMeta = 200;

            let porcentaje = (puntos / proximaMeta) * 100;
            if (porcentaje > 100) porcentaje = 100;

            res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                ${cssPremium}
                <title>Panel Socio | Raízoma</title>
            </head>
            <body>
                <div class="contenedor-app">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                        <h2>Socio: <span class="txt-azul">${s.nombre}</span></h2>
                        <a href="/logout" class="txt-rojo" style="font-weight:bold; text-decoration:none;">[ SALIR ]</a>
                    </div>

                    <div class="grid-metricas">
                        <div class="bloque-metrica"><span class="metrica-valor txt-azul">${total}</span><span class="metrica-etiqueta">Invitados</span></div>
                        <div class="bloque-metrica"><span class="metrica-valor txt-verde">${activos}</span><span class="metrica-etiqueta">Activos</span></div>
                        <div class="bloque-metrica"><span class="metrica-valor txt-oro">${puntos}</span><span class="metrica-etiqueta">Puntos PV</span></div>
                    </div>

                    <div class="tarjeta-vmax">
                        <div class="progreso-header"><span>Progreso para Próximo Bono</span><span class="txt-azul">${puntos} / ${proximaMeta} PV</span></div>
                        <div class="barra-base"><div class="barra-relleno" style="width:${porcentaje}%"></div></div>
                    </div>

                    <div class="tarjeta-vmax" style="border-left: 6px solid var(--color-exito);">
                        <small style="color:var(--color-exito); font-weight:bold;">BALANCE DISPONIBLE</small>
                        <div style="font-size:42px; font-weight:900; color:var(--color-exito);">$${s.balance} <small style="font-size:18px;">MXN</small></div>
                        
                        ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? `
                        <form action="/user/request-payout" method="POST" style="margin-top:20px;">
                            <textarea name="info" class="input-vmax" style="height:70px; font-size:14px;" placeholder="Datos de cobro (Banco, CLABE)..." required></textarea>
                            <button type="submit" class="boton-vmax" style="background:var(--color-exito);">Solicitar Retiro</button>
                        </form>
                        ` : ''}

                        ${s.solicitud_retiro === 'si' ? `<div style="margin-top:20px; text-align:center; color:var(--color-alerta);"><b>SOLICITUD EN PROCESO...</b></div>` : ''}
                    </div>

                    <div class="tarjeta-vmax">
                        <h4 style="margin-bottom:10px;">Link de Invitación</h4>
                        <input type="text" class="input-vmax" value="https://${req.get('host')}/registro?ref=${s.usuario}" readonly>
                    </div>

                    <div class="tarjeta-vmax">
                        <h4>Mi Red Directa</h4>
                        <div class="tabla-responsive">
                            <table class="tabla-vmax">
                                <thead><tr><th>Nombre</th><th>Paquete</th><th>Estatus</th></tr></thead>
                                <tbody>${tablaHTML || '<tr><td colspan="3" style="text-align:center;">Sin invitados</td></tr>'}</tbody>
                            </table>
                        </div>
                    </div>

                    ${s.usuario === 'ADMINRZ' ? `<a href="/admin/control" class="boton-vmax" style="background:var(--color-alerta); text-decoration:none; display:block; text-align:center;">PANEL ADMINISTRATIVO</a>` : ''}
                </div>
            </body>
            </html>
            `);
        });
    });
});

// =========================================================================================
// 7. PANEL DE CONTROL ADMINISTRATIVO
// =========================================================================================

app.get('/admin/control', (req, res) => {
    db.get("SELECT usuario FROM socios WHERE id = ?", [req.session.socioId], (err, u) => {
        if (!u || u.usuario !== 'ADMINRZ') return res.redirect('/dashboard');

        db.all("SELECT * FROM socios ORDER BY id DESC", (err, lista) => {
            let filas = "";
            lista.forEach(r => {
                filas += `
                <tr>
                    <td><b>${r.usuario}</b><br><small>${r.nombre}</small></td>
                    <td>${r.plan}<br><small class="txt-azul">${r.hash_pago}</small></td>
                    <td>PV: ${r.puntos}<br>Bal: <span class="txt-verde">$${r.balance}</span></td>
                    <td>
                        <div style="display:flex; gap:5px; flex-direction:column;">
                            <a href="/admin/activar/${r.id}" style="color:var(--color-primario); font-size:11px; font-weight:bold;">[ ACTIVAR ]</a>
                            <a href="/admin/pagado/${r.id}" style="color:var(--color-exito); font-size:11px; font-weight:bold;">[ PAGADO ]</a>
                        </div>
                    </td>
                </tr>`;
            });

            res.send(`
            <!DOCTYPE html>
            <html>
            <head>${cssPremium}</head>
            <body>
                <div class="tarjeta-vmax" style="max-width:1000px; width:98%;">
                    <h2 class="titulo-seccion">Control Maestro</h2>
                    <div class="tabla-responsive">
                        <table class="tabla-vmax">
                            <thead><tr><th>Socio</th><th>Inscripción</th><th>Finanzas</th><th>Acción</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>
                    <br><a href="/dashboard" class="txt-azul">Volver al Dashboard</a>
                </div>
            </body>
            </html>
            `);
        });
    });
});

// =========================================================================================
// 8. LÓGICA DE PROCESAMIENTO (BONOS Y AUTH)
// =========================================================================================

/** LOGIN */
app.post('/auth/login', (req, res) => {
    const { usuario, password } = req.body;
    db.get("SELECT id FROM socios WHERE usuario = ? AND password = ?", [usuario, password], (err, row) => {
        if (row) { req.session.socioId = row.id; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Clave incorrecta'); window.location='/';</script>"); }
    });
});

/** REGISTRO */
app.post('/auth/register', (req, res) => {
    const b = req.body;
    db.run(`INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [b.nombre, b.whatsapp, b.user_reg, b.pass_reg, b.sponsor, b.plan, b.hash, b.direccion], (err) => {
        if (err) return res.send("Error: El usuario ya existe.");
        res.send("<h2>Registro recibido. Espera activación administrativa.</h2><a href='/'>Volver al inicio</a>");
    });
});

/** ACTIVACIÓN Y DISPARO DE BONOS */
app.get('/admin/activar/:id', (req, res) => {
    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, socio) => {
        if (socio && socio.estado !== 'activo') {
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                
                if (socio.patrocinador_id) {
                    // 1. Sumar 100 PV al Patrocinador
                    db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [socio.patrocinador_id], () => {
                        
                        // 2. Calcular Bono
                        db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [socio.patrocinador_id], (err, p) => {
                            if (p) {
                                let metaActual = 0;
                                if (p.puntos >= 400) metaActual = 12000;
                                else if (p.puntos >= 200) metaActual = 6000;
                                else if (p.puntos >= 100) metaActual = 1500;

                                let abono = metaActual - (p.bono_cobrado || 0);
                                if (abono > 0) {
                                    db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", 
                                        [abono, abono, socio.patrocinador_id]);
                                }
                            }
                        });
                    });
                }
                res.redirect('/admin/control');
            });
        } else { res.redirect('/admin/control'); }
    });
});

/** LIQUIDACIÓN DE PAGOS */
app.get('/admin/pagado/:id', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0, detalles_retiro = NULL WHERE id = ?", [req.params.id], () => {
        res.redirect('/admin/control');
    });
});

/** RETIRO */
app.post('/user/request-payout', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", [req.body.info, req.session.socioId], () => {
        res.redirect('/dashboard');
    });
});

/** SALIR */
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// =========================================================================================
// 9. INICIO DEL SERVIDOR
// =========================================================================================
app.listen(port, () => {
    console.log("---------------------------------------------------------");
    console.log("RAÍZOMA V.MAX ONLINE - PUERTO " + port);
    console.log("---------------------------------------------------------");
});

/**
 * FINAL DEL ARCHIVO - TODAS LAS LLAVES CERRADAS
 * ARQUITECTURA PROTEGIDA RAÍZOMA 2026
 */