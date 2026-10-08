/**
 * INSTITUTO ÁDAPO - AMAZÔNIA BRINCANTE 2026
 * Configuração central da aplicação
 */

const CONFIG = {
  // Insira aqui a URL do Web App gerada após implantar o Google Apps Script
  // Exemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxDQAbIhYfOSB6wejSBZu9REPGYI16YOiEMxE0EOYCZ3gjC6glTsmPf-G9ZgCy3P24/exec",

  EVENTO: {
    NOME: "Amazônia Brincante 2026",
    SUBTITULO: "Ação de Dia das Crianças - Instituto Ádapo",
    DATA: "11 de Outubro de 2026",
    LOCAL: "Novo Angelim - São Luís/MA",
    ORGANIZACAO: "Instituto Ádapo"
  },

  STORAGE_KEYS: {
    VOLUNTARIOS: "adapo_voluntarios_cache",
    AREAS: "adapo_areas_cache",
    ULTIMA_ATUALIZACAO: "adapo_ultima_atualizacao",
    APPS_SCRIPT_URL_OVERRIDE: "adapo_script_url_custom"
  },

  // Áreas padrão cadastradas no sistema
  AREAS_PADRAO: [
    {
      nome: "Mini mundinho - Recreação com crianças menores de seis anos",
      responsavel: "Coordenação Mini Mundinho",
      fotoUrl: "",
      descricao: "Acolhimento afetuoso, brinquedoteca e dinâmicas sensoriais dedicadas à primeira infância (0 a 6 anos).",
      whatsapp: "98988000001",
      pontoEncontro: "Tenda 1 - Espaço Primeira Infância"
    },
    {
      nome: "Monitor de Recreações",
      responsavel: "Coordenação Recreação Geral",
      fotoUrl: "",
      descricao: "Condução de circuitos recreativos, gincanas coletivas e atividades ao ar livre para crianças de 7 a 12 anos.",
      whatsapp: "98988000002",
      pontoEncontro: "Tenda 2 - Pátio Central de Brincadeiras"
    },
    {
      nome: "Organização de Filas",
      responsavel: "Coordenação de Fluxo e Segurança",
      fotoUrl: "",
      descricao: "Triagem, acolhimento das famílias, conferência de pulseiras e organização ordenada das filas nos brinquedos e refeições.",
      whatsapp: "98988000003",
      pontoEncontro: "Tenda 3 - Entrada e Circulação"
    },
    {
      nome: "Apoio e Limpeza",
      responsavel: "Coordenação de Logística e Zeladoria",
      fotoUrl: "",
      descricao: "Suporte operacional imediato, reposição de insumos, água, coleta seletiva e manutenção da salubridade dos espaços.",
      whatsapp: "98988000004",
      pontoEncontro: "Tenda 4 - Base de Apoio Operacional"
    },
    {
      nome: "Decoração",
      responsavel: "Coordenação Visual e Ambientação",
      fotoUrl: "",
      descricao: "Montagem, sustentação cênica e ambientação temática da Amazônia Brincante por todo o território da ação.",
      whatsapp: "98988000005",
      pontoEncontro: "Tenda 5 - Galpão de Arte"
    },
    {
      nome: "Pintura facial",
      responsavel: "Coordenação Artística",
      fotoUrl: "",
      descricao: "Pintura artística temática e segura nas crianças com tintas hipoalergênicas.",
      whatsapp: "98988000006",
      pontoEncontro: "Tenda 6 - Espaço Arte e Pintura"
    }
  ],

  // Dados iniciais sincronizados com a planilha oficial do Instituto Ádapo
  VOLUNTARIOS_INICIAIS: [
    {
      id: "ADP-1002",
      nome: "Angelina Helena Martins Tavares",
      whatsapp: "98970128820",
      email: "martinstavaresangelinahelena7@gmail.com",
      areaPrincipal: "Mini mundinho - Recreação com crianças menores de seis anos",
      areasApoio: [],
      todasAreas: ["Mini mundinho - Recreação com crianças menores de seis anos"],
      disponibilidade: "Sim, posso participar desde as 9h30.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Eu vou levar meu almoço",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1003",
      nome: "Ana Carolina dos Santos Silva",
      whatsapp: "98988007862",
      email: "carolinasantos270205@gmail.com",
      areaPrincipal: "Monitor de Recreações",
      areasApoio: ["Mini mundinho - Recreação com crianças menores de seis anos"],
      todasAreas: ["Monitor de Recreações", "Mini mundinho - Recreação com crianças menores de seis anos"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1004",
      nome: "Bárbara Guimarães Guedêlha",
      whatsapp: "98992448055",
      email: "barbguedelha@gmail.com",
      areaPrincipal: "Monitor de Recreações",
      areasApoio: ["Mini mundinho - Recreação com crianças menores de seis anos"],
      todasAreas: ["Monitor de Recreações", "Mini mundinho - Recreação com crianças menores de seis anos"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1005",
      nome: "Cleydson Renato Fonseca Franco Sá",
      whatsapp: "98970016824",
      email: "cleydson.vet@gmail.com",
      areaPrincipal: "Monitor de Recreações",
      areasApoio: ["Apoio e Limpeza"],
      todasAreas: ["Monitor de Recreações", "Apoio e Limpeza"],
      disponibilidade: "Sim, posso participar desde as 9h30.",
      precisaAlmoco: "Sim",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1006",
      nome: "Elinete da cruz melo",
      whatsapp: "98989185816",
      email: "elinetemello97@gmail.com",
      areaPrincipal: "Mini mundinho - Recreação com crianças menores de seis anos",
      areasApoio: [],
      todasAreas: ["Mini mundinho - Recreação com crianças menores de seis anos"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1007",
      nome: "Jéssica Natália Anjos Silva",
      whatsapp: "98991301563",
      email: "jessnat002@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: ["Apoio e Limpeza"],
      todasAreas: ["Organização de Filas", "Apoio e Limpeza"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1008",
      nome: "Victória Costa Rocha Tugeiro",
      whatsapp: "98985175291",
      email: "victoriatugeiro1@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: ["Apoio e Limpeza"],
      todasAreas: ["Organização de Filas", "Apoio e Limpeza"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1009",
      nome: "Giovane Chagas Brito Filho",
      whatsapp: "98988058827",
      email: "giovanebfilho@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: ["Monitor de Recreações", "Apoio e Limpeza", "Decoração"],
      todasAreas: ["Organização de Filas", "Monitor de Recreações", "Apoio e Limpeza", "Decoração"],
      disponibilidade: "Sim, posso participar desde as 9h30.",
      precisaAlmoco: "Sim",
      restricaoAlimentar: "Peixes",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1010",
      nome: "Giovana Lima Garcia",
      whatsapp: "98970265284",
      email: "ggiovana917@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: ["Monitor de Recreações", "Apoio e Limpeza", "Decoração", "Mini mundinho - Recreação com crianças menores de seis anos"],
      todasAreas: ["Organização de Filas", "Monitor de Recreações", "Apoio e Limpeza", "Decoração", "Mini mundinho - Recreação com crianças menores de seis anos"],
      disponibilidade: "Sim, posso participar desde as 9h30.",
      precisaAlmoco: "Sim",
      restricaoAlimentar: "Intolerância à lactose",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1011",
      nome: "Elisete da cruz melo",
      whatsapp: "9882033310",
      email: "elisetecruzmelo@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: [],
      todasAreas: ["Organização de Filas"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1012",
      nome: "Maria Clara Araujo Alexandre",
      whatsapp: "21970940541",
      email: "mcla.ale@gmail.com",
      areaPrincipal: "Pintura facial",
      areasApoio: ["Monitor de Recreações", "Mini mundinho - Recreação com crianças menores de seis anos"],
      todasAreas: ["Monitor de Recreações", "Mini mundinho - Recreação com crianças menores de seis anos", "Pintura facial"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1013",
      nome: "Cíntia Lúcia Carvalho de Sousa",
      whatsapp: "98981435049",
      email: "cintialcsousa@gmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: [],
      todasAreas: ["Organização de Filas"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1014",
      nome: "Juliana Gama Maia",
      whatsapp: "61995214659",
      email: "julianagama020@gmail.com",
      areaPrincipal: "Decoração",
      areasApoio: ["Monitor de Recreações", "Apoio e Limpeza"],
      todasAreas: ["Monitor de Recreações", "Apoio e Limpeza", "Decoração"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1015",
      nome: "Matheus Gabryel De Santana Maciel",
      whatsapp: "98985698151",
      email: "matheusgabryel@hotmail.com",
      areaPrincipal: "Organização de Filas",
      areasApoio: ["Monitor de Recreações", "Apoio e Limpeza"],
      todasAreas: ["Organização de Filas", "Monitor de Recreações", "Apoio e Limpeza"],
      disponibilidade: "Sim, posso participar desde as 9h30.",
      precisaAlmoco: "Sim",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    },
    {
      id: "ADP-1016",
      nome: "Ana Karolina De Lima Lisboa",
      whatsapp: "98988316902",
      email: "anakarolina.akll61@gmail.com",
      areaPrincipal: "Decoração",
      areasApoio: ["Organização de Filas", "Monitor de Recreações", "Apoio e Limpeza"],
      todasAreas: ["Organização de Filas", "Monitor de Recreações", "Apoio e Limpeza", "Decoração"],
      disponibilidade: "Não, participarei apenas a partir das 13h.",
      precisaAlmoco: "Não",
      restricaoAlimentar: "Não",
      status: "Inscrito",
      horarioChegada: ""
    }
  ]
};
