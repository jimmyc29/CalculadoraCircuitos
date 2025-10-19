// Lógica principal de la SPA separada del HTML
(function(){
  // Referencias a elementos clave
  const formConfiguracion = document.getElementById('formConfiguracion');
  const areaResistores = document.getElementById('areaResistores');
  const contenedorCampos = document.getElementById('contenedorCamposResistores');
  const btnCalcular = document.getElementById('btnCalcular');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const resultadoFinal = document.getElementById('resultadoFinal');
  const mensajeError = document.getElementById('mensajeError');

  let N = 0; // Número de resistores

  // ===== Utilidades de formateo SI y decimales =====
  function decimalsByRange(absVal) {
    if (absVal < 10) return 3;
    if (absVal < 100) return 2;
    return 1;
  }

  function formatFixed(value, unit) {
    if (!isFinite(value)) return '-';
    const dec = decimalsByRange(Math.abs(value));
    return `${value.toFixed(dec)} ${unit}`;
  }

  // Detalle de componentes
  function formatCurrentDetail(I) {
    if (!isFinite(I) || I === 0) return '0 A';
    const absI = Math.abs(I);
    if (absI < 1e-3) {
      return formatFixed(I * 1e6, 'µA');
    } else if (absI < 1) {
      return formatFixed(I * 1e3, 'mA');
    } else {
      return formatFixed(I, 'A');
    }
  }

  function formatVoltageDetail(V) {
    if (!isFinite(V) || V === 0) return '0 V';
    const absV = Math.abs(V);
    if (absV < 1) {
      return formatFixed(V * 1e3, 'mV');
    } else if (absV >= 1e3) {
      return formatFixed(V / 1e3, 'kV');
    } else {
      return formatFixed(V, 'V');
    }
  }

  function formatPowerDetail(P) {
    if (!isFinite(P) || P === 0) return '0 W';
    const absP = Math.abs(P);
    if (absP < 1e-3) {
      return formatFixed(P * 1e6, 'µW');
    } else if (absP < 1) {
      return formatFixed(P * 1e3, 'mW');
    } else {
      return formatFixed(P, 'W');
    }
  }

  function formatResistanceDetail(R) {
    if (!isFinite(R) || R === 0) return '0 Ω';
    const absR = Math.abs(R);
    if (absR < 1e3) {
      return formatFixed(R, 'Ω');
    } else if (absR < 1e6) {
      return formatFixed(R / 1e3, 'kΩ');
    } else {
      return formatFixed(R / 1e6, 'MΩ');
    }
  }

  // Formatos para sección Resultados
  function formatResistanceOhmsOnly(R) {
    const val = Number(R) || 0;
    return formatFixed(val, 'Ω');
  }

  function formatCurrentTotal(IT) {
    if (!isFinite(IT) || IT === 0) return '0 A';
    const absI = Math.abs(IT);
    if (absI < 1) return formatFixed(IT * 1e3, 'mA');
    return formatFixed(IT, 'A');
  }

  function formatPowerTotal(PT) {
    if (!isFinite(PT) || PT === 0) return '0 W';
    const absP = Math.abs(PT);
    if (absP < 1) return formatFixed(PT * 1e3, 'mW');
    return formatFixed(PT, 'W');
  }

  // Función para generar los campos R1, R2, ... RN
  function generarCamposResistores() {
    contenedorCampos.innerHTML = ''; // Limpiar campos anteriores

    // Obtener el valor de la cantidad de resistores
    const cantidadStr = document.getElementById('cantidadResistores').value;
    N = parseInt(cantidadStr);

    if (N >= 1) {
      for (let i = 1; i <= N; i++) {
        const col = document.createElement('div');
        // xs: 12 (1 por fila), md: 6 (2 por fila), lg: 4 (3 por fila)
        col.className = 'col-12 col-md-6 col-lg-4';
        col.innerHTML = `
          <label for="resistor${i}" class="form-label small mb-1">Resistencia ${i} (R<sub>${i}</sub>)</label>
          <div class="input-group input-group-sm">
            <input type="number" step="any" min="0.01" class="form-control form-control-sm resistor-input" id="resistor${i}" name="R${i}" placeholder="Ohmios" required>
            <span class="input-group-text">&Omega;</span> 
          </div>
        `;
        contenedorCampos.appendChild(col);
      }
      areaResistores.style.display = 'block';
      btnCalcular.style.display = 'block';
    } else {
      areaResistores.style.display = 'none';
      btnCalcular.style.display = 'none';
    }
  }

  // 1) Configurar formulario -> generar campos
  formConfiguracion.addEventListener('submit', function(e) {
    e.preventDefault();
    mensajeError.style.display = 'none';
    resultadoFinal.style.display = 'none'; 
    generarCamposResistores();
  });

  // 2) Calcular circuito
  btnCalcular.addEventListener('click', function() {
    mensajeError.style.display = 'none';
    resultadoFinal.style.display = 'none';

    const tipo = document.querySelector('input[name="tipoCircuito"]:checked').value;
    const V_f = document.getElementById('voltajeFuente').value;

    const resistencias = [];
    const inputsR = document.querySelectorAll('.resistor-input');

    let errorR = false;
    inputsR.forEach((input, index) => {
      const valor = parseFloat(input.value);
      if (isNaN(valor) || valor < 0.01) {
        errorR = true;
        mensajeError.textContent = `Error: La Resistencia R${index+1} debe ser un número positivo (mín. 0.01).`;
        mensajeError.style.display = 'block';
      }
      resistencias.push(valor);
    });

    if (errorR) return;

    const datosCircuito = {
      tipo: tipo,
      voltaje_fuente: parseFloat(V_f),
      resistencias: resistencias
    };

    // Usar la calculadora local en lugar de peticiones al servidor
    const resultado = window.CircuitCalculator.calcularCircuito(datosCircuito);
    
    if (resultado.success) {
      const body = resultado; 
        // Calcular métricas auxiliares para totales
        const sumPi = (body.resultados.resistores || []).reduce((acc, r) => acc + (Number(r.P) || 0), 0);
        const ptFormatted = formatPowerTotal(sumPi);

        let html = '<h6 class="text-center text-primary mb-3">Resultados</h6>';

        // Tabla totales
        html += `
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm text-center">
              <thead class="bg-light">
                <tr>
                  <th>Parámetro</th>
                  <th>Fórmula</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Resistencia Total (R<sub>T</sub>)</td>
                  <td>${tipo === 'serie' ? '&Sigma; R<sub>n</sub>' : '1 / (&Sigma; 1/R<sub>n</sub>)'}</td>
                  <td class="fw-bold text-success">${formatResistanceOhmsOnly(body.resultados.RT)}</td>
                </tr>
                <tr>
                  <td>Corriente Total (I<sub>T</sub>)</td>
                  <td>V<sub>f</sub> / R<sub>T</sub></td>
                  <td class="fw-bold text-success">${formatCurrentTotal(body.resultados.IT)}</td>
                </tr>
                <tr>
                  <td>Potencia Total (P<sub>T</sub>)</td>
                  <td>&Sigma; P<sub>i</sub> = V<sub>f</sub> × I<sub>T</sub></td>
                  <td class="fw-bold text-danger">${ptFormatted}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;

        // Tabla detalle
        html += '<h6 class="text-center text-secondary mb-3">Detalle de Componentes</h6>';
        html += `
          <div class="table-responsive">
            <table class="table table-striped table-hover table-sm text-center">
              <thead class="table-dark">
                <tr>
                  <th>Resistor</th>
                  <th>R</th>
                  <th>V</th>
                  <th>I</th>
                  <th>P</th>
                </tr>
              </thead>
              <tbody>
        `;

        body.resultados.resistores.forEach((r, index) => {
          html += `<tr>
              <td>R<sub>${index + 1}</sub></td>
              <td>${formatResistanceDetail(r.R)}</td> 
              <td>${formatVoltageDetail(r.V)}</td>
              <td>${formatCurrentDetail(r.I)}</td>
              <td class="text-danger">${formatPowerDetail(r.P)}</td>
            </tr>`;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;

        // Esquema SVG + descarga
        html += `
          <h6 class="text-center text-secondary mb-3">Esquema del Circuito</h6>
          <div class="border rounded p-2 bg-white">
            <div id="circuit-schematic" style="width:100%; min-height:220px;"></div>
            <div class="text-end mt-2">
              <button id="btnDescargarPNG" type="button" class="btn btn-outline-secondary btn-sm">Descargar PNG</button>
            </div>
          </div>
        `;

        resultadoFinal.innerHTML = html;
        try {
          const container = document.getElementById('circuit-schematic');
          if (container && window.CircuitRenderer && typeof window.CircuitRenderer.renderCircuit === 'function') {
            window.CircuitRenderer.renderCircuit(container, {
              tipo: tipo,
              Vf: parseFloat(V_f),
              resistores: body.resultados.resistores
            });
          }
          const btnPNG = document.getElementById('btnDescargarPNG');
          if (btnPNG && window.CircuitRenderer && typeof window.CircuitRenderer.downloadPNG === 'function') {
            btnPNG.addEventListener('click', () => {
              const nombre = `esquema_${tipo}.png`;
              window.CircuitRenderer.downloadPNG(container, nombre, 2);
            });
          }
        } catch (e) {
          console.warn('No se pudo renderizar el esquema SVG:', e);
        }
        resultadoFinal.style.display = 'block';

      } else {
        mensajeError.textContent = resultado.message || 'Ocurrió un error desconocido al procesar el cálculo.';
        mensajeError.style.display = 'block';
      }
  });

  // 3) Limpieza
  btnLimpiar.addEventListener('click', function() {
    formConfiguracion.reset(); 
    areaResistores.style.display = 'none';
    btnCalcular.style.display = 'none';
    contenedorCampos.innerHTML = '';
    resultadoFinal.innerHTML = '';
    resultadoFinal.style.display = 'none';
    mensajeError.style.display = 'none';
    N = 0;
    document.getElementById('circuitoSerie').checked = true;
  });
})();
