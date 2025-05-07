const form = document.getElementById('ventasForm');
const ctx = document.getElementById('graficoVentas').getContext('2d');
let chart;

// Colores aleatorios
function generarColores(n) {
  return Array.from({ length: n }, () =>
    `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.7)`
  );
}

// Cargar localStorage
window.onload = () => {
  const saved = localStorage.getItem("ventasData");
  if (saved) {
    const data = JSON.parse(saved);
    Object.entries(data).forEach(([key, val]) => {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) input.value = val;
    });
  }
};

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const meses = [], ventas = [];

  for (let [mes, valor] of formData.entries()) {
    if (mes !== "tipoGrafico") {
      meses.push(mes);
      ventas.push(Number(valor));
    }
  }

  const tipoGrafico = document.getElementById('tipoGrafico').value;
  const colores = generarColores(meses.length);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: tipoGrafico,
    data: {
      labels: meses,
      datasets: [{
        label: 'Ventas del Año',
        data: ventas,
        backgroundColor: tipoGrafico === 'pie' ? colores : 'rgba(54, 162, 235, 0.6)',
        borderColor: tipoGrafico === 'pie' ? '#fff' : 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      animation: {
        duration: 1000,
        easing: 'easeOutBounce'
      },
      responsive: true,
      scales: tipoGrafico !== 'pie' ? {
        y: { beginAtZero: true }
      } : {}
    }
  });

  actualizarResumen(meses, ventas);
});

// Guardar
document.getElementById("guardar").addEventListener("click", () => {
  const data = {};
  new FormData(form).forEach((valor, clave) => {
    if (clave !== "tipoGrafico") data[clave] = valor;
  });
  localStorage.setItem("ventasData", JSON.stringify(data));
  alert("✅ Datos guardados en el navegador.");
});

// Limpiar
document.getElementById("limpiar").addEventListener("click", () => {
  form.reset();
  localStorage.removeItem("ventasData");
  if (chart) chart.destroy();
});

// Resumen
function actualizarResumen(meses, ventas) {
  const total = ventas.reduce((a, b) => a + b, 0);
  const promedio = (total / ventas.length).toFixed(2);
  const max = Math.max(...ventas);
  const min = Math.min(...ventas);
  const maxMes = meses[ventas.indexOf(max)];
  const minMes = meses[ventas.indexOf(min)];

  document.getElementById("totalVentas").textContent = total;
  document.getElementById("promedioVentas").textContent = promedio;
  document.getElementById("maxMes").textContent = `${maxMes} (${max})`;
  document.getElementById("minMes").textContent = `${minMes} (${min})`;
}

// Exportar PDF
document.getElementById("exportarPDF").addEventListener("click", () => {
  const pdf = new jspdf.jsPDF();
  html2canvas(document.body).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("reporte_ventas.pdf");
  });
});

// Exportar Excel
document.getElementById("exportarExcel").addEventListener("click", () => {
  const formData = new FormData(form);
  const data = [];

  for (let [mes, valor] of formData.entries()) {
    if (mes !== "tipoGrafico") {
      data.push({ Mes: mes, Ventas: parseFloat(valor) });
    }
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  XLSX.writeFile(wb, "reporte_ventas.xlsx");
});
