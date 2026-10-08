# Design System & Padrões de Interface — Sistema Elo
### Identidade Visual, Arquitetura de Páginas, Geometria Soft Bento e Diretrizes de UI/UX

**Versão:** 2.0 (Padronização Completa entre `/projetos`, `/pedagogia` e Módulos do Sistema)  
**Organização:** Instituto Ádapo  
**Referências:** Paleta institucional oficial (`CORES.png`) + Princípios `frontend-design` & `ui-ux-pro-max` + Leis de Miller, Hick e Fitts.

---

## 1. Filosofia de Design & Diretrizes Centrais

O Elo é um sistema de gestão **institucional, acolhedor, transparente e humanizado** voltado para a transformação social de crianças, adolescentes e suas famílias. Toda e qualquer página desenvolvida no ERP deve seguir rigorosamente os princípios abaixo:

### Princípios Fundamentais de UX/UI:
1. **Restrição é Luxo & Clareza**: Eliminar elementos visuais supérfluos, ruídos decorativos e **100% de emojis em controles de UI**. Todos os ícones pertencem à biblioteca **Lucide React**.
2. **Divulgação Progressiva (Progressive Disclosure)**: Telas densas nunca devem despejar todos os dados de uma vez. Usar sub-navegação em abas/pílulas, accordions inteligentes para roteiros/atividades e modais retráteis.
3. **Lei de Miller (Miller's Law)**: Toda tela ou sub-seção deve agrupar as informações principais em no máximo **5 a 9 blocos lógicos visíveis**.
4. **Espaço para Respirar (Whitespace)**: Espaçamento consistente e generoso (`p-6` a `p-8`, `gap-4` a `gap-6`, `space-y-6`) para leitura fluida e redução da fadiga visual.
5. **Ergonomia e Área de Toque (Lei de Fitts)**: Altura confortável para botões e inputs (mínimo 36px/40px), feedback visual instantâneo e `cursor-pointer` em 100% dos itens interativos.

---

## 2. Paleta de Cores Institucional e Regra 60-30-10

| Nome do Token | Hex / Variável | Papel Semântico no Sistema |
|---|---|---|
| `laranja` (Primária) | `#F2632D` (`--color-primary`) | **Cor de Ação**: Botões primários (CTAs), destaques de conversão e foco ativo |
| `laranja-claro` | `#F7955F` (`--color-primary-soft`) | Estados de hover e backgrounds suaves de abas ativas |
| `amarelo` | `#F9C859` | Alertas de atenção, avisos de prazo, status intermediários |
| `roxo` | `#93368F` | Módulo Pedagógico, planos de aula e categorização institucional |
| `roxo-escuro` | `#4A1B57` | Cabeçalhos de alto contraste e textos institucionais em dark mode |
| `marrom` | `#8B4A2E` | Módulo de Estoque, identificadores físicos e divisores |
| `verde-azulado` | `#1C9C82` | Status concluído/ativo, confirmações de sucesso e valores positivos |
| `vermelho` | `#D64545` | Ações destrutivas (exclusões), cancelamentos e erros |

### Distribuição Visual 60-30-10:
* **60% — Superfície & Fundo (Base)**: Canvas limpo (`--bg-primary`: `#FDFBF8` / Dark: `#1C1712`) e cartões elevados (`--bg-elevated`: `#FFFFFF` / Dark: `#2A251E`).
* **30% — Estrutura & Leitura (Contraste Médio)**: Painéis secundários (`--bg-secondary`: `#F5F1EA` / Dark: `#24201A`), textos (`--text-primary`: `#2B2118` / Dark: `#F3EDE4`) e bordas (`--border-default`: `#E8E1D6` / Dark: `#383126`).
* **10% — Ponto Focal & Ação (Laranja Ádapo)**: Reservado exclusivamente para botões de ação primária (`#F2632D`), badges ativos e indicadores de estado.

> 🔴 **Regra de Ouro**: O roxo (`#93368F`) e o azul nunca devem substituir o laranja (`#F2632D`) como cor de ação principal de formulários ou botões primários.

---

## 3. Geometria Unificada (Soft Bento Institucional)

| Elemento de UI | Classe Tailwind | Raio (Radius) | Uso Obrigatório |
|---|---|---|---|
| **Containers Principais & Telas** | `rounded-2xl` | `16px` a `24px` | Painéis principais, cabeçalhos de módulo, envelopes de formulário |
| **Cards, Modais & Tabelas** | `rounded-xl` | `12px` a `16px` | Cards de listagem, painéis de dados, modais de diálogo |
| **Controles, Inputs & Botões** | `rounded-xl` | `10px` a `12px` | Campos de texto, `<select>`, botões `<Button>`, textareas |
| **Tooltips & Menus Suspensos** | `rounded-xl` | `12px` | Componente `FieldInfo`, menus dropdown de ações |
| **Badges, Tags & Pílulas** | `rounded-full` ou `rounded-lg` | `9999px` ou `8px` | Indicadores de status, tags temáticas, contadores |

> ⛔ **Proibição**: Nunca utilizar `rounded-sm` (2px) ou `rounded-md` (6px) em cartões ou botões principais do sistema.

---

## 4. Arquitetura Padrão de Telas e Sub-Telas Complexas

Toda página de módulo (como `/dashboard/projetos/[id]` e `/dashboard/pedagogia`) deve seguir a mesma estrutura de 3 blocos:

### Bloco 1: Cabeçalho com Seletor Global Ativo
- Contêiner: `rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] p-6`.
- Ícone do módulo/projeto com cor de identificação dinâmica em quadrado arredondado `w-14 h-14 rounded-2xl text-white font-bold text-xl`.
- Seletor de projeto sempre ativo em dropdown estilizado (`font-display font-bold text-lg sm:text-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] px-3 py-1.5 rounded-xl`).
- Badge de status (`ATIVO` / `PLANEJAMENTO`) + resumo numérico em pílulas (`Inscritos`, `Encontros`, `Metas`).
- Botão de ação rápida à direita (ex: `Ver Projeto Completo`).

### Bloco 2: Barra de Navegação por Áreas (Tabs Bento)
- Contêiner: `p-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]`.
- Grid responsivo de abas (`grid-cols-2 md:grid-cols-4` ou `md:grid-cols-5`):
  - **Aba Ativa**: `border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm scale-[1.02]`.
  - **Aba Inativa**: `border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]`.
  - Ícone de 20px com a cor semântica da área + rótulo claro em texto de 12px com peso `font-bold`.

### Bloco 3: Sub-navegação em Pílulas (Divulgação Progressiva)
- Para sub-telas densas (como Socioemocional ou Execução):
  - Botão 1: **"Consulta / Fichas Cadastradas (N)"** (exibe a visão panorâmica, cards compactos, busca e botões de exportação).
  - Botão 2: **"Novo Registro / Preenchimento"** (abre a visualização focada no formulário de edição).

---

## 5. Padrões para Cards, Formulários e Modais

### 5.1 Cards Salvos com Accordion Inteligente
- Evitar exibir formulários inteiros ou descrições extensas dentro dos cards salvos.
- Exibir: Cabeçalho com data, ação vinculada, título do encontro e educador responsável.
- Incluir botão interativo **"Ver roteiro de atividades (N) ▼"** que expande suavemente os detalhes das dinâmicas sem sobrecarregar a listagem.

### 5.2 Formulários Estruturados em Blocos Semânticos
- Formulários complexos devem ser divididos em blocos `rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 sm:p-5 space-y-4`.
- Cabeçalho do bloco com ícone semântico Lucide, título em caixa alta `text-xs font-bold uppercase tracking-wider` e subtítulo explicativo.
- Grid de opções (`grid-cols-1 md:grid-cols-3 gap-3`) com radio buttons em caixas destacadas `p-3.5 rounded-xl bg-[var(--bg-secondary)]`.

### 5.3 Selects com Suporte a Voluntários e Metas
- **Responsáveis / Mediadores**: Dropdown populado automaticamente com os voluntários cadastrados da equipe + opção `__CUSTOM__` (*"+ Digitar outro nome / equipe externa..."*) que abre campo de texto livre sob demanda.
- **Metas do Projeto**: Descrição completa sem truncamento (`whitespace-normal`), permitindo leitura 100% integral dos objetivos.
- **Destino do Campo**: Quando um campo alimentar um documento timbrado, utilizar badge de destaque `[Exibido na Devolutiva Timbrada]`.

### 5.4 Documentos Oficiais em Papel Timbrado (`PapelTimbradoModal.tsx`)
- Todos os documentos destinados a famílias, parceiros ou prestação de contas devem utilizar o modal timbrado oficial:
  - Formato A4 com margens proporcionais.
  - Títulos sem emojis, cabeçalho institucional, síntese dos dados, campos de assinatura e classes `timbrado-avoid-break` para impressão perfeita em PDF.

### 5.5 Notificações de Salvamento com Alto Contraste
- Todos os feedbacks de gravação com sucesso devem utilizar container com contraste sólido:
  ```tsx
  <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
    <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
    Registro gravado com sucesso no sistema!
  </div>
  ```

---

## 6. Check-up Rápido de Tela (Auditoria Pré-Entrega)

Antes de considerar qualquer tela ou componente como finalizado, valide:

- [ ] **Teste do Espaço**: Textos longos de ajuda foram convertidos para `FieldInfo`? A tela possui respiro visual?
- [ ] **Teste da Lei de Miller**: As informações estão agrupadas em no máximo 5 a 9 blocos lógicos visíveis?
- [ ] **Teste do Cursor**: Todos os elementos interativos possuem `cursor-pointer` e transições suaves?
- [ ] **Teste Geométrico**: `rounded-2xl` para contêineres principais e `rounded-xl` para cards/inputs/botões?
- [ ] **Teste Zero Emojis**: 100% dos ícones vêm do **Lucide React**?
- [ ] **Teste de Alto Contraste**: Notificações e textos foram validados no modo claro e no modo escuro?