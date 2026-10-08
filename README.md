# Sistema de Credenciamento e Gestão de Voluntários
## Instituto Ádapo • Amazônia Brincante 2026

Sistema web desenvolvido especificamente para eliminar gargalos operacionais no credenciamento da ação de Dia das Crianças (11 de Outubro de 2026), reduzindo o tempo de atendimento por voluntário de 10 minutos para menos de 15 segundos.

---

## 🌟 Funcionalidades Principais

### 1. Portal do Voluntário (`index.html`)
- **Busca Rápida Autocomplete:** O voluntário digita seu nome e encontra sua inscrição instantaneamente.
- **Link Direto:** A coordenação pode compartilhar links já direcionados (ex: `index.html?id=ADP-1002`).
- **Credencial Digital com QR Code:** Código de leitura único emitido diretamente no navegador.
- **Área Principal & Coordenador:** Mostra a área designada, orientações operacionais, ponto de encontro (tenda) e botão direto de WhatsApp com o coordenador.
- **Áreas de Apoio:** Exibe áreas secundárias caso haja necessidade de redirecionamento durante o evento.
- **Download em Imagem (PNG):** Botão para salvar o crachá como imagem no celular e usar offline.

### 2. Painel da Recepção / Coordenação (`admin.html`)
- **Leitor de QR Code via Câmera:** Bipa o crachá digital do voluntário em 2 segundos pela câmera de qualquer celular/notebook.
- **Feedback Sonoro (Web Audio):** Bipe duplo suave confirmando credenciamento e alerta em caso de duplicidade.
- **Check-in Manual de Contingência:** Campo para busca rápida caso o voluntário esteja sem bateria.
- **Métricas em Tempo Real:** Total de inscritos, presentes, faltantes e almoços confirmados.
- **Filtros e Alocação:** Filtre quem já chegou, quem está faltando, por área ou por horário (09h30 / 13h00).
- **Exportação CSV para Certificados:** Gera arquivo com dados consolidados dos presentes com 1 clique.

---

## 🚀 Como Testar Localmente Imediatamente

Os 14 voluntários já inscritos na planilha oficial do Instituto Ádapo estão pré-carregados na aplicação.

Você pode abrir diretamente no seu navegador:
- Abra o arquivo `index.html` para testar o **Portal do Voluntário**.
  *(Experimente digitar "Angelina", "Cleydson", "Giovane" ou "Ana")*
- Abra o arquivo `admin.html` para testar o **Painel da Recepção & Leitor de QR Code**.

---

## 🔗 Integração com o Google Sheets (Passo a Passo)

Para que as presenças e novas inscrições sincronizem automaticamente com a sua planilha oficial:

1. Abra a sua planilha: [Planilha de Inscrições Google Sheets](https://docs.google.com/spreadsheets/d/1LFrRgANUgN5T7YXcKfBh8Q_d0vhLJ1_IBWoJqiE-MKU/edit?usp=sharing)
2. Acesse o menu superior: **Extensões &gt; Apps Script**.
3. Apague o conteúdo existente e cole todo o código do arquivo `apps-script/Code.gs`.
4. No topo, selecione a função **`executarSetupInicial`** e clique em **Executar**.
   - *Isso criará a aba "Áreas" automaticamente e as colunas de controle (Status, Horário Chegada, Área Principal e ID Único).*
5. No canto superior direito, clique no botão azul **Implantar &gt; Nova implantação**.
   - Tipo: **Aplicativo da Web**.
   - Descrição: `API Credenciamento Ádapo`.
   - Executar como: **Eu (seu e-mail)**.
   - Quem pode acessar: **Qualquer pessoa**.
6. Clique em **Implantar** e autorize as permissões.
7. Copie a **URL do aplicativo da Web** gerada (termina com `/exec`).
8. Abra o arquivo `js/config.js` e cole a URL no campo `APPS_SCRIPT_URL`, ou cole diretamente na aba **Configuração** do painel `admin.html`.

---

## 🌐 Deploy na Vercel

O projeto foi preparado para deploy estático imediato com o arquivo `vercel.json` configurado.

### Opção 1: Via GitHub
1. Envie esta pasta para um repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New &gt; Project**.
3. Importe o repositório. O framework preset será reconhecido automaticamente como **Other** (Static HTML).
4. Clique em **Deploy**.

### Opção 2: Via Vercel CLI no Terminal
```bash
npx vercel
```
Siga as instruções padrão pressionando Enter para todas as opções.

---

## 📋 Resumo das Tecnologias

- **Frontend:** Vanilla HTML5, CSS3 Institucional (Design Tokens sem emojis) e JavaScript ES6+.
- **QR Code:** QRCode.js (Geração) e HTML5-QRCode (Leitura por câmera).
- **Exportação de Imagens:** HTML2Canvas (Renderização de credencial em alta definição).
- **Backend / Persistência:** Google Sheets API nativa via Google Apps Script (sem custos de servidor).
- **Hospedagem:** Vercel (Edge Network global de alta velocidade).
