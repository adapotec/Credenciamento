/**
 * INSTITUTO ÁDAPO - AMAZÔNIA BRINCANTE 2026
 * Módulo do Leitor de QR Code (Recepção) e Feedback Sonoro
 */

const ScannerManager = {
  html5QrCode: null,
  isScanning: false,
  cameraIdAtual: null,
  todasCameras: [],
  ultimoCodigoLido: null,
  cooldownTimestamp: 0,
  audioCtx: null,

  /**
   * Inicializa o sintetizador de áudio Web Audio API (sem dependência de arquivos externos)
   */
  obterAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  /**
   * Emite bipe institucional suave de confirmação (Dois tons harmônicos)
   */
  tocarBipeSucesso() {
    try {
      const ctx = this.obterAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);        // A5
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Áudio não disponível no dispositivo:", e);
    }
  },

  /**
   * Emite som suave de aviso (para caso de voluntário já credenciado)
   */
  tocarBipeAtencao() {
    try {
      const ctx = this.obterAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  },

  /**
   * Inicia o leitor de QR Code usando a câmera do dispositivo
   */
  async iniciar() {
    const readerElement = document.getElementById("reader");
    const statusBadge = document.getElementById("cameraStatusBadge");
    const statusMsg = document.getElementById("scannerMessage");

    if (!readerElement) return;

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode("reader");
      }

      // Obtém lista de câmeras disponíveis
      this.todasCameras = await Html5Qrcode.getCameras();

      if (this.todasCameras.length === 0) {
        statusMsg.textContent = "Nenhuma câmera detectada no dispositivo.";
        statusBadge.textContent = "Sem Câmera";
        statusBadge.className = "badge badge-ausente";
        return;
      }

      // Prioriza a câmera traseira (environment) no celular
      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const cameraParaUsar = { facingMode: "environment" };

      await this.html5QrCode.start(
        cameraParaUsar,
        config,
        (decodedText) => this.tratarQrCodeLido(decodedText),
        (errorMessage) => {
          // Frame sem QR code - ignorar logs excessivos
        }
      );

      this.isScanning = true;
      statusBadge.textContent = "Câmera Ativa";
      statusBadge.className = "badge badge-presente";
      statusMsg.textContent = "Aponte a câmera para o QR Code da credencial.";

    } catch (err) {
      console.warn("Falha ao abrir câmera automaticamente com facingMode:", err);
      // Fallback: Tenta primeira câmera disponível
      if (this.todasCameras && this.todasCameras.length > 0) {
        try {
          await this.html5QrCode.start(
            this.todasCameras[0].id,
            { fps: 15, qrbox: 250 },
            (decodedText) => this.tratarQrCodeLido(decodedText)
          );
          this.isScanning = true;
          statusBadge.textContent = "Câmera Ativa";
          statusBadge.className = "badge badge-presente";
        } catch (e2) {
          statusMsg.textContent = "Permissão de câmera necessária para ler QR Code.";
          statusBadge.textContent = "Permissão Negada";
        }
      }
    }
  },

  /**
   * Pausa ou para o scanner
   */
  async parar() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.isScanning = false;
        const statusBadge = document.getElementById("cameraStatusBadge");
        if (statusBadge) {
          statusBadge.textContent = "Pausado";
          statusBadge.className = "badge badge-inscrito";
        }
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
  },

  /**
   * Processa o texto decodificado do QR Code
   */
  async tratarQrCodeLido(codigoDecodificado) {
    const agora = Date.now();
    const codigoLimpo = (codigoDecodificado || "").trim().toUpperCase();

    // Evita leituras duplicadas repetidas do mesmo código em menos de 2.5 segundos
    if (this.ultimoCodigoLido === codigoLimpo && (agora - this.cooldownTimestamp) < 2500) {
      return;
    }

    this.ultimoCodigoLido = codigoLimpo;
    this.cooldownTimestamp = agora;

    await this.processarIdentificador(codigoLimpo);
  },

  /**
   * Processa um código ou nome de voluntário e atualiza a interface
   */
  async processarIdentificador(identificador) {
    const statusMsg = document.getElementById("scannerMessage");
    statusMsg.textContent = `Processando: ${identificador}...`;

    // 1. Tenta registrar presença
    const resultado = await API.registrarPresenca(identificador);

    const emptyState = document.getElementById("scanEmptyState");
    const detailsContainer = document.getElementById("scanDetailsContainer");
    const banner = document.getElementById("scanFeedbackBanner");
    const bannerText = document.getElementById("scanFeedbackText");
    const card = document.getElementById("scanResultCard");

    emptyState.style.display = "none";
    detailsContainer.style.display = "block";

    // Remove classes anteriores de animação
    card.classList.remove("success-flash", "warning-flash");
    void card.offsetWidth; // força reflow

    if (resultado.sucesso) {
      const vol = resultado.voluntario;

      if (resultado.jaEstavaPresente) {
        this.tocarBipeAtencao();
        banner.className = "scan-feedback-banner already";
        bannerText.textContent = `Atenção: Voluntário já credenciado anteriormente (${vol.horarioChegada}).`;
        card.classList.add("warning-flash");
      } else {
        this.tocarBipeSucesso();
        banner.className = "scan-feedback-banner success";
        bannerText.textContent = `Presença Confirmada às ${vol.horarioChegada}!`;
        card.classList.add("success-flash");
      }

      banner.style.display = "flex";

      // Preenche os dados
      document.getElementById("scanVolunteerId").textContent = vol.id;
      document.getElementById("scanVolunteerName").textContent = vol.nome;
      document.getElementById("scanVolunteerArea").textContent = vol.areaPrincipal || "A definir";
      document.getElementById("scanArrivalTime").textContent = vol.horarioChegada || "--:--";
      document.getElementById("scanExpectedTime").textContent = vol.disponibilidade && vol.disponibilidade.includes("9h30") ? "09h30" : "13h00";
      
      const almocoSim = vol.precisaAlmoco && vol.precisaAlmoco.toLowerCase().startsWith("sim");
      document.getElementById("scanLunchInfo").textContent = almocoSim 
        ? `Sim ${vol.restricaoAlimentar && vol.restricaoAlimentar !== "Não" ? `(${vol.restricaoAlimentar})` : ""}`
        : "Não necessita";

      // Adiciona ao histórico recente
      this.adicionarAoHistorico(vol, resultado.jaEstavaPresente);

      // Notifica o painel administrativo para atualizar métricas e tabela
      if (window.AdminManager) {
        window.AdminManager.atualizarInterfaceAposCheckin();
      }

      statusMsg.textContent = `Leitura concluída: ${vol.nome}`;

    } else {
      this.tocarBipeAtencao();
      banner.className = "scan-feedback-banner already";
      bannerText.textContent = resultado.erro || "Voluntário não encontrado.";
      banner.style.display = "flex";
      card.classList.add("warning-flash");
      statusMsg.textContent = "Código não reconhecido. Verifique no painel geral.";
    }

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Adiciona registro à lista de histórico recente
   */
  adicionarAoHistorico(voluntario, repetido) {
    const list = document.getElementById("recentScansList");
    if (!list) return;

    // Se houver o aviso de lista vazia, limpa
    if (list.children.length === 1 && list.children[0].textContent.includes("Nenhuma entrada")) {
      list.innerHTML = "";
    }

    const item = document.createElement("div");
    item.style.padding = "6px 8px";
    item.style.background = "var(--color-surface-subtle)";
    item.style.borderRadius = "var(--radius-sm)";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";

    const badgeTipo = repetido ? "badge-inscrito" : "badge-presente";
    const textoStatus = repetido ? "Já presente" : "Novo check-in";

    item.innerHTML = `
      <div>
        <strong>${voluntario.nome}</strong> 
        <span style="color: var(--color-text-muted); font-family: monospace;">(${voluntario.id})</span>
        <div style="font-size: 11px; color: var(--color-primary);">${voluntario.areaPrincipal}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${badgeTipo}">${textoStatus}</span>
        <div style="font-size: 11px; color: var(--color-text-muted);">${voluntario.horarioChegada || ""}</div>
      </div>
    `;

    list.insertBefore(item, list.firstChild);

    // Mantém no máximo 8 itens no histórico visual
    while (list.children.length > 8) {
      list.removeChild(list.lastChild);
    }
  }
};
