document.addEventListener('DOMContentLoaded', function() {
  // Elementos del DOM
  const pedidosContainer = document.getElementById("pedidosContainer");
  const totalLibrosElement = document.getElementById("total-libros");
  const notificacion = document.getElementById("notificacion");
  const agregarPedidoBtn = document.getElementById("agregarPedidoBtn");
  const generarPDFBtn = document.getElementById("generarPDFBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const correoBtn = document.getElementById("correoBtn");
  const deshacerBtn = document.getElementById("deshacerBtn");
  
  // Variables de estado
  let ultimosPedidosAgregados = [];
  let timeoutNotificacion;
  
  // Event listeners
  agregarPedidoBtn.addEventListener('click', agregarPedido);
  generarPDFBtn.addEventListener('click', validarFormulario);
  whatsappBtn.addEventListener('click', enviarPorWhatsApp);
  correoBtn.addEventListener('click', enviarPorCorreo);
  deshacerBtn.addEventListener('click', deshacerUltimoPedido);
  
  // Delegación de eventos para eliminar pedidos
  pedidosContainer.addEventListener('click', function(e) {
    if (e.target.closest('.eliminar-pedido')) {
      eliminarPedido(e.target.closest('.eliminar-pedido'));
    }
  });

  // Inicialización
  document.getElementById("profesor").focus();
  calcularTotalLibros();

  // ======= FUNCIONES PRINCIPALES =======
  
  function agregarPedido() {
    const nuevoPedido = document.createElement("div");
    nuevoPedido.className = "pedido";
    nuevoPedido.innerHTML = `
      <button class="eliminar-pedido"><i class="fas fa-times"></i></button>
      <div class="pedido-row">
        <div class="form-group">
          <i class="fas fa-book"></i>
          <input type="text" class="materia" placeholder="Nombre de la Materia" required />
          <span class="error-message">Campo requerido</span>
        </div>
        <div class="form-group">
          <i class="fas fa-graduation-cap"></i>
          <select class="curso" required>
            <option value="">Seleccione grado/curso</option>
            <option value="Pre Jardín">Pre Jardín</option>
            <option value="Jardín">Jardín</option>
            <option value="Pre Escolar">Pre Escolar</option>
            <option value="1er Grado">1er Grado</option>
            <option value="2do Grado">2do Grado</option>
            <option value="3er Grado">3er Grado</option>
            <option value="4to Grado">4to Grado</option>
            <option value="5to Grado">5to Grado</option>
            <option value="6to Grado">6to Grado</option>
            <option value="7mo Grado">7mo Grado</option>
            <option value="8vo Grado">8vo Grado</option>
            <option value="9no Grado">9no Grado</option>
            <option value="1er Curso">1er Curso</option>
            <option value="2do Curso">2do Curso</option>
            <option value="3er Curso">3er Curso</option>
            <option value="1er Curso Técnico">1er Curso Técnico</option>
            <option value="2do Curso Técnico">2do Curso Técnico</option>
            <option value="3er Curso Técnico">3er Curso Técnico</option>
          </select>
          <span class="error-message">Seleccione una opción</span>
        </div>
        <div class="form-group">
          <i class="fas fa-sort-numeric-up"></i>
          <input type="number" class="cantidad" placeholder="Cantidad" required min="1" />
          <span class="error-message">Cantidad debe ser mayor a 0</span>
        </div>
      </div>
    `;
    
    // Guardar referencia y agregar al DOM
    ultimosPedidosAgregados.push(nuevoPedido);
    pedidosContainer.appendChild(nuevoPedido);
    
    // Enfocar el campo de materia y mostrar notificación
    nuevoPedido.querySelector(".materia").focus();
    mostrarNotificacion('Nuevo pedido agregado', 'exito');
    calcularTotalLibros();
    
    // Efecto visual en el botón de agregar
    agregarPedidoBtn.classList.add('button-pulse');
    setTimeout(() => {
      agregarPedidoBtn.classList.remove('button-pulse');
    }, 500);
  }
  
  function deshacerUltimoPedido() {
    if (ultimosPedidosAgregados.length > 0 && document.querySelectorAll(".pedido").length > 1) {
      const ultimoPedido = ultimosPedidosAgregados.pop();
      ultimoPedido.classList.add('ocultar');
      
      setTimeout(() => {
        ultimoPedido.remove();
        calcularTotalLibros();
        mostrarNotificacion('Último pedido deshecho', 'exito');
      }, 300);
    } else {
      mostrarNotificacion('No hay pedidos recientes para deshacer', 'advertencia');
    }
  }
  
  function eliminarPedido(boton) {
    if (document.querySelectorAll(".pedido").length > 1) {
      const pedido = boton.closest(".pedido");
      ultimosPedidosAgregados = ultimosPedidosAgregados.filter(p => p !== pedido);
      
      pedido.classList.add('ocultar');
      setTimeout(() => {
        pedido.remove();
        calcularTotalLibros();
        mostrarNotificacion('Pedido eliminado', 'exito');
      }, 300);
    } else {
      mostrarNotificacion('Debe haber al menos un pedido', 'advertencia');
    }
  }
  
  function validarFormulario() {
    const form = document.getElementById("pedidoForm");
    const inputs = form.querySelectorAll("input[required], select[required]");
    let esValido = true;
    
    inputs.forEach(input => {
      const errorSpan = input.nextElementSibling;
      const esCantidad = input.classList.contains("cantidad");
      const esSelect = input.tagName === 'SELECT';
      const esRUC = input.id === 'ruc';
      
      if ((esSelect && input.value === "") || 
          (!esSelect && input.value.trim() === "") || 
          (esCantidad && parseInt(input.value) <= 0) ||
          (esRUC && isNaN(input.value))) {
        input.classList.add("error", "campo-error");
        errorSpan.style.display = "block";
        esValido = false;
        
        // Eliminar animación después de que termine
        setTimeout(() => {
          input.classList.remove("campo-error");
        }, 500);
      } else {
        input.classList.remove("error", "campo-error");
        errorSpan.style.display = "none";
      }
    });
    
    if (esValido) {
      generarPDF();
    } else {
      mostrarNotificacion('Complete todos los campos requeridos', 'error');
    }
  }
  
  function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración de márgenes
    const margin = {
      left: 20,
      top: 20,
      right: 20,
      bottom: 20
    };
    const pageWidth = doc.internal.pageSize.getWidth() - margin.left - margin.right;
    let y = margin.top;
    
    // Encabezado del documento
    doc.setFontSize(18);
    doc.setTextColor(139, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("EDITORA EYE BOOK SELLERS", margin.left + pageWidth/2, y, { align: "center" });
    y += 10;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text("SOLICITUD DE PEDIDO ESCOLAR", margin.left + pageWidth/2, y, { align: "center" });
    y += 15;
    
    // Línea divisoria
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin.left, y, margin.left + pageWidth, y);
    y += 15;
    
    // Datos del formulario
    const datos = obtenerDatosFormulario();
    
    // Lista vertical de datos (MODIFICACIÓN SOLICITADA)
    doc.setFontSize(12);
    const lineHeight = 8;
    
    // Datos en el orden solicitado
    const datosOrdenados = [
      { etiqueta: "Fecha:", valor: datos.fechaActual },
      { etiqueta: "Solicitante:", valor: datos.profesor },
      { etiqueta: "C.I./R.U.C:", valor: datos.ruc },
      { etiqueta: "Escuela/Colegio:", valor: datos.colegio },
      { etiqueta: "Ciudad:", valor: datos.ciudad },
      { etiqueta: "Referencia:", valor: datos.referencia || "N/A" }
    ];
    
    // Dibujar datos en lista vertical
    datosOrdenados.forEach(item => {
      // Verificar espacio en página
      if (y > doc.internal.pageSize.getHeight() - margin.bottom - 15) {
        doc.addPage();
        y = margin.top;
      }
      
      doc.setFont("helvetica", "bold");
      doc.text(item.etiqueta, margin.left, y);
      doc.setFont("helvetica", "normal");
      doc.text(item.valor, margin.left + 40, y);
      y += lineHeight;
    });
    
    y += 10;
    
    // Tabla de pedidos
    doc.setFontSize(12);
    doc.setFillColor(139, 0, 0);
    doc.setTextColor(255);
    doc.rect(margin.left, y, pageWidth, 10, "F");
    
    // Encabezados de tabla
    doc.text("MATERIA", margin.left + 5, y + 7);
    doc.text("GRADO/CURSO", margin.left + 70, y + 7);
    doc.text("CANTIDAD", margin.left + 140, y + 7);
    
    y += 15;
    
    // Contenido de la tabla
    doc.setTextColor(0);
    
    datos.pedidos.forEach((pedido, i) => {
      // Verificar espacio para nueva fila
      if (y > doc.internal.pageSize.getHeight() - margin.bottom - 15) {
        doc.addPage();
        y = margin.top;
        
        // Repetir encabezado en nueva página
        doc.setFillColor(139, 0, 0);
        doc.setTextColor(255);
        doc.rect(margin.left, y, pageWidth, 10, "F");
        doc.text("MATERIA", margin.left + 5, y + 7);
        doc.text("GRADO/CURSO", margin.left + 70, y + 7);
        doc.text("CANTIDAD", margin.left + 140, y + 7);
        y += 15;
        doc.setTextColor(0);
      }
      
      // Fondo alternado para filas
      doc.setFillColor(i % 2 === 0 ? 240 : 230, 240, 240);
      doc.rect(margin.left, y - 5, pageWidth, 10, "F");
      
      // Contenido de la fila
      doc.text(pedido.materia, margin.left + 5, y);
      doc.text(pedido.curso, margin.left + 70, y);
      doc.text(pedido.cantidad, margin.left + 140, y);
      
      y += 10;
    });
    
    // Total
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL DE LIBROS:", margin.left + 100, y);
    doc.text(datos.totalLibros.toString(), margin.left + 140, y);
    
    // Guardar PDF
    const nombreArchivo = `Pedido_${datos.colegio.replace(/\s+/g, "_")}_${datos.fechaActual.replace(/\//g, "-")}.pdf`;
    doc.save(nombreArchivo);
    
    mostrarNotificacion('PDF generado con éxito', 'exito');
  }
  
  function enviarPorWhatsApp() {
    validarFormulario();
    
    const datos = obtenerDatosFormulario();
    const numero = "595981482519";
    const mensaje = encodeURIComponent(
      `Hola, soy ${datos.profesor} de ${datos.colegio}.\n` +
      `Les envío mi pedido de libros (${datos.totalLibros} unidades).\n` +
      `Por favor revisen el PDF adjunto.\n\n` +
      `Mi CI/RUC: ${datos.ruc}\n` +
      `Referencia: ${datos.referencia || 'Ninguna'}`
    );
    
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, "_blank");
    
    mostrarNotificacion('Adjunte el PDF en WhatsApp', 'advertencia');
  }
  
  function enviarPorCorreo() {
    validarFormulario();
    
    const datos = obtenerDatosFormulario();
    const asunto = encodeURIComponent(`Pedido de libros - ${datos.colegio}`);
    const cuerpo = encodeURIComponent(
      `Estimados,\n\n` +
      `Adjunto encontrará el pedido de libros realizado por:\n\n` +
      `Nombre: ${datos.profesor}\n` +
      `Escuela/Colegio: ${datos.colegio}\n` +
      `CI/RUC: ${datos.ruc}\n` +
      `Total de libros: ${datos.totalLibros}\n\n` +
      `Por favor confirmar disponibilidad.\n\n` +
      `Saludos cordiales,\n` +
      `${datos.profesor}`
    );
    
    const mailto = `mailto:mezaedithadriana@gmail.com?subject=${asunto}&body=${cuerpo}`;
    window.location.href = mailto;
    
    mostrarNotificacion('Adjunte el PDF en el correo', 'advertencia');
  }
  
  // ======= FUNCIONES AUXILIARES =======
  
  function calcularTotalLibros() {
    const cantidades = document.querySelectorAll(".cantidad");
    let total = 0;
    
    cantidades.forEach(input => {
      total += parseInt(input.value) || 0;
    });
    
    totalLibrosElement.textContent = total;
    return total;
  }
  
  function obtenerDatosFormulario() {
    const fechaActual = new Date().toLocaleDateString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const pedidos = Array.from(document.querySelectorAll(".pedido")).map(pedido => ({
      materia: pedido.querySelector(".materia").value,
      curso: pedido.querySelector(".curso").value,
      cantidad: pedido.querySelector(".cantidad").value
    }));
    
    return {
      profesor: document.getElementById("profesor").value,
      ruc: document.getElementById("ruc").value,
      colegio: document.getElementById("colegio").value,
      ciudad: document.getElementById("ciudad").value,
      referencia: document.getElementById("referencia").value || '',
      fechaActual,
      pedidos,
      totalLibros: calcularTotalLibros()
    };
  }
  
  function mostrarNotificacion(mensaje, tipo = 'exito') {
    // Limpiar notificación anterior
    notificacion.classList.remove('mostrar', 'error', 'advertencia', 'exito');
    clearTimeout(timeoutNotificacion);
    
    // Configurar nueva notificación
    notificacion.textContent = mensaje;
    notificacion.classList.add(tipo);
    
    // Mostrar con animación
    setTimeout(() => {
      notificacion.classList.add('mostrar');
      
      // Ocultar después de 3 segundos
      timeoutNotificacion = setTimeout(() => {
        notificacion.classList.add('ocultar');
        
        // Eliminar completamente después de la animación
        setTimeout(() => {
          notificacion.classList.remove('mostrar', 'ocultar');
        }, 400);
      }, 3000);
    }, 10);
  }
});