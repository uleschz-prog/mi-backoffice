const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// ==========================================
// 1. CONFIGURACIÓN DE LA BASE DE DATOS
// ==========================================
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("ERROR AL ABRIR LA BASE DE DATOS:");
        console.error(err.message);
    } else {
        console.log("-----------------------------------------");
        console.log("CONECTADO EXITOSAMENTE: /data/raizoma.db");
        console.log("-----------------------------------------");
    }
});

// ==========================================
// 2. ESTRUCTURA DE TABLAS Y AUTO-ADMIN
// ==========================================
db.serialize(() => {
    // Creación de la tabla principal de socios
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
        solicitud_retiro TEXT DEFAULT 'no'
    )`);

    // Verificación y agregación de columnas necesarias una por una
    db.run("ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0", (err) => {
        if (err) { console.log("Info: Columna balance ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {
        if (err) { console.log("Info: Columna puntos ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0", (err) => {
        if (err) { console.log("Info: Columna bono_cobrado ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'", (err) => {
        if (err) { console.log("Info: Columna solicitud_retiro ya existe."); }
    });

    // CREACIÓN FORZADA DEL ADMINISTRADOR SI NO EXISTE
    const masterUser = 'ADMINRZ';
    const masterPass = 'ROOT'; 

    db.get("SELECT * FROM socios WHERE usuario = ?", [masterUser], (err, row) => {
        if (err) {
            console.log("Error al buscar admin:", err.message);
        } else if (!row) {
            console.log("CREANDO CUENTA MAESTRA ADMINRZ...");
            db.run(`INSERT INTO socios (
                nombre, 
                usuario, 
                password, 
                estado, 
                plan, 
                balance, 
                puntos
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [
                'Administrador General', 
                masterUser, 
                masterPass, 
                'activo', 
                'MASTER', 
                0, 
                0
            ], (err) => {
                if (err) {
                    console.log("Error al insertar admin:", err.message);
                } else {
                    console.log("USUARIO ADMINRZ CREADO CON ÉXITO. PASS: ROOT");
                }
            });
        } else {
            console.log("EL ADMINISTRADOR YA ESTÁ CONFIGURADO EN LA DB.");
        }
    });
});

// ==========================================
// 3. MIDDLEWARES Y SESIONES
// ==========================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_ultra_secret_key_2026',
    resave: false,
    saveUninitialized: true
}));

// ==========================================
// 4. DISEÑO CSS (EXTENSO)
// ==========================================
const css_estilos = `
    <style>
        body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .contenedor-principal {
            max-width: 500px;
            margin: 0 auto;
        }
        .tarjeta {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .titulo-azul {
            color: #3b82f6;
            font-weight: bold;
            text-align: center;
        }
        .input-raizoma {
            background-color: #0f172a;
            color: white;
            border: 1px solid #334155;
            padding: 12px;
            border-radius: 8px;
            width: 100%;
            margin-bottom: 15px;
            box-sizing: border-box;
        }
        .boton-primario {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            width: 100%;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
        }
        .boton-primario:hover {
            background-color: #2563eb;
        }
        .termometro-fondo {
            background-color: #0f172a;
            border-radius: 20px;
            height: 20px;
            width: 100%;
            border: 1px solid #334155;
            margin-top: 10px;
            overflow: hidden;
        }
        .termometro-relleno {
            background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
            height: 100%;
            transition: width 0.5s ease;
        }
        .tabla-invitados {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-top: 15px;
        }
        .tabla-invitados th {
            text-align: left;
            color: #94a3b8;
            border-bottom: 1px solid #334155;
            padding: 8px;
        }
        .tabla-invitados td {
            padding: 10px 8px;
            border-bottom: 1px solid #1e293b;
        }
    </style>
`;

// ==========================================
// 5. RUTAS DEL SISTEMA
// ==========================================

// --- VISTA DE LOGIN ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login - Raízoma</title>
            ${css_estilos}
        </head>
        <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
            <div class="tarjeta" style="width: 100%; max-width: 380px;">
                <h1 class="titulo-azul">🌳 Raízoma</h1>
                <p style="text-align: center; color: #94a3b8;">Oficina Virtual</p>
                <form action="/login" method="POST">
                    <label style="display:block; margin-bottom:5px;">Usuario</label>
                    <input type="text" name="user" class="input-raizoma" required>
                    
                    <label style="display:block; margin-bottom:5px;">Contraseña</label>
                    <input type="password" name="pass" class="input-raizoma" required>
                    
                    <button type="submit" class="boton-primario">ACCEDER AL SISTEMA</button>
                </form>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="/registro" style="color: #64748b; text-decoration: none; font-size: 14px;">¿No tienes cuenta? Regístrate</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// --- VISTA DEL DASHBOARD ---
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) {
        return res.redirect('/');
    }

    const s = req.session.socio;

    // Obtener lista de invitados para las estadísticas y la tabla
    db.all("SELECT nombre, plan, estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        let n_totales = 0;
        let n_activos = 0;
        let filas_tabla = "";

        if (invitados) {
            n_totales = invitados.length;
            for (let i = 0; i < invitados.length; i++) {
                let inv = invitados[i];
                let color_est = (inv.estado === 'activo') ? "#10b981" : "#f59e0b";
                if (inv.estado === 'activo') {
                    n_activos++;
                }
                filas_tabla += `
                    <tr>
                        <td>${inv.nombre}</td>
                        <td>${inv.plan}</td>
                        <td style="color: ${color_est}; font-weight: bold;">${inv.estado.toUpperCase()}</td>
                    </tr>
                `;
            }
        }

        // Lógica del Termómetro de Rangos
        let puntos = s.puntos || 0;
        let meta = 100;
        let prox_bono = 1500;
        let porcentaje = 0;

        if (puntos >= 400) {
            meta = 400; prox_bono = 9000; porcentaje = 100;
        } else if (puntos >= 200) {
            meta = 400; prox_bono = 9000; porcentaje = (puntos / 400) * 100;
        } else if (puntos >= 100) {
            meta = 200; prox_bono = 4500; porcentaje = (puntos / 200) * 100;
        } else {
            meta = 100; prox_bono = 1500; porcentaje = (puntos / 100) * 100;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard - Raízoma</title>
                ${css_estilos}
            </head>
            <body>
                <div class="contenedor-principal">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">Hola, <span style="color: #3b82f6;">${s.nombre}</span></h2>
                        <a href="/logout" style="color: #ef4444; text-decoration: none; font-weight: bold;">Salir</a>
                    </div>

                    <div class="tarjeta">
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <span style="font-weight: bold;">Progreso de Rango</span>
                            <span style="color: #3b82f6; font-weight: bold;">${puntos} / ${meta} PV</span>
                        </div>
                        <div class="termometro-fondo">
                            <div class="termometro-relleno" style="width: ${porcentaje}%;"></div>
                        </div>
                        <p style="margin-top: 10px; font-size: 13px; color: #94a3b8; text-align: center;">
                            ${puntos >= 400 ? "¡Nivel Máximo Alcanzado!" : `Te faltan ${meta - puntos} PV para calificar al bono de $${prox_bono}`}
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div class="tarjeta" style="margin-bottom: 0; text-align: center;">
                            <small style="color: #94a3b8;">Balance</small>
                            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">$${s.balance}</div>
                        </div>
                        <div class="tarjeta" style="margin-bottom: 0; text-align: center;">
                            <small style="color: #94a3b8;">Puntos</small>
                            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${puntos} PV</div>
                        </div>
                    </div>

                    <div class="tarjeta">
                        <label style="font-size: 13px; color: #94a3b8;">Mi enlace de invitación:</label>
                        <input type="text" id="link_ref" class="input-raizoma" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly style="margin-top: 5px; margin-bottom: 10px;">
                        <button onclick="copiarLink()" class="boton-primario" style="padding: 8px;">COPIAR ENLACE</button>
                    </div>

                    <div class="tarjeta">
                        <h4 style="margin: 0 0 15px 0; text-align: center;">Mi Equipo Directo</h4>
                        <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                            <div style="text-align: center;">
                                <div style="font-size: 18px; font-weight: bold;">${n_totales}</div>
                                <small style="color: #94a3b8;">Registros</small>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 18px; font-weight: bold; color: #10b981;">${n_activos}</div>
                                <small style="color: #94a3b8;">Activos</small>
                            </div>
                        </div>
                        <div style="max-height: 200px; overflow-y: auto;">
                            <table class="tabla-invitados">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Plan</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filas_tabla || '<tr><td colspan="3" style="text-align:center; color:#475569;">No hay invitados aún</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    ${s.balance >= 500 ? `<a href="/solicitar-retiro" class="boton-primario" style="text-decoration:none; display:block; text-align:center; margin-bottom:15px; background-color:#10b981;">RETIRAR COMISIONES</a>` : ''}
                    
                    ${s.usuario === 'ADMINRZ' ? `<a href="/codigo-1-panel" class="boton-primario" style="text-decoration:none; display:block; text-align:center; background-color:#f59e0b;">PANEL DE ADMINISTRACIÓN</a>` : ''}

                </div>

                <script>
                    function copiarLink() {
                        var copyText = document.getElementById("link_ref");
                        copyText.select();
                        copyText.setSelectionRange(0, 99999);
                        document.execCommand("copy");
                        alert("¡Enlace copiado!");
                    }
                </script>
            </body>
            </html>
        `);
    });
});

// --- RUTA DE REGISTRO ---
app.get('/registro', (req, res) => {
    const referido_por = req.query.ref || '';
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro - Raízoma</title>
            ${css_estilos}
        </head>
        <body>
            <div class="contenedor-principal">
                <div class="tarjeta">
                    <h2 class="titulo-azul">Inscripción Raízoma</h2>
                    <form action="/registro" method="POST">
                        <input type="hidden" name="patrocinador" value="${referido_por}">
                        
                        <label>Nombre Completo</label>
                        <input type="text" name="nombre" class="input-raizoma" required>
                        
                        <label>Nombre de Usuario</label>
                        <input type="text" name="usuario" class="input-raizoma" required>
                        
                        <label>Contraseña</label>
                        <input type="password" name="password" class="input-raizoma" required>
                        
                        <label>Plan de Ingreso</label>
                        <select name="plan" class="input-raizoma" style="height: 45px;">
                            <option value="Partner">Partner - $15,000 MXN</option>
                            <option value="Pro">Pro - $30,000 MXN</option>
                        </select>
                        
                        <label>Hash de Pago (TxID)</label>
                        <input type="text" name="hash" class="input-raizoma" required>
                        
                        <label>Dirección de Envío</label>
                        <textarea name="direccion" class="input-raizoma" style="height: 80px;" required></textarea>
                        
                        <button type="submit" class="boton-primario">ENVIAR REGISTRO</button>
                    </form>
                    <div style="text-align: center; margin-top: 15px;">
                        <a href="/" style="color: #94a3b8; text-decoration: none;">Volver al Login</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// --- PROCESAMIENTO DE DATOS ---

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Usuario o clave incorrecta'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion],
        (err) => {
            if (err) {
                res.send("Error al registrar usuario: " + err.message);
            } else {
                res.send(`
                    <body style="background:#0f172a; color:white; text-align:center; padding-top:100px; font-family:sans-serif;">
                        <h1 style="color:#10b981;">¡Solicitud Enviada!</h1>
                        <p>Tu cuenta será activada tras validar el pago.</p>
                        <a href="/" style="color:#3b82f6;">Regresar al Login</a>
                    </body>
                `);
            }
        }
    );
});

app.get('/solicitar-retiro', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'si' WHERE id = ?", [req.session.socio.id], () => {
        res.send("<script>alert('Solicitud de retiro enviada.'); window.location='/dashboard';</script>");
    });
});

// --- PANEL DE ADMINISTRACIÓN ---
app.get('/codigo-1-panel', (req, res) => {
    if (!req.session.socio || req.session.socio.usuario !== 'ADMINRZ') {
        return res.redirect('/');
    }

    db.all("SELECT * FROM socios", (err, rows) => {
        let tabla_admin = "";
        for (let j = 0; j < rows.length; j++) {
            let r = rows[j];
            let estilo_fila = (r.solicitud_retiro === 'si') ? "background-color: #450a0a;" : "";
            
            tabla_admin += `
                <tr style="${estilo_fila}">
                    <td>${r.nombre}</td>
                    <td>${r.usuario}</td>
                    <td>${r.estado}</td>
                    <td>$${r.balance}</td>
                    <td>${r.solicitud_retiro === 'si' ? '<b>SÍ</b>' : 'No'}</td>
                    <td>
                        <a href="/aprobar-socio/${r.id}" style="color:#3b82f6;">Activar</a> | 
                        <a href="/marcar-pagado/${r.id}" style="color:#10b981;">Pagado</a>
                    </td>
                </tr>
            `;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                ${css_estilos}
            </head>
            <body>
                <h2>Panel Maestro Raízoma</h2>
                <table class="tabla-invitados" style="font-size: 12px; background: #1e293b;">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>User</th>
                            <th>Estado</th>
                            <th>Balance</th>
                            <th>¿Retiro?</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabla_admin}
                    </tbody>
                </table>
                <br>
                <a href="/dashboard" class="boton-primario" style="text-decoration:none;">Volver al Dashboard</a>
            </body>
            </html>
        `);
    });
});

app.get('/aprobar-socio/:id', (req, res) => {
    const socioId = req.params.id;
    db.get("SELECT patrocinador_id FROM socios WHERE id = ?", [socioId], (err, s) => {
        if (s && s.patrocinador_id) {
            // Sumar 100 PV
            db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [s.patrocinador_id], () => {
                // Calcular bono por diferencia
                db.get("SELECT puntos, bono_cobrado FROM socios WHERE usuario = ?", [s.patrocinador_id], (err, p) => {
                    let meta_dinero = 0;
                    if (p.puntos >= 400) meta_dinero = 9000;
                    else if (p.puntos >= 200) meta_dinero = 4500;
                    else if (p.puntos >= 100) meta_dinero = 1500;

                    let pago = meta_dinero - p.bono_cobrado;
                    if (pago > 0) {
                        db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", 
                        [pago, pago, s.patrocinador_id]);
                    }
                });
            });
        }
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [socioId], () => {
            res.redirect('/codigo-1-panel');
        });
    });
});

app.get('/marcar-pagado/:id', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0 WHERE id = ?", [req.params.id], () => {
        res.redirect('/codigo-1-panel');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log("=========================================");
    console.log(`SISTEMA RAÍZOMA V.MAX CORRIENDO EN PORT ${port}`);
    console.log("=========================================");
});