/**
 * INSTITUTO ÁDAPO - AMAZÔNIA BRINCANTE 2026
 * Controlador Principal do Painel Administrativo e Coordenação
 */

window.AdminManager = {
  voluntarios: [],
  areas: [],

  async inicializar() {
    this.configurarAbas();
    this.configurarBotoes();
    this.carregarConfiguracao();

    await this.carregarDados();
    this.renderizarAreasDropdownFiltro();
    this.atualizarMetricas();
    this.renderizarTabela();
    this.renderizarQuadroAreas();

    // Inicia o scanner na aba padrão
    if (window.ScannerManager) {
      ScannerManager.iniciar();
    }
  },

  /**
   * Alternância de abas
   */
  configurarAbas() {
    const botoes = document.querySelectorAll(".tab-btn");
    botoes.forEach(btn => {
      btn.addEventListener("click", () => {
        botoes.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");

        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        const tabConteudo = document.getElementById(tabId);
        if (tabConteudo) {
          tabConteudo.style.display = "block";
        }

        // Se sair da aba scanner, pausa câmera para economizar bateria
        if (window.ScannerManager) {
          if (tabId === "tabScanner") {
            ScannerManager.iniciar();
          } else {
            ScannerManager.parar();
          }
        }

        if (window.lucide) lucide.createIcons();
      });
    });
  },

  /**
   * Configura eventos de botões e inputs
   */
  configurarBotoes() {
    // Botão de check-in manual na aba scanner
    const btnManual = document.getElementById("btnManualCheckin");
    const inputManual = document.getElementById("manualCheckinInput");

    if (btnManual && inputManual) {
      const executarManual = () => {
        const valor = inputManual.value.trim();
        if (valor) {
          ScannerManager.processarIdentificador(valor);
          inputManual.value = "";
        }
      };

      btnManual.addEventListener("click", executarManual);
      inputManual.addEventListener("keydown", (e) => {
        if (e.key === "Enter") executarManual();
      });
    }

    // Botão de alternar câmera
    const btnCam = document.getElementById("btnToggleCamera");
    if (btnCam) {
      btnCam.addEventListener("click", async () => {
        if (ScannerManager.html5QrCode && ScannerManager.todasCameras.length > 1) {
          await ScannerManager.parar();
          // Inverte seleção de câmera
          const cameraAlvo = ScannerManager.todasCameras.find(c => c.id !== ScannerManager.cameraIdAtual) || ScannerManager.todasCameras[0];
          ScannerManager.cameraIdAtual = cameraAlvo.id;
          try {
            await ScannerManager.html5QrCode.start(
              cameraAlvo.id,
              { fps: 15, qrbox: 250 },
              (text) => ScannerManager.tratarQrCodeLido(text)
            );
            ScannerManager.isScanning = true;
          } catch (e) {
            ScannerManager.iniciar();
          }
        } else {
          alert("Apenas uma câmera detectada neste dispositivo.");
        }
      });
    }

    // Botão reiniciar leitor
    const btnRestart = document.getElementById("btnRestartScanner");
    if (btnRestart) {
      btnRestart.addEventListener("click", async () => {
        await ScannerManager.parar();
        await ScannerManager.iniciar();
      });
    }

    // Botão limpar resultado e preparar próximo
    const btnNext = document.getElementById("btnNextScan");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        const details = document.getElementById("scanDetailsContainer");
        const empty = document.getElementById("scanEmptyState");
        const banner = document.getElementById("scanFeedbackBanner");
        if (details) details.style.display = "none";
        if (empty) empty.style.display = "block";
        if (banner) banner.style.display = "none";
      });
    }

    // Filtros da tabela
    const searchInput = document.getElementById("tableSearchInput");
    const statusSelect = document.getElementById("filterStatus");
    const areaSelect = document.getElementById("filterArea");

    if (searchInput) searchInput.addEventListener("input", () => this.renderizarTabela());
    if (statusSelect) statusSelect.addEventListener("change", () => this.renderizarTabela());
    if (areaSelect) areaSelect.addEventListener("change", () => this.renderizarTabela());

    // Exportar CSV
    const btnExport = document.getElementById("btnExportCsv");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.exportarCsv());
    }

    // Salvar configuração de URL
    const btnSaveCfg = document.getElementById("btnSaveConfig");
    const btnSync = document.getElementById("btnSyncNow");

    if (btnSaveCfg) {
      btnSaveCfg.addEventListener("click", () => {
        const url = document.getElementById("inputAppsScriptUrl").value;
        API.setEndpointUrl(url);
        const alertBox = document.getElementById("syncResultAlert");
        alertBox.style.display = "block";
        alertBox.textContent = "URL da API salva com sucesso!";
        setTimeout(() => alertBox.style.display = "none", 3000);
      });
    }

    if (btnSync) {
      btnSync.addEventListener("click", async () => {
        btnSync.disabled = true;
        btnSync.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Sincronizando...`;
        await this.carregarDados();
        this.atualizarMetricas();
        this.renderizarTabela();
        this.renderizarQuadroAreas();
        btnSync.disabled = false;
        btnSync.innerHTML = `<i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i> Sincronizar com a Planilha Agora`;
        if (window.lucide) lucide.createIcons();
      });
    }
  },

  carregarConfiguracao() {
    const input = document.getElementById("inputAppsScriptUrl");
    if (input) {
      input.value = API.getEndpointUrl();
    }
  },

  async carregarDados() {
    try {
      const [voluntarios, areas] = await Promise.all([
        API.getVoluntarios(),
        API.getAreas()
      ]);
      this.voluntarios = voluntarios;
      this.areas = areas;
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  },

  atualizarMetricas() {
    const total = this.voluntarios.length;
    const presentes = this.voluntarios.filter(v => v.status.toLowerCase() === "presente").length;
    const faltantes = total - presentes;
    const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;
    const almoco = this.voluntarios.filter(v => v.precisaAlmoco && v.precisaAlmoco.toLowerCase().startsWith("sim")).length;

    document.getElementById("metricTotal").textContent = total;
    document.getElementById("metricPresentes").textContent = presentes;
    document.getElementById("metricFaltantes").textContent = faltantes;
    document.getElementById("metricPercentual").textContent = `${percentual}% do efetivo presente no local`;
    document.getElementById("metricAlmoco").textContent = almoco;
  },

  renderizarAreasDropdownFiltro() {
    const select = document.getElementById("filterArea");
    if (!select) return;

    select.innerHTML = `<option value="todas">Todas as Áreas</option>`;
    this.areas.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.nome;
      opt.textContent = a.nome;
      select.appendChild(opt);
    });
  },

  renderizarTabela() {
    const tbody = document.getElementById("volunteersTableBody");
    if (!tbody) return;

    const termo = (document.getElementById("tableSearchInput")?.value || "").toLowerCase().trim();
    const filtroStatus = document.getElementById("filterStatus")?.value || "todos";
    const filtroArea = document.getElementById("filterArea")?.value || "todas";

    const filtrados = this.voluntarios.filter(v => {
      const matchTermo = !termo || 
        v.nome.toLowerCase().includes(termo) || 
        (v.id && v.id.toLowerCase().includes(termo)) ||
        (v.whatsapp && v.whatsapp.includes(termo));

      const matchStatus = filtroStatus === "todos" || 
        (filtroStatus === "presente" && v.status.toLowerCase() === "presente") ||
        (filtroStatus === "inscrito" && v.status.toLowerCase() !== "presente");

      const matchArea = filtroArea === "todas" || v.areaPrincipal === filtroArea;

      return matchTermo && matchStatus && matchArea;
    });

    tbody.innerHTML = "";

    if (filtrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
            Nenhum voluntário encontrado com os filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    filtrados.forEach(v => {
      const isPresente = v.status.toLowerCase() === "presente";
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td class="table-volunteer-id">${escapeHtml(v.id)}</td>
        <td>
          <div class="table-volunteer-name">${escapeHtml(v.nome)}</div>
          <div style="font-size: 11px; color: var(--color-text-muted);">${escapeHtml(v.email || "")}</div>
        </td>
        <td>
          <a href="https://wa.me/55${(v.whatsapp || '').replace(/\D/g, '')}" target="_blank" style="color: var(--color-primary); font-size: 13px;">
            ${escapeHtml(v.whatsapp || "-")}
          </a>
        </td>
        <td>
          <select class="form-select area-selector-select" data-id="${v.id}" style="font-size: 12px; padding: 4px 8px;">
            ${this.areas.map(a => `
              <option value="${escapeHtml(a.nome)}" ${a.nome === v.areaPrincipal ? 'selected' : ''}>
                ${escapeHtml(a.nome)}
              </option>
            `).join('')}
          </select>
        </td>
        <td style="font-size: 12px;">
          ${v.disponibilidade && v.disponibilidade.includes("9h30") ? "09h30" : "13h00"}
        </td>
        <td style="font-size: 12px; font-family: monospace;">
          ${v.horarioChegada || "--:--"}
        </td>
        <td>
          <span class="badge ${isPresente ? 'badge-presente' : 'badge-inscrito'}">
            ${isPresente ? 'Presente' : 'Inscrito'}
          </span>
        </td>
        <td>
          ${!isPresente ? `
            <button type="button" class="btn btn-primary btn-sm btn-checkin-manual" data-id="${v.id}">
              Confirmar
            </button>
          ` : `
            <span style="font-size: 11px; color: var(--color-success); font-weight: 600;">Credenciado</span>
          `}
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Eventos dos botões manuais de cada linha
    tbody.querySelectorAll(".btn-checkin-manual").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        btn.disabled = true;
        btn.textContent = "...";
        await ScannerManager.processarIdentificador(id);
      });
    });

    // Eventos para alteração de área ao vivo
    tbody.querySelectorAll(".area-selector-select").forEach(select => {
      select.addEventListener("change", async (e) => {
        const id = select.getAttribute("data-id");
        const novaArea = e.target.value;
        await API.atualizarAreaPrincipal(id, novaArea);
        this.renderizarQuadroAreas();
      });
    });
  },

  renderizarQuadroAreas() {
    const grid = document.getElementById("areasSummaryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    this.areas.forEach(area => {
      const alocados = this.voluntarios.filter(v => v.areaPrincipal === area.nome);
      const presentes = alocados.filter(v => v.status.toLowerCase() === "presente").length;
      const total = alocados.length;
      const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;

      const card = document.createElement("div");
      card.className = "area-summary-card";

      card.innerHTML = `
        <div class="area-summary-header">
          <div>
            <div class="area-summary-title">${escapeHtml(area.nome)}</div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 2px;">
              Líder: <strong>${escapeHtml(area.responsavel || "A definir")}</strong>
            </div>
          </div>
          <span class="badge badge-area">${presentes}/${total}</span>
        </div>

        <div class="area-progress-bar">
          <div class="area-progress-fill" style="width: ${pct}%;"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-muted);">
          <span>${pct}% do efetivo presente</span>
          <span>${total - presentes} aguardando</span>
        </div>

        <div style="margin-top: var(--space-3); font-size: 12px; color: var(--color-text-secondary); border-top: 1px solid var(--color-border-subtle); padding-top: var(--space-2);">
          ${escapeHtml(area.pontoEncontro || area.descricao || "")}
        </div>
      `;

      grid.appendChild(card);
    });
  },

  atualizarInterfaceAposCheckin() {
    this.carregarDados().then(() => {
      this.atualizarMetricas();
      this.renderizarTabela();
      this.renderizarQuadroAreas();
    });
  },

  exportarCsv() {
    const cabecalhos = [
      "ID",
      "Nome Completo",
      "WhatsApp",
      "E-mail",
      "Área Principal",
      "Status",
      "Horário de Chegada",
      "Disponibilidade",
      "Almoço",
      "Restrições Alimentares"
    ];

    const linhas = this.voluntarios.map(v => [
      v.id || "",
      `"${(v.nome || '').replace(/"/g, '""')}"`,
      `"${v.whatsapp || ''}"`,
      `"${v.email || ''}"`,
      `"${(v.areaPrincipal || '').replace(/"/g, '""')}"`,
      v.status || "Inscrito",
      v.horarioChegada || "",
      `"${(v.disponibilidade || '').replace(/"/g, '""')}"`,
      `"${(v.precisaAlmoco || '').replace(/"/g, '""')}"`,
      `"${(v.restricaoAlimentar || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map(l => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Credenciamento-Adapo-Presentes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.AdminManager.inicializar();
});

function escapeHtml(string) {
  if (!string) return "";
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
