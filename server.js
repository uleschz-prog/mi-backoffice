const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.urlencoded({ extended: true }));
const db = new sqlite3.Database(':memory:'); // Memoria temporal para evitar errores de disco

db.serialize(() => {
    db.run("CREATE TABLE socios (nombre TEXT, direccion TEXT, volumen REAL)");
});

app.get('/', (req, res) => {
    res.send('<h1>Sistema Raízoma Activo</h1><a href="/unete">Registrar Socio</a>');
});

app.get('/unete', (req, res) => {
    res.send(`
        <form action="/reg" method="POST">
            <input name="n" placeholder="Nombre"><br>
            <input name="d" placeholder="Direccion"><br>
            <input name="v" type="number" placeholder="Volumen"><br>
            <button type="submit">Registrar</button>
        </form>
    `);
});

app.post('/reg', (req, res) => {
    const { n, d, v } = req.body;
    db.run("INSERT INTO socios VALUES (?,?,?)", [n, d, v], () => res.redirect('/'));
});

// PUERTO PARA RENDER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Servidor en puerto ' + PORT));