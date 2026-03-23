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
  salvarNoStorage();
}

function gerarCampos() {
  const num = parseInt(document.getElementById("numAtivos").value);
  const form = document.getElementById("ativosForm");
  form.innerHTML = "";

  document.getElementById("step2").style.display = "flex";

  for (let i = 1; i <= num; i++) {
    const bloco = document.createElement("div");
    bloco.className = "ativo-bloco";
    bloco.innerHTML = `
      <h4>💼 Ativo ${i}</h4>
      <div class="ativo-campos">
        <div class="ativo-campo">
          <label for="nome_${i}">Nome do ativo</label>
          <input type="text" id="nome_${i}" placeholder="Ex: Tesouro Selic" value="Ativo ${i}">
        </div>
        <div class="ativo-campo">
          <label for="valor_${i}">Valor atual (R$)</label>
          <input type="text" id="valor_${i}" placeholder="0,00">
        </div>
        <div class="ativo-campo">
          <label for="meta_${i}">Meta (%)</label>
          <input type="text" id="meta_${i}" placeholder="0,00">
        </div>
      </div>
    `;
    form.appendChild(bloco);

    bloco.querySelector(`#valor_${i}`).addEventListener("input", function () {
      formatarMoedaBR(this);
      salvarNoStorage();
    });
    bloco.querySelector(`#meta_${i}`).addEventListener("input", atualizarSomaMetas);
    bloco.querySelector(`#nome_${i}`).addEventListener("input", salvarNoStorage);
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
  html += "<tr><th>Ativo</th><th>Valor Atual</th><th>Valor Meta</th><th>Aporte Sugerido</th><th>Status</th></tr>";

  for (let i = 0; i < num; i++) {
    const temAporte = distribuicao[i] > 0.01;
    const rowClass = temAporte ? "row-ok" : "row-zero";
    const status = temAporte ? "✅ Aportar" : "— Já no alvo";
    html += `<tr class="${rowClass}">`;
    html += `<td>${nomes[i]}</td>`;
    html += `<td>R$ ${formatBR(investimentos[i])}</td>`;
    html += `<td>R$ ${formatBR(valoresAlvo[i])}</td>`;
    html += `<td>R$ ${formatBR(distribuicao[i])}</td>`;
    html += `<td>${status}</td>`;
    html += `</tr>`;
  }

  html += `<tr class="row-total">`;
  html += `<td>Total</td>`;
  html += `<td>R$ ${formatBR(totalAtual)}</td>`;
  html += `<td>R$ ${formatBR(totalFinal)}</td>`;
  html += `<td>R$ ${formatBR(valorDisponivel)}</td>`;
  html += `<td></td>`;
  html += `</tr>`;
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

function salvarNoStorage() {
  const num = parseInt(document.getElementById("numAtivos").value);
  const dados = { num, ativos: [] };
  for (let i = 1; i <= num; i++) {
    dados.ativos.push({
      nome: document.getElementById(`nome_${i}`)?.value || "",
      valor: document.getElementById(`valor_${i}`)?.value || "",
      meta: document.getElementById(`meta_${i}`)?.value || "",
    });
  }
  localStorage.setItem("investdistrib_dados", JSON.stringify(dados));
}

function restaurarDoStorage() {
  const raw = localStorage.getItem("investdistrib_dados");
  if (!raw) return false;
  try {
    const dados = JSON.parse(raw);
    document.getElementById("numAtivos").value = dados.num;
    gerarCampos();
    dados.ativos.forEach((a, idx) => {
      const i = idx + 1;
      const nomeEl = document.getElementById(`nome_${i}`);
      const valorEl = document.getElementById(`valor_${i}`);
      const metaEl = document.getElementById(`meta_${i}`);
      if (nomeEl) nomeEl.value = a.nome;
      if (valorEl) valorEl.value = a.valor;
      if (metaEl) metaEl.value = a.meta;
    });
    atualizarSomaMetas();
    return true;
  } catch (err) {
    localStorage.removeItem("investdistrib_dados");
    return false;
  }
}

function limpar() {
  localStorage.removeItem("investdistrib_dados");
  document.getElementById("numAtivos").value = 4;
  document.getElementById("valorDisponivel").value = "";
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("chartsContainer").style.display = "none";
  gerarCampos();
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const active = document.activeElement;
    if (active && active.id === "numAtivos") {
      gerarCampos();
      return;
    }
    const section = document.getElementById("valorDisponivelSection");
    if (section && section.style.display !== "none" && active && active.id === "valorDisponivel") {
      calcularDistribuicao(e);
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

  document.getElementById("numAtivos").addEventListener("keydown", function (e) {
    if (e.key === "Enter") gerarCampos();
  });

  restaurarDoStorage() || gerarCampos();
});
