const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// 1. CONEXIÓN A LA BASE DE DATOS
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log("Conectado exitosamente a /data/raizoma.db");
});

// 2. CREACIÓN Y ACTUALIZACIÓN DE TABLAS
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
        puntos INTEGER DEFAULT 0
    )`);

    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {
        if (err) console.log("La columna puntos ya existe.");
    });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_secret_master_key_2026',
    resave: false,
    saveUninitialized: true
}));

// --- RUTAS DEL SISTEMA ---

// LOGIN PRINCIPAL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login - Raízoma</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .login-card { background: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155; width: 100%; max-width: 400px; }
            </style>
        </head>
        <body>
            <div class="login-card text-center">
                <h2 class="mb-4" style="color:#3b82f6;">🌳 Raízoma</h2>
                <form action="/login" method="POST">
                    <input type="text" name="user" class="form-control mb-3" placeholder="Usuario" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                    <input type="password" name="pass" class="form-control mb-3" placeholder="Contraseña" style="background:#0f172a; color:white; border:1px solid #334155;" required>
                    <button type="submit" class="btn btn-primary w-100" style="background:#3b82f6; border:none; font-weight:bold;">ENTRAR</button>
                </form>
                <p class="mt-3 small"><a href="/registro" style="color:#94a3b8; text-decoration:none;">¿No tienes cuenta? Regístrate aquí</a></p>
            </div>
        </body>
        </html>
    `);
});

// DASHBOARD CON RED (OPCIÓN B)
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    // Lógica para obtener datos de la red antes de mostrar el HTML
    db.all("SELECT estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        const totales = invitados ? invitados.length : 0;
        const activos = invitados ? invitados.filter(i => i.estado === 'activo').length : 0;
        const pendientes = totales - activos;

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Backoffice - Raízoma</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background-color: #0f172a; color: white; font-family: sans-serif; padding: 20px; }
                    .card-custom { background: #1e293b; border-radius: 15px; border: 1px solid #334155; padding: 20px; margin-bottom: 20px; }
                    .stat-circle { width: 70px; height: 70px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: auto; border: 3px solid; }
                </style>
            </head>
            <body>
                <div class="container" style="max-width: 500px;">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2 class="m-0">Hola, <span style="color:#3b82f6;">${s.nombre}</span></h2>
                        <a href="/logout" class="btn btn-sm btn-outline-danger">Salir</a>
                    </div>

                    <div class="card-custom text-center">
                        <small style="color:#94a3b8;">Tu Enlace de Invitación</small>
                        <input type="text" id="link" class="form-control my-2 text-center" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly style="background:#0f172a; color:white; border:1px solid #334155;">
                        <button onclick="copy()" class="btn btn-primary w-100" style="background:#3b82f6; border:none; font-weight:bold;">Copiar Link</button>
                    </div>

                    <div class="card-custom">
                        <p class="text-center small mb-3" style="color:#94a3b8;">MI EQUIPO DIRECTO</p>
                        <div class="row">
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#3b82f6; color:#3b82f6;">
                                    <b style="font-size:18px;">${totales}</b>
                                    <span style="font-size:9px;">TOTAL</span>
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#10b981; color:#10b981;">
                                    <b style="font-size:18px;">${activos}</b>
                                    <span style="font-size:9px;">ACTIVOS</span>
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#f59e0b; color:#f59e0b;">
                                    <b style="font-size:18px;">${pendientes}</b>
                                    <span style="font-size:9px;">PEND.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #10b981;">
                        <small style="color:#94a3b8;">Puntos de Volumen (PV)</small>
                        <div style="font-size:28px; font-weight:bold; color:#10b981;">${s.puntos || 0} PV</div>
                        <small>Estado: <span style="color:${s.estado === 'activo' ? '#10b981' : '#f59e0b'}">${s.estado.toUpperCase()}</span></small>
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #3b82f6;">
                        <small style="color:#94a3b8;">Comisiones Totales</small>
                        <div style="font-size:32px; font-weight:bold; color:#3b82f6;">$${s.balance || 0}</div>
                    </div>
                </div>
                <script>
                    function copy() {
                        var copyText = document.getElementById("link");
                        copyText.select();
                        document.execCommand("copy");
                        alert("¡Enlace copiado!");
                    }
                </script>
            </body>
            </html>
        `);
    });
});

// REGISTRO COMPLETO (TODOS LOS CAMPOS)
app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro - Raízoma</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background-color: #0f172a; color: white; padding: 20px; }
                .form-card { background: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155; max-width: 500px; margin: auto; }
            </style>
        </head>
        <body>
            <div class="form-card">
                <h3 class="text-center mb-4">Inscripción Raízoma</h3>
                <form action="/registro" method="POST">
                    <input type="hidden" name="patrocinador" value="${ref}">
                    <div class="mb-3"><label>Nombre Completo</label><input type="text" name="nombre" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Usuario</label><input type="text" name="usuario" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Contraseña</label><input type="password" name="password" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3">
                        <label>Plan de Ingreso</label>
                        <select name="plan" class="form-select" style="background:#0f172a; color:white; border:1px solid #444;">
                            <option value="Partner">Partner - $15,000 MXN</option>
                            <option value="Pro">Pro - $30,000 MXN</option>
                        </select>
                    </div>
                    <div class="mb-3"><label>Hash de Pago (TxID)</label><input type="text" name="hash" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Dirección de Envío</label><textarea name="direccion" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" rows="3" required></textarea></div>
                    <button type="submit" class="btn btn-success w-100" style="font-weight:bold;">FINALIZAR REGISTRO</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// LÓGICA DE PROCESAMIENTO
app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Datos incorrectos'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion],
        function(err) {
            if (err) return res.send("Error al registrar: " + err.message);
            res.send("<body style='background:#0f172a;color:white;text-align:center;padding-top:50px;'><h1>¡Registro Enviado!</h1><p>Activaremos tu cuenta al confirmar el pago.</p><a href='/' style='color:#3b82f6;'>Ir al Login</a></body>");
        }
    );
});

// PANEL DE ADMIN
app.get('/codigo-1-panel', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        let tabla = rows.map(r => `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.plan}</td>
                <td><span class="badge ${r.estado === 'activo' ? 'bg-success' : 'bg-warning'}">${r.estado}</span></td>
                <td><a href='/aprobar/${r.id}' class="btn btn-sm btn-primary">Aprobar</a></td>
            </tr>
        `).join('');
        res.send(`
            <body style="background:#0f172a; color:white; padding:40px; font-family:sans-serif;">
                <h2>Panel Maestro de Socios</h2>
                <table border="1" style="width:100%; text-align:center; border-collapse:collapse; margin-top:20px;">
                    <thead><tr><th>Nombre</th><th>Plan</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>${tabla}</tbody>
                </table>
                <br><a href="/dashboard" style="color:white;">Regresar al Dashboard</a>
            </body>
        `);
    });
});

app.get('/aprobar/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT patrocinador_id FROM socios WHERE id = ?", [id], (err, s) => {
        if (s && s.patrocinador_id) {
            db.run("UPDATE socios SET puntos = puntos + 100 WHERE usuario = ?", [s.patrocinador_id]);
        }
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [id], () => {
            res.redirect('/codigo-1-panel');
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => console.log(`Servidor Raízoma en puerto ${port}`));