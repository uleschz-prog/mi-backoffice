const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));

// Base de datos - Versión estable
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, volumen REAL, fecha TEXT)");
});

function calcularBono(v) {
    if (v >= 60000) return { p: v * 0.20, r: "Senior Partner", c: "#c084fc" };
    if (v >= 30000) return { p: 4500, r: "Director", c: "#60a5fa" };
    if (v >= 15000) return { p: 1500, r: "Asociado", c: "#34d399" };
    return { p: 0, r: "Socio", c: "#94a3b8" };
}

app.get('/', (req, res) => {
    db.all("SELECT * FROM socios", (err, rows) => {
        const totalVol = rows.reduce((acc, curr) => acc + curr.volumen, 0);
        const totalBonos = rows.reduce((acc, curr) => acc + calcularBono(curr.volumen).p, 0);
        
        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raízoma | Dashboard</title>
            <style>
                :root { --bg: #0b0e11; --card: #181a20; --accent: #2ecc71; --text: #eaecef; }
                body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
                .container { max-width: 1000px; margin: auto; }
                .top-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: var(--card); padding: 20px; border-radius: 15px; border-bottom: 3px solid var(--accent); text-align: center; }
                .stat-card h3 { color: #848e9c; font-size: 14px; margin: 0; }
                .stat-card p { font-size: 24px; font-weight: bold; margin: 10px 0 0; }
                .main-table { background: var(--card); border-radius: 20px; padding: 25px; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; color: #848e9c; padding: 15px; font-size: 12px; text-transform: uppercase; }
                td { padding: 15px; border-top: 1px solid #2b2f36; }
                .rango-tag { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
                .btn { background: var(--accent); color: #000; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; float: right; margin-bottom: 20px; transition: 0.3s; }
                .btn:hover { opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/unete" class="btn">+ REGISTRO</a>
                <h1 style="font-size: 28px;">Raízoma <span style="color:var(--accent)">Global</span></h1>
                
                <div class="top-stats">
                    <div class="stat-card"><h3>VOLUMEN TOTAL</h3><p>$${totalVol.toLocaleString()}</p></div>
                    <div class="stat-card"><h3>GESTIÓN RED</h3><p>$${totalBonos.toLocaleString()}</p></div>
                    <div class="stat-card"><h3>SOCIOS ACTIVOS</h3><p>${rows.length}</p></div>
                </div>

                <div class="main-table">
                    <table>
                        <thead>
                            <tr><th>Socio / Logística</th><th>Volumen</th><th>Rango</th><th>Gestión</th></tr>
                        </thead>
                        <tbody>
                            ${rows.map(s => {
                                const b = calcularBono(s.volumen);
                                return `
                                <tr>
                                    <td><b>${s.nombre}</b><br><small style="color:#848e9c">${s.direccion}</small></td>
                                    <td>$${s.volumen.toLocaleString()}</td>
                                    <td><span class="rango-tag" style="background:${b.c}33; color:${b.c}">${b.r}</span></td>
                                    <td style="color:${b.p > 0 ? '#2ecc71' : '#848e9c'}"><b>$${b.p.toLocaleString()}</b></td>
                                </tr>`;
                            }).join('') || '<tr><td colspan="4" style="text-align:center; padding:40px;">Esperando datos del mercado...</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `);
    });
});

app.get('/unete', (req, res) => {
    res.send(`
    <body style="background:#0b0e11; font-family:sans-serif; color:white; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
        <form action="/reg" method="POST" style="background:#181a20; padding:40px; border-radius:20px; width:350px; border:1px solid #2b2f36;">
            <h2 style="text-align:center; margin-top:0;">Alta Raízoma</h2>
            <input name="n" placeholder="Nombre" style="width:100%; margin-bottom:15px; padding:12px; background:#2b2f36; border:none; border-radius:8px; color:white;" required>
            <textarea name="d" placeholder="Dirección Envío" style="width:100%; margin-bottom:15px; padding:12px; background:#2b2f36; border:none; border-radius:8px; color:white;" required></textarea>
            <div style="background:#1e2329; padding:15px; border-radius:10px; font-size:11px; margin-bottom:15px; color:#2ecc71; border:1px solid #2ecc71;">
                <b>USDT TRC20:</b><br>TA4wCKDm2kNzPbJWA51CLrUAGqQcPbdtUw
            </div>
            <input name="v" type="number" placeholder="Monto ($)" style="width:100%; margin-bottom:20px; padding:12px; background:#2b2f36; border:none; border-radius:8px; color:white;" required>
            <button type="submit" style="width:100%; padding:15px; background:#2ecc71; color:black; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">CONFIRMAR ACTIVACIÓN</button>
        </form>
    </body>`);
});

app.post('/reg', (req, res) => {
    db.run("INSERT INTO socios VALUES (?,?,?,?)", [req.body.n, req.body.d, req.body.v, new Date().toLocaleDateString()], () => res.redirect('/'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Dashboard Raízoma OK'));