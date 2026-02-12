const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();

// --- CONFIGURACIÓN DE RUTA PARA RENDER ---
// Si existe la carpeta de Render, guarda ahí. Si no, guarda en la carpeta actual.
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'negocio.db');

app.use(session({
    secret: 'raizoma-ultra-v10-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } 
}));
app.use(bodyParser.urlencoded({ extended: true }));

// --- BASE DE DATOS TOTAL ---
(async () => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT, correo TEXT UNIQUE, password TEXT,
            telefono TEXT, direccion TEXT,
            patrocinador_id INTEGER, estatus TEXT DEFAULT 'PENDIENTE',
            banco TEXT, clabe TEXT, wallet_crypto TEXT, red_crypto TEXT DEFAULT 'TRC20'
        );
        CREATE TABLE IF NOT EXISTS billeteras (usuario_id INTEGER, saldo REAL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS historial (id INTEGER PRIMARY KEY AUTOINCREMENT, emisor_nombre TEXT, receptor_id INTEGER, monto REAL, concepto TEXT);
        CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER, producto TEXT, estatus TEXT DEFAULT 'PREPARANDO', guia TEXT DEFAULT 'Pendiente');
        CREATE TABLE IF NOT EXISTS inventario (id INTEGER PRIMARY KEY, nombre TEXT, stock INTEGER);
        CREATE TABLE IF NOT EXISTS pagos_pendientes (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER, monto REAL, referencia TEXT);
    `);

    const hasAdmin = await db.get('SELECT * FROM usuarios WHERE id = 1');
    if (!hasAdmin) {
        await db.run('INSERT INTO usuarios (nombre, correo, password, estatus) VALUES ("Cuenta Madre", "admin@raizoma.com", "1234", "ACTIVO")');
        await db.run('INSERT INTO billeteras (usuario_id, saldo) VALUES (1, 0)');
        await db.run('INSERT INTO inventario (id, nombre, stock) VALUES (1, "Membresía VIP", 10), (2, "Kit Fundador", 10)');
    }
})();

// --- LÓGICA DE RED ---
async function obtenerEstructura(db, patrocinadorId, nivel = 1) {
    let listaGlobal = []; let volumenTotal = 0;
    const hijos = await db.all(`SELECT u.*, h.monto as inversion FROM usuarios u LEFT JOIN historial h ON u.nombre = h.emisor_nombre AND h.concepto = 'INVERSIÓN INICIAL' WHERE u.patrocinador_id = ?`, [patrocinadorId]);
    for (const hijo of hijos) {
        const inv = hijo.inversion || 0; volumenTotal += inv;
        listaGlobal.push({ ...hijo, nivel, inv });
        const subRed = await obtenerEstructura(db, hijo.id, nivel + 1);
        listaGlobal = listaGlobal.concat(subRed.lista); volumenTotal += subRed.volumen;
    }
    return { lista: listaGlobal, volumen: volumenTotal };
}

// --- PANEL DE CONTROL ---
app.get('/socio/:id', async (req, res) => {
    if (!req.session.usuarioId || req.session.usuarioId != req.params.id) return res.redirect('/login');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    
    if(user.estatus === 'PENDIENTE') return res.redirect('/pago/' + user.id);

    const { lista, volumen } = await obtenerEstructura(db, user.id);
    const bill = await db.get('SELECT saldo FROM billeteras WHERE usuario_id = ?', [user.id]);
    const stock = await db.all('SELECT * FROM inventario');
    const misPedidos = await db.all('SELECT * FROM pedidos WHERE usuario_id = ?', [user.id]);
    const pagosValidar = (user.id == 1) ? await db.all('SELECT p.*, u.nombre FROM pagos_pendientes p JOIN usuarios u ON p.usuario_id = u.id') : [];

    res.send(`
        <body style="font-family:'Segoe UI',sans-serif; background:#f4f7fe; padding:20px; color:#1e293b;">
            <div style="max-width:1150px; margin:auto; background:white; padding:40px; border-radius:40px; box-shadow:0 15px 50px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                    <div><h1>Raízoma: ${user.nombre}</h1><span style="background:#e2e8f0; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold;">Socio Activo</span></div>
                    <a href="/logout" style="color:#ef4444; text-decoration:none; font-weight:bold; border:1px solid #fee2e2; padding:10px 20px; border-radius:15px;">Cerrar Sesión</a>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:25px; margin-bottom:40px;">
                    <div style="background:#1e293b; color:white; padding:30px; border-radius:25px;">
                        <small style="opacity:0.6;">VOLUMEN RED</small><h2 style="margin:10px 0; font-size:32px;">$${volumen.toLocaleString()}</h2>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; padding:30px; border-radius:25px;">
                        <small style="color:#64748b;">MI BILLETERA</small><h2 style="margin:10px 0; font-size:32px;">$${(bill?.saldo || 0).toLocaleString()}</h2>
                    </div>
                    <div style="background:white; border:1px solid #e2e8f0; padding:30px; border-radius:25px;">
                         <small style="color:#64748b;">RETIRAR</small>
                         <form action="/retiro" method="POST" style="margin-top:15px; display:flex; gap:10px;">
                            <input type="number" name="monto" placeholder="$" style="width:100%; padding:12px; border-radius:12px; border:1px solid #e2e8f0;">
                            <button style="background:#1e293b; color:white; border:none; padding:12px; border-radius:12px; cursor:pointer;">OK</button>
                         </form>
                    </div>
                </div>

                ${user.id == 1 ? `
                    <div style="background:#fffbeb; border:1px solid #fde68a; padding:30px; border-radius:30px; margin-bottom:40px;">
                        <h4>📦 Inventario y Pagos (Admin)</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                            ${stock.map(s => `
                                <div style="background:white; padding:15px; border-radius:15px; border:1px solid #fde68a;">
                                    ${s.nombre}: <b>${s.stock}</b>
                                    <form action="/reabastecer" method="POST" style="display:flex; gap:5px; margin-top:5px;">
                                        <input type="hidden" name="prodId" value="${s.id}"><input type="number" name="cantidad" style="width:50px;"><button>+</button>
                                    </form>
                                </div>
                            `).join('')}
                        </div>
                        <h5>💳 Pagos por Aprobar:</h5>
                        ${pagosValidar.map(p => `<div style="padding:10px; background:white; margin-bottom:5px; border-radius:10px;">${p.nombre} - <a href="/aprobar/${p.id}">[APROBAR]</a></div>`).join('')}
                    </div>
                ` : ''}

                <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:40px;">
                    <div>
                        <h4>📦 Estatus de Pedidos</h4>
                        <div style="background:#f8fafc; padding:25px; border-radius:25px; border:1px solid #e2e8f0; margin-bottom:30px;">
                            ${misPedidos.map(p => `<div style="padding:10px 0; border-bottom:1px solid #eee;"><b>${p.producto}</b> - ${p.estatus} <br><small>Guía: ${p.guia}</small></div>`).join('')}
                        </div>
                        <h4>🚀 Datos de Cobro</h4>
                        <form action="/update-cobro" method="POST" style="background:#f8fafc; padding:30px; border-radius:30px; border:1px solid #e2e8f0; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                            <input type="text" name="banco" value="${user.banco || ''}" placeholder="Banco" style="padding:12px; border-radius:10px; border:1px solid #ddd;">
                            <input type="text" name="clabe" value="${user.clabe || ''}" placeholder="CLABE" style="padding:12px; border-radius:10px; border:1px solid #ddd;">
                            <input type="text" name="wallet" value="${user.wallet_crypto || ''}" placeholder="Wallet USDT" style="padding:12px; border-radius:10px; border:1px solid #ddd;">
                            <select name="red" style="padding:12px; border-radius:10px; border:1px solid #ddd;">
                                <option value="TRC20" ${user.red_crypto == 'TRC20' ? 'selected' : ''}>TRC20</option>
                                <option value="BEP20" ${user.red_crypto == 'BEP20' ? 'selected' : ''}>BEP20</option>
                            </select>
                            <button style="grid-column:span 2; padding:15px; background:#1e293b; color:white; border:none; border-radius:12px; cursor:pointer;">ACTUALIZAR</button>
                        </form>
                    </div>

                    <div style="background:#f8fafc; padding:35px; border-radius:35px; border:1px solid #e2e8f0;">
                        <h4>📋 Registrar Socio</h4>
                        <form action="/registrar" method="POST">
                            <input type="hidden" name="patrocinadorId" value="${user.id}">
                            <input type="text" name="nombre" placeholder="Nombre" required style="width:92%; padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid #ddd;">
                            <input type="text" name="telefono" placeholder="WhatsApp" required style="width:92%; padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid #ddd;">
                            <input type="email" name="correo" placeholder="Email" required style="width:92%; padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid #ddd;">
                            <input type="text" name="direccion" placeholder="Dirección Envío" required style="width:92%; padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid #ddd;">
                            <input type="password" name="password" placeholder="Pass" required style="width:92%; padding:15px; margin-bottom:15px; border-radius:12px; border:1px solid #ddd;">
                            <select name="inversion" style="width:100%; padding:15px; margin-bottom:25px; border-radius:12px; border:1px solid #ddd;">
                                <option value="1750">Membresía VIP - $1,750</option>
                                <option value="15000">Kit Fundador - $15,000</option>
                            </select>
                            <button style="width:100%; padding:20px; background:#10b981; color:white; border:none; border-radius:15px; font-weight:bold; cursor:pointer;">REGISTRAR Y AVISAR</button>
                        </form>
                    </div>
                </div>
            </div>
        </body>
    `);
});

// --- RUTA DE PAGO ---
app.get('/pago/:id', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    res.send(`<body style="font-family:sans-serif; background:#f4f7fe; display:flex; justify-content:center; align-items:center; height:100vh;"><div style="background:white; padding:50px; border-radius:40px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.05); max-width:400px;"><h2>🌱 Activa tu Cuenta</h2><p>Paga y envía tu referencia.</p><div style="text-align:left; background:#f8fafc; padding:20px; border-radius:20px; font-size:13px; margin:25px 0;"><b>BBVA:</b> 0123 4567 8901 2345 67<br><b>USDT:</b> T9yD6P5GwMj6...</div><form action="/notificar-pago" method="POST"><input type="hidden" name="userId" value="${user.id}"><input type="text" name="ref" placeholder="Referencia" required style="width:90%; padding:15px; margin-bottom:15px; border-radius:12px; border:1px solid #ddd;"><button style="width:100%; padding:18px; background:#10b981; color:white; border:none; border-radius:15px;">ENVIAR</button></form></div></body>`);
});

// --- ACCIONES ---
app.post('/registrar', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const { nombre, correo, password, patrocinadorId, inversion, telefono, direccion } = req.body;
    const prodId = (inversion == "15000") ? 2 : 1;
    try {
        const result = await db.run('INSERT INTO usuarios (nombre, correo, password, patrocinador_id, telefono, direccion, estatus) VALUES (?, ?, ?, ?, ?, ?, "PENDIENTE")', [nombre, correo, password, patrocinadorId, telefono, direccion]);
        await db.run('INSERT INTO billeteras (usuario_id, saldo) VALUES (?, 0)', [result.lastID]);
        await db.run('UPDATE inventario SET stock = stock - 1 WHERE id = ?', [prodId]);
        const msg = encodeURIComponent(`¡Hola ${nombre}! 🌱 Registrado. Paga para activarte.`);
        res.send(`<script>window.open("https://wa.me/${telefono.replace(/\+/g, '')}?text=${msg}", "_blank"); window.location.href = "/socio/${req.session.usuarioId}";</script>`);
    } catch (e) { res.send("Error"); }
});

app.post('/notificar-pago', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('INSERT INTO pagos_pendientes (usuario_id, referencia) VALUES (?, ?)', [req.body.userId, req.body.ref]);
    res.send("Pago enviado. <a href='/login'>Volver</a>");
});

app.get('/aprobar/:id', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const pago = await db.get('SELECT * FROM pagos_pendientes WHERE id = ?', [req.params.id]);
    await db.run('UPDATE usuarios SET estatus = "ACTIVO" WHERE id = ?', [pago.usuario_id]);
    const user = await db.get('SELECT * FROM usuarios WHERE id = ?', [pago.usuario_id]);
    if (user.patrocinador_id) {
        await db.run('UPDATE billeteras SET saldo = saldo + (1750 * 0.15) WHERE usuario_id = ?', [user.patrocinador_id]);
    }
    await db.run('INSERT INTO pedidos (usuario_id, producto) VALUES (?, "Kit de Inicio")', [user.id]);
    await db.run('DELETE FROM pagos_pendientes WHERE id = ?', [req.params.id]);
    res.redirect('/socio/1');
});

app.post('/reabastecer', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('UPDATE inventario SET stock = stock + ? WHERE id = ?', [req.body.cantidad, req.body.prodId]);
    res.redirect('/socio/1');
});

app.post('/update-cobro', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.run('UPDATE usuarios SET banco = ?, clabe = ?, wallet_crypto = ?, red_crypto = ? WHERE id = ?', [req.body.banco, req.body.clabe, req.body.wallet, req.body.red, req.session.usuarioId]);
    res.redirect('/socio/' + req.session.usuarioId);
});

app.get('/login', (req, res) => res.send(`<body style="font-family:sans-serif; background:#f0f2f5; display:flex; justify-content:center; align-items:center; height:100vh;"><div style="background:white; padding:50px; border-radius:30px; box-shadow:0 10px 25px rgba(0,0,0,0.05); width:320px; text-align:center;"><h2>Raízoma</h2><form action="/login" method="POST"><input type="email" name="correo" placeholder="Email" required style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;"><input type="password" name="password" placeholder="Pass" required style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;"><button style="width:100%; padding:16px; background:#1e293b; color:white; border:none; border-radius:12px; cursor:pointer;">ENTRAR</button></form></div></body>`));
app.post('/login', async (req, res) => {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const user = await db.get('SELECT * FROM usuarios WHERE correo = ? AND password = ?', [req.body.correo, req.body.password]);
    if (user) { req.session.usuarioId = user.id; res.redirect('/socio/' + user.id); } else { res.send("Error"); }
});
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Raízoma Online en Puerto ' + PORT));