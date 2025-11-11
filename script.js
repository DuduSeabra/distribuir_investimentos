function gerarCampos() {
  const num = parseInt(document.getElementById("numAtivos").value);
  const form = document.getElementById("ativosForm");
  form.innerHTML = "";

  for (let i = 1; i <= num; i++) {
    const bloco = document.createElement("div");
    bloco.className = "ativo-bloco";
    bloco.innerHTML = `
      <h4>💼 Ativo ${i}</h4>
      <input type="text" id="nome_${i}" placeholder="Nome do ativo" value="Ativo ${i}"><br>
      <input type="text" id="valor_${i}" placeholder="Valor atual (R$)"><br>
      <input type="text" id="meta_${i}" placeholder="Meta (%)">
      <hr>
    `;
    form.appendChild(bloco);
  }

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
    investimentos.push(parseFloat(document.getElementById(`valor_${i}`).value.replace(",", ".")) || 0);
    metas.push(parseFloat(document.getElementById(`meta_${i}`).value.replace(",", ".")) || 0);
  }

  const somaMetas = metas.reduce((a, b) => a + b, 0);
  if (somaMetas !== 100) {
    alert(`⚠️ As porcentagens devem somar 100%. Atualmente somam ${somaMetas.toFixed(2)}%.`);
    return;
  }

  const valorDisponivel = parseFloat(document.getElementById("valorDisponivel").value.replace(",", ".")) || 0;

  const totalAtual = investimentos.reduce((a, b) => a + b, 0);
  const totalFinal = totalAtual + valorDisponivel;
  const metasFrac = metas.map(m => m / 100);
  const valoresAlvo = metasFrac.map(f => totalFinal * f);

  const necessidades = valoresAlvo.map((alvo, i) => Math.max(0, alvo - investimentos[i]));
  const somaNec = necessidades.reduce((a, b) => a + b, 0);
  const distribuicao = somaNec === 0 ? investimentos.map(() => 0) : necessidades.map(n => (n / somaNec) * valorDisponivel);

  // Exibe tabela
  let html = "<h3>📊 Resultado da distribuição</h3><table style='margin:auto; border-collapse:collapse;'>";
  html += "<tr><th>Ativo</th><th>Aporte Sugerido (R$)</th></tr>";
  for (let i = 0; i < num; i++) {
    html += `<tr><td>${nomes[i]}</td><td>R$ ${distribuicao[i].toFixed(2)}</td></tr>`;
  }
  html += "</table>";
  document.getElementById("resultado").innerHTML = html;

  // Gráficos
  document.getElementById("chartsContainer").style.display = "block";
  desenharGraficos(nomes, investimentos, distribuicao, valorDisponivel);
}

function desenharGraficos(nomes, investimentos, distribuicao, valorDisponivel) {
  const totalAtual = investimentos.reduce((a, b) => a + b, 0);
  const totalFinal = totalAtual + valorDisponivel;
  const finalValores = investimentos.map((v, i) => v + distribuicao[i]);

  const ctx1 = document.getElementById("chartAntes").getContext("2d");
  const ctx2 = document.getElementById("chartDepois").getContext("2d");

  new Chart(ctx1, {
    type: "pie",
    data: { labels: nomes, datasets: [{ data: investimentos, backgroundColor: gerarCores(nomes.length) }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  new Chart(ctx2, {
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
