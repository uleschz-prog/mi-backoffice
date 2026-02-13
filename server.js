const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Base de Datos en Disco Persistente
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log("Conectado a la base de datos en /data/raizoma.db");
});

// Crear tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        usuario TEXT UNIQUE,
        password TEXT,
        patrocinador_id INTEGER,
        plan TEXT,
        hash_pago TEXT,
        direccion TEXT,
        status TEXT DEFAULT 'pendiente',
        balance REAL DEFAULT 0,
        puntos INTEGER DEFAULT 0
    )`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_secret_key',
    resave: false,
    saveUninitialized: true
}));

// --- RUTAS DE NAVEGACIÓN ---

// Login Principal
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
                body { background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; }
                .login-card { background: #1e293b; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; }
                .btn-primary { background: #3b82f6; border: none; }
            </style>
        </head>
        <body>
            <div class="login-card text-center">
                <h2 class="mb-4">🌳 Raízoma</h2>
                <form action="/login" method="POST">
                    <input type="text" name="usuario" class="form-control mb-3" placeholder="Usuario" required>
                    <input type="password" name="password" class="form-control mb-3" placeholder="Contraseña" required>
                    <button type="submit" class="btn btn-primary w-100 mb-3">Entrar</button>
                </form>
                <a href="/registro" class="text-info" style="text-decoration:none;">¿No tienes cuenta? Inscríbete aquí</a>
            </div>
        </body>
        </html>
    `);
});

// Dashboard del Socio (DISEÑO ACTUALIZADO CON PV)
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Oficina - Raízoma</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background-color: #0f172a; color: white; font-family: sans-serif; }
                .card-custom { background: #1e293b; border-radius: 15px; border: 1px solid #334155; padding: 20px; margin-bottom: 20px; }
                .btn-copy { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; width: 100%; }
            </style>
        </head>
        <body class="p-4">
            <div class="container" style="max-width: 500px;">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Hola, <span style="color:#3b82f6;">${s.nombre}</span></h2>
                    <a href="/logout" class="btn btn-sm btn-outline-danger">Salir</a>
                </div>
                
                <div class="card-custom">
                    <small style="color:#94a3b8;">Tu Enlace de Invitación</small>
                    <input type="text" id="referralLink" class="form-control my-2" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.id}" readonly style="background:#0f172a; color:white; border:1px solid #334155;">
                    <button class="btn-copy" onclick="copyLink()">Copiar Enlace</button>
                </div>

                <div class="card-custom" style="border-color: #10b981;">
                    <small style="color:#94a3b8;">Puntos de Volumen (PV)</small>
                    <div style="font-size:28px; font-weight:bold; color:#10b981; margin-top:5px;">
                        ${s.puntos || 0} PV
                    </div>
                    <small style="color:#64748b;">Estatus: <span style="color:${s.status === 'activo' ? '#10b981' : '#f59e0b'}">${s.status.toUpperCase()}</span></small>
                </div>

                <div class="card-custom">
                    <small style="color:#94a3b8;">Comisiones Acumuladas</small>
                    <div style="font-size:32px; font-weight:bold; color:#3b82f6; margin-top:5px;">
                        $${s.balance || 0}
                    </div>
                </div>

                <script>
                    function copyLink() {
                        var copyText = document.getElementById("referralLink");
                        copyText.select();
                        copyText.setSelectionRange(0, 99999);
                        navigator.clipboard.writeText(copyText.value);
                        alert("¡Enlace copiado!");
                    }
                </script>
            </div>
        </body>
        </html>
    `);
});

// Registro de Socios
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
                .form-card { background: #1e293b; padding: 25px; border-radius: 20px; max-width: 500px; margin: auto; }
            </style>
        </head>
        <body>
            <div class="form-card">
                <h3 class="mb-4 text-center">Inscripción Raízoma</h3>
                <form action="/registro" method="POST">
                    <input type="hidden" name="patrocinador_id" value="${ref}">
                    <div class="mb-3"><label>Nombre Completo</label><input type="text" name="nombre" class="form-control" required></div>
                    <div class="mb-3"><label>Usuario</label><input type="text" name="usuario" class="form-control" required></div>
                    <div class="mb-3"><label>Contraseña</label><input type="password" name="password" class="form-control" required></div>
                    <div class="mb-3">
                        <label>Plan de Ingreso</label>
                        <select name="plan" class="form-select">
                            <option value="Partner">Partner - $15,000 MXN</option>
                            <option value="Pro">Pro - $30,000 MXN</option>
                        </select>
                    </div>
                    <div class="mb-3"><label>Hash de Pago (TxID)</label><input type="text" name="hash_pago" class="form-control" required></div>
                    <div class="mb-3"><label>Dirección de Envío</label><textarea name="direccion" class="form-control" required></textarea></div>
                    <button type="submit" class="btn btn-success w-100">Finalizar Registro</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- LÓGICA DE DATOS ---

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    db.get("SELECT * FROM users WHERE usuario = ? AND password = ?", [usuario, password], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Datos incorrectos'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion } = req.body;
    db.run(`INSERT INTO users (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion],
        function(err) {
            if (err) return res.send("Error al registrar: " + err.message);
            res.send("<h1>¡Registro enviado!</h1><p>Tu cuenta será activada cuando confirmemos tu pago.</p><a href='/'>Ir al Login</a>");
        }
    );
});

// Panel de Administración Maestro (Código 1)
app.get('/codigo-1-panel', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; padding:40px;">
            <h2>Panel Maestro de Activaciones</h2>
            <form action="/admin-auth" method="POST">
                <input type="password" name="master_pass" placeholder="Password Maestro">
                <button type="submit">Entrar</button>
            </form>
        </body>
    `);
});

app.post('/admin-auth', (req, res) => {
    if (req.body.master_pass === 'RAIZOMA_MASTER_ADMIN') {
        db.all("SELECT * FROM users", (err, rows) => {
            let html = "<h1>Socios Registrados</h1><table border='1'><tr><th>Nombre</th><th>Plan</th><th>Hash</th><th>Acción</th></tr>";
            rows.forEach(user => {
                html += `<tr>
                    <td>${user.nombre}</td>
                    <td>${user.plan}</td>
                    <td>${user.hash_pago}</td>
                    <td><a href='/aprobar/${user.id}'>[APROBAR]</a></td>
                </tr>`;
            });
            res.send(html + "</table>");
        });
    } else {
        res.send("Acceso Denegado");
    }
});

// Función de Aprobación (Suma Puntos)
app.get('/aprobar/:id', (req, res) => {
    const userId = req.params.id;
    // Aprobar usuario y sumar 100 puntos al patrocinador
    db.get("SELECT patrocinador_id FROM users WHERE id = ?", [userId], (err, user) => {
        if (user && user.patrocinador_id) {
            db.run("UPDATE users SET puntos = puntos + 100 WHERE id = ?", [user.patrocinador_id]);
        }
        db.run("UPDATE users SET status = 'activo' WHERE id = ?", [userId], () => {
            res.send("<h1>Socio Activado y Puntos Sumados</h1><a href='/codigo-1-panel'>Regresar</a>");
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Servidor Raízoma corriendo en puerto ${port}`);
});