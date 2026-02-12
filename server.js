const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbPath = path.join(__dirname, 'negocio.db');
const db = new sqlite3.Database(dbPath);

// --- PANTALLA DE LOGIN ---
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Raízoma - Login</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #e8f5e9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); width: 320px; text-align: center; }
                h1 { color: #2e7d32; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #2e7d32; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Raízoma</h1>
                <form action="/login" method="POST">
                    <input type="email" name="correo" placeholder="Correo electrónico" required>
                    <input type="password" name="password" placeholder="Contraseña" required>
                    <button type="submit">ENTRAR</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- DASHBOARD PRINCIPAL (EL PANEL) ---
app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    if (correo === "admin@raizoma.com" && password === "1234") {
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Panel Raízoma</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f0f2f5; }
                    header { background: #2e7d32; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
                    .container { padding: 20px; max-width: 1000px; margin: auto; }
                    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); text-align: center; }
                    .stat-card h3 { margin: 0; color: #666; font-size: 14px; }
                    .stat-card p { font-size: 24px; font-weight: bold; color: #2e7d32; margin: 10px 0 0; }
                    table { width: 100%; background: white; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                    th { background: #f8f9fa; padding: 15px; text-align: left; color: #666; border-bottom: 2px solid #eee; }
                    td { padding: 15px; border-bottom: 1px solid #eee; }
                    .btn-new { background: #2e7d32; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
                </style>
            </head>
            <body>
                <header>
                    <h2>Raízoma Backoffice</h2>
                    <a href="/login" style="color: white; text-decoration: none;">Cerrar Sesión</a>
                </header>
                <div class="container">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
                        <h3>Resumen de Red</h3>
                        <a href="#" class="btn-new">+ Nuevo Socio</a>
                    </div>
                    <div class="stats">
                        <div class="stat-card"><h3>Socios Activos</h3><p>0</p></div>
                        <div class="stat-card"><h3>Puntos de Mes</h3><p>0 pts</p></div>
                        <div class="stat-card"><h3>Comisiones</h3><p>$0.00</p></div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Nivel</th>
                                <th>Puntos</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="4" style="text-align: center; color: #999;">Aún no hay socios registrados</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
    } else {
        res.send("<script>alert('Error'); window.location='/login';</script>");
    }
});

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Dashboard Raízoma listo en puerto ' + PORT);
});