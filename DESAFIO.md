# 🚀 Desafio Técnico – Full-stack com IA

Este é um desafio **greenfield**: você vai **construir** uma pequena aplicação full-stack do zero, durante a sessão, **usando IA o tempo todo**, e publicá-la.

O objetivo não é digitar código rápido. É mostrar como você **conduz a IA, revisa o que ela produz e toma decisões de engenharia** para entregar algo que funciona em produção — não só na demo.

## 📚 Índice

- [🎯 Visão geral](#visao-geral)
- [🧱 O que você vai construir](#o-que-construir)
- [🛠️ Stack (recomendada, não obrigatória)](#stack)
- [▲ Publicação](#publicacao)
- [📏 Regras funcionais (baseline)](#regras)
- [✅ Critérios de aceite](#aceite)
- [⏱️ Escopo da sessão](#escopo)
- [🤖 Política de uso de IA](#ia)
- [🧰 Ambiente e ferramentas de IA](#ambiente)
- [🔑 Chave de IA (OpenAI)](#chave)

<a id="visao-geral"></a>
## 🎯 Visão geral

Durante a sessão você vai, com auxílio de IA:

- construir uma API e uma interface para gerenciar **invoices** (faturas)
- persistir os dados de forma que sobrevivam a reinícios e novos deploys
- publicar a aplicação e garantir que ela funciona **na URL publicada**
- explicar suas decisões, o que aceitou e o que rejeitou das sugestões da IA

> Importante ⚠️: não buscamos a arquitetura "perfeita". Buscamos uma entrega **correta, segura e justificada** no tempo disponível.

<a id="o-que-construir"></a>
## 🧱 O que você vai construir

Uma aplicação de **faturamento** (invoices) simples, com **backend e frontend**.

### Backend (API)

A aplicação precisa permitir:

- verificar a **saúde** do serviço
- **criar** uma invoice (cliente, itens, desconto e imposto)
- **listar** as invoices
- **consultar** uma invoice específica
- **registrar o pagamento** de uma invoice

**Como você estrutura e expõe isso é decisão sua — e faz parte do que avaliamos.** Estilo de API (REST, RPC, GraphQL…), modelagem de recursos, verbos e rotas, códigos de status, contratos de request/response: escolha o que fizer sentido e esteja pronto para justificar. Queremos **ver e entender suas escolhas**, não te dar um molde para preencher.

### Frontend (UI)

Uma interface mínima que permita:

- listar as invoices existentes
- criar uma nova invoice
- ver os detalhes de uma invoice
- marcar uma invoice como paga

Estética não é o foco — clareza, funcionamento e consistência com a API são.

<a id="stack"></a>
## 🛠️ Stack (recomendada, não obrigatória)

Use as ferramentas com as quais você é mais produtivo. **Nada aqui é obrigatório** — é apenas uma recomendação que costuma funcionar bem:

- **Next.js** (front + back no mesmo projeto) + **TypeScript**
- Deploy no **Vercel**
- **Postgres** (ex.: Neon, free tier)

Você é livre para usar outra stack — por exemplo **Cloudflare** Workers/Pages, outro framework, outro banco e outra hospedagem. A própria **escolha de stack é um sinal**: queremos entender por que você escolheu o que escolheu. Os únicos requisitos são que a aplicação rode **publicada** e que os dados **persistam**.

<a id="publicacao"></a>
## ▲ Publicação

Publique a aplicação na **plataforma de sua escolha** e **valide o comportamento na URL publicada** (não apenas no localhost).

<a id="regras"></a>
## 📏 Regras funcionais (baseline)

Estas regras existem para reduzir ambiguidade. Você pode propor alternativas, desde que **explicite** e ajuste comportamento/testes.

- Uma invoice possui **itens**, **desconto** opcional e **imposto**.
- O **total final deve ser derivado dos itens** — não aceite um total enviado pelo cliente como verdade.
- Regra padrão de cálculo: **desconto é aplicado antes do imposto**.
- Valores monetários devem ser **exatos** (sem erros de arredondamento).
- Pagamento só pode ocorrer para invoice em **status elegível** (ex.: `OPEN`).
- Uma invoice **não pode ser paga duas vezes**.
- Falhas de **domínio** (ex.: pagar invoice já paga) devem ser diferenciadas de falhas de **infraestrutura**.

<a id="aceite"></a>
## ✅ Critérios de aceite

- A aplicação funciona na **URL publicada** (na plataforma que você escolher).
- Os dados **persistem** entre requisições e entre deploys/reinícios.
- Os fluxos de criar, listar, consultar e pagar funcionam de ponta a ponta (UI ↔ API ↔ persistência).
- As regras funcionais acima são respeitadas.

<a id="escopo"></a>
## ⏱️ Escopo da sessão

- Construa de forma incremental e mantenha a aplicação sempre funcional.
- Priorize **correção e robustez** antes de escopo extra ou estética.
- Use IA para acelerar, mas **revise** o que ela produz.
- Valide o comportamento (testes, requests, conferência na UI/URL publicada).
- Saiba parar no ponto certo e explicar o que ficou de fora.

Não é necessário entregar "tudo". Qualidade de condução e de decisão pesa tanto quanto volume.

<a id="ia"></a>
## 🤖 Política de uso de IA

**A IA é liberada o tempo todo** — inclusive para análise, design, código, testes e deploy. Esse é o ponto do desafio: queremos ver você trabalhar **com** IA.

O que avaliamos não é "se" você usa IA, mas **como**:

- como você **decompõe e descreve** o problema para a IA
- como você **revisa, aceita ou rejeita** as sugestões dela
- como você **conduz a arquitetura** em vez de apenas seguir o output
- como você **valida** que o resultado realmente atende aos requisitos

Esperamos que você consiga explicar, a qualquer momento:

- o que aceitou e por quê
- o que rejeitou e por quê
- quais trade-offs considerou
- que erros a IA introduziu e como você percebeu/corrigiu

<a id="ambiente"></a>
## 🧰 Ambiente e ferramentas de IA

Para você **não gastar seus próprios créditos/tokens** com o nosso desafio, **oferecemos uma chave de API da OpenAI** para usar durante a sessão. Usá-la é **opcional** — se você já tem um setup próprio que prefere, fique à vontade.

A chave funciona com qualquer assistente de código que **aceite uma API key da OpenAI**, por exemplo:

- **Codex CLI** (terminal)
- a **extensão do Codex** no VS Code/Cursor, configurada **com API key**
- **Cursor** (custom API key), **Cline**, **Continue**, etc.

> ⚠️ A chave **não** funciona com o app/Codex logado pela sua **conta ChatGPT** (assinatura pessoal) — nesse modo o uso não passa pela chave. Para usar a nossa chave, aponte a ferramenta para ela via API key.

Deixe a instalação/login **prontos e testados antes da call** para não gastarmos tempo de sessão com setup.

<a id="chave"></a>
## 🔑 Chave de IA (OpenAI)

A chave é entregue **no início da sessão**. Configure-a via variável de ambiente:

```bash
export OPENAI_API_KEY="sk-proj-..."
```

- Use a chave **apenas no seu ambiente de desenvolvimento**.
- **Não** comite a chave no repositório nem a exponha em logs/prints.
- A chave tem **limite de gasto** e é **revogada após a sessão**.
