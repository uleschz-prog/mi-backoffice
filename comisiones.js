const red = [
    { id: 1, nombre: "Ulises (Tú)", patrocinador: null },
    { id: 2, nombre: "Ana (Línea A)", patrocinador: 1 },
    { id: 3, nombre: "Beto (Línea B)", patrocinador: 1 },
    { id: 4, nombre: "Carla (Nieto)", patrocinador: 2 },
    { id: 5, nombre: "Dani (Bisnieto)", patrocinador: 4 }
];

const ventas = [
    { usuarioId: 2, monto: 10000 }, // Ana vendió mucho (10,000)
    { usuarioId: 4, monto: 2000 },  
    { usuarioId: 5, monto: 3000 },  
    { usuarioId: 3, monto: 1000 }   // Beto vendió poco
];

function calcularBonoExpansion(usuarioId) {
    const META = 15000;
    const MAX_POR_LINEA = META * 0.60; // 9,000
    let volumenComputableTotal = 0;

    // 1. Identificamos las líneas (directos de Ulises)
    const lineasDirectas = red.filter(u => u.patrocinador === usuarioId);

    console.log("--- Análisis de Calificación 60/40 ---");

    lineasDirectas.forEach(directo => {
        // Calculamos cuánto vendió esta línea completa (hasta 3 niveles)
        let volumenDeEstaLinea = obtenerVolumenRecursivo(directo.id, 1);
        
        // APLICAMOS REGLA 60/40:
        // Si la línea hizo 12,000, solo nos sirven 9,000 para la meta.
        let computable = Math.min(volumenDeEstaLinea, MAX_POR_LINEA);
        
        volumenComputableTotal += computable;

        console.log(`Línea de ${directo.nombre}: Total $${volumenDeEstaLinea} -> Computable: $${computable}`);
    });

    console.log("--------------------------------------");
    console.log(`TOTAL COMPUTABLE: $${volumenComputableTotal}`);

    if (volumenComputableTotal >= META) {
        const bono = volumenComputableTotal * 0.10;
        console.log(`✅ ¡CALIFICADO! Tu bono del 10% es: $${bono}`);
    } else {
        console.log(`❌ No calificado. Te faltan $${META - volumenComputableTotal} para la meta.`);
    }
}

// Función auxiliar para sumar volumen hasta 3 niveles
function obtenerVolumenRecursivo(id, nivel) {
    if (nivel > 3) return 0;
    let suma = ventas.find(v => v.usuarioId === id)?.monto || 0;
    const hijos = red.filter(u => u.patrocinador === id);
    hijos.forEach(h => {
        suma += obtenerVolumenRecursivo(h.id, nivel + 1);
    });
    return suma;
}

calcularBonoExpansion(1);