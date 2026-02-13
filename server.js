/**
 * ============================================================================
 * SISTEMA DE GESTIÓN BACKOFFICE RAÍZOMA V.MAX ELITE - PROTECTED VERSION
 * ============================================================================
 * DESARROLLADO PARA: Ulises
 * FECHA DE ÚLTIMA ACTUALIZACIÓN: 2026
 * VERSIÓN: 7.0.0 (ULTRA-EXTENDED)
 * * DESCRIPCIÓN TÉCNICA:
 * - Arquitectura: Node.js con Express Framework.
 * - Persistencia: SQLite3 con almacenamiento en volumen persistente /data.
 * - Seguridad: Manejo de sesiones con express-session y cifrado de cookies.
 * - Interfaz: Diseño responsivo inyectado mediante Template Literals.
 * - Plan de Compensación: 20% sobre volumen (Meta máxima $12,000 MXN).
 * * VARIABLES DE CONTROL INCLUIDAS:
 * 1. ID de Socio Autoincremental.
 * 2. Nombre completo y Usuario único.
 * 3. Contraseña de acceso.
 * 4. WhatsApp / Teléfono de contacto directo.
 * 5. Fecha de registro automática.
 * 6. ID del Patrocinador (Sistema de referidos).
 * 7. Plan/Paquete de inscripción seleccionado.
 * 8. Hash de Pago / TxID para validación de depósitos.
 * 9. Dirección completa de envío de productos.
 * 10. Estado de cuenta (Activo / Pendiente).
 * 11. Balance disponible para retiro.
 * 12. Puntos de Volumen (PV) acumulados.
 * 13. Volumen total de red (Dinero real movido).
 * 14. Histórico de bonos cobrados.
 * 15. Flag de solicitud de retiro.
 * 16. Detalles bancarios para recepción de pagos.
 * ============================================================================
 */

// ============================================================================
// IMPORTACIÓN DE MÓDULOS DEL SISTEMA
// ============================================================================
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

// INICIALIZACIÓN DE LA APLICACIÓN
const app = express();
const port = process.env.PORT || 10000;

// ============================================================================
// CONFIGURACIÓN DE PERSISTENCIA (SISTEMA DE ARCHIVOS)
// ============================================================================
// Render requiere que los datos persistentes se guarden en una carpeta específica
const dirLogistica = '/data';
if (!fs.existsSync(dirLogistica)) {
    try {
        fs.mkdirSync(dirLogistica);
        console.log("Directorio de datos creado exitosamente.");
    } catch (error) {
        console.error("Error al crear el directorio de datos:", error);
    }
}

// ============================================================================
// CONEXIÓN Y CREACIÓN DE LA BASE DE DATOS
// ============================================================================
const rutaBaseDatos = path.join(dirLogistica, 'raizoma_elite.db');
const db = new sqlite3.Database(rutaBaseDatos, (err) => {
    if (err) {
        console.error("**************************************************");
        console.error("ERROR CRÍTICO: No se pudo conectar a la DB.");
        console.error(err.message);
        console.error("**************************************************");
    } else {
        console.log("**************************************************");
        console.log("RAÍZOMA V.MAX ELITE - CONEXIÓN ESTABLECIDA");
        console.log("ARCHIVO: /data/raizoma_elite.db");
        console.log("ESTADO: SISTEMA PROTEGIDO CONTRA RECORTES");
        console.log("**************************************************");
    }
});

// ============================================================================
// ESTRUCTURA Y MIGRACIÓN DE TABLAS
// ============================================================================
db.serialize(() => {
    // Definición de la tabla principal con todas las variables requeridas
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

    // SCRIPT DE SEGURIDAD PARA ASEGURAR COLUMNAS EN VERSIONES PREVIAS
    const columnas_de_seguridad = [
        "ALTER TABLE socios ADD COLUMN whatsapp TEXT",
        "ALTER TABLE socios ADD COLUMN fecha_reg DATETIME DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE socios ADD COLUMN volumen_red REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0",
        "ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'",
        "ALTER TABLE socios ADD COLUMN detalles_retiro TEXT"
    ];

    columnas_de_seguridad.forEach((sentencia) => {
        db.run(sentencia, (err) => {
            // Se ignoran errores si la columna ya existe por despliegues previos
        });
    });

    // CREACIÓN DEL ADMINISTRADOR MAESTRO INICIAL
    const master_user = 'ADMINRZ';
    const master_pass = 'ROOT';
    db.get("SELECT * FROM socios WHERE usuario = ?", [master_user], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO socios (nombre, usuario, password, estado, plan, balance, puntos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                    ['Administrador General', master_user, master_pass, 'activo', 'MASTER', 0, 0]);
            console.log("Usuario Maestro ADMINRZ generado correctamente.");
        }
    });
});

// ============================================================================
// CONFIGURACIÓN DE MIDDLEWARES Y SEGURIDAD DE SESIÓN
// ============================================================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'clave_secreta_raizoma_vmax_elite_no_borrar_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // Duración de 24 horas
        secure: false // Cambiar a true si se usa HTTPS estrictamente
    }
}));

// ============================================================================
// MOTOR DE DISEÑO CSS PREMIUM (EXTENDIDO PARA SCANNABILITY)
// ============================================================================
const css_vmax_elite = `
<style>
    /* VARIABLES GLOBALES DE COLOR */
    :root {
        --principal-bg: #0b0f19;
        --tarjeta-bg: #161d2f;
        --acento-azul: #3b82f6;
        --acento-verde: #10b981;
        --acento-amarillo: #f59e0b;
        --acento-rojo: #ef4444;
        --texto-principal: #f8fafc;
        --texto-tenue: #94a3b8;
        --borde-color: #2d3748;
    }

    /* ESTILOS DE BASE */
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
    
    body { 
        background-color: var(--principal-bg); 
        color: var(--texto-principal); 
        padding: 20px; 
        line-height: 1.6;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .capa-principal { width: 100%; max-width: 680px; }

    /* TARJETAS DE DISEÑO */
    .tarjeta-elite {
        background: var(--tarjeta-bg);
        border: 1px solid var(--borde-color);
        border-radius: 28px;
        padding: 30px;
        margin-bottom: 25px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        position: relative;
        overflow: hidden;
    }

    .titulo-seccion {
        color: var(--acento-azul);
        font-weight: 900;
        font-size: 24px;
        text-align: center;
        margin-bottom: 30px;
        text-transform: uppercase;
        letter-spacing: -1px;
    }

    /* SISTEMA DE CONTADORES CIRCULARES V.MAX */
    .contenedor-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 30px;
    }

    .circulo-metrica {
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--borde-color);
        border-radius: 24px;
        padding: 20px 5px;
        text-align: center;
        transition: transform 0.3s ease;
    }

    .circulo-metrica:hover { transform: translateY(-5px); border-color: var(--acento-azul); }

    .valor-metrica { display: block; font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .label-metrica { font-size: 10px; color: var(--texto-tenue); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

    /* BARRA DE PROGRESO DE METAS (TERMÓMETRO) */
    .info-progreso { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
    .rail-progreso {
        background: var(--principal-bg);
        border-radius: 50px;
        height: 16px;
        width: 100%;
        border: 1px solid var(--borde-color);
        overflow: hidden;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    }
    .llenado-progreso {
        background: linear-gradient(90deg, var(--acento-azul) 0%, var(--acento-verde) 100%);
        height: 100%;
        border-radius: 50px;
        transition: width 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
    }

    /* COMPONENTES DE FORMULARIO */
    .input-raizoma {
        background: var(--principal-bg);
        color: white;
        border: 1px solid var(--borde-color);
        padding: 18px;
        border-radius: 14px;
        width: 100%;
        margin-bottom: 18px;
        font-size: 16px;
        transition: border-color 0.3s;
    }

    .input-raizoma:focus { border-color: var(--acento-azul); outline: none; }

    .boton-primario {
        background: var(--acento-azul);
        color: white;
        border: none;
        padding: 20px;
        border-radius: 16px;
        width: 100%;
        font-weight: 800;
        cursor: pointer;
        font-size: 16px;
        text-transform: uppercase;
        transition: 0.3s;
    }

    .boton-primario:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }

    /* TABLAS DE DATOS */
    .tabla-container { width: 100%; overflow-x: auto; }
    .tabla-backoffice { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .tabla-backoffice th { text-align: left; color: var(--texto-tenue); font-size: 11px; padding: 15px; border-bottom: 2px solid var(--borde-color); }
    .tabla-backoffice td { padding: 15px; border-bottom: 1px solid #1e293b; font-size: 13px; }

    /* BOTONES DE ACCIÓN RÁPIDA */
    .btn-wa { background: #25d366; color: white; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 800; display: inline-block; }
    .btn-copiar-link { background: #2d3748; color: var(--acento-azul); border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px; }

    /* COLORES DE ESTADO */
    .txt-azul { color: var(--acento-azul); }
    .txt-verde { color: var(--acento-verde); }
    .txt-amarillo { color: var(--acento-amarillo); }
    .txt-rojo { color: var(--acento-rojo); }
</style>
`;

// ============================================================================
// LÓGICA DE RUTAS - NAVEGACIÓN Y RENDERIZADO
// ============================================================================

/**
 * PÁGINA DE INICIO (LOGIN)
 * Renderiza el formulario de acceso inicial.
 */
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso | Raízoma Backoffice</title>
        ${css_vmax_elite}
    </head>
    <body>
        <div class="capa-principal" style="margin-top: 100px;">
            <div class="tarjeta-elite">
                <h1 class="titulo-seccion">🌳 Acceso al Sistema</h1>
                <form action="/login" method="POST">
                    <input type="text" name="usr_login" class="input-raizoma" placeholder="Tu nombre de usuario" required>
                    <input type="password" name="pwd_login" class="input-raizoma" placeholder="Tu clave de acceso" required>
                    <button type="submit" class="boton-primario">Iniciar Sesión Ahora</button>
                </form>
                <div style="text-align:center; margin-top:30px;">
                    <a href="/registro" style="color:var(--texto-tenue); text-decoration:none; font-size:14px;">
                        ¿No tienes una cuenta? <span class="txt-azul">Regístrate aquí</span>
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

/**
 * PÁGINA DE REGISTRO
 * Captura todos los datos de los nuevos socios.
 */
app.get('/registro', (req, res) => {
    const patrocinador_referido = req.query.ref || '';
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inscripción | Raízoma</title>
        ${css_vmax_elite}
    </head>
    <body>
        <div class="capa-principal">
            <div class="tarjeta-elite">
                <h2 class="titulo-seccion">Formulario de Inscripción</h2>
                
                <div style="background:rgba(59,130,246,0.1); border:2px dashed var(--acento-azul); padding:20px; border-radius:18px; text-align:center; margin-bottom:25px;">
                    <small class="txt-azul" style="font-weight:bold;">PASO 1: ENVIAR PAGO USDT (TRC20)</small>
                    <div id="w-disp" style="color:var(--acento-verde); font-family:monospace; font-size:16px; font-weight:900; margin:10px 0;">TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw</div>
                    <button onclick="copiarW()" style="background:none; border:none; color:var(--texto-tenue); cursor:pointer; font-size:12px;">[Copiar Dirección de Billetera]</button>
                </div>

                <form action="/registro" method="POST">
                    <input type="hidden" name="ref_id" value="${patrocinador_referido}">
                    
                    <label style="font-size:11px; color:var(--texto-tenue); padding-left:10px;">DATOS DE IDENTIDAD</label>
                    <input type="text" name="reg_nombre" class="input-raizoma" placeholder="Nombre y Apellidos" required>
                    <input type="text" name="reg_whatsapp" class="input-raizoma" placeholder="WhatsApp (Ej: 521...)" required>
                    <input type="text" name="reg_usuario" class="input-raizoma" placeholder="Elige un nombre de usuario" required>
                    <input type="password" name="reg_password" class="input-raizoma" placeholder="Crea una clave segura" required>
                    
                    <label style="font-size:11px; color:var(--texto-tenue); padding-left:10px;">DETALLES DEL PLAN</label>
                    <select name="reg_plan" class="input-raizoma" style="height:60px;">
                        <option value="RZ Metabolico Cap. $300">RZ Metabolico Cap. - $300 MXN</option>
                        <option value="RZ Origen $600">RZ Origen - $600 MXN</option>
                        <option value="Membresia + RZ Origen $1,700">Membresia + RZ Origen - $1,700 MXN</option>
                        <option value="PQT Fundador $15,000">PQT Fundador - $15,000 MXN</option>
                    </select>

                    <input type="text" name="reg_hash" class="input-raizoma" placeholder="Hash de Transacción (TxID)" required>
                    <textarea name="reg_direccion" class="input-raizoma" style="height:100px; padding-top:15px;" placeholder="Dirección completa para entrega de productos" required></textarea>
                    
                    <button type="submit" class="boton-primario">Enviar Inscripción Ahora</button>
                </form>
            </div>
        </div>
        <script>
            function copiarW() {
                const el = document.getElementById('w-disp');
                const range = document.createRange();
                range.selectNode(el);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand("copy");
                alert("Billetera copiada. Procede con tu pago.");
            }
        </script>
    </body>
    </html>
    `);
});

/**
 * DASHBOARD PRINCIPAL
 * Muestra métricas de equipo, progreso y balance.
 */
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    db.all("SELECT * FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, red_directa) => {
        let total_invitados = red_directa ? red_directa.length : 0;
        let activos = 0;
        let pendientes = 0;
        let equipo_html = "";

        if (red_directa) {
            red_directa.forEach(v => {
                if (v.estado === 'activo') activos++;
                else pendientes++;
                equipo_html += `
                <tr>
                    <td>${v.nombre}</td>
                    <td><small>${v.plan}</small></td>
                    <td><b class="${v.estado === 'activo' ? 'txt-verde' : 'txt-amarillo'}">${v.estado.toUpperCase()}</b></td>
                </tr>`;
            });
        }

        // CÁLCULO DINÁMICO DE TERMÓMETRO (META 400 PV)
        let pv_actual = s.puntos || 0;
        let meta_pv = 100;
        if (pv_actual >= 400) meta_pv = 400;
        else if (pv_actual >= 200) meta_pv = 400;
        else if (pv_actual >= 100) meta_pv = 200;

        let porcentaje = (pv_actual / meta_pv) * 100;
        if (porcentaje > 100) porcentaje = 100;

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panel de Socio | Raízoma</title>
            ${css_vmax_elite}
        </head>
        <body>
            <div class="capa-principal">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <div>
                        <h2 style="margin:0; font-size:20px;">Socio: <span class="txt-azul">${s.nombre}</span></h2>
                        <small style="color:var(--texto-tenue)">Registro: ${s.fecha_reg.split(' ')[0]}</small>
                    </div>
                    <a href="/logout" class="txt-rojo" style="text-decoration:none; font-weight:bold;">CERRAR SESIÓN</a>
                </div>

                <div class="contenedor-stats">
                    <div class="circulo-metrica"><span class="valor-metrica txt-azul">${total_invitados}</span><span class="label-metrica">Totales</span></div>
                    <div class="circulo-metrica"><span class="valor-metrica txt-verde">${activos}</span><span class="label-metrica">Activos</span></div>
                    <div class="circulo-metrica"><span class="valor-metrica txt-amarillo">${pendientes}</span><span class="label-metrica">En Espera</span></div>
                </div>

                <div class="tarjeta-elite">
                    <div class="info-progreso">
                        <span>PUNTOS DE VOLUMEN (PV)</span>
                        <b class="txt-azul" style="font-size:20px;">${pv_actual} / ${meta_pv}</b>
                    </div>
                    <div class="rail-progreso"><div class="llenado-progreso" style="width:${porcentaje}%"></div></div>
                    <p style="text-align:center; font-size:12px; color:var(--texto-tenue); margin-top:10px;">
                        ${pv_actual >= 400 ? '¡HAS ALCANZADO LA META MÁXIMA DE LÍDER!' : 'Te faltan ' + (meta_pv - pv_actual) + ' PV para tu siguiente bono.'}
                    </p>
                </div>

                <div class="tarjeta-elite" style="border-left: 6px solid var(--acento-verde);">
                    <small class="txt-verde" style="font-weight:bold;">DISPONIBLE PARA COBRO</small>
                    <div style="font-size:40px; font-weight:900; color:var(--acento-verde); margin:10px 0;">$${s.balance} MXN</div>
                    
                    ${s.balance >= 500 && s.solicitud_retiro !== 'si' ? `
                    <form action="/solicitar-retiro" method="POST" style="margin-top:20px;">
                        <textarea name="detalles_pago" class="input-raizoma" style="height:80px; font-size:14px;" placeholder="Banco, CLABE, Nombre del titular o Wallet USDT..." required></textarea>
                        <button type="submit" class="boton-primario" style="background:var(--acento-verde);">Solicitar Cobro Ahora</button>
                    </form>
                    ` : ''}

                    ${s.solicitud_retiro === 'si' ? `
                    <div style="background:rgba(245,158,11,0.1); padding:15px; border-radius:12px; text-align:center;">
                        <b class="txt-amarillo">SOLICITUD EN PROCESO</b><br>
                        <small>El administrador está verificando tus datos.</small>
                    </div>
                    ` : ''}
                </div>

                <div class="tarjeta-elite">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <small class="txt-azul" style="font-weight:bold;">VENTAS TOTALES DE TU RED</small>
                            <div style="font-size:24px; font-weight:900;">$${s.volumen_red || 0} MXN</div>
                        </div>
                    </div>
                </div>

                <div class="tarjeta-elite">
                    <h4 style="margin-bottom:12px; font-size:14px;">Tu enlace de invitación</h4>
                    <input type="text" id="referral-link" class="input-raizoma" style="margin-bottom:5px;" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly>
                    <button onclick="copiarLinkReg()" class="btn-copiar-link">COPIAR LINK DE INSCRIPCIÓN</button>
                </div>

                <div class="tarjeta-elite">
                    <h4 style="text-align:center; margin-bottom:20px;">Mi Estructura Directa</h4>
                    <div class="tabla-container">
                        <table class="tabla-backoffice">
                            <thead><tr><th>Nombre</th><th>Plan</th><th>Estado</th></tr></thead>
                            <tbody>
                                ${equipo_html || '<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--texto-tenue);">Aún no tienes socios directos inscritos.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${s.usuario === 'ADMINRZ' ? `
                <a href="/panel-maestro-raizoma" class="boton-primario" style="background:var(--acento-amarillo); display:block; text-align:center; text-decoration:none; margin-top:25px;">ABRIR PANEL ADMINISTRATIVO</a>
                ` : ''}
            </div>
            <script>
                function copiarLinkReg() {
                    const i = document.getElementById('referral-link');
                    i.select();
                    document.execCommand("copy");
                    alert("Enlace copiado correctamente.");
                }
            </script>
        </body>
        </html>
        `);
    });
});

/**
 * PANEL DE ADMINISTRACIÓN MAESTRO
 * Control total sobre los socios y pagos.
 */
app.get('/panel-maestro-raizoma', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');

    db.all("SELECT * FROM socios ORDER BY id DESC", (err, todos) => {
        let tabla_admin = "";
        todos.forEach(r => {
            const solicitud_pendiente = r.solicitud_retiro === 'si' ? 'background:rgba(239, 68, 68, 0.1);' : '';
            tabla_admin += `
            <tr style="${solicitud_pendiente}">
                <td>
                    <b>ID: ${r.id}</b><br>
                    ${r.usuario}<br>
                    <small>${r.fecha_reg}</small>
                </td>
                <td>
                    Ref por: <b class="txt-azul">${r.patrocinador_id || 'ORIGEN'}</b><br><br>
                    <a href="https://wa.me/${r.whatsapp}" target="_blank" class="btn-wa">WhatsApp</a>
                </td>
                <td>
                    <b>${r.plan}</b><br>
                    <small style="font-size:9px; color:var(--texto-tenue); word-break:break-all;">${r.hash_pago}</small>
                </td>
                <td>
                    Balance: <b class="txt-verde">$${r.balance}</b><br>
                    PV: <b class="txt-azul">${r.puntos}</b><br>
                    Estatus: <b class="${r.estado === 'activo' ? 'txt-verde' : 'txt-amarillo'}">${r.estado}</b>
                </td>
                <td>
                    <small><b>ENVÍO:</b> ${r.direccion}</small><br><br>
                    <small><b>COBRO:</b> ${r.detalles_retiro || 'No solicitado'}</small>
                </td>
                <td>
                    <a href="/admin/activar/${r.id}" class="txt-azul" style="text-decoration:none; font-weight:bold;">ACTIVAR</a><br><br>
                    <a href="/admin/baja/${r.id}" class="txt-rojo" style="text-decoration:none; font-size:11px;">DESACTIVAR</a><br><br>
                    <a href="/admin/pagar/${r.id}" class="txt-verde" style="text-decoration:none; font-weight:bold;">PAGADO</a>
                </td>
            </tr>`;
        });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            ${css_vmax_elite}
            <title>Panel Maestro | Raízoma</title>
        </head>
        <body>
            <div class="tarjeta-elite" style="max-width:1150px; width:98%;">
                <h1 class="titulo-seccion">Control Maestro de Logística</h1>
                <div class="tabla-container">
                    <table class="tabla-backoffice">
                        <thead>
                            <tr>
                                <th>Socio/Fecha</th>
                                <th>Sponsor/WA</th>
                                <th>Paquete/Hash</th>
                                <th>Finanzas/PV</th>
                                <th>Dirección/Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>${tabla_admin}</tbody>
                    </table>
                </div>
                <div style="margin-top:30px; text-align:center;">
                    <a href="/dashboard" class="boton-primario" style="display:inline-block; width:250px; text-decoration:none;">Cerrar Panel Maestro</a>
                </div>
            </div>
        </body>
        </html>
        `);
    });
});

// ============================================================================
// LÓGICA DE PROCESAMIENTO DE DATOS (POST/GET)
// ============================================================================

/** PROCESAR LOGIN */
app.post('/login', (req, res) => {
    const { usr_login, pwd_login } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [usr_login, pwd_login], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Acceso denegado. Verifica tus credenciales.'); window.location='/';</script>");
        }
    });
});

/** PROCESAR REGISTRO */
app.post('/registro', (req, res) => {
    const { reg_nombre, reg_whatsapp, reg_usuario, reg_password, ref_id, reg_plan, reg_hash, reg_direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, whatsapp, usuario, password, patrocinador_id, plan, hash_pago, direccion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [reg_nombre, reg_whatsapp, reg_usuario, reg_password, ref_id, reg_plan, reg_hash, reg_direccion], (err) => {
        if (err) {
            return res.send("<script>alert('Error: El nombre de usuario ya existe.'); window.history.back();</script>");
        }
        res.send(`
        <body style="background:#0b0f19; color:white; text-align:center; padding-top:100px; font-family:sans-serif;">
            <h1 class="txt-verde">¡Inscripción Enviada!</h1>
            <p>Tu cuenta será activada por el administrador tras validar el hash de pago.</p>
            <br><a href="/" style="color:#3b82f6; font-weight:bold; text-decoration:none;">REGRESAR AL INICIO</a>
        </body>
        `);
    });
});

/** PROCESAR SOLICITUD DE RETIRO */
app.post('/solicitar-retiro', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'si', detalles_retiro = ? WHERE id = ?", 
        [req.body.detalles_pago, req.session.socio.id], () => {
        res.send("<script>alert('Tu solicitud ha sido enviada. El balance se liquidará en breve.'); window.location='/dashboard';</script>");
    });
});

/** ACCIÓN: ACTIVAR SOCIO Y PAGAR BONOS AL 20% */
app.get('/admin/activar/:id', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');

    db.get("SELECT * FROM socios WHERE id = ?", [req.params.id], (err, row) => {
        if (row && row.estado !== 'activo') {
            // Calculamos el valor numérico del plan para el volumen de red
            const valor_plan = parseInt(row.plan.replace(/[^0-9]/g, '')) || 0;
            
            // Si tiene patrocinador, actualizamos PV y Balance del patrocinador
            if (row.patrocinador_id) {
                db.run("UPDATE socios SET puntos = puntos + 100, volumen_red = volumen_red + ? WHERE usuario = ?", 
                    [valor_plan, row.patrocinador_id], () => {
                    
                    db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [row.patrocinador_id], (err, p) => {
                        // REGLA DEL 20% (META $12,000)
                        let meta_dinero = 0;
                        if (p.puntos >= 400) meta_dinero = 12000;
                        else if (p.puntos >= 200) meta_dinero = 6000;
                        else if (p.puntos >= 100) meta_dinero = 1500;

                        const diferencia = meta_dinero - (p.bono_cobrado || 0);
                        if (diferencia > 0) {
                            db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", 
                                [diferencia, diferencia, row.patrocinador_id]);
                        }
                    });
                });
            }
            
            // Activamos definitivamente al socio
            db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [req.params.id], () => {
                res.redirect('/panel-maestro-raizoma');
            });
        } else {
            res.redirect('/panel-maestro-raizoma');
        }
    });
});

/** ACCIÓN: DAR DE BAJA O DESACTIVAR */
app.get('/admin/baja/:id', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');
    db.run("UPDATE socios SET estado = 'pendiente' WHERE id = ?", [req.params.id], () => {
        res.redirect('/panel-maestro-raizoma');
    });
});

/** ACCIÓN: MARCAR RETIRO COMO PAGADO */
app.get('/admin/pagar/:id', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0, detalles_retiro = NULL WHERE id = ?", 
        [req.params.id], () => {
        res.redirect('/panel-maestro-raizoma');
    });
});

/** CERRAR SESIÓN */
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ============================================================================
// FINALIZACIÓN Y ARRANQUE DEL SERVIDOR
// ============================================================================
app.listen(port, () => {
    console.log("==================================================");
    console.log("RAÍZOMA ELITE V.MAX - SERVIDOR ONLINE");
    console.log(`PUERTO DE ESCUCHA: ${port}`);
    console.log(`BILLETERA USDT: TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw`);
    console.log(`LÍNEAS DE CÓDIGO TOTALES: > 615`);
    console.log("==================================================");
});

/**
 * FIN DEL ARCHIVO - SISTEMA RAÍZOMA V.MAX ELITE 2026
 * PROTEGIDO POR ESTRUCTURA EXTENSA.
 */