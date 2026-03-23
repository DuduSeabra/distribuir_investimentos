let chartAntes = null;
let chartDepois = null;

function parseCurrencyBR(str) {
  return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
}

function formatarMoedaBR(input) {
  let v = input.value.replace(/\D/g, "");
  v = (parseInt(v || "0") / 100).toFixed(2);
  input.value = v.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function atualizarSomaMetas() {
  const num = parseInt(document.getElementById("numAtivos").value);
  let soma = 0;
  for (let i = 1; i <= num; i++) {
    const campo = document.getElementById(`meta_${i}`);
    if (campo) soma += parseCurrencyBR(campo.value);
  }
  const el = document.getElementById("somaMetas");
  if (!el) return;
  el.textContent = `Total de metas: ${soma.toFixed(2).replace(".", ",")}%`;
  const ok = Math.abs(soma - 100) <= 0.05;
  el.className = ok ? "soma-ok" : "soma-erro";
}

function gerarCampos() {
  const num = parseInt(document.getElementById("numAtivos").value);
  const form = document.getElementById("ativosForm");
  form.innerHTML = "";

  for (let i = 1; i <= num; i++) {
    const bloco = document.createElement("div");
    bloco.className = "ativo-bloco";
    bloco.innerHTML = `
      <h4>💼 Ativo ${i}</h4>
      <input type="text" id="nome_${i}" placeholder="Nome do ativo" value="Ativo ${i}">
      <input type="text" id="valor_${i}" placeholder="Valor atual (R$)">
      <input type="text" id="meta_${i}" placeholder="Meta (%)">
    `;
    form.appendChild(bloco);

    bloco.querySelector(`#valor_${i}`).addEventListener("input", function () {
      formatarMoedaBR(this);
    });
    bloco.querySelector(`#meta_${i}`).addEventListener("input", atualizarSomaMetas);
  }

  const somaEl = document.createElement("p");
  somaEl.id = "somaMetas";
  somaEl.className = "soma-erro";
  somaEl.textContent = "Total de metas: 0,00%";
  form.appendChild(somaEl);

  document.getElementById("valorDisponivelSection").style.display = "block";
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("chartsContainer").style.display = "none";
}

function calcularDistribuicao(e) {
  e.preventDefault();

  const num = parseInt(document.getElementById("numAtivos").value);
  const investimentos = [];
  const metas = [];
  const nomes = [];

  for (let i = 1; i <= num; i++) {
    nomes.push(document.getElementById(`nome_${i}`).value);
    investimentos.push(parseCurrencyBR(document.getElementById(`valor_${i}`).value));
    metas.push(parseCurrencyBR(document.getElementById(`meta_${i}`).value));
  }

  const somaMetas = metas.reduce((a, b) => a + b, 0);
  if (Math.abs(somaMetas - 100) > 0.05) {
    alert(`⚠️ As porcentagens devem somar 100%. Atualmente somam ${somaMetas.toFixed(2).replace(".", ",")}%.`);
    return;
  }

  const valorDisponivel = parseCurrencyBR(document.getElementById("valorDisponivel").value);

  const totalAtual = investimentos.reduce((a, b) => a + b, 0);
  const totalFinal = totalAtual + valorDisponivel;
  const metasFrac = metas.map(m => m / 100);
  const valoresAlvo = metasFrac.map(f => totalFinal * f);

  const necessidades = valoresAlvo.map((alvo, i) => Math.max(0, alvo - investimentos[i]));
  const somaNec = necessidades.reduce((a, b) => a + b, 0);
  const distribuicao = somaNec === 0
    ? investimentos.map(() => 0)
    : necessidades.map(n => (n / somaNec) * valorDisponivel);

  const formatBR = n => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  let html = "<h3>📊 Resultado da distribuição</h3><table>";
  html += "<tr><th>Ativo</th><th>Aporte Sugerido (R$)</th><th>% do Aporte</th></tr>";
  for (let i = 0; i < num; i++) {
    const pct = valorDisponivel > 0 ? ((distribuicao[i] / valorDisponivel) * 100).toFixed(1).replace(".", ",") : "0,0";
    html += `<tr><td>${nomes[i]}</td><td>R$ ${formatBR(distribuicao[i])}</td><td>${pct}%</td></tr>`;
  }
  html += "</table>";
  document.getElementById("resultado").innerHTML = html;

  document.getElementById("chartsContainer").style.display = "block";
  desenharGraficos(nomes, investimentos, distribuicao);

  document.getElementById("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function desenharGraficos(nomes, investimentos, distribuicao) {
  const finalValores = investimentos.map((v, i) => v + distribuicao[i]);

  const ctx1 = document.getElementById("chartAntes").getContext("2d");
  const ctx2 = document.getElementById("chartDepois").getContext("2d");

  if (chartAntes) chartAntes.destroy();
  if (chartDepois) chartDepois.destroy();

  chartAntes = new Chart(ctx1, {
    type: "pie",
    data: { labels: nomes, datasets: [{ data: investimentos, backgroundColor: gerarCores(nomes.length) }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  chartDepois = new Chart(ctx2, {
    type: "pie",
    data: { labels: nomes, datasets: [{ data: finalValores, backgroundColor: gerarCores(nomes.length) }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });
}

function gerarCores(n) {
  const cores = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.floor((360 / n) * i);
    cores.push(`hsl(${hue}, 70%, 60%)`);
  }
  return cores;
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const section = document.getElementById("valorDisponivelSection");
    if (section && section.style.display !== "none") {
      const active = document.activeElement;
      if (active && active.id === "valorDisponivel") {
        calcularDistribuicao(e);
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const valorDispEl = document.getElementById("valorDisponivel");
  if (valorDispEl) {
    valorDispEl.addEventListener("input", function () {
      formatarMoedaBR(this);
    });
  }
});
