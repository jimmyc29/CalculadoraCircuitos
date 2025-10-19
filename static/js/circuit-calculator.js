/**
 * Calculadora de Circuitos Resistivos - JavaScript Puro
 */

// Constantes de configuración
const MAX_RESISTORES = 10;
const MIN_RESISTANCE = 0.01;

/**
 * Clase para errores específicos de circuitos
 */
class CircuitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitError';
    }
}

/**
 * Convierte un valor a número, retorna null si no es válido
 * @param {any} value - Valor a convertir
 * @returns {number|null} - Número convertido o null
 */
function toNumber(value) {
    try {
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    } catch (error) {
        return null;
    }
}

/**
 * Valida los datos de entrada del circuito
 * @param {string} tipo - Tipo de circuito ('serie' o 'paralelo')
 * @param {any} VfRaw - Voltaje de la fuente (raw)
 * @param {Array} resistenciasRaw - Array de resistencias (raw)
 * @returns {Object} - Objeto con tipo, Vf y resistencias validadas
 * @throws {CircuitError} - Si los datos no son válidos
 */
function validarEntrada(tipo, VfRaw, resistenciasRaw) {
    // Validar tipo de circuito
    if (tipo !== "serie" && tipo !== "paralelo") {
        throw new CircuitError("Tipo de circuito inválido. Use 'serie' o 'paralelo'.");
    }

    // Validar array de resistencias
    if (!Array.isArray(resistenciasRaw) || resistenciasRaw.length === 0) {
        throw new CircuitError("La lista de resistencias debe ser un arreglo no vacío.");
    }
    
    if (resistenciasRaw.length > MAX_RESISTORES) {
        throw new CircuitError(`Número máximo de resistores permitido: ${MAX_RESISTORES}.`);
    }

    // Validar cada resistencia
    const resistencias = [];
    for (let i = 0; i < resistenciasRaw.length; i++) {
        const val = toNumber(resistenciasRaw[i]);
        if (val === null || val < MIN_RESISTANCE) {
            throw new CircuitError(`Resistencia R${i + 1} inválida. Debe ser numérica y >= ${MIN_RESISTANCE}.`);
        }
        resistencias.push(val);
    }

    // Validar voltaje de la fuente
    const Vf = toNumber(VfRaw);
    if (Vf === null || Vf <= 0) {
        throw new CircuitError("Voltaje de la fuente inválido. Debe ser numérico y mayor que 0.");
    }

    return { tipo, Vf, resistencias };
}

/**
 * Calcula los resultados del circuito
 * @param {string} tipo - Tipo de circuito ('serie' o 'paralelo')
 * @param {number} Vf - Voltaje de la fuente
 * @param {Array<number>} resistencias - Array de valores de resistencias
 * @returns {Object} - Resultados del cálculo
 * @throws {CircuitError} - Si hay errores en el cálculo
 */
function calcularResultados(tipo, Vf, resistencias) {
    let RT; // Resistencia total

    // Calcular resistencia total según el tipo de circuito
    if (tipo === 'serie') {
        // En serie: RT = R1 + R2 + ... + Rn
        RT = resistencias.reduce((sum, R) => sum + R, 0);
    } else {
        // En paralelo: 1/RT = 1/R1 + 1/R2 + ... + 1/Rn
        let sumaInversas = 0.0;
        for (const R of resistencias) {
            if (R === 0) {
                throw new CircuitError("Una resistencia tiene valor 0, lo que no es válido en paralelo.");
            }
            sumaInversas += 1.0 / R;
        }
        
        if (sumaInversas === 0) {
            throw new CircuitError("Error de cálculo en paralelo (suma de inversas es cero).");
        }
        
        RT = 1.0 / sumaInversas;
    }

    // Validar resistencia total
    if (RT <= 0 || !isFinite(RT)) {
        throw new CircuitError("Resistencia total inválida calculada.");
    }

    // Calcular corriente total: IT = Vf / RT
    const IT = Vf / RT;

    // Calcular detalles por resistor
    const resistoresDetalle = [];
    
    if (tipo === 'serie') {
        // En serie: misma corriente, voltajes proporcionales
        for (const Rn of resistencias) {
            const In = IT; // Misma corriente en todos los resistores
            const Vn = In * Rn; // V = I × R
            const Pn = In * Vn; // P = I × V
            
            resistoresDetalle.push({
                R: Rn,
                I: In,
                V: Vn,
                P: Pn
            });
        }
    } else {
        // En paralelo: mismo voltaje, corrientes proporcionales
        for (const Rn of resistencias) {
            const Vn = Vf; // Mismo voltaje en todos los resistores
            const In = Vn / Rn; // I = V / R
            const Pn = In * Vn; // P = I × V
            
            resistoresDetalle.push({
                R: Rn,
                I: In,
                V: Vn,
                P: Pn
            });
        }
    }

    // Retornar resultados sin redondeo agresivo
    // El formateo es responsabilidad del frontend
    return {
        RT: RT,
        IT: IT,
        resistores: resistoresDetalle
    };
}

/**
 * Función principal para calcular un circuito completo
 * @param {Object} datosCircuito - Datos del circuito
 * @param {string} datosCircuito.tipo - Tipo de circuito
 * @param {any} datosCircuito.voltaje_fuente - Voltaje de la fuente
 * @param {Array} datosCircuito.resistencias - Array de resistencias
 * @returns {Object} - Resultado con success y datos o mensaje de error
 */
function calcularCircuito(datosCircuito) {
    try {
        // Validar datos de entrada
        if (!datosCircuito) {
            return {
                success: false,
                message: "Datos del circuito vacíos o inválidos."
            };
        }

        const tipo = datosCircuito.tipo;
        const VfRaw = datosCircuito.voltaje_fuente;
        const resistenciasRaw = datosCircuito.resistencias;

        // Validar y normalizar entrada
        const { tipo: tipoValidado, Vf, resistencias } = validarEntrada(tipo, VfRaw, resistenciasRaw);

        // Calcular resultados
        const resultados = calcularResultados(tipoValidado, Vf, resistencias);

        return {
            success: true,
            resultados: resultados
        };

    } catch (error) {
        if (error instanceof CircuitError) {
            return {
                success: false,
                message: error.message
            };
        } else {
            // Error inesperado
            console.error("Error en el cálculo:", error);
            return {
                success: false,
                message: "Error interno del cálculo. Revise los datos enviados."
            };
        }
    }
}

// Exportar funciones para uso global
window.CircuitCalculator = {
    calcularCircuito,
    CircuitError,
    validarEntrada,
    calcularResultados,
    MAX_RESISTORES,
    MIN_RESISTANCE
};