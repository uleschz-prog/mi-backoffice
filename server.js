const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// 1. CONEXIÓN A LA BASE DE DATOS (Ruta persistente en Render)
const dbPath = path.join('/data', 'raizoma.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log("Conexión exitosa a /data/raizoma.db");
});

// 2. ESTRUCTURA DE TABLA (Aseguramos que no falte ninguna columna de tus capturas)
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

    // Verificación de seguridad: Agregar columna puntos si no existe por alguna actualización previa
    db.run("ALTER TABLE socios ADD COLUMN puntos INTEGER DEFAULT 0", (err) => {
        if (err) console.log("La columna 'puntos' ya está integrada.");
    });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'raizoma_master_ultra_secret_2026',
    resave: false,
    saveUninitialized: true
}));

// --- INTERFAZ VISUAL (HTML & CSS UNIFICADO) ---
const header = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: white; font-family: 'Segoe UI', sans-serif; }
        .raizoma-card { background: #1e293b; border-radius: 20px; border: 1px solid #334155; padding: 25px; margin-bottom: 20px; }
        .btn-raizoma { background: #3b82f6; border: none; padding: 12px; font-weight: bold; border-radius: 10px; color: white; width: 100%; }
        .btn-raizoma:hover { background: #2563eb; }
        .input-raizoma { background: #0f172a !important; color: white !important; border: 1px solid #334155 !important; margin-bottom: 15px; }
        .pv-count { font-size: 32px; font-weight: bold; color: #10b981; }
    </style>
`;

// --- RUTAS ---

// 1. LOGIN
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head>${header}<title>Login - Raízoma</title></head>
        <body class="d-flex align-items-center" style="height:100vh;">
            <div class="container" style="max-width:400px;">
                <div class="raizoma-card text-center">
                    <h2 class="mb-4">🌳 Raízoma</h2>
                    <form action="/login" method="POST">
                        <input type="text" name="user" class="form-control input-raizoma" placeholder="Usuario" required>
                        <input type="password" name="pass" class="form-control input-raizoma" placeholder="Contraseña" required>
                        <button type="submit" class="btn-raizoma">INICIAR SESIÓN</button>
                    </form>
                    <p class="mt-3"><a href="/registro" class="text-secondary text-decoration-none small">¿Nuevo socio? Regístrate aquí</a></p>
                </div>
            </div>
        </body></html>
    `);
});

// 2. DASHBOARD (TU OFICINA)
app.get('/dashboard', (req, res) => {
    if (!req.session.socio) return res.redirect('/');
    const s = req.session.socio;

    res.send(`
        <!DOCTYPE html><html><head>${header}<title>Dashboard - Raízoma</title></head>
        <body class="p-3">
            <div class="container" style="max-width:500px;">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="m-0">Hola, <span class="text-info">${s.nombre}</span></h4>
                    <a href="/logout" class="btn btn-sm btn-outline-danger">Salir</a>
                </div>

                <div class="raizoma-card">
                    <label class="text-secondary small">Mi Link de Invitación</label>
                    <input type="text" id="link" class="form-control input-raizoma mt-2" value="https://mi-backoffice-ra8q.onrender.com/registro?ref=${s.usuario}" readonly>
                    <button onclick="copy()" class="btn-raizoma">COPIAR ENLACE</button>
                </div>

                <div class="raizoma-card" style="border-left: 5px solid #10b981;">
                    <label class="text-secondary small">Puntos de Volumen (PV)</label>
                    <div class="pv-count">${s.puntos || 0} PV</div>
                    <div class="small">Estatus: <span class="${s.estado === 'activo' ? 'text-success' : 'text-warning'}">${s.estado.toUpperCase()}</span></div>
                </div>

                <div class="raizoma-card" style="border-left: 5px solid #3b82f6;">
                    <label class="text-secondary small">Comisiones Totales</label>
                    <div class="pv-count text-info">$${s.balance || 0}</div>
                    <small class="text-secondary text-uppercase" style="font-size:10px;">Corte al día de hoy</small>
                </div>
            </div>
            <script>function copy(){ var c=document.getElementById('link'); c.select(); document.execCommand('copy'); alert('¡Enlace copiado con éxito!'); }</script>
        </body></html>
    `);
});

// 3. REGISTRO (CON TODOS LOS CAMPOS DE TU CAPTURA)
app.get('/registro', (req, res) => {
    const ref = req.query.ref || '';
    res.send(`
        <!DOCTYPE html><html><head>${header}<title>Registro - Raízoma</title></head>
        <body class="p-3">
            <div class="container" style="max-width:500px;">
                <div class="raizoma-card">
                    <h3 class="text-center mb-4">Nueva Inscripción</h3>
                    <form action="/registro" method="POST">
                        <input type="hidden" name="patrocinador" value="${ref}">
                        <div class="mb-3"><label>Nombre Completo</label><input type="text" name="nombre" class="form-control input-raizoma" required></div>
                        <div class="mb-3"><label>Nombre de Usuario</label><input type="text" name="usuario" class="form-control input-raizoma" required></div>
                        <div class="mb-3"><label>Contraseña</label><input type="password" name="password" class="form-control input-raizoma" required></div>
                        <div class="mb-3"><label>Plan de Ingreso</label>
                            <select name="plan" class="form-select input-raizoma">
                                <option value="Partner">Partner - $15,000 MXN</option>
                                <option value="Pro">Pro - $30,000 MXN</option>
                            </select>
                        </div>
                        <div class="mb-3"><label>Hash de Pago (TxID)</label><input type="text" name="hash" class="form-control input-raizoma" required></div>
                        <div class="mb-3"><label>Dirección de Envío</label><textarea name="direccion" class="form-control input-raizoma" rows="2" required></textarea></div>
                        <button type="submit" class="btn-raizoma" style="background:#10b981;">FINALIZAR Y ENVIAR</button>
                    </form>
                </div>
            </div>
        </body></html>
    `);
});

// --- PROCESAMIENTO ---

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM socios WHERE usuario = ? AND password = ?", [user, pass], (err, row) => {
        if (row) {
            req.session.socio = row;
            res.redirect('/dashboard');
        } else {
            res.send("<script>alert('Usuario o contraseña incorrectos'); window.location='/';</script>");
        }
    });
});

app.post('/registro', (req, res) => {
    const { nombre, usuario, password, patrocinador, plan, hash, direccion } = req.body;
    db.run(`INSERT INTO socios (nombre, usuario, password, patrocinador_id, plan, hash_pago, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, usuario, password, patrocinador, plan, hash, direccion],
        function(err) {
            if (err) return res.send("Error al registrar: " + err.message);
            res.send("<body style='background:#0f172a;color:white;text-align:center;padding-top:50px;'><h1>¡Registro Recibido!</h1><p>Estamos validando tu pago. Pronto se activará tu oficina.</p><a href='/' style='color:#3b82f6;'>Volver al inicio</a></body>");
        }
    );
});

// --- ADMIN PANEL (CÓDIGO 1) ---
app.get('/codigo-1-panel', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        let tableRows = rows.map(r => `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.plan}</td>
                <td><small>${r.hash_pago}</small></td>
                <td><span class="badge ${r.estado === 'activo' ? 'bg-success' : 'bg-warning'}">${r.estado}</span></td>
                <td><a href='/aprobar/${r.id}' class="btn btn-sm btn-primary">Aprobar</a></td>
            </tr>
        `).join('');

        res.send(`
            <!DOCTYPE html><html><head>${header}</head><body class="p-4">
                <h2>Gestión de Socios</h2>
                <table class="table table-dark table-striped mt-4">
                    <thead><tr><th>Nombre</th><th>Plan</th><th>Hash</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <a href="/dashboard" class="btn btn-secondary">Volver al Dashboard</a>
            </body></html>
        `);
    });
});

app.get('/aprobar/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT patrocinador_id FROM socios WHERE id = ?", [id], (err, s) => {
        if (s && s.patrocinador_id) {
            // Suman 100 PV al usuario que lo invitó
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

app.listen(port, () => console.log(`Raízoma V2026 Activo en puerto ${port}`));