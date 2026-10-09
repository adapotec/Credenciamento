/**
 * INSTITUTO ÁDAPO - AMAZÔNIA BRINCANTE 2026
 * Lógica do Portal e da Credencial do Voluntário
 */

document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("volunteerSearchInput");
  const dropdown = document.getElementById("searchResultsDropdown");
  const loadingState = document.getElementById("loadingState");
  const searchSection = document.getElementById("searchSection");
  const credentialSection = document.getElementById("credentialSection");
  const btnChangeVolunteer = document.getElementById("btnChangeVolunteer");
  const btnDownloadBadge = document.getElementById("btnDownloadBadge");

  // Elementos do Termo de Conduta e Uso de Imagem
  const termsSection = document.getElementById("termsSection");
  const termsVolunteerName = document.getElementById("termsVolunteerName");
  const termsVolunteerId = document.getElementById("termsVolunteerId");
  const termsCheckbox = document.getElementById("termsCheckbox");
  const btnAcceptTerms = document.getElementById("btnAcceptTerms");
  const btnBackToSearch = document.getElementById("btnBackToSearch");
  const badgeTermsTimestamp = document.getElementById("badgeTermsTimestamp");
  const termsModal = document.getElementById("termsModal");
  const btnOpenTermsModal = document.getElementById("btnOpenTermsModal");
  const btnCloseTermsModal = document.getElementById("btnCloseTermsModal");
  const btnCloseTermsModalFooter = document.getElementById("btnCloseTermsModalFooter");
  const termsModalLegalContent = document.getElementById("termsModalLegalContent");
  const termsContentBox = document.getElementById("termsContentBox");

  const STORAGE_KEY_TERMOS = "adapo_termos_aceitos_v1";

  // Sincroniza o texto das cláusulas no modal de leitura
  if (termsModalLegalContent && termsContentBox) {
    const legalText = termsContentBox.querySelector(".terms-legal-text");
    if (legalText) {
      termsModalLegalContent.innerHTML = legalText.innerHTML;
    }
  }

  function obterAceiteTermo(volId) {
    if (!volId) return null;
    try {
      const todos = JSON.parse(localStorage.getItem(STORAGE_KEY_TERMOS) || "{}");
      return todos[volId] || null;
    } catch (e) {
      return null;
    }
  }

  function registrarAceiteTermo(vol) {
    if (!vol || !vol.id) return null;
    try {
      const todos = JSON.parse(localStorage.getItem(STORAGE_KEY_TERMOS) || "{}");
      const agora = new Date();
      const registro = {
        volId: vol.id,
        nome: vol.nome,
        aceitoEm: agora.toISOString(),
        dataFormatada: agora.toLocaleDateString("pt-BR") + " às " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      todos[vol.id] = registro;
      localStorage.setItem(STORAGE_KEY_TERMOS, JSON.stringify(todos));
      return registro;
    } catch (e) {
      return null;
    }
  }

  let listaVoluntarios = [];
  let listaAreas = [];
  let voluntarioAtual = null;
  let qrcodeInstance = null;

  // Carrega voluntários e áreas
  try {
    loadingState.style.display = "flex";
    const [voluntarios, areas] = await Promise.all([
      API.getVoluntarios(),
      API.getAreas()
    ]);
    listaVoluntarios = voluntarios;
    listaAreas = areas;
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  } finally {
    loadingState.style.display = "none";
  }

  // Verifica se há voluntário solicitado via parâmetro de URL (?id=ADP-1002 ou ?nome=...)
  verificarParametroUrl();

  /**
   * Trata digitação no campo de busca com debounce
   */
  let debounceTimeout = null;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    const termo = e.target.value.trim();

    if (termo.length < 2) {
      fecharDropdown();
      return;
    }

    debounceTimeout = setTimeout(() => {
      executarBusca(termo);
    }, 200);
  });

  /**
   * Executa busca com normalização de acentos
   */
  function normalizar(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function executarBusca(termo) {
    const termoNormalizado = normalizar(termo);
    const resultados = listaVoluntarios.filter(v => 
      normalizar(v.nome).includes(termoNormalizado) ||
      (v.id && normalizar(v.id).includes(termoNormalizado))
    );

    renderizarDropdown(resultados);
  }

  /**
   * Renderiza os resultados no dropdown
   */
  function renderizarDropdown(resultados) {
    dropdown.innerHTML = "";

    if (resultados.length === 0) {
      dropdown.innerHTML = `
        <div class="search-empty-state">
          Nenhum voluntário localizado com este nome.<br>
          <span style="font-size: 12px; color: var(--color-text-muted);">
            Verifique a grafia ou consulte a coordenação.
          </span>
        </div>
      `;
      dropdown.classList.add("active");
      return;
    }

    resultados.forEach(vol => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.setAttribute("role", "option");

      const statusBadgeClass = vol.status.toLowerCase() === "presente" ? "badge-presente" : "badge-inscrito";

      item.innerHTML = `
        <div>
          <div class="search-result-name">${escapeHtml(vol.nome)}</div>
          <div class="search-result-meta">
            <span style="font-family: monospace;">${escapeHtml(vol.id)}</span>
            <span>•</span>
            <span>${escapeHtml(vol.areaPrincipal || "Área a definir")}</span>
          </div>
        </div>
        <div>
          <span class="badge ${statusBadgeClass}">${escapeHtml(vol.status)}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        selecionarVoluntario(vol);
      });

      dropdown.appendChild(item);
    });

    dropdown.classList.add("active");
  }

  function fecharDropdown() {
    dropdown.innerHTML = "";
    dropdown.classList.remove("active");
  }

  // Fecha dropdown ao clicar fora
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      fecharDropdown();
    }
  });

  /**
   * Seleciona um voluntário e verifica obrigatoriedade do aceite dos termos
   */
  function selecionarVoluntario(vol) {
    voluntarioAtual = vol;
    fecharDropdown();
    searchInput.value = vol.nome;

    // Atualiza a URL sem recarregar a página para permitir compartilhamento do link
    const novaUrl = new URL(window.location.href);
    novaUrl.searchParams.set("id", vol.id);
    window.history.pushState({}, "", novaUrl);

    // Verifica se já aceitou o termo anteriormente neste dispositivo
    const aceiteExistente = obterAceiteTermo(vol.id);

    if (aceiteExistente) {
      // Já assinou: vai direto para a credencial e mostra a confirmação
      searchSection.style.display = "none";
      if (termsSection) termsSection.style.display = "none";
      renderizarCredencial(vol, aceiteExistente);
    } else {
      // NÃO assinou: bloqueio obrigatório. Exibe tela de termos antes do QR Code
      searchSection.style.display = "none";
      credentialSection.style.display = "none";
      if (termsSection) {
        termsSection.style.display = "block";
        if (termsVolunteerName) termsVolunteerName.textContent = vol.nome;
        if (termsVolunteerId) termsVolunteerId.textContent = vol.id;
        if (termsCheckbox) termsCheckbox.checked = false;
        if (btnAcceptTerms) btnAcceptTerms.disabled = true;
        if (termsContentBox) termsContentBox.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.lucide) lucide.createIcons();
    }
  }

  /**
   * Renderiza a credencial completa do voluntário (após aceite confirmado)
   */
  function renderizarCredencial(vol, registroAceite) {
    // 0. Atualização do carimbo de aceite do termo
    const aceite = registroAceite || obterAceiteTermo(vol.id);
    if (badgeTermsTimestamp) {
      if (aceite && aceite.dataFormatada) {
        badgeTermsTimestamp.textContent = `Assinado digitalmente em ${aceite.dataFormatada}`;
      } else {
        badgeTermsTimestamp.textContent = "Assinado e confirmado digitalmente";
      }
    }
    // 1. Dados básicos
    document.getElementById("badgeVolunteerId").textContent = vol.id;
    document.getElementById("badgeVolunteerName").textContent = vol.nome;

    // 2. Status
    const statusEl = document.getElementById("badgeStatusBadge");
    if (vol.status.toLowerCase() === "presente") {
      statusEl.className = "badge badge-presente";
      statusEl.textContent = vol.horarioChegada ? `Credenciado às ${vol.horarioChegada}` : "Presente / Credenciado";
    } else {
      statusEl.className = "badge badge-inscrito";
      statusEl.textContent = "Inscrito • Aguardando Check-in";
    }

    // 3. QR Code (codifica o ID único: ex. ADP-1002)
    const qrContainer = document.getElementById("qrcodeContainer");
    qrContainer.innerHTML = "";
    
    // Gerador de QR Code
    try {
      qrcodeInstance = new QRCode(qrContainer, {
        text: vol.id,
        width: 170,
        height: 170,
        colorDark: "#085437",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }

    // 4. Área Principal e Coordenador
    const areaInfo = listaAreas.find(a => normalizar(a.nome) === normalizar(vol.areaPrincipal)) || {
      nome: vol.areaPrincipal || "Área a ser designada pela coordenação",
      responsavel: "Coordenação Geral Ádapo",
      fotoUrl: "",
      descricao: "Apresente-se na recepção para direcionamento à tenda de atividades.",
      whatsapp: "",
      pontoEncontro: "Tenda Central de Recepção"
    };

    document.getElementById("badgeMainAreaTitle").textContent = areaInfo.nome;
    document.getElementById("badgeMainAreaDesc").textContent = areaInfo.descricao || "Orientações operacionais serão repassadas pela liderança no local.";

    // Áreas de Apoio (Secundárias)
    const secondaryContainer = document.getElementById("secondaryAreasContainer");
    const secondaryList = document.getElementById("badgeSecondaryAreasList");
    secondaryList.innerHTML = "";

    if (vol.areasApoio && vol.areasApoio.length > 0) {
      vol.areasApoio.forEach(areaNome => {
        const badge = document.createElement("span");
        badge.className = "badge badge-apoio";
        badge.textContent = areaNome;
        secondaryList.appendChild(badge);
      });
      secondaryContainer.style.display = "block";
    } else {
      secondaryContainer.style.display = "none";
    }

    // Coordenador de Área
    document.getElementById("coordinatorName").textContent = areaInfo.responsavel || "Coordenação Ádapo";
    document.getElementById("coordinatorPontoEncontro").textContent = areaInfo.pontoEncontro || "Liderança da Área";

    // Avatar do Coordenador (Foto com fallback limpo para Iniciais)
    const avatarEl = document.getElementById("coordinatorAvatar");
    const fotoFinal = formatarUrlImagem(areaInfo.fotoUrl);
    const iniciais = extrairIniciais(areaInfo.responsavel || "CA");

    if (fotoFinal && (fotoFinal.startsWith("http") || fotoFinal.startsWith("assets/"))) {
      avatarEl.innerHTML = `<img src="${fotoFinal}" alt="${escapeHtml(areaInfo.responsavel || '')}" onerror="this.onerror=null; this.parentElement.textContent='${iniciais}';">`;
    } else {
      avatarEl.textContent = iniciais;
    }

    // Botão de WhatsApp do Coordenador
    const whatsappBtn = document.getElementById("coordinatorWhatsappBtn");
    const telLimpo = (areaInfo.whatsapp || "").replace(/\D/g, "");
    if (telLimpo.length >= 10) {
      const textoMensagem = encodeURIComponent(
        `Olá! Sou ${vol.nome}, voluntário(a) alocado(a) na área ${areaInfo.nome} para a ação Amazônia Brincante 2026.`
      );
      whatsappBtn.href = `https://wa.me/55${telLimpo}?text=${textoMensagem}`;
      whatsappBtn.style.display = "inline-flex";
    } else {
      whatsappBtn.style.display = "none";
    }

    // 5. Logística Operacional
    const horarioEl = document.getElementById("badgeHorario");
    if (vol.disponibilidade && vol.disponibilidade.includes("9h30")) {
      horarioEl.textContent = "09h30 (Preparação da Ação)";
    } else {
      horarioEl.textContent = "13h00 (Início da Ação)";
    }

    const alimentacaoEl = document.getElementById("badgeAlimentacao");
    if (vol.precisaAlmoco && vol.precisaAlmoco.toLowerCase().startsWith("sim")) {
      let textoAlmoco = "Almoço Confirmado";
      if (vol.restricaoAlimentar && vol.restricaoAlimentar.toLowerCase() !== "não" && vol.restricaoAlimentar.toLowerCase() !== "nao") {
        textoAlmoco += ` (${vol.restricaoAlimentar})`;
      }
      alimentacaoEl.textContent = textoAlmoco;
    } else {
      alimentacaoEl.textContent = "Não necessita de almoço no local";
    }

    // 6. Transição de telas
    searchSection.style.display = "none";
    if (termsSection) termsSection.style.display = "none";
    credentialSection.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * Eventos do Termo de Conduta e Uso de Imagem
   */
  if (termsCheckbox && btnAcceptTerms) {
    // Habilita o botão somente quando a caixinha estiver marcada
    termsCheckbox.addEventListener("change", () => {
      btnAcceptTerms.disabled = !termsCheckbox.checked;
    });

    // Ao confirmar o aceite: salva o registro e libera a credencial
    btnAcceptTerms.addEventListener("click", () => {
      if (!termsCheckbox.checked || !voluntarioAtual) return;
      const registro = registrarAceiteTermo(voluntarioAtual);
      if (termsSection) termsSection.style.display = "none";
      renderizarCredencial(voluntarioAtual, registro);
    });
  }

  // Botão voltar da tela de termos para a pesquisa
  if (btnBackToSearch) {
    btnBackToSearch.addEventListener("click", () => {
      if (termsSection) termsSection.style.display = "none";
      credentialSection.style.display = "none";
      searchSection.style.display = "block";
      searchInput.value = "";
      searchInput.focus();

      const novaUrl = new URL(window.location.href);
      novaUrl.searchParams.delete("id");
      novaUrl.searchParams.delete("nome");
      window.history.pushState({}, "", novaUrl);
    });
  }

  // Modal de leitura dos termos
  function fecharModalTermo() {
    if (termsModal) termsModal.style.display = "none";
  }

  if (btnOpenTermsModal && termsModal) {
    btnOpenTermsModal.addEventListener("click", () => {
      termsModal.style.display = "flex";
      if (window.lucide) lucide.createIcons();
    });
  }
  if (btnCloseTermsModal) btnCloseTermsModal.addEventListener("click", fecharModalTermo);
  if (btnCloseTermsModalFooter) btnCloseTermsModalFooter.addEventListener("click", fecharModalTermo);
  if (termsModal) {
    termsModal.addEventListener("click", (e) => {
      if (e.target === termsModal) fecharModalTermo();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && termsModal && termsModal.style.display === "flex") {
      fecharModalTermo();
    }
  });

  /**
   * Volta para a tela de pesquisa a partir da credencial
   */
  btnChangeVolunteer.addEventListener("click", () => {
    credentialSection.style.display = "none";
    if (termsSection) termsSection.style.display = "none";
    searchSection.style.display = "block";
    searchInput.value = "";
    searchInput.focus();

    // Remove parâmetro da URL
    const novaUrl = new URL(window.location.href);
    novaUrl.searchParams.delete("id");
    novaUrl.searchParams.delete("nome");
    window.history.pushState({}, "", novaUrl);
  });

  /**
   * Baixa a credencial em imagem PNG de alta resolução
   */
  btnDownloadBadge.addEventListener("click", async () => {
    if (!voluntarioAtual) return;

    const elemento = document.getElementById("credentialBadgeToDownload");
    const actionsContainer = elemento.querySelector(".credential-actions");

    try {
      btnDownloadBadge.disabled = true;
      btnDownloadBadge.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Gerando imagem...`;

      // Oculta temporariamente os botões dentro do cartão para captura limpa
      if (actionsContainer) actionsContainer.style.display = "none";

      const canvas = await html2canvas(elemento, {
        scale: 2, // 2x para retina/alta definição
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false
      });

      if (actionsContainer) actionsContainer.style.display = "flex";

      const imagemUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const nomeArquivo = `Credencial-Adapo-${normalizar(voluntarioAtual.nome).replace(/\s+/g, "-")}.png`;
      link.download = nomeArquivo;
      link.href = imagemUrl;
      link.click();
    } catch (err) {
      console.error("Falha ao exportar imagem:", err);
      alert("Não foi possível gerar a imagem automaticamente. Você pode tirar uma captura de tela do seu cartão.");
    } finally {
      btnDownloadBadge.disabled = false;
      btnDownloadBadge.innerHTML = `<i data-lucide="download" style="width: 16px; height: 16px;"></i> Salvar Credencial como Imagem (PNG)`;
      if (window.lucide) lucide.createIcons();
    }
  });

  /**
   * Auxiliares
   */
  function verificarParametroUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("id");
    const nomeParam = urlParams.get("nome");

    if (idParam || nomeParam) {
      const termo = (idParam || nomeParam).trim();
      const voluntario = listaVoluntarios.find(v => 
        (v.id && v.id.toLowerCase() === termo.toLowerCase()) ||
        (v.nome && normalizar(v.nome) === normalizar(termo))
      );

      if (voluntario) {
        selecionarVoluntario(voluntario);
      }
    }
  }

  function formatarUrlImagem(url) {
    if (!url || typeof url !== "string") return "";
    const limpa = url.trim();
    if (!limpa) return "";

    // Suporte automático a links de compartilhamento do Google Drive (conversão para imagem direta)
    const driveMatch = limpa.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                       limpa.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
    }

    return limpa;
  }

  function extrairIniciais(nome) {
    if (!nome) return "AD";
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function escapeHtml(string) {
    if (!string) return "";
    return String(string)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
