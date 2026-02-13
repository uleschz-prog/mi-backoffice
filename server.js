const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// 1. CONEXIÓN A LA BASE DE DATOS (Persistencia en Render)
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al abrir la base de datos:", err.message);
    } else {
        console.log("Conexión exitosa a la base de datos en /data/raizoma.db");
    }
});

// 2. CREACIÓN Y ACTUALIZACIÓN DE TABLAS (ESTRUCTURA EXTENSA)
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
        solicitud_retiro TEXT DEFAULT 'no'
    )`);

    // Verificación manual de columnas (Línea por línea)
    db.run("ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0", (err) => {
        if (err) { console.log("Columna balance ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {
        if (err) { console.log("Columna puntos ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN bono_cobrado REAL DEFAULT 0", (err) => {
        if (err) { console.log("Columna bono_cobrado ya existe."); }
    });
    db.run("ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'", (err) => {
        if (err) { console.log("Columna solicitud_retiro ya existe."); }
    });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_secret_master_key_2026_safe_version',
    resave: false,
    saveUninitialized: true
}));

// --- ESTILOS CSS EXTENSOS ---
const html_header = `
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { 
                background-color: #0f172a; 
                color: white; 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
            }
            .card-custom { 
                background: #1e293b; 
                border-radius: 20px; 
                border: 1px solid #334155; 
                padding: 25px; 
                margin-bottom: 25px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .stat-circle { 
                width: 75px; 
                height: 75px; 
                border-radius: 50%; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                margin: 0 auto; 
                border: 3px solid; 
                background: rgba(0,0,0,0.2);
            }
            .stat-number {
                font-size: 20px;
                font-weight: bold;
            }
            .stat-text {
                font-size: 9px;
                text-transform: uppercase;
            }
            .btn-raizoma {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 10px;
                font-weight: bold;
                width: 100%;
                transition: 0.3s;
            }
            .btn-raizoma:hover {
                background: #2563eb;
            }
        </style>
    </head>
`;

// --- RUTAS ---

// LOGIN
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        ${html_header}
        <body class="d-flex align-items-center justify-content-center" style="height: 100vh; padding:0; margin:0;">
            <div class="card-custom text-center" style="width: 100%; max-width: 400px;">
                <h2 class="mb-4" style="color:#3b82f6;">🌳 Raízoma</h2>
                <form action="/login" method="POST">
                    <div class="mb-3 text-start">
                        <label>Usuario</label>
                        <input type="text" name="user" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                    </div>
                    <div class="mb-3 text-start">
                        <label>Contraseña</label>
                        <input type="password" name="pass" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                    </div>
                    <button type="submit" class="btn-raizoma">INICIAR SESIÓN</button>
                </form>
                <div class="mt-4">
                    <a href="/registro" style="color:#94a3b8; text-decoration:none; font-size:14px;">¿Nuevo socio? Regístrate aquí</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// DASHBOARD (OFICINA VIRTUAL COMPLETA)
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) {
        return res.redirect('/');
    }
    const s = req.session.socio;

    // CONSULTA DE EQUIPO (SIN .MAP, USANDO FOR TRADICIONAL)
    db.all("SELECT nombre, plan, estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        let totales = 0;
        let activos = 0;
        let pendientes = 0;
        let tablaHtml = "";

        if (invitados) {
            totales = invitados.length;
            tablaHtml = `
                <table class="table table-dark table-striped mt-3" style="font-size:13px; border:1px solid #334155;">
                    <thead>
                        <tr>
                            <th>Socio</th>
                            <th>Plan</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            for (let i = 0; i < invitados.length; i++) {
                let inv = invitados[i];
                let colorEstado = "#f59e0b"; // Naranja para pendiente
                if (inv.estado === 'activo') {
                    activos++;
                    colorEstado = "#10b981"; // Verde para activo
                }
                tablaHtml += `
                    <tr>
                        <td>${inv.nombre}</td>
                        <td>${inv.plan}</td>
                        <td style="color:${colorEstado}; font-weight:bold;">${inv.estado.toUpperCase()}</td>
                    </tr>
                `;
            }
            pendientes = totales - activos;
            tablaHtml += `</tbody></table>`;
        } else {
            tablaHtml = "<p class='text-center text-secondary py-3'>No tienes invitados registrados.</p>";
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            ${html_header}
            <body>
                <div class="container" style="max-width: 600px;">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="m-0">Hola, <span style="color:#3b82f6;">${s.nombre}</span></h4>
                        <a href="/logout" class="btn btn-sm btn-outline-danger">Cerrar Sesión</a>
                    </div>

                    <div class="card-custom">
                        <label class="text-secondary small mb-2">Tu Enlace de Referido</label>
                        <div class="d-flex gap-2">
                            <input type="text" id="linkInvitacion" class="form-control" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly style="background:#0f172a; color:white; border:1px solid #334155;">
                            <button onclick="copiarLink()" class="btn btn-primary">Copiar</button>
                        </div>
                    </div>

                    <div class="card-custom">
                        <p class="text-center small text-secondary mb-4">MI EQUIPO DIRECTO</p>
                        <div class="row">
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#3b82f6; color:#3b82f6;">
                                    <span class="stat-number">${totales}</span>
                                    <span class="stat-text">Total</span>
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#10b981; color:#10b981;">
                                    <span class="stat-number">${activos}</span>
                                    <span class="stat-text">Activos</span>
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#f59e0b; color:#f59e0b;">
                                    <span class="stat-number">${pendientes}</span>
                                    <span class="stat-text">Pend.</span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4" style="max-height: 250px; overflow-y: auto;">
                            ${tablaHtml}
                        </div>
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #3b82f6;">
                        <div class="row align-items-center">
                            <div class="col-7">
                                <small class="text-secondary">Balance de Comisiones</small>
                                <div style="font-size: 30px; font-weight: bold; color: #3b82f6;">$${s.balance || 0}</div>
                            </div>
                            <div class="col-5 text-end">
                                ${s.balance >= 500 ? `<a href="/solicitar-retiro" class="btn btn-success btn-sm w-100">RETIRAR</a>` : `<span class="badge bg-secondary">Mínimo $500</span>`}
                            </div>
                        </div>
                        ${s.solicitud_retiro === 'si' ? `<p class="text-warning small text-center mt-2 mb-0">⚠️ Pago en proceso de validación...</p>` : ''}
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #10b981;">
                        <small class="text-secondary">Puntos de Volumen (PV)</small>
                        <div style="font-size: 26px; font-weight: bold; color: #10b981;">${s.puntos || 0} PV</div>
                    </div>
                </div>

                <script>
                    function copiarLink() {
                        var input = document.getElementById("linkInvitacion");
                        input.select();
                        input.setSelectionRange(0, 99999);
                        document.execCommand("copy");
                        alert("¡Enlace copiado al portapapeles!");
                    }
                </script>
            </body>
            </html>
        `);
    });
});

// REGISTRO DE NUEVOS SOCIOS
app.get('/registro', (req, res) => {
    const patrocinador = req.query.ref || '';
    res.send(`
        <!DOCTYPE html>
        <html>
        ${html_header}
        <body>
            <div class="container" style="max-width: 500px;">
                <div class="card-custom">
                    <h3 class="text-center mb-4">Formulario de Inscripción</h3>
                    <form action="/registro" method="POST">
                        <input type="hidden" name="patrocinador" value="${patrocinador}">
                        
                        <div class="mb-3">
                            <label>Nombre Completo</label>
                            <input type="text" name="nombre" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                        </div>
                        
                        <div class="mb-3">
                            <label>Nombre de Usuario</label>
                            <input type="text" name="usuario" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                        </div>
                        
                        <div class="mb-3">
                            <label>Contraseña</label>
                            <input type="password" name="password" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                        </div>
                        
                        <div class="mb-3">
                            <label>Plan a Adquirir</label>
                            <select name="plan" class="form-select" style="background:#0f172a; color:white; border:1px solid #334155;">
                                <option value="Partner">Partner - $15,000 MXN</option>
                                <option value="Pro">Pro - $30,000 MXN</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label>Hash de Pago (TxID)</label>
                            <input type="text" name="hash" class="form-control" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                        </div>
                        
                        <div class="mb-3">
                            <label>Dirección de Envío Completa</label>
                            <textarea name="direccion" class="form-control" rows="3" style="background:#0f172a; color:white; border:1px solid #334155;" required></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-success w-100 font-weight-bold py-3">ENVIAR INSCRIPCIÓN</button>
                    </form>
                </div>
            </div>
        </body>
        </html>
    `);
});

// --- LÓGICA DE PROCESAMIENTO (DETALLADA) ---

app.post('/login', (req, res) => {
    const usuarioRecibido = req.body.user;
    const passwordRecibida = req.body.pass;

    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [usuarioRecibido, passwordRecibida], (err, row) => {
        if (err) {
            console.error(err.message);
            res.send("Error en el servidor.");
        } else if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Datos incorrectos. Intenta de nuevo.'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;

    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion],
        function(err) {
            if (err) {
                res.send("Error al registrar: " + err.message);
            } else {
                res.send(`
                    <body style="background:#0f172a; color:white; text-align:center; padding-top:100px; font-family:sans-serif;">
                        <h1 style="color:#10b981;">¡Registro Exitoso!</h1>
                        <p>Tu solicitud está en revisión. En breve activaremos tu cuenta.</p>
                        <a href="/" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Regresar al Inicio</a>
                    </body>
                `);
            }
        }
    );
});

app.get('/solicitar-retiro', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    
    db.run("UPDATE socios SET solicitud_retiro = 'si' WHERE id = ?", [req.session.socio.id], (err) => {
        if (err) {
            res.send("Error al procesar solicitud.");
        } else {
            res.send("<script>alert('Tu solicitud de retiro ha sido enviada al administrador.'); window.location='/dashboard';</script>");
        }
    });
});

// --- PANEL DE ADMINISTRACIÓN (VISTA EXTENSA) ---
app.get('/codigo-1-panel', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        if (err) {
            res.send("Error al cargar socios.");
        } else {
            let filasTabla = "";
            for (let j = 0; j < rows.length; j++) {
                let r = rows[j];
                let alertaRetiro = (r.solicitud_retiro === 'si') ? "background-color: #450a0a; color: #fca5a5; font-weight:bold;" : "";
                
                filasTabla += `
                    <tr style="${alertaRetiro}">
                        <td>${r.nombre}</td>
                        <td>${r.usuario}</td>
                        <td>${r.plan}</td>
                        <td>$${r.balance}</td>
                        <td>${r.solicitud_retiro === 'si' ? 'PAGO PENDIENTE' : 'No'}</td>
                        <td>
                            <a href='/aprobar-socio/${r.id}' class="btn btn-sm btn-primary">Activar</a>
                            <a href='/marcar-pagado/${r.id}' class="btn btn-sm btn-success">Pagado</a>
                        </td>
                    </tr>
                `;
            }

            res.send(`
                <!DOCTYPE html>
                <html>
                ${html_header}
                <body>
                    <div class="container-fluid">
                        <h2 class="mb-4">Panel Maestro de Control</h2>
                        <table class="table table-dark table-bordered">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Usuario</th>
                                    <th>Plan</th>
                                    <th>Balance</th>
                                    <th>Retiro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filasTabla}
                            </tbody>
                        </table>
                        <a href="/dashboard" class="btn btn-secondary">Volver al Dashboard</a>
                    </div>
                </body>
                </html>
            `);
        }
    });
});

// LÓGICA DE APROBACIÓN CON REGLA DE BONOS (DIFERENCIA)
app.get('/aprobar-socio/:id', (req, res) => {
    const idSocio = req.params.id;

    db.get("SELECT patrocinador_id FROM socios WHERE id = ?", [idSocio], (err, socioNuevo) => {
        if (socioNuevo && socioNuevo.patrocinador_id) {
            // 1. Sumar 100 PV al patrocinador
            db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [socioNuevo.patrocinador_id], () => {
                
                // 2. Calcular Bono por diferencia
                db.get("SELECT puntos, bono_cobrado, balance FROM socios WHERE usuario = ?", [socioNuevo.patrocinador_id], (err, p) => {
                    if (p) {
                        let bonoMeta = 0;
                        if (p.puntos >= 400) {
                            bonoMeta = 9000;
                        } else if (p.puntos >= 200) {
                            bonoMeta = 4500;
                        } else if (p.puntos >= 100) {
                            bonoMeta = 1500;
                        }

                        let diferencia = bonoMeta - p.bono_cobrado;

                        if (diferencia > 0) {
                            db.run("UPDATE socios SET balance = balance + ?, bono_cobrado = bono_cobrado + ? WHERE usuario = ?", 
                                [diferencia, diferencia, socioNuevo.patrocinador_id]
                            );
                        }
                    }
                });
            });
        }
        
        // 3. Activar al socio
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [idSocio], () => {
            res.redirect('/codigo-1-panel');
        });
    });
});

app.get('/marcar-pagado/:id', (req, res) => {
    const idRetiro = req.params.id;
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0 WHERE id = ?", [idRetiro], () => {
        res.redirect('/codigo-1-panel');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// INICIO DEL SERVIDOR
app.listen(port, () => {
    console.log("-----------------------------------------");
    console.log(`SERVIDOR RAÍZOMA V.SAFE CORRIENDO EN PUERTO ${port}`);
    console.log("-----------------------------------------");
});