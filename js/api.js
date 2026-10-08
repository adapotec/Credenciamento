/**
 * INSTITUTO ÁDAPO - AMAZÔNIA BRINCANTE 2026
 * Camada de API e Sincronização de Dados
 */

const API = {
  /**
   * Obtém a URL ativa do Apps Script (configuração ou localStorage)
   */
  getEndpointUrl() {
    const customUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.APPS_SCRIPT_URL_OVERRIDE);
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim();
    }
    return CONFIG.APPS_SCRIPT_URL.trim();
  },

  /**
   * Salva uma URL customizada do Apps Script
   */
  setEndpointUrl(url) {
    if (!url || url.trim().length === 0) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.APPS_SCRIPT_URL_OVERRIDE);
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEYS.APPS_SCRIPT_URL_OVERRIDE, url.trim());
    }
  },

  /**
   * Obtém a lista de voluntários (remota ou cache local)
   */
  async getVoluntarios() {
    const endpoint = this.getEndpointUrl();

    // Se houver endpoint configurado, tenta buscar remotamente
    if (endpoint) {
      try {
        const response = await fetch(`${endpoint}?action=voluntarios`, {
          method: 'GET',
          cache: 'no-cache'
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.sucesso && Array.isArray(data.voluntarios)) {
            // Atualiza cache local
            this.salvarCacheVoluntarios(data.voluntarios);
            return data.voluntarios;
          }
        }
      } catch (err) {
        console.warn("Falha na sincronização remota, utilizando cache local:", err);
      }
    }

    // Fallback: Cache local ou dados iniciais da planilha
    return this.obterCacheVoluntarios();
  },

  /**
   * Obtém um voluntário específico por ID ou Nome
   */
  async getVoluntario(identificador) {
    if (!identificador) return null;
    const lista = await this.getVoluntarios();
    const termo = String(identificador).trim().toLowerCase();
    
    return lista.find(v => 
      v.id.toLowerCase() === termo || 
      v.nome.toLowerCase() === termo
    ) || null;
  },

  /**
   * Obtém a lista de áreas e seus respectivos coordenadores
   */
  async getAreas() {
    const endpoint = this.getEndpointUrl();

    const normalizarUrl = (url) => {
      if (!url || typeof url !== "string") return "";
      const limpa = url.trim();
      const driveMatch = limpa.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || limpa.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w400`;
      }
      return limpa;
    };

    if (endpoint) {
      try {
        const response = await fetch(`${endpoint}?action=areas`, {
          method: 'GET',
          cache: 'no-cache'
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.sucesso && Array.isArray(data.areas) && data.areas.length > 0) {
            const areasTratadas = data.areas.map(a => ({
              ...a,
              fotoUrl: normalizarUrl(a.fotoUrl)
            }));
            localStorage.setItem(CONFIG.STORAGE_KEYS.AREAS, JSON.stringify(areasTratadas));
            return areasTratadas;
          }
        }
      } catch (err) {
        console.warn("Falha ao carregar áreas remotas, usando locais:", err);
      }
    }

    const cachedAreas = localStorage.getItem(CONFIG.STORAGE_KEYS.AREAS);
    if (cachedAreas) {
      try {
        const parsed = JSON.parse(cachedAreas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(a => ({
            ...a,
            fotoUrl: normalizarUrl(a.fotoUrl)
          }));
        }
      } catch (e) {}
    }

    return CONFIG.AREAS_PADRAO.map(a => ({
      ...a,
      fotoUrl: normalizarUrl(a.fotoUrl)
    }));
  },

  /**
   * Registra a presença de um voluntário (pelo QR Code ou ID)
   */
  async registrarPresenca(idVoluntario) {
    if (!idVoluntario) {
      return { sucesso: false, erro: "Código de identificação não fornecido." };
    }

    const idLimpo = String(idVoluntario).trim().toUpperCase();
    const endpoint = this.getEndpointUrl();

    // 1. Atualização imediata no estado local (latência zero para a recepção)
    const lista = this.obterCacheVoluntarios();
    const voluntario = lista.find(v => v.id.toUpperCase() === idLimpo);

    if (!voluntario) {
      return { sucesso: false, erro: `Voluntário com código ${idLimpo} não encontrado.` };
    }

    const jaPresente = voluntario.status.toLowerCase() === "presente";
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!jaPresente) {
      voluntario.status = "Presente";
      voluntario.horarioChegada = horaFormatada;
      this.salvarCacheVoluntarios(lista);
    }

    // 2. Disparo assíncrono para a planilha Google Sheets
    if (endpoint) {
      try {
        // Envio via GET simples para evitar restrições de CORS no Google Apps Script
        fetch(`${endpoint}?action=presenca&id=${encodeURIComponent(idLimpo)}`, {
          method: 'GET',
          mode: 'no-cors'
        }).catch(err => console.error("Erro no envio para planilha:", err));
      } catch (e) {
        console.error("Falha ao notificar planilha:", e);
      }
    }

    return {
      sucesso: true,
      jaEstavaPresente: jaPresente,
      voluntario: voluntario,
      mensagem: jaPresente 
        ? `Voluntário ${voluntario.nome} já estava credenciado às ${voluntario.horarioChegada}.` 
        : `Presença confirmada para ${voluntario.nome} às ${horaFormatada}.`
    };
  },

  /**
   * Atualiza a área principal de um voluntário
   */
  async atualizarAreaPrincipal(idVoluntario, novaArea) {
    const idLimpo = String(idVoluntario).trim().toUpperCase();
    const lista = this.obterCacheVoluntarios();
    const voluntario = lista.find(v => v.id.toUpperCase() === idLimpo);

    if (!voluntario) {
      return { sucesso: false, erro: "Voluntário não encontrado." };
    }

    voluntario.areaPrincipal = novaArea;
    if (voluntario.todasAreas) {
      voluntario.areasApoio = voluntario.todasAreas.filter(a => a !== novaArea);
    }
    this.salvarCacheVoluntarios(lista);

    const endpoint = this.getEndpointUrl();
    if (endpoint) {
      try {
        fetch(`${endpoint}?action=area-principal&id=${encodeURIComponent(idLimpo)}&areaPrincipal=${encodeURIComponent(novaArea)}`, {
          method: 'GET',
          mode: 'no-cors'
        }).catch(err => console.error("Erro ao atualizar área na planilha:", err));
      } catch (e) {}
    }

    return { sucesso: true, voluntario: voluntario };
  },

  /**
   * Funções auxiliares de cache local
   */
  obterCacheVoluntarios() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.VOLUNTARIOS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    // Inicializa cache com dados da planilha do Instituto
    this.salvarCacheVoluntarios(CONFIG.VOLUNTARIOS_INICIAIS);
    return CONFIG.VOLUNTARIOS_INICIAIS;
  },

  salvarCacheVoluntarios(lista) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.VOLUNTARIOS, JSON.stringify(lista));
      localStorage.setItem(CONFIG.STORAGE_KEYS.ULTIMA_ATUALIZACAO, new Date().toISOString());
    } catch (e) {
      console.error("Erro ao salvar cache:", e);
    }
  }
};
