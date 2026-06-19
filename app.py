import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="Scientific Calculator",
    page_icon="🧮",
    layout="centered"
)

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

with open("style.css", "r", encoding="utf-8") as f:
    css = f.read()

with open("script.js", "r", encoding="utf-8") as f:
    js = f.read()

html_code = f"""
<style>
{css}
</style>

{html}

<script>
{js}
</script>
"""

components.html(html_code, height=850, scrolling=True)
