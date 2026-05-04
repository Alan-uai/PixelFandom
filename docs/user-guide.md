# Guia de Comandos para a IA

Este guia fornece exemplos de como me instruir para realizar tarefas de desenvolvimento no seu projeto. Use estes padrões para garantir que eu entenda suas solicitações com clareza.

---

### 1. Modificando a Estrutura de Dados (`backend.json`)

Para alterar as entidades de dados do seu aplicativo, seja específico sobre a entidade e as propriedades.

**Exemplo para adicionar um campo:**
> "Adicione uma nova propriedade 'cooldown' à entidade 'PowerStat' no backend.json. Ela deve ser do tipo 'string' e a descrição deve ser 'O cooldown do ataque'."

**Exemplo para criar uma nova entidade:**
> "Crie uma nova entidade chamada 'Guild' em `backend.json`. Ela deve ter as propriedades 'id' (string), 'name' (string) e 'memberCount' (number)."

---

### 2. Trabalhando com Componentes React

Para criar ou modificar componentes, especifique o caminho do arquivo e os detalhes da implementação.

**Exemplo para criar um componente:**
> "Crie um novo componente de botão em `src/components/ui/special-button.tsx`. Ele deve usar Radix e ter uma variante de cor roxa."

**Exemplo para modificar um componente:**
> "Na página `src/app/page.tsx`, altere o título principal de 'Bem-vindo' para 'Bem-vindo ao Guia Eterno'."

---

### 3. Editando o Conteúdo da Wiki

Você pode me pedir para criar, modificar ou popular os dados estáticos que são usados para preencher o Firestore.

**Exemplo para criar um novo artigo estático:**
> "Crie um novo arquivo de dados em `src/lib/world-23-data.ts`. Ele deve exportar um objeto chamado `world23Data` com a propriedade `name` definida como 'World 23 - Chaos Realm'."

**Exemplo para adicionar dados a um artigo existente:**
> "No arquivo `src/lib/world-1-data.ts`, adicione um novo NPC à lista de `npcs`. O nome deve ser 'Mystic Trader', rank 'A', e exp 10."

---

### 4. Corrigindo Bugs

Ao relatar um bug, descreva o comportamento inesperado e, se possível, o comportamento esperado. Mencionar o arquivo relevante ajuda muito.

**Exemplo de correção de bug:**
> "Na página da calculadora em `src/app/calculator/page.tsx`, o cálculo de DPS não está incluindo o bônus do pet. Corrija a fórmula para multiplicar o dano final pelo bônus de energia do pet selecionado."

---

### 5. Termos Técnicos Comuns

*   **Entidade:** Refere-se a uma definição de objeto em `backend.json` (ex: "entidade User").
*   **Propriedade:** Um campo dentro de uma entidade (ex: "propriedade `email`").
*   **Componente:** Um arquivo React (`.tsx`) que renderiza uma parte da UI.
*   **Página:** Um arquivo `page.tsx` dentro do diretório `src/app`.
*   **Fluxo (Flow):** Uma função de IA definida com Genkit (ex: "o fluxo `generateSolution`").
*   **Coleção / Sub-coleção:** Refere-se a um caminho no Firestore.
