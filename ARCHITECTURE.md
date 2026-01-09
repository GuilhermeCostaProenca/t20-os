# 🌍 World‑First Architecture

## Manifesto do Mundo Vivo (Non‑Negotiable)

---

## 🧠 A Ideia Central

Este projeto **não é um app de RPG**.

Ele é um **sistema para criar, lembrar e evoluir mundos narrativos vivos**.

Um *World* não nasce para acabar.
Ele nasce para **existir no tempo**.

Campanhas passam.
Personagens morrem.
Reinos caem.

👉 **O mundo permanece.**

---

## 🌍 World é o Topo (Regra Absoluta)

* **World é a entidade raiz.**
* Nada existe fora de um mundo.
* Tudo pertence a um mundo, direta ou indiretamente.

```txt
World
 ├─ Campaigns (linhas do tempo)
 │   ├─ Sessions
 │   │   └─ Events
 │   └─ Characters (contextualizados)
 ├─ Characters (globais ao mundo)
 ├─ NPCs
 ├─ Locations
 ├─ Items
 ├─ Lore / Compendium
 └─ WorldEvent Ledger (memória absoluta)
```

### ❌ Proibido

* Personagem sem mundo
* NPC solto
* Sessão fora de campanha
* Campanha sem mundo

### ✔ Verdade

> **Campanha não é raiz. Campanha é linha do tempo.**

---

## ⏳ Campaigns = Timelines

* Uma campanha representa **uma linha temporal dentro do mundo**.
* Um mesmo mundo pode ter:

  * passado
  * presente
  * futuro
  * linhas alternativas

> Campanhas contam histórias.
> Mundos guardam verdades.

---

## ⚡ Tudo é Evento

### Regra Fundamental

👉 **Tudo que acontece vira um evento.**

* falas
* decisões
* mentiras
* batalhas
* mortes
* viagens
* descobertas

Nada é pequeno demais.

---

## 📜 WorldEvent Ledger (Memória do Mundo)

* Todos os eventos vão para um **ledger único**.
* Eventos **nunca são apagados**.
* Eventos **nunca são editados**.

```txt
Micro‑evento → Macro‑evento → Consequência no Mundo
```

> O mundo não esquece.
> Ele apenas muda a forma como lembra.

---

## 🔹 Micro vs 🔺 Macro

### Micro‑eventos

* Acontecem o tempo todo
* Podem parecer irrelevantes

Ex:

* “NPC mentiu”
* “Personagem escolheu ir ao norte”

### Macro‑eventos

* Alteram o mundo

Ex:

* morte importante
* queda de reino
* guerra
* continente destruído

👉 Um micro‑evento pode virar macro depois.
👉 Classificação **não é fixa no tempo**.

---

## 🧬 Estado é Derivado, Nunca Editado

Nada muda diretamente.

Estados são **derivados dos eventos**.

Exemplo:

* Personagem não tem `status = morto`
* Ele tem:

  * Evento: “X matou Y na sessão 12”

O sistema **infere**:

* Y está morto (nesta linha do tempo)

Isso permite:

* retcons
* futuros alternativos
* campanhas paralelas

---

## 🤖 IA é Parte do Design (Mesmo Desligada)

A IA **não é um plugin**.
Ela é **parte do mundo**.

### A IA deve ser capaz de:

* ouvir sessões
* transcrever tudo
* detectar eventos
* classificar micro/macro
* sugerir consequências

### Regra de Ouro

> **IA nunca edita entidades.**
> **IA apenas cria eventos.**

---

## 🎭 Segredos e Verdade

* Nem tudo é público
* Eventos têm visibilidade:

  * GM_ONLY
  * PARTY
  * PUBLIC

A IA sabe tudo.
O mundo mostra só o que deve.

---

## 🧭 UI Philosophy

### World Hub

* Cockpit do mundo
* Controle total da narrativa

### Sidebar Dinâmica

* Fora do mundo: apenas Worlds
* Dentro do mundo:

  * Characters
  * NPCs
  * Locations
  * Diary
  * Compendium

### Rotas

❌ Globais

```
/app/npcs
/app/personagens
```

✔ World‑scoped

```
/app/worlds/[id]/npcs
/app/worlds/[id]/characters
```

---

## ♾️ Mundos Não Morrem

* Mundos podem ser abandonados
* Podem falhar
* Podem ser retomados anos depois

> Um mundo só acaba quando ninguém mais se lembra dele.
> Este sistema existe para lembrar.

---

## 🛑 Regra Final

> **Se uma mudança quebra a ideia de mundo vivo,
> ela está errada, mesmo que o código esteja certo.**
