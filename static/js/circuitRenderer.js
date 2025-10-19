// Renderizador de circuitos (SVG) para serie/paralelo, estilo esquemático simple
// API principal: renderCircuit(containerEl, { tipo, Vf, resistores })
// - tipo: 'serie' | 'paralelo'
// - Vf: number (voltios)
// - resistores: Array<{ R:number, V:number, I:number, P:number }>

(function(global){
  function h(tag, attrs = {}, children = []) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v !== undefined && v !== null) el.setAttribute(k, String(v));
    }
    for (const c of children) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }

  function addTextWithBackground(g, x, y, textStr, opts = {}) {
    const anchor = opts.anchor ?? 'middle';
    const fontSize = opts.fontSize ?? 11;
    const fill = opts.fill ?? '#444';
    const paddingX = opts.paddingX ?? 4;
    const paddingY = opts.paddingY ?? 2;

    const textEl = h('text', { x, y, 'text-anchor': anchor, 'font-size': fontSize, fill }, [textStr]);
    g.appendChild(textEl);
    try {
      const bbox = textEl.getBBox();
      const rectAttrs = {
        x: bbox.x - paddingX,
        y: bbox.y - paddingY,
        width: bbox.width + paddingX * 2,
        height: bbox.height + paddingY * 2,
        fill: '#ffffff',
        stroke: 'none',
        'rx': 2,
        'ry': 2
      };
      const bg = h('rect', rectAttrs);
      // Colocar el rect por detrás del texto
      g.insertBefore(bg, textEl);
    } catch (e) {
      // Si getBBox falla, dejamos solo el texto
    }
    return textEl;
  }

  function drawBattery(g, x, yTop, height) {
    // Batería: dos placas + y -
    const plateGap = 10;
    const longPlate = height * 0.8;
    const shortPlate = height * 0.5;
    g.appendChild(h('line', { x1: x, y1: yTop, x2: x, y2: yTop + longPlate, stroke: '#333', 'stroke-width': 2 }));
    g.appendChild(h('line', { x1: x + plateGap, y1: yTop + (longPlate - shortPlate)/2, x2: x + plateGap, y2: yTop + (longPlate + shortPlate)/2, stroke: '#777', 'stroke-width': 4 }));
    return x + plateGap; // retorno con offset a la derecha
  }

  function drawResistorZigZag(g, x, y, width, label, options = {}) {
    const teeth = options.teeth ?? 6; // picos del zig-zag
    const amp = options.amp ?? 8; // amplitud vertical
    const step = width / (teeth * 2);
    let path = `M ${x} ${y}`;
    for (let i = 0; i < teeth * 2; i++) {
      const nx = x + (i + 1) * step;
      const ny = i % 2 === 0 ? y - amp : y + amp;
      path += ` L ${nx} ${ny}`;
    }
  g.appendChild(h('path', { d: path, fill: 'none', stroke: '#d19a2a', 'stroke-width': 2 }));
  // etiqueta
  g.appendChild(h('text', { x: x + width / 2, y: y - amp - 6, 'text-anchor': 'middle', 'font-size': 11, fill: '#333' }, [label]));
  }

  function renderSerie(svg, data) {
    const { Vf, resistores } = data;
    const margin = 20;
    const rowY = 80;
    const bottomY = 140;
    const batteryHeight = 60;
    const wire = (x1,y1,x2,y2)=> svg.appendChild(h('line', {x1, y1, x2, y2, stroke: '#222', 'stroke-width': 2}));

    // Cálculo de ancho total
    const Rw = 70; // ancho por resistor
    const gap = 30;
    let width = margin + 30 + resistores.length * (Rw + gap) + margin;
    svg.setAttribute('viewBox', `0 0 ${width} 180`);

    // Grupo principal
    const g = h('g', {});
    svg.appendChild(g);

    // Batería izquierda
    const battRightX = drawBattery(g, margin, 30, batteryHeight);

    // Conexión superior hasta primer resistor
    wire(battRightX, 30, battRightX + 20, 30);
    wire(battRightX + 20, 30, battRightX + 20, rowY);

    let x = battRightX + 20;
    for (let i = 0; i < resistores.length; i++) {
      // cable corto antes
      wire(x, rowY, x + 10, rowY);
  // Etiquetas con formateo simple (mantener legible)
  const rVal = resistores[i].R;
  let rLabel = `${rVal.toFixed(2)}Ω`;
  if (Math.abs(rVal) >= 1e6) rLabel = `${(rVal/1e6).toFixed(2)}MΩ`;
  else if (Math.abs(rVal) >= 1e3) rLabel = `${(rVal/1e3).toFixed(2)}kΩ`;
  drawResistorZigZag(g, x + 10, rowY, Rw, `R${i+1} (${rLabel})`);
  // voltaje arriba del resistor
  const vVal = resistores[i].V;
  let vLabel = `${vVal.toFixed(2)}V`;
  if (Math.abs(vVal) < 1) vLabel = `${(vVal*1e3).toFixed(2)}mV`;
  else if (Math.abs(vVal) >= 1e3) vLabel = `${(vVal/1e3).toFixed(2)}kV`;
  g.appendChild(h('text', { x: x + 10 + Rw/2, y: rowY + 22, 'text-anchor': 'middle', 'font-size': 11, fill: '#444' }, [`V${i+1}=${vLabel}`]));
      wire(x + 10 + Rw, rowY, x + 10 + Rw + gap, rowY);
      x += Rw + gap;
    }

    // Bajada al riel inferior
    wire(x, rowY, x, bottomY);
    // Riel inferior de regreso a batería (-)
    wire(x, bottomY, margin, bottomY);
    // Subir para cerrar
    wire(margin, bottomY, margin, 30);

    // Etiqueta de fuente
    // Etiqueta fuente
    let vfLabel = `${Vf.toFixed(2)}V`;
    if (Math.abs(Vf) < 1) vfLabel = `${(Vf*1e3).toFixed(2)}mV`;
    else if (Math.abs(Vf) >= 1e3) vfLabel = `${(Vf/1e3).toFixed(2)}kV`;
    g.appendChild(h('text', { x: margin + 5, y: 20, 'font-size': 12, fill: '#111' }, [`Vf=${vfLabel}`]));
  }

  function renderParalelo(svg, data) {
    const { Vf, resistores } = data;
    const margin = 20;
    const topY = 30;
    const railYTop = 60;
    const railYBottom = 140;
    const batteryHeight = 60;
    // Separamos en grupos para controlar el orden de apilado (z-order)
    const gWires = h('g', {});
    const gSymbols = h('g', {});

    const minWidth = 260;
    const branchSpace = 90;
    let Rw = 60;

    const width = Math.max(minWidth, margin + 30 + (resistores.length-1)*branchSpace + Rw + margin);
    svg.setAttribute('viewBox', `0 0 ${width} 190`);

    const g = h('g', {});
    svg.appendChild(g);
    // Primero los cables (debajo), luego símbolos/textos (encima)
    svg.appendChild(gWires);
    svg.appendChild(gSymbols);

    const wire = (x1,y1,x2,y2)=> gWires.appendChild(h('line', {x1, y1, x2, y2, stroke: '#222', 'stroke-width': 2}));

    const battRightX = drawBattery(g, margin, topY, batteryHeight);
    const railStartX = battRightX + 20;
    const railEndX = width - margin;

  // Rieles
  wire(railStartX, railYTop, railEndX, railYTop);
  wire(railStartX, railYBottom, railEndX, railYBottom);

  // Conexión batería a rieles
  wire(battRightX, topY, battRightX + 20, topY);
  wire(battRightX + 20, topY, railStartX, railYTop);
  wire(margin, railYBottom, railStartX, railYBottom);

    // Ramas
    for (let i = 0; i < resistores.length; i++) {
      const x = railStartX + i * branchSpace;
      // Centro vertical entre rieles
      const centerY = (railYTop + railYBottom) / 2;
      // Reducir otro 20% (total ~36% respecto original)
      const rWidth = Rw * 0.64; // 0.8 * 0.8
      const ampVal = 8 * 0.64;
      // Conexión superior hasta el centro y desde el centro a inferior (debajo)
      wire(x, railYTop, x, centerY);
      wire(x, centerY, x, railYBottom);
      // Fondo blanco detrás del resistor para que no se vea la línea vertical
      const bgW = rWidth + 18; // padding lateral
      const bgH = ampVal * 2 + 28; // padding vertical
      const bgRect = h('rect', {
        x: x - bgW/2,
        y: centerY - bgH/2,
        width: bgW,
        height: bgH,
        fill: '#ffffff',
        stroke: 'none'
      });
      gSymbols.appendChild(bgRect);
      // Resistor centrado horizontal en el centro de la rama (encima)
  const rVal = resistores[i].R;
  let rLabel = `${rVal.toFixed(2)}Ω`;
  if (Math.abs(rVal) >= 1e6) rLabel = `${(rVal/1e6).toFixed(2)}MΩ`;
  else if (Math.abs(rVal) >= 1e3) rLabel = `${(rVal/1e3).toFixed(2)}kΩ`;
  drawResistorZigZag(gSymbols, x - rWidth/2, centerY, rWidth, `R${i+1} (${rLabel})`, { amp: ampVal });
  // Etiqueta voltaje con fondo blanco para legibilidad (encima)
  const vVal = resistores[i].V;
  let vLabel = `${vVal.toFixed(2)}V`;
  if (Math.abs(vVal) < 1) vLabel = `${(vVal*1e3).toFixed(2)}mV`;
  else if (Math.abs(vVal) >= 1e3) vLabel = `${(vVal/1e3).toFixed(2)}kV`;
  addTextWithBackground(gSymbols, x, centerY + ampVal + 16, `V${i+1}=${vLabel}`, { anchor: 'middle', fontSize: 11, fill: '#444', paddingX: 4, paddingY: 2 });
    }

    // Etiqueta de fuente
    let vfLabel = `${Vf.toFixed(2)}V`;
    if (Math.abs(Vf) < 1) vfLabel = `${(Vf*1e3).toFixed(2)}mV`;
    else if (Math.abs(Vf) >= 1e3) vfLabel = `${(Vf/1e3).toFixed(2)}kV`;
    g.appendChild(h('text', { x: margin + 5, y: 20, 'font-size': 12, fill: '#111' }, [`Vf=${vfLabel}`]));
  }

  function renderCircuit(containerEl, data) {
    // Limpia contenedor y crea SVG
    containerEl.innerHTML = '';
    const svg = h('svg', { width: '100%', height: 'auto' });
    if (data.tipo === 'serie') renderSerie(svg, data); else renderParalelo(svg, data);
    containerEl.appendChild(svg);
  }

  function downloadPNG(containerElOrId, filename = 'esquema.png', scale = 2) {
    const container = typeof containerElOrId === 'string' ? document.getElementById(containerElOrId) : containerElOrId;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Obtener dimensiones desde el viewBox
    const vb = svg.getAttribute('viewBox');
    let w = 800, h = 400;
    if (vb) {
      const parts = vb.split(/\s+/).map(Number);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        w = parts[2];
        h = parts[3];
      }
    }

    // Clonar SVG y fijar tamaño absoluto
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(w * scale);
        canvas.height = Math.ceil(h * scale);
        const ctx = canvas.getContext('2d');
        // Fondo blanco para PNG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }, 'image/png');
      } catch (e) {
        URL.revokeObjectURL(url);
        console.warn('Fallo al exportar PNG:', e);
      }
    };
    img.onerror = function() {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  global.CircuitRenderer = { renderCircuit, downloadPNG };
})(window);
