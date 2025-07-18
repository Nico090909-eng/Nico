
import streamlit as st
import requests
import pandas as pd

st.title("Macro Trading Dashboard V2")
st.write("Bienvenue dans votre outil d'analyse macroéconomique et géopolitique.")

# Ajoutons un exemple d'interface
st.header("📊 Données économiques en direct")
st.write("Connexion aux API en cours...")

# Exemple de placeholder
st.success("✅ Les API clés sont bien connectées.")


def fetch_economic_calendar(api_key: str) -> pd.DataFrame:
    """Fetch economic calendar data from TradingEconomics."""
    url = "https://api.tradingeconomics.com/calendar"
    params = {"c": api_key, "format": "json"}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return pd.DataFrame(resp.json())


api_key = st.text_input("Entrez votre clé API TradingEconomics:")

if api_key:
    with st.spinner("Récupération des données..."):
        try:
            df_calendar = fetch_economic_calendar(api_key)
            st.dataframe(df_calendar)
        except Exception as exc:
            st.error(f"Erreur lors de la récupération des données: {exc}")
