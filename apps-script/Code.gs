/**
 * INSTITUTO ÁDAPO - CREDENCIAMENTO AMAZÔNIA BRINCANTE 2026
 * API Google Apps Script para Gestão e Credenciamento de Voluntários
 * 
 * Endpoints suportados via GET e POST:
 * - GET ?action=voluntarios       -> Retorna lista completa de voluntários
 * - GET ?action=voluntario&id=X   -> Retorna dados de um voluntário pelo ID ou Nome
 * - GET ?action=areas             -> Retorna áreas, coordenadores, fotos e contatos
 * - GET ?action=stats             -> Métricas em tempo real (total, presentes, faltantes, por área)
 * - GET ?action=setup             -> Inicializa colunas e cria a aba 'Áreas' automaticamente
 * - POST action=presenca          -> Registra presença com carimbo de data/hora
 * - POST action=area-principal    -> Define/atualiza a área principal de atuação
 */

const NOME_ABA_RESPOSTAS = "Respostas ao formulário 1";
const NOME_ABA_AREAS = "Áreas";

// Configuração das colunas extras na aba de respostas
const COL_STATUS = "Status";
const COL_AREA_PRINCIPAL = "Área Principal";
const COL_HORARIO_CHEGADA = "Horário Chegada";
const COL_ID_UNICO = "ID Único";

/**
 * Trata requisições HTTP GET
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || "voluntarios";

    let resultado;

    switch (action) {
      case "setup":
        resultado = executarSetupInicial();
        break;
      case "voluntarios":
        resultado = obterTodosVoluntarios();
        break;
      case "voluntario":
        resultado = obterVoluntarioPorId(params.id || params.nome);
        break;
      case "areas":
        resultado = obterTodasAreas();
        break;
      case "stats":
        resultado = obterEstatisticas();
        break;
      case "presenca":
        // Suporte a chamada rápida via GET se necessário
        resultado = registrarPresenca(params.id);
        break;
      default:
        resultado = { sucesso: false, erro: "Ação não reconhecida: " + action };
    }

    return responderJson(resultado);
  } catch (erro) {
    return responderJson({ sucesso: false, erro: erro.toString() });
  }
}

/**
 * Trata requisições HTTP POST
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    let resultado;

    switch (action) {
      case "presenca":
        resultado = registrarPresenca(payload.id);
        break;
      case "area-principal":
        resultado = atualizarAreaPrincipal(payload.id, payload.areaPrincipal);
        break;
      default:
        resultado = { sucesso: false, erro: "Ação POST desconhecida: " + action };
    }

    return responderJson(resultado);
  } catch (erro) {
    return responderJson({ sucesso: false, erro: erro.toString() });
  }
}

/**
 * Retorna saída formatada em JSON com cabeçalhos adequados
 */
function responderJson(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Obtém a planilha ativa
 */
function obterPlanilha() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Obtém a aba de respostas do formulário
 */
function obterAbaRespostas() {
  const ss = obterPlanilha();
  let aba = ss.getSheetByName(NOME_ABA_RESPOSTAS);
  if (!aba) {
    aba = ss.getSheets()[0]; // Se o nome for diferente, usa a primeira aba
  }
  return aba;
}

/**
 * Obtém ou cria a aba 'Áreas'
 */
function obterAbaAreas() {
  const ss = obterPlanilha();
  let aba = ss.getSheetByName(NOME_ABA_AREAS);
  if (!aba) {
    aba = ss.insertSheet(NOME_ABA_AREAS);
    // Configura cabeçalhos padrão da aba Áreas
    aba.appendRow(["Área", "Responsável", "Foto URL", "Descrição", "WhatsApp Responsável"]);
    aba.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#085437").setFontColor("#FFFFFF");
  }
  return aba;
}

/**
 * Garante que as colunas extras necessárias existam na aba de respostas
 */
function assegurarColunasExtras(aba) {
  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const colunasNecessarias = [COL_STATUS, COL_AREA_PRINCIPAL, COL_HORARIO_CHEGADA, COL_ID_UNICO];
  
  colunasNecessarias.forEach(colNome => {
    if (cabecalhos.indexOf(colNome) === -1) {
      const novaCol = aba.getLastColumn() + 1;
      aba.getRange(1, novaCol).setValue(colNome).setFontWeight("bold").setBackground("#E2E8F0");
    }
  });
}

/**
 * Configuração automática inicial da planilha
 */
function executarSetupInicial() {
  const abaRespostas = obterAbaRespostas();
  assegurarColunasExtras(abaRespostas);

  // Gera ID único para linhas que ainda não possuem
  const cabecalhos = abaRespostas.getRange(1, 1, 1, abaRespostas.getLastColumn()).getValues()[0];
  const idxId = cabecalhos.indexOf(COL_ID_UNICO) + 1;
  const idxStatus = cabecalhos.indexOf(COL_STATUS) + 1;
  const idxNome = cabecalhos.indexOf("Nome completo") + 1;

  const totalLinhas = abaRespostas.getLastRow();
  let idsGerados = 0;

  if (totalLinhas > 1) {
    const dados = abaRespostas.getRange(2, 1, totalLinhas - 1, abaRespostas.getLastColumn()).getValues();

    dados.forEach((linha, i) => {
      const linhaIndex = i + 2;
      const idAtual = linha[idxId - 1];
      const statusAtual = linha[idxStatus - 1];

      if (!idAtual || String(idAtual).trim() === "") {
        const novoId = "ADP-" + (1000 + linhaIndex);
        abaRespostas.getRange(linhaIndex, idxId).setValue(novoId);
        idsGerados++;
      }

      if (!statusAtual || String(statusAtual).trim() === "") {
        abaRespostas.getRange(linhaIndex, idxStatus).setValue("Inscrito");
      }
    });
  }

  // Preenche áreas padrão se a aba Áreas estiver vazia
  const abaAreas = obterAbaAreas();
  if (abaAreas.getLastRow() <= 1) {
    const areasIniciais = [
      ["Mini mundinho - Recreação com crianças menores de seis anos", "Coordenação Mini Mundinho", "", "Recreação e acolhimento especializado para crianças de 0 a 6 anos.", ""],
      ["Monitor de Recreações", "Coordenação Recreação Geral", "", "Condução de brincadeiras dinâmicas, gincanas e oficinas para crianças maiores.", ""],
      ["Organização de Filas", "Coordenação de Fluxo", "", "Orientação do fluxo de crianças e famílias nos brinquedos e atividades.", ""],
      ["Apoio e Limpeza", "Coordenação Operacional", "", "Suporte contínuo à estrutura, reposição de materiais e manutenção do espaço limpo.", ""],
      ["Decoração", "Coordenação Visual", "", "Montagem e ambientação dos espaços temáticos da Amazônia Brincante.", ""],
      ["Pintura facial", "Coordenação Artística", "", "Aplicação de pinturas temáticas nas crianças.", ""]
    ];
    areasIniciais.forEach(area => abaAreas.appendRow(area));
  }

  return {
    sucesso: true,
    mensagem: "Configuração concluída com sucesso.",
    idsGerados: idsGerados,
    totalLinhas: totalLinhas - 1
  };
}

/**
 * Gatilho automático executado quando uma nova resposta entra pelo Google Forms
 * (Garante ID e Status imediatos para os novos inscritos)
 */
function onFormSubmit(e) {
  try {
    const aba = obterAbaRespostas();
    assegurarColunasExtras(aba);
    const ultimaLinha = aba.getLastRow();
    
    if (ultimaLinha > 1) {
      const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
      const idxId = cabecalhos.indexOf(COL_ID_UNICO) + 1;
      const idxStatus = cabecalhos.indexOf(COL_STATUS) + 1;
      const idxAreaPrincipal = cabecalhos.indexOf(COL_AREA_PRINCIPAL) + 1;
      const idxAreas = cabecalhos.findIndex(c => c.toLowerCase().includes("áreas abaixo") || c.toLowerCase().includes("habilidades")) + 1;

      if (idxId > 0 && !aba.getRange(ultimaLinha, idxId).getValue()) {
        aba.getRange(ultimaLinha, idxId).setValue("ADP-" + (1000 + ultimaLinha));
      }
      if (idxStatus > 0 && !aba.getRange(ultimaLinha, idxStatus).getValue()) {
        aba.getRange(ultimaLinha, idxStatus).setValue("Inscrito");
      }
      if (idxAreaPrincipal > 0 && !aba.getRange(ultimaLinha, idxAreaPrincipal).getValue() && idxAreas > 0) {
        const raw = String(aba.getRange(ultimaLinha, idxAreas).getValue() || "");
        const primeira = raw.split(",")[0].trim();
        if (primeira) {
          aba.getRange(ultimaLinha, idxAreaPrincipal).setValue(primeira);
        }
      }
    }
  } catch (err) {
    console.error("Erro no processamento da nova resposta:", err);
  }
}

/**
 * Retorna a lista de todos os voluntários com campos mapeados
 */
function obterTodosVoluntarios() {
  const aba = obterAbaRespostas();
  assegurarColunasExtras(aba);
  const totalLinhas = aba.getLastRow();
  const totalColunas = aba.getLastColumn();

  if (totalLinhas <= 1) {
    return { sucesso: true, voluntarios: [] };
  }

  const cabecalhos = aba.getRange(1, 1, 1, totalColunas).getValues()[0];
  const dados = aba.getRange(2, 1, totalLinhas - 1, totalColunas).getValues();

  // Mapeamento de índices das colunas
  const idx = {
    carimbo: cabecalhos.indexOf("Carimbo de data/hora"),
    nome: cabecalhos.findIndex(c => c.toLowerCase().includes("nome completo")),
    whatsapp: cabecalhos.findIndex(c => c.toLowerCase().includes("whatsapp")),
    email: cabecalhos.findIndex(c => c.toLowerCase().includes("e-mail") || c.toLowerCase().includes("email")),
    areas: cabecalhos.findIndex(c => c.toLowerCase().includes("áreas abaixo") || c.toLowerCase().includes("habilidades")),
    horario: cabecalhos.findIndex(c => c.toLowerCase().includes("9h30")),
    almoco: cabecalhos.findIndex(c => c.toLowerCase().includes("almoço")),
    restricao: cabecalhos.findIndex(c => c.toLowerCase().includes("restrição alimentar")),
    status: cabecalhos.indexOf(COL_STATUS),
    areaPrincipal: cabecalhos.indexOf(COL_AREA_PRINCIPAL),
    horarioChegada: cabecalhos.indexOf(COL_HORARIO_CHEGADA),
    id: cabecalhos.indexOf(COL_ID_UNICO)
  };

  const voluntarios = dados.map((linha, i) => {
    const linhaNumero = i + 2;
    let id = idx.id !== -1 ? String(linha[idx.id] || "").trim() : "";
    if (!id) {
      id = "ADP-" + (1000 + linhaNumero);
      // Salva na planilha para persistir nas novas respostas
      if (idx.id !== -1) {
        aba.getRange(linhaNumero, idx.id + 1).setValue(id);
      }
    }

    let status = idx.status !== -1 && linha[idx.status] ? String(linha[idx.status]).trim() : "";
    if (!status) {
      status = "Inscrito";
      if (idx.status !== -1) {
        aba.getRange(linhaNumero, idx.status + 1).setValue("Inscrito");
      }
    }

    const areasSelecionadasRaw = idx.areas !== -1 ? String(linha[idx.areas] || "") : "";
    const listaAreas = areasSelecionadasRaw
      ? areasSelecionadasRaw.split(",").map(a => a.trim()).filter(a => a.length > 0)
      : [];

    let areaPrincipal = idx.areaPrincipal !== -1 ? String(linha[idx.areaPrincipal] || "").trim() : "";
    if (!areaPrincipal && listaAreas.length > 0) {
      areaPrincipal = listaAreas[0]; // Primeira área como padrão caso não definida
    }

    const areasApoio = listaAreas.filter(a => a !== areaPrincipal);

    let horarioChegadaDisplay = "";
    if (idx.horarioChegada !== -1 && linha[idx.horarioChegada]) {
      const valorHora = linha[idx.horarioChegada];
      if (valorHora instanceof Date) {
        horarioChegadaDisplay = Utilities.formatDate(valorHora, "GMT-3", "HH:mm:ss");
      } else {
        horarioChegadaDisplay = String(valorHora);
      }
    }

    return {
      id: id,
      linha: linhaNumero,
      nome: idx.nome !== -1 ? String(linha[idx.nome] || "").trim() : "",
      whatsapp: idx.whatsapp !== -1 ? String(linha[idx.whatsapp] || "").trim() : "",
      email: idx.email !== -1 ? String(linha[idx.email] || "").trim() : "",
      areaPrincipal: areaPrincipal,
      areasApoio: areasApoio,
      todasAreas: listaAreas,
      disponibilidade: idx.horario !== -1 ? String(linha[idx.horario] || "").trim() : "",
      precisaAlmoco: idx.almoco !== -1 ? String(linha[idx.almoco] || "").trim() : "",
      restricaoAlimentar: idx.restricao !== -1 ? String(linha[idx.restricao] || "").trim() : "",
      status: idx.status !== -1 && linha[idx.status] ? String(linha[idx.status]).trim() : "Inscrito",
      horarioChegada: horarioChegadaDisplay
    };
  }).filter(v => v.nome.length > 0);

  return {
    sucesso: true,
    total: voluntarios.length,
    voluntarios: voluntarios
  };
}

/**
 * Busca voluntário individual por ID ou nome
 */
function obterVoluntarioPorId(termoBusca) {
  if (!termoBusca) {
    return { sucesso: false, erro: "Identificador não informado." };
  }

  const todos = obterTodosVoluntarios();
  if (!todos.sucesso) return todos;

  const termoLimpo = String(termoBusca).trim().toLowerCase();

  const voluntario = todos.voluntarios.find(v => 
    v.id.toLowerCase() === termoLimpo || 
    v.nome.toLowerCase() === termoLimpo
  );

  if (!voluntario) {
    return { sucesso: false, erro: "Voluntário não encontrado." };
  }

  return { sucesso: true, voluntario: voluntario };
}

/**
 * Retorna as áreas cadastradas na aba Áreas
 */
function obterTodasAreas() {
  const aba = obterAbaAreas();
  const totalLinhas = aba.getLastRow();

  if (totalLinhas <= 1) {
    return { sucesso: true, areas: [] };
  }

  const dados = aba.getRange(2, 1, totalLinhas - 1, 5).getValues();

  const areas = dados.map(linha => {
    let fotoUrl = String(linha[2] || "").trim();
    // Converte automaticamente links do Google Drive para imagem direta
    const driveMatch = fotoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || fotoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      fotoUrl = "https://lh3.googleusercontent.com/d/" + driveMatch[1] + "=w400";
    }

    return {
      nome: String(linha[0] || "").trim(),
      responsavel: String(linha[1] || "").trim(),
      fotoUrl: fotoUrl,
      descricao: String(linha[3] || "").trim(),
      whatsapp: String(linha[4] || "").trim()
    };
  }).filter(a => a.nome.length > 0);

  return {
    sucesso: true,
    total: areas.length,
    areas: areas
  };
}

/**
 * Registra presença de um voluntário
 */
function registrarPresenca(idVoluntario) {
  if (!idVoluntario) {
    return { sucesso: false, erro: "ID do voluntário não fornecido." };
  }

  const aba = obterAbaRespostas();
  assegurarColunasExtras(aba);

  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const idxId = cabecalhos.indexOf(COL_ID_UNICO) + 1;
  const idxStatus = cabecalhos.indexOf(COL_STATUS) + 1;
  const idxChegada = cabecalhos.indexOf(COL_HORARIO_CHEGADA) + 1;
  const idxNome = cabecalhos.findIndex(c => c.toLowerCase().includes("nome completo")) + 1;
  const idxAreaPrincipal = cabecalhos.indexOf(COL_AREA_PRINCIPAL) + 1;

  const totalLinhas = aba.getLastRow();
  if (totalLinhas <= 1) {
    return { sucesso: false, erro: "Planilha sem registros." };
  }

  const idProcurado = String(idVoluntario).trim().toUpperCase();
  const dadosIds = aba.getRange(2, idxId, totalLinhas - 1, 1).getValues();

  let linhaEncontrada = -1;
  for (let i = 0; i < dadosIds.length; i++) {
    if (String(dadosIds[i][0]).trim().toUpperCase() === idProcurado) {
      linhaEncontrada = i + 2;
      break;
    }
  }

  // Se não achou pelo ID exato, tenta achar pelo ID ADP-XXXX
  if (linhaEncontrada === -1) {
    for (let i = 0; i < totalLinhas - 1; i++) {
      const linhaIndex = i + 2;
      const idCalculado = "ADP-" + (1000 + linhaIndex);
      if (idCalculado === idProcurado) {
        linhaEncontrada = linhaIndex;
        break;
      }
    }
  }

  if (linhaEncontrada === -1) {
    return { sucesso: false, erro: "Voluntário com código " + idVoluntario + " não encontrado." };
  }

  // Verifica status atual
  const statusAtual = aba.getRange(linhaEncontrada, idxStatus).getValue();
  const jaCredenciado = String(statusAtual).toLowerCase() === "presente";

  const agora = new Date();
  const horarioFormatado = Utilities.formatDate(agora, "GMT-3", "HH:mm:ss");

  if (!jaCredenciado) {
    aba.getRange(linhaEncontrada, idxStatus).setValue("Presente");
    aba.getRange(linhaEncontrada, idxChegada).setValue(horarioFormatado);
  }

  const nome = aba.getRange(linhaEncontrada, idxNome).getValue();
  const areaPrincipal = idxAreaPrincipal > 0 ? aba.getRange(linhaEncontrada, idxAreaPrincipal).getValue() : "";

  return {
    sucesso: true,
    jaEstavaPresente: jaCredenciado,
    mensagem: jaCredenciado ? "Voluntário já credenciado anteriormente." : "Presença registrada com sucesso.",
    voluntario: {
      id: idProcurado,
      nome: nome,
      areaPrincipal: areaPrincipal,
      horarioChegada: jaCredenciado ? aba.getRange(linhaEncontrada, idxChegada).getValue() : horarioFormatado
    }
  };
}

/**
 * Atualiza a área principal de um voluntário
 */
function atualizarAreaPrincipal(idVoluntario, novaAreaPrincipal) {
  if (!idVoluntario || !novaAreaPrincipal) {
    return { sucesso: false, erro: "Dados insuficientes." };
  }

  const aba = obterAbaRespostas();
  assegurarColunasExtras(aba);

  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const idxId = cabecalhos.indexOf(COL_ID_UNICO) + 1;
  const idxAreaPrincipal = cabecalhos.indexOf(COL_AREA_PRINCIPAL) + 1;

  const totalLinhas = aba.getLastRow();
  const idProcurado = String(idVoluntario).trim().toUpperCase();
  const dadosIds = aba.getRange(2, idxId, totalLinhas - 1, 1).getValues();

  let linhaEncontrada = -1;
  for (let i = 0; i < dadosIds.length; i++) {
    if (String(dadosIds[i][0]).trim().toUpperCase() === idProcurado) {
      linhaEncontrada = i + 2;
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return { sucesso: false, erro: "Voluntário não encontrado." };
  }

  aba.getRange(linhaEncontrada, idxAreaPrincipal).setValue(novaAreaPrincipal);

  return {
    sucesso: true,
    mensagem: "Área principal atualizada para: " + novaAreaPrincipal
  };
}

/**
 * Retorna estatísticas gerais para o dashboard do Admin
 */
function obterEstatisticas() {
  const dadosVol = obterTodosVoluntarios();
  if (!dadosVol.sucesso) return dadosVol;

  const voluntarios = dadosVol.voluntarios;
  const total = voluntarios.length;
  const presentes = voluntarios.filter(v => v.status.toLowerCase() === "presente").length;
  const faltantes = total - presentes;
  const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;

  // Contagem por área
  const contagemPorArea = {};
  voluntarios.forEach(v => {
    const area = v.areaPrincipal || "Não definida";
    if (!contagemPorArea[area]) {
      contagemPorArea[area] = { total: 0, presentes: 0, faltantes: 0 };
    }
    contagemPorArea[area].total++;
    if (v.status.toLowerCase() === "presente") {
      contagemPorArea[area].presentes++;
    } else {
      contagemPorArea[area].faltantes++;
    }
  });

  return {
    sucesso: true,
    estatisticas: {
      total: total,
      presentes: presentes,
      faltantes: faltantes,
      percentualCredenciado: percentual,
      porArea: contagemPorArea
    }
  };
}
