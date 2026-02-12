const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function depositarBonoExpansion(usuarioId, montoBono) {
    const db = await open({
        filename: './negocio.db',
        driver: sqlite3.Database
    });

    console.log(`Calculando depósito para Usuario ID: ${usuarioId}...`);

    // 1. Consultar saldo actual
    const billetera = await db.get('SELECT saldo FROM billeteras WHERE usuario_id = ?', [usuarioId]);
    console.log(`Saldo actual: $${billetera.saldo}`);

    // 2. Sumar el nuevo bono
    const nuevoSaldo = billetera.saldo + montoBono;

    // 3. Actualizar la base de datos
    await db.run('UPDATE billeteras SET saldo = ? WHERE usuario_id = ?', [nuevoSaldo, usuarioId]);

    console.log("-----------------------------------------");
    console.log(`✅ ¡DEPÓSITO EXITOSO!`);
    console.log(`Nuevo saldo en cuenta: $${nuevoSaldo}`);
    console.log("-----------------------------------------");
}

// Simulamos que Ulises ganó el bono de expansión (10% de 15,000 = 1500)
depositarBonoExpansion(1, 1500);