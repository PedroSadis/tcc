# 🕒 Sistema de Gestão de Ponto e Entregas (TCC)

Este projeto é um sistema completo de **Controle de Ponto Eletrônico e Gestão Logística**, desenvolvido como Trabalho de Conclusão de Curso (TCC). 

O sistema opera em arquitetura Desktop (via Electron) com comunicação cliente-servidor, permitindo que **Funcionários** registrem suas atividades e que o **Recursos Humanos (RH)** gerencie a equipe, aprove solicitações e gere relatórios detalhados.

---

## 🚀 Tecnologias Utilizadas

O projeto foi construído utilizando uma stack moderna e leve:

* **Frontend:** Electron (Desktop), HTML5, CSS3, JavaScript (Vanilla).
* **Backend:** Node.js, Express.
* **Banco de Dados:** SQLite3 (Relacional, Local).
* **Autenticação & Segurança:** JWT (JSON Web Tokens) e Bcrypt (Hash de senhas).

---

## ✨ Funcionalidades do Sistema

### 👨‍💼 Perfil: Funcionário
* **Autenticação Segura:** Login com email e senha.
* **Registro de Ponto:** Marcação de **Entrada** e **Saída** com registro exato de data/hora.
* **Histórico Pessoal:** Visualização dos últimos registros de ponto em tempo real.
* **Gestão de Entregas:** Registro de mercadorias entregues (Logística) com número de Nota Fiscal.
* **Solicitações ao RH:** Envio de pedidos de **Ajuste de Ponto** (em caso de esquecimento) ou envio de **Atestados Médicos**.
* **Notificações:** Recebimento de feedback visual quando o RH aprova ou rejeita uma solicitação.

### 🏢 Perfil: Recursos Humanos (RH)
* **Dashboard Administrativo:** Acesso exclusivo protegido por nível de permissão.
* **Cadastro de Funcionários:** Registro completo com validação de CPF e Email únicos, vinculando a **Cargos** e **Departamentos** dinâmicos.
* **Relatórios Detalhados:** Geração de relatórios individuais contendo todo o histórico de pontos e entregas realizadas.
* **Gestão de Solicitações:** Visualização de pedidos pendentes com opções de **Aprovar** ou **Rejeitar**.
* **Intervenção Manual (Novidade):** * Lançamento manual de pontos (para casos onde o funcionário não consegue acessar).
    * **Edição e Exclusão** de registros de ponto incorretos diretamente no relatório.

---

## 🛠️ Instalação e Execução

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado na máquina.

### Passo a Passo

1.  **Clone o repositório ou extraia os arquivos:**
    ```bash
    git clone <seu-link-do-git>
    cd nome-da-pasta
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute o sistema:**
    O comando abaixo iniciará tanto o **Servidor Backend** quanto a **Interface Electron** simultaneamente.
    ```bash
    npm run start:all
    ```

> **Nota:** Na primeira execução, o sistema criará automaticamente o arquivo `ponto.db` e as tabelas necessárias.

---

## 🔐 Acesso Padrão (Dados de Teste)

O sistema inicia com dois usuários pré-configurados para testes imediatos:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Funcionário** | `func@empresa.com` | `123456` |
| **RH (Admin)** | `rh@empresa.com` | `123456` |

---

## 🗂️ Estrutura do Banco de Dados

O sistema utiliza **SQLite3** com as seguintes tabelas principais:

* `Funcionario`: Dados pessoais, cargo e departamento.
* `UsuarioRH`: Administradores do sistema.
* `RegistroPonto`: Histórico de entradas e saídas.
* `Entrega`: Registro de atividades logísticas.
* `SolicitacaoAjuste`: Pedidos de correção ou abono.
* `Cargo` e `Departamento`: Tabelas auxiliares normalizadas com restrição `UNIQUE` para evitar duplicatas.

---

## 🛡️ Segurança

* **Senhas:** Todas as senhas são armazenadas criptografadas (Hash) utilizando `bcryptjs`.
* **Sessão:** O controle de acesso é feito via Tokens JWT. O Backend valida o token a cada requisição para garantir que apenas usuários autorizados (e com o perfil correto) acessem determinadas rotas.

---

## 📝 Autor

Desenvolvido por **Pedro Augusto Vessoni Bastos e Gustavo Henrique Gomes dos Santos** para o Trabalho de Conclusão de Curso.
