# Specification Quality Checklist: Segurança de Acesso ao Painel Administrativo

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-25
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

### Iteração 1 — problemas encontrados e corrigidos

1. **FR-020 e SC-007 não eram testáveis.** Diziam "tentativas repetidamente falhadas" e
   "o número definido de tentativas" sem número nem duração. Corrigido para 5 tentativas
   e 15 minutos de bloqueio, com reposição da contagem após entrada bem-sucedida.
   Justificação do valor registada em Assumptions.

### Decisões deliberadas de fronteira spec/plano

Três pontos foram mantidos ao nível do comportamento e empurrados para o plano por serem
decisões de implementação, não de requisito. Registados aqui para não parecerem omissões:

- **Onde é guardada a contagem de tentativas falhadas.** A plataforma de execução não
  tem servidor persistente, pelo que a contagem precisa de armazenamento externo. FR-020
  define o comportamento exigido; a escolha do mecanismo é do plano. Pode implicar uma
  dependência nova de infraestrutura — a assinalar no plano se for esse o caso.
- **Modo de aplicação da política de origens de recursos.** FR-024 exige a restrição e
  exige que mapa, imagens, ícones e estatísticas continuem a funcionar. Aplicar em modo
  de observação antes de bloquear é uma tática de implementação para não partir o site
  em produção, e pertence ao plano.
- **Como é feita a verificação automática da fronteira de segredos.** FR-028 exige que a
  construção falhe se código de navegador passar a depender da credencial privilegiada.
  Se isso é uma regra de análise estática, um teste, ou um passo de verificação, é
  escolha do plano.

### Nota de âmbito

A especificação tem cinco histórias, duas delas com prioridade P1. A História 5 (visitante
não nota diferença) partilha a prioridade máxima com a História 1 por ser a rede de
proteção contra o próprio trabalho: uma alteração de autorização que feche o catálogo ao
público troca uma falha grave por outra pior. As duas devem ser implementadas e testadas
em conjunto, não em sequência.

### Estado

Todos os itens passam. Pronto para `/speckit-plan`.

Recomenda-se **saltar** `/speckit-clarify`: a especificação nasceu de uma auditoria com
sondas executadas contra a produção, e os quatro pontos de ambiguidade que existiam foram
resolvidos com o utilizador antes da escrita — ordem das fases, âmbito do painel,
abordagem do conteúdo tridimensional e estrutura da página. Não restam áreas
subespecificadas que justifiquem outra ronda de perguntas.
