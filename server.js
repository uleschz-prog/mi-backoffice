const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. CONEXIÓN A BASE DE DATOS
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// 2. CREACIÓN DE TABLAS (Asegura que tus apartados existan)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        nivel TEXT,
        puntos INTEGER,
        estado TEXT DEFAULT 'Activo'
    )`);
});

// 3. PANTALLA DE LOGIN
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Login</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #e8f5e9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); width: 320px; text-align: center; }
                h1 { color: #2e7d32; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #2e7d32; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; }
                button:hover { background: #1b5e20; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Raízoma</h1>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="Correo electrónico" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 4. DASHBOARD PRINCIPAL (Lee datos de la DB)
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    // Validación simple
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, rows) => {
            let filasTabla = "";
            let totalPuntos = 0;
            
            rows.forEach(socio => {
                totalPuntos += socio.puntos;
                filasTabla += \`
                    <tr>
                        <td>\${socio.nombre}</td>
                        <td>\${socio.nivel}</td>
                        <td>\${socio.puntos} pts</td>
                        <td><span style="color: #2e7d32; font-weight: bold;">\${socio.estado}</span></td>
                    </tr>\`;
            });

            res.send(\`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Panel Raízoma</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f0f2f5; }
                        header { background: #2e7d32; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
                        .container { padding: 30px; max-width: 1100px; margin: auto; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                        .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; }
                        .stat-card h3 { margin: 0; color: #666; font-size: 14px; text-transform: uppercase; }
                        .stat-card p { font-size: 28px; font-weight: bold; color: #2e7d32; margin: 10px 0 0; }
                        table { width: 100%; background: white; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                        th { background: #f8f9fa; padding: 18px; text-align: left; color: #444; border-bottom: 2px solid #eee; }
                        td { padding: 18px; border-bottom: 1px solid #eee; color: #333; }
                        .btn-new { background: #2e7d32; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; border: none; font-weight: bold; font-size: 14px; }
                        
                        /* MODAL FLOTANTE */
                        .modal { display: none; position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); }
                        .modal-content { background: white; margin: 10% auto; padding: 30px; border-radius: 15px; width: 400px; }
                        .modal-input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <header>
                        <h2>RAÍZOMA BACKOFFICE</h2>
                        <a href="/login" style="color: white; text-decoration: none; font-weight: bold;">Cerrar Sesión</a>
                    </header>
                    <div class="container">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h2 style="color: #333;">Resumen de tu Red</h2>
                            <button type="button" class="btn-new" style="cursor:pointer;" onclick="document.getElementById('modalSocio').style.display='block'">+ NUEVO SOCIO</button>
                        </div>
                        
                        <div class="stats">
                            <div class="stat-card"><h3>Socios Activos</h3><p>\${rows.length}</p></div>
                            <div class="stat-card"><h3>Puntos Totales</h3><p>\${totalPuntos} pts</p></div>
                            <div class="stat-card"><h3>Comisiones Est.</h3><p>$\${(totalPuntos * 0.1).toFixed(2)}</p></div>
                        </div>

                        <table>
                            <thead>
                                <tr><th>Nombre</th><th>Nivel</th><th>Puntos</th><th>Estado</th></tr>
                            </thead>
                            <tbody>
                                \${filasTabla || '<tr><td colspan="4" style="text-align: center; color: #999; padding: 40px;">No hay socios registrados todavía.</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <div id="modalSocio" class="modal">
                        <div class="modal-content">
                            <h2 style="color: #2e7d32; margin-top: 0;">Inscribir Socio</h2>
                            <form action="/guardar-socio" method="POST">
                                <input type="text" name="nombre" class="modal-input" placeholder="Nombre completo" required>
                                <input type="text" name="nivel" class="modal-input" placeholder="Rango (Ej. Bronce, Plata)" required>
                                <input type="number" name="puntos" class="modal-input" placeholder="Puntos de compra" required>
                                <div style="display: flex; gap: 10px; margin-top: 20px;">
                                    <button type="submit" style="flex: 1; background: #2e7d32; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">GUARDAR</button>
                                    <button type="button" onclick="cerrarModal()" style="flex: 1; background: #999; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">CANCELAR</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <script>
                        function abrirModal() { document.getElementById('modalSocio').style.display = 'block'; }
                        function cerrarModal() { document.getElementById('modalSocio').style.display = 'none'; }
                    </script>
                </body>
                </html>
            \`);
        });
    } else {
        res.send("<script>alert('Datos incorrectos'); window.location='/login';</script>");
    }
});

// 5. GUARDAR SOCIO EN LA DB
app.post('/guardar-socio', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], (err) => {
        // Truco para volver al dashboard después de guardar
        res.send(\`
            <form id="back" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>
                alert('Socio guardado con éxito');
                document.getElementById('back').submit();
            </script>
        \`);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('🚀 Raízoma Full System Online'));