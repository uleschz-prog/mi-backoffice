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
        puntos INTEGER DEFAULT 0,
        solicitud_retiro TEXT DEFAULT 'no'
    )`);

    // Aseguramos que existan las columnas de balance, puntos y solicitudes
    db.run("ALTER TABLE socios ADD COLUMN balance REAL DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {});
    db.run("ALTER TABLE socios ADD COLUMN solicitud_retiro TEXT DEFAULT 'no'", (err) => {});
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_secret_master_key_2026',
    resave: false,
    saveUninitialized: true
}));

// --- RUTAS DEL SISTEMA ---

// LOGIN
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
                <p class="mt-3 small"><a href="/registro" style="color:#94a3b8; text-decoration:none;">¿No tienes cuenta? Regístrate</a></p>
            </div>
        </body>
        </html>
    `);
});

// DASHBOARD CON LISTA DE INVITADOS Y RETIROS
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    // Obtenemos todos los invitados de este socio
    db.all("SELECT nombre, plan, estado FROM socios WHERE patrocinador_id = ?", [s.usuario], (err, invitados) => {
        const totales = invitados ? invitados.length : 0;
        const activos = invitados ? invitados.filter(i => i.estado === 'activo').length : 0;
        const pendientes = totales - activos;

        // Generamos la tabla de invitados
        let listaInvitados = "";
        if (totales > 0) {
            listaInvitados = `<table class="table table-dark table-sm mt-2 small" style="border-color:#334155;">
                <thead><tr><th>Socio</th><th>Plan</th><th>Estado</th></tr></thead>
                <tbody>`;
            invitados.forEach(inv => {
                const color = inv.estado === 'activo' ? '#10b981' : '#f59e0b';
                listaInvitados += `<tr><td>${inv.nombre}</td><td>${inv.plan}</td><td style="color:${color}">${inv.estado}</td></tr>`;
            });
            listaInvitados += `</tbody></table>`;
        } else {
            listaInvitados = `<p class="text-center small text-secondary mt-2">Aún no tienes invitados directos.</p>`;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Backoffice - Raízoma</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background-color: #0f172a; color: white; padding: 20px; font-family: sans-serif; }
                    .card-custom { background: #1e293b; border-radius: 15px; border: 1px solid #334155; padding: 20px; margin-bottom: 20px; }
                    .stat-circle { width: 65px; height: 65px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: auto; border: 2px solid; }
                </style>
            </head>
            <body>
                <div class="container" style="max-width: 500px;">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="m-0">Hola, <span style="color:#3b82f6;">${s.nombre}</span></h4>
                        <a href="/logout" class="btn btn-sm btn-outline-danger">Salir</a>
                    </div>

                    <div class="card-custom text-center">
                        <small style="color:#94a3b8;">Tu Link de Invitación</small>
                        <input type="text" id="link" class="form-control my-2 text-center" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly style="background:#0f172a; color:white; border:1px solid #334155;">
                        <button onclick="copy()" class="btn btn-sm btn-primary w-100">Copiar Link</button>
                    </div>

                    <div class="card-custom">
                        <p class="text-center small mb-3 text-secondary">ESTADÍSTICAS DE EQUIPO</p>
                        <div class="row mb-3">
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#3b82f6; color:#3b82f6;"><b>${totales}</b><span style="font-size:8px;">TOTAL</span></div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#10b981; color:#10b981;"><b>${activos}</b><span style="font-size:8px;">ACTIVOS</span></div>
                            </div>
                            <div class="col-4 text-center">
                                <div class="stat-circle" style="border-color:#f59e0b; color:#f59e0b;"><b>${pendientes}</b><span style="font-size:8px;">PEND.</span></div>
                            </div>
                        </div>
                        <p class="small text-secondary mb-1">Mis Invitados Directos:</p>
                        <div style="max-height:150px; overflow-y:auto;">
                            ${listaInvitados}
                        </div>
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #3b82f6;">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small style="color:#94a3b8;">Balance Disponible</small>
                                <div style="font-size:28px; font-weight:bold; color:#3b82f6;">$${s.balance || 0}</div>
                            </div>
                            ${s.balance >= 500 ? `<a href="/retirar" class="btn btn-sm btn-success">Cobrar</a>` : `<span class="badge bg-secondary">Mín. $500</span>`}
                        </div>
                        ${s.solicitud_retiro === 'si' ? `<p class="mt-2 small text-warning text-center">⚠️ Solicitud de pago en proceso...</p>` : ''}
                    </div>

                    <div class="card-custom" style="border-left: 5px solid #10b981;">
                        <small style="color:#94a3b8;">Puntos de Volumen (PV)</small>
                        <div style="font-size:24px; font-weight:bold; color:#10b981;">${s.puntos || 0} PV</div>
                    </div>
                </div>
                <script>function copy(){ var c=document.getElementById("link"); c.select(); document.execCommand("copy"); alert("Copiado"); }</script>
            </body>
            </html>
        `);
    });
});

// RUTA PARA SOLICITAR RETIRO
app.get('/retirar', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    db.run("UPDATE socios SET solicitud_retiro = 'si' WHERE id = ?", [req.session.socio.id], () => {
        res.send("<script>alert('Solicitud enviada al Admin'); window.location='/dashboard';</script>");
    });
});

// REGISTRO (SIN CAMBIOS)
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
            <style>body { background-color: #0f172a; color: white; padding: 20px; }</style>
        </head>
        <body>
            <div class="container" style="max-width:500px; background:#1e293b; padding:25px; border-radius:20px;">
                <h3 class="text-center mb-4">Nueva Inscripción</h3>
                <form action="/registro" method="POST">
                    <input type="hidden" name="patrocinador" value="${ref}">
                    <div class="mb-3"><label>Nombre</label><input type="text" name="nombre" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Usuario</label><input type="text" name="usuario" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Contraseña</label><input type="password" name="password" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Plan</label><select name="plan" class="form-select" style="background:#0f172a; color:white; border:1px solid #444;"><option value="Partner">Partner - $15,000 MXN</option><option value="Pro">Pro - $30,000 MXN</option></select></div>
                    <div class="mb-3"><label>Hash de Pago</label><input type="text" name="hash" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></div>
                    <div class="mb-3"><label>Dirección</label><textarea name="direccion" class="form-control" style="background:#0f172a; color:white; border:1px solid #444;" required></textarea></div>
                    <button type="submit" class="btn btn-success w-100">ENVIAR REGISTRO</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) { req.session.socio = row; res.redirect('/dashboard'); }
        else { res.send("<script>alert('Error'); window.location='/';</script>"); }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion],
        function(err) { res.send("<body style='background:#0f172a;color:white;text-align:center;padding-top:50px;'><h1>¡Listo!</h1><p>Confirmaremos tu pago pronto.</p><a href='/'>Ir al Login</a></body>"); }
    );
});

// PANEL ADMIN ACTUALIZADO (VER QUIÉN QUIERE COBRAR)
app.get('/codigo-1-panel', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        let tabla = rows.map(r => `
            <tr style="color: ${r.solicitud_retiro === 'si' ? '#fcd535' : 'white'}">
                <td>${r.nombre}</td>
                <td>${r.estado}</td>
                <td>$${r.balance}</td>
                <td>${r.solicitud_retiro === 'si' ? '<b>PAGO PENDIENTE</b>' : 'No'}</td>
                <td>
                    <a href='/aprobar/${r.id}' class="btn btn-sm btn-primary">Activar</a>
                    <a href='/pagar/${r.id}' class="btn btn-sm btn-success">Pagado</a>
                </td>
            </tr>
        `).join('');
        res.send(`
            <body style="background:#0f172a; color:white; padding:20px; font-family:sans-serif;">
                <h2>Panel Maestro</h2>
                <table border="1" style="width:100%; text-align:center; border-collapse:collapse;">
                    <thead><tr><th>Nombre</th><th>Estado</th><th>Balance</th><th>Retiro</th><th>Acciones</th></tr></thead>
                    <tbody>${tabla}</tbody>
                </table>
                <br><a href="/dashboard" style="color:white;">Dashboard</a>
            </body>
        `);
    });
});

app.get('/aprobar/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT patrocinador_id FROM socios WHERE id = ?", [id], (err, s) => {
        if (s && s.patrocinador_id) {
            db.run("UPDATE socios SET puntos = puntos + 100, balance = balance + 1500 WHERE usuario = ?", [s.patrocinador_id]);
        }
        db.run("UPDATE socios SET estado = 'activo' WHERE id = ?", [id], () => { res.redirect('/codigo-1-panel'); });
    });
});

app.get('/pagar/:id', (req, res) => {
    db.run("UPDATE socios SET solicitud_retiro = 'no', balance = 0 WHERE id = ?", [req.params.id], () => {
        res.redirect('/codigo-1-panel');
    });
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });
app.listen(port, () => console.log(`Raízoma V11 Activo`));