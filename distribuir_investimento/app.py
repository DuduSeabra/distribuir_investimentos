import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt

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


# ---------- INTERFACE ----------
st.set_page_config(page_title="Distribuidor de Investimentos", page_icon="💰", layout="centered")

st.title("💰 Distribuidor de Investimentos")
st.write("""
Calcule quanto investir em cada grupo para atingir a **porcentagem meta** da sua carteira de forma simples e visual.
""")

st.divider()

num_ativos = st.number_input("Quantos tipos de investimentos você tem?", min_value=1, step=1, value=4)

nomes = []
investimentos = []
metas_percentuais = []

st.subheader("📋 Dados dos investimentos atuais")
colunas = st.columns([2, 2, 2])
colunas[0].markdown("**Nome do ativo**")
colunas[1].markdown("**Valor atual (R$)**")
colunas[2].markdown("**Meta (%)**")

for i in range(num_ativos):
    with st.container():
        c1, c2, c3 = st.columns([2, 2, 2])
        nome = c1.text_input(f"Nome do ativo {i+1}", value=f"Ativo {i+1}")
        valor = c2.number_input(f"Valor atual {i+1}", min_value=0.0, step=0.01, label_visibility="collapsed")
        meta = c3.number_input(f"Meta {i+1}", min_value=0.0, max_value=100.0, step=0.1, label_visibility="collapsed")

        nomes.append(nome)
        investimentos.append(valor)
        metas_percentuais.append(meta)

soma_metas = sum(metas_percentuais)
if soma_metas != 100:
    st.warning(f"⚠️ As porcentagens devem somar 100%. Atualmente somam {soma_metas:.2f}%.")

valor_disponivel = st.number_input("Valor disponível para investir este mês (R$)", min_value=0.0, step=0.01)

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
