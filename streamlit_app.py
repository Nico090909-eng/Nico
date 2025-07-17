
import streamlit as st
import sqlite3
import requests

# Chargement des clés API (intégrées en privé)
TRADING_ECONOMICS_KEY = "f03dcef1c0a244c:prgnhl4ucxykfzq"
FRED_KEY = "28b862afd9aa3579129eeb27514851ee"
NASDAQ_KEY = "m_Rmu_mus22_yuTdNx3L"
IG_KEY = "67f72691898475f198aaf011cdd93d087f9ca834"

st.set_page_config(page_title="Cockpit Macro V2", layout="wide")
st.title("📊 Cockpit Macro Institutionnel V2")

st.markdown("### 🔗 APIs Connectées")
st.write(f"✅ Trading Economics Key: {TRADING_ECONOMICS_KEY[:6]}***")
st.write(f"✅ FRED Key: {FRED_KEY[:6]}***")
st.write(f"✅ Nasdaq Key: {NASDAQ_KEY[:6]}***")
st.write(f"✅ IG Key: {IG_KEY[:6]}***")

st.markdown("### 🚀 Dashboard en construction...")
