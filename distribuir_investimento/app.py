import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import streamlit.components.v1 as components

# ---------- INTERFACE ----------
st.set_page_config(page_title="InvestDistrib", page_icon="💰", layout="centered")

# --- Detecta se é mobile (executa só uma vez) ---
if "mobile_view" not in st.session_state:
    st.session_state["mobile_view"] = False

st.markdown("""
<script>
    const mobile = window.innerWidth < 768;
    window.parent.postMessage({type: 'streamlit:setComponentValue', key: 'mobile_view', value: mobile}, '*');
</script>
""", unsafe_allow_html=True)

# ---------- LÓGICA PRINCIPAL ----------
def distribuir_investimento(investimentos, metas_percentuais, valor_disponivel):
    total_atual = sum(investimentos)
    total_final = total_atual + valor_disponivel

    metas_frações = [m / 100 for m in metas_percentuais]
    valores_alvo = [total_final * f for f in metas_frações]

    necessidades = [max(0, alvo - atual) for alvo, atual in zip(valores_alvo, investimentos)]
    soma_necessidades = sum(necessidades)

    if soma_necessidades == 0:
        return [0] * len(investimentos), valores_alvo

    distribuicao = [(n / soma_necessidades) * valor_disponivel for n in necessidades]
    return distribuicao, valores_alvo



# ---------- CABEÇALHO MODERNO E CENTRALIZADO ----------
from PIL import Image
import base64
from io import BytesIO

def image_to_base64(img_path):
    """Converte a imagem para Base64 para exibição via HTML."""
    img = Image.open(img_path)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

# Garante o caminho correto, mesmo se o app for executado de outra pasta
logo_path = Path(__file__).parent / "logo_investdistrib.png"
logo_base64 = image_to_base64(logo_path)

# Inserir CSS e HTML customizado
st.markdown(
    f"""
    <style>
    .header-container {{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin-top: -30px;
        margin-bottom: 20px;
    }}
    .header-logo {{
        width: 130px;
        height: auto;
        margin-bottom: 10px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }}
    .header-title {{
        font-size: 2.4rem;
        font-weight: 800;
        color: #1a1a1a;
        margin-bottom: 4px;
    }}
    .header-subtitle {{
        font-size: 1.1rem;
        color: #555;
    }}
    </style>

    <div class="header-container">
        <img src="data:image/png;base64,{logo_base64}" class="header-logo" alt="InvestDistrib logo">
        <div class="header-subtitle">Distribuidor inteligente de investimentos</div>
    </div>
    <hr>
    """,
    unsafe_allow_html=True
)


st.write("""
Calcule quanto investir em cada grupo para atingir a **porcentagem meta** da sua carteira de forma simples e visual.
""")

st.divider()

num_ativos = st.number_input("Quantos tipos de investimentos você tem?", min_value=1, step=1, value=4)

nomes = []
investimentos = []
metas_percentuais = []


# --- CSS para alinhamento perfeito e visual limpo ---
st.markdown("""
<style>
div[data-testid="stTextInput"] > div:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
}
input {
    text-align: center;
    height: 38px !important;
    padding: 6px 8px !important;
    border: 1px solid #ccc !important;
    border-radius: 6px !important;
    font-size: 14px !important;
}
input::placeholder {
    color: #bbb !important;
    text-align: center;
}
label[data-testid="stMarkdownContainer"] > p {
    font-weight: 600;
    color: #1a1a1a;
    text-align: center;
}
</style>
""", unsafe_allow_html=True)

# --- CSS para comportamento responsivo das labels ---
st.markdown("""
<style>
/* Hide per-field labels on desktop, show column headers */
@media (min-width: 769px) {
  .mobile-label { display: none !important; }  /* labels individuais escondidas no desktop */
  .desktop-headers { display: block !important; }
}
/* On small screens show per-field labels and hide the desktop header row */
@media (max-width: 768px) {
  .mobile-label { display: block !important; margin-bottom:6px; color:#333; font-weight:600; }
  .desktop-headers { display: none !important; }
}

/* Styling inputs to keep consistent look */
div[data-testid="stTextInput"] > div:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
}
input {
    text-align: center;
    height: 38px !important;
    padding: 6px 8px !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 8px !important;
    font-size: 14px !important;
}
input::placeholder {
    color: #9aa0a6 !important;
    text-align: center;
}
</style>
""", unsafe_allow_html=True)

# Cabeçalhos (visíveis no desktop, escondidos no mobile)
st.markdown(
    '<div class="desktop-headers" style="display:block; margin-bottom:8px;">'
    '<div style="display:flex; gap:16px;">'
    '<div style="flex:2; font-weight:700;">Nome do ativo</div>'
    '<div style="flex:2; font-weight:700;">Valor atual (R$)</div>'
    '<div style="flex:2; font-weight:700;">Meta (%)</div>'
    '</div>'
    '</div>',
    unsafe_allow_html=True
)

# --- Loop responsivo e legível ---
for i in range(num_ativos):
    # bloco título do ativo (sempre)
    st.markdown(f"<div style='margin-top:6px; margin-bottom:6px; font-weight:600;'>💼 Ativo {i+1}</div>", unsafe_allow_html=True)

    # Cria as colunas para desktop - no mobile elas vão empilhar mas labels locais aparecem
    c1, c2, c3 = st.columns([2, 2, 2])

    # Label visível apenas no mobile (escondida no desktop via CSS)
    c1.markdown('<div class="mobile-label">Nome do ativo</div>', unsafe_allow_html=True)
    c2.markdown('<div class="mobile-label">Valor atual (R$)</div>', unsafe_allow_html=True)
    c3.markdown('<div class="mobile-label">Meta (%)</div>', unsafe_allow_html=True)

    # Inputs (labels do streamlit colapsados para evitar duplicação)
    nome = c1.text_input(
        f"Nome do ativo {i+1}",
        value=f"Ativo {i+1}",
        label_visibility="collapsed",
        key=f"nome_{i}"
    )

    valor_str = c2.text_input(
        f"Valor atual {i+1}",
        value="",
        placeholder="0,00",
        label_visibility="collapsed",
        key=f"valor_{i}"
    )

    meta_str = c3.text_input(
        f"Meta {i+1}",
        value="",
        placeholder="0,0",
        label_visibility="collapsed",
        key=f"meta_{i}"
    )

    # Conversões seguras
    try:
        valor = float(valor_str.replace(",", ".")) if valor_str.strip() != "" else 0.0
    except ValueError:
        valor = 0.0

    try:
        meta = float(meta_str.replace(",", ".")) if meta_str.strip() != "" else 0.0
    except ValueError:
        meta = 0.0

    nomes.append(nome)
    investimentos.append(valor)
    metas_percentuais.append(meta)

    # separador suave
    st.markdown("<hr style='border:0.5px solid #f1f1f1; margin:12px 0;'>", unsafe_allow_html=True)


soma_metas = sum(metas_percentuais)
if soma_metas != 100:
    st.warning(f"⚠️ As porcentagens devem somar 100%. Atualmente somam {soma_metas:.2f}%.")

# --- Campo de valor disponível (com placeholder estilo 0,00) ---
st.markdown("""
<style>
input[data-testid="stNumberInput"] {
    text-align: center !important;
}
</style>
""", unsafe_allow_html=True)

valor_disponivel_str = st.text_input(
    "Valor disponível para investir este mês (R$)",
    value="",
    placeholder="0,00",
    key="valor_disponivel"
)

# Conversão segura do texto para número
try:
    valor_disponivel = float(valor_disponivel_str.replace(",", ".")) if valor_disponivel_str.strip() != "" else 0.0
except ValueError:
    valor_disponivel = 0.0

if st.button("Calcular distribuição", type="primary"):
    if soma_metas != 100:
        st.error("As metas devem somar exatamente 100% para realizar o cálculo.")
    else:
        distribuicao, valores_alvo = distribuir_investimento(investimentos, metas_percentuais, valor_disponivel)
        
        st.subheader("📊 Resultado da distribuição")
        df_resultado = pd.DataFrame({
            "Ativo": nomes,
            "Valor Atual (R$)": investimentos,
            "Meta (%)": metas_percentuais,
            "Valor Alvo (R$)": [round(v, 2) for v in valores_alvo],
            "Aporte Sugerido (R$)": [round(v, 2) for v in distribuicao],
        })

        # Cálculo do quanto falta para atingir o equilíbrio
        diferencas = [max(0, alvo - atual - aporte) for alvo, atual, aporte in zip(valores_alvo, investimentos, distribuicao)]
        total_faltante = sum(diferencas)

        st.dataframe(df_resultado, hide_index=True, use_container_width=True)
        st.success(f"💵 Total a investir este mês: R$ {sum(distribuicao):,.2f}")

        if total_faltante > 0:
            st.info(f"🎯 Após este aporte, ainda faltarão **R$ {total_faltante:,.2f}** para atingir totalmente o equilíbrio da carteira.")
        else:
            st.success("✅ Sua carteira ficará totalmente equilibrada após este aporte!")

        st.divider()
        st.subheader("📈 Distribuição da Carteira")

        # Preparar dados para os gráficos
        total_atual = sum(investimentos)
        total_final = total_atual + valor_disponivel
        atual_pct = [v / total_atual * 100 if total_atual > 0 else 0 for v in investimentos]
        final_valores = [v + d for v, d in zip(investimentos, distribuicao)]
        final_pct = [v / total_final * 100 if total_final > 0 else 0 for v in final_valores]

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Antes do aporte**")
            fig1, ax1 = plt.subplots()
            ax1.pie(atual_pct, labels=nomes, autopct='%1.1f%%', startangle=90)
            ax1.axis('equal')
            st.pyplot(fig1)

        with col2:
            st.markdown("**Depois do aporte**")
            fig2, ax2 = plt.subplots()
            ax2.pie(final_pct, labels=nomes, autopct='%1.1f%%', startangle=90)
            ax2.axis('equal')
            st.pyplot(fig2)

st.divider()
st.caption("Criado por Dudu Seabra | Ferramenta gratuita de distribuição de investimentos 💡")
