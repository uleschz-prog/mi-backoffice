const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- BASE DE DATOS ---
const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS socios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nivel TEXT NOT NULL,
        puntos INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'Activo'
    )`);
});

// --- PANTALLA DE LOGIN ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma - Login</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 350px; text-align: center; }
                h1 { color: #1a237e; margin-bottom: 30px; }
                input { width: 100%; padding: 15px; margin: 10px 0; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
                button { width: 100%; padding: 15px; background: #1a237e; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Raízoma</h1>
                <form action="/dashboard" method="POST">
                    <input type="email" name="correo" placeholder="admin@raizoma.com" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DASHBOARD (FORMATO CUENTA MADRE) ---
app.post('/dashboard', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        
        db.all("SELECT * FROM socios ORDER BY id DESC", [], (err, rows) => {
            let totalPuntos = 0;
            let listado = rows.map(s => {
                totalPuntos += s.puntos;
                return `
                <tr>
                    <td>${s.nombre}</td>
                    <td>$${s.puntos}</td>
                    <td><span style="color:#2ecc71; font-weight:bold;">${s.estado}</span></td>
                    <td>
                        <form action="/delete" method="POST" style="margin:0;">
                            <input type="hidden" name="id" value="${s.id}">
                            <button type="submit" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:12px;">Eliminar</button>
                        </form>
                    </td>
                </tr>`;
            }).join('');

            res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Cuenta Madre - Raízoma</title>
                    <style>
                        :root { --blue: #1a237e; --bg: #f8fafc; }
                        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); margin: 0; color: #334155; }
                        .main-container { max-width: 1000px; margin: 40px auto; background: white; border-radius: 30px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
                        
                        /* HEADER */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                        .user-info h1 { margin: 0; font-size: 28px; color: var(--blue); }
                        .badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                        
                        .ciclo-info { text-align: right; }
                        .progress-bar { width: 150px; height: 6px; background: #e2e8f0; border-radius: 10px; margin: 10px 0; position: relative; }
                        .progress-fill { width: 70%; height: 100%; background: #3b82f6; border-radius: 10px; }

                        /* CARDS SUPERIORES */
                        .top-cards { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 30px; }
                        .card-blue { background: #1e293b; color: white; padding: 25px; border-radius: 20px; }
                        .card-white { background: white; border: 1px solid #f1f5f9; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
                        
                        /* SECCIÓN RETIROS */
                        .section-box { background: #f8fafc; border-radius: 20px; padding: 30px; margin-bottom: 30px; }
                        .input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
                        input { padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; }
                        .btn-action { background: #2ecc71; color: white; border: none; padding: 15px; border-radius: 12px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 20px; }

                        /* TABLA */
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; padding: 15px; color: #94a3b8; font-size: 14px; }
                        td { padding: 15px; border-top: 1px solid #f1f5f9; }

                        /* REGISTRO FLOTANTE */
                        .btn-open { background: var(--blue); color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; }
                        #modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:100; }
                        .modal-content { background:white; width:350px; margin:10% auto; padding:30px; border-radius:20px; }
                    </style>
                </head>
                <body>
                    <div class="main-container">
                        <div class="header">
                            <div class="user-info">
                                <h1>Cuenta Madre</h1>
                                <span class="badge">ASOCIADO PARTNER</span>
                            </div>
                            <div class="ciclo-info">
                                <span style="font-weight:bold; color:var(--blue)">CIERRE DE CICLO</span><br>
                                <div class="progress-bar"><div class="progress-fill"></div></div>
                                <span style="font-size:12px; color:#64748b">Faltan 30 días</span>
                            </div>
                        </div>

                        <div class="top-cards">
                            <div class="card-blue">
                                <span style="font-size:12px; opacity:0.8">VOLUMEN DE RED</span>
                                <p style="font-size:28px; margin:10px 0;">$${totalPuntos}</p>
                                <span style="font-size:12px; opacity:0.6">Meta: $15,000</span>
                            </div>
                            <div class="card-white">
                                <span style="font-size:12px; color:#94a3b8">MI BILLETERA</span>
                                <p style="font-size:28px; margin:10px 0; color:var(--blue)">$${(totalPuntos * 0.1).toFixed(2)}</p>
                            </div>
                            <div class="card-white" style="display:flex; align-items:center; gap:10px;">
                                <input type="number" placeholder="Monto $" style="flex:1">
                                <button style="background:var(--blue); color:white; border:none; padding:12px 20px; border-radius:10px; cursor:pointer;">RETIRAR</button>
                            </div>
                        </div>

                        <div class="section-box">
                            <h3 style="margin:0; font-size:16px;">🔗 Vinculación de Cuentas (Retiros)</h3>
                            <div class="input-group">
                                <input type="text" placeholder="Nombre del Banco">
                                <input type="text" placeholder="CLABE Interbancaria (18 dígitos)">
                                <input type="text" placeholder="Dirección Wallet USDT">
                                <select style="padding:12px; border-radius:10px; border:1px solid #e2e8f0; background:white;">
                                    <option>RED TRON (TRC20)</option>
                                </select>
                            </div>
                            <button class="btn-action">ACTUALIZAR DATOS DE PAGO</button>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3>Socios en Red</h3>
                            <button class="btn-open" onclick="document.getElementById('modal').style.display='block'">+ Nuevo Socio</button>
                        </div>

                        <table>
                            <thead>
                                <tr><th>Socio</th><th>Inversión</th><th>Estado</th><th>Acción</th></tr>
                            </thead>
                            <tbody>
                                ${listado || '<tr><td colspan="4" style="text-align:center; padding:20px;">No hay socios registrados</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <div id="modal">
                        <div class="modal-content">
                            <h2 style="color:var(--blue)">Registrar Socio</h2>
                            <form action="/add" method="POST">
                                <input type="text" name="nombre" placeholder="Nombre completo" required style="width:100%; margin-bottom:10px;">
                                <input type="text" name="nivel" placeholder="Email / Usuario" required style="width:100%; margin-bottom:10px;">
                                <input type="number" name="puntos" placeholder="Inversión inicial" required style="width:100%; margin-bottom:10px;">
                                <button type="submit" class="btn-action" style="margin-top:10px;">GUARDAR</button>
                                <button type="button" onclick="document.getElementById('modal').style.display='none'" style="width:100%; background:#94a3b8; border:none; color:white; padding:10px; border-radius:10px; margin-top:5px; cursor:pointer;">Cerrar</button>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
    } else {
        res.send("<script>alert('Error'); window.location='/login';</script>");
    }
});

// --- RUTA: AGREGAR ---
app.post('/add', (req, res) => {
    const { nombre, nivel, puntos } = req.body;
    db.run("INSERT INTO socios (nombre, nivel, puntos) VALUES (?, ?, ?)", [nombre, nivel, puntos], () => {
        res.send(`
            <form id="f" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio registrado'); document.getElementById('f').submit();</script>
        `);
    });
});

// --- RUTA: ELIMINAR ---
app.post('/delete', (req, res) => {
    db.run("DELETE FROM socios WHERE id = ?", [req.body.id], () => {
        res.send(`
            <form id="f" action="/dashboard" method="POST">
                <input type="hidden" name="correo" value="admin@raizoma.com">
                <input type="hidden" name="password" value="1234">
            </form>
            <script>alert('Socio eliminado'); document.getElementById('f').submit();</script>
        `);
    });
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('🚀 Raízoma Premium Online'));