// CORREÇÃO DEFINITIVA PARA O ERRO 'TypeError: ... of null'
// Espera que o HTML esteja 100% pronto antes de executar qualquer JavaScript
document.addEventListener('DOMContentLoaded', () => {

    // Endereço da sua API backend
    const API_URL = 'http://localhost:3000';

    // Elementos da DOM (agora com a certeza que existem)
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logoutButton');
    const funcionarioArea = document.getElementById('funcionario-area');
    const rhArea = document.getElementById('rh-area');
    const btnEntrada = document.getElementById('btnEntrada');
    const btnSaida = document.getElementById('btnSaida');
    const pontoStatus = document.getElementById('ponto-status');
    const listaRegistrosDiv = document.getElementById('lista-registros');
    const solicitacaoForm = document.getElementById('solicitacaoForm');
    const solicitacaoStatus = document.getElementById('solicitacao-status');
    const entregaForm = document.getElementById('entregaForm');
    const entregaStatus = document.getElementById('entrega-status');
    const registroFuncionarioForm = document.getElementById('registroFuncionarioForm');
    const rhStatus = document.getElementById('rh-status');
    const rhSelectFuncionario = document.getElementById('rh_select_funcionario');
    const rhBtnGerarRelatorio = document.getElementById('rh_btn_gerar_relatorio');
    const rhRelatorioStatus = document.getElementById('rh-relatorio-status');
    const rhRelatorioResultado = document.getElementById('rh_relatorio_resultado');
    const relatorioPontosContent = document.getElementById('relatorio_pontos_content');
    const relatorioEntregasContent = document.getElementById('relatorio_entregas_content');
    const rhSolicitacoesPendentes = document.getElementById('rh_solicitacoes_pendentes');
    const rhSolicitacaoStatus = document.getElementById('rh-solicitacao-status');


    // --- Gerenciamento de Autenticação ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = ''; 
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            // DE VOLTA: Pegamos o 'tipo' da caixa de seleção
            const tipo = document.getElementById('tipo').value; 

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // DE VOLTA: Enviamos o 'tipo' para o backend
                    body: JSON.stringify({ email: email, senha: senha, tipo: tipo }) 
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.message); }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                // O 'tipo' agora vem do que selecionámos
                localStorage.setItem('userType', tipo); 

                showAppView(tipo, data.user); // Usamos o 'tipo' que enviámos
            } catch (error) {
                loginError.textContent = `Erro: ${error.message}`;
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            showLoginView();
        });
    }

    function showAppView(tipo, user) {
        loginView.style.display = 'none';
        appView.style.display = 'block';
        welcomeMessage.textContent = `Bem-vindo(a), ${user.nome}!`;

        if (tipo === 'funcionario') {
            funcionarioArea.style.display = 'block';
            rhArea.style.display = 'none';
            carregarMeusRegistros();
        } else if (tipo === 'rh') {
            funcionarioArea.style.display = 'none';
            rhArea.style.display = 'block';
            carregarListaFuncionariosParaRH();
            carregarSolicitacoesPendentes(); // Carrega solicitações para o RH
        }
    }

    function showLoginView() {
        loginView.style.display = 'block';
        appView.style.display = 'none';
        // Adiciona verificações para evitar erros se os elementos não existirem
        if (pontoStatus) pontoStatus.textContent = '';
        if (loginError) loginError.textContent = '';
        if (solicitacaoStatus) solicitacaoStatus.textContent = '';
        if (entregaStatus) entregaStatus.textContent = '';
        if (rhStatus) rhStatus.textContent = '';
        if (rhRelatorioStatus) rhRelatorioStatus.textContent = '';
        if (rhRelatorioResultado) rhRelatorioResultado.style.display = 'none';
        if (rhSolicitacaoStatus) rhSolicitacaoStatus.textContent = '';
    }

    // --- Ações do Funcionário ---

    if (btnEntrada) {
        btnEntrada.addEventListener('click', () => registrarPonto('Entrada'));
    }
    if (btnSaida) {
        btnSaida.addEventListener('click', () => registrarPonto('Saida'));
    }

    async function registrarPonto(tipo) {
        pontoStatus.textContent = 'Registrando...';
        pontoStatus.style.color = 'var(--cor-primaria)';
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/ponto/registrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ tipo_registro: tipo })
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }
            pontoStatus.style.color = 'var(--cor-sucesso)';
            pontoStatus.textContent = data.message;
            carregarMeusRegistros();
        } catch (error) {
            pontoStatus.style.color = 'var(--cor-perigo)';
            pontoStatus.textContent = `Erro: ${error.message}`;
        }
    }

    // --- Ações do Funcionário (Carregar Registros) ---
    async function carregarMeusRegistros() {
        if (!listaRegistrosDiv) return;
        listaRegistrosDiv.innerHTML = '<p>Carregando registros...</p>';
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/ponto/meus-registros`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }

            listaRegistrosDiv.innerHTML = '';
            if (data.registros && data.registros.length > 0) {
                const ul = document.createElement('ul');
                data.registros.forEach(registro => {
                    const li = document.createElement('li');
                    const dataHora = new Date(registro.data_hora);
                    const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                    if (registro.tipo_registro === 'Entrada') {
                        li.style.color = 'var(--cor-primaria)';
                    } else {
                        li.style.color = 'var(--cor-perigo)';
                    }
                    li.textContent = `[${registro.tipo_registro}] - ${formatado}`;
                    ul.appendChild(li);
                });
                listaRegistrosDiv.appendChild(ul);
            } else {
                listaRegistrosDiv.innerHTML = '<p>Nenhum registro encontrado.</p>';
            }
        } catch (error) {
            listaRegistrosDiv.innerHTML = `<p style="color: var(--cor-perigo);">Erro ao carregar registros: ${error.message}</p>`;
        }
    }

    // --- Ações do Funcionário (Enviar Solicitação) ---
    if (solicitacaoForm) {
        solicitacaoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            solicitacaoStatus.textContent = 'Enviando...';
            solicitacaoStatus.style.color = 'var(--cor-primaria)';

            const tipo_solicitacao = document.getElementById('tipo_solicitacao').value;
            const justificativa = document.getElementById('justificativa').value;
            const anexo_atestado = document.getElementById('anexo_atestado').value;
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${API_URL}/ponto/solicitar-ajuste`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tipo_solicitacao,
                        justificativa,
                        anexo_atestado: anexo_atestado || null
                    })
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.message); }
                solicitacaoStatus.style.color = 'var(--cor-sucesso)';
                solicitacaoStatus.textContent = data.message;
                solicitacaoForm.reset();
            } catch (error) {
                solicitacaoStatus.style.color = 'var(--cor-perigo)';
                solicitacaoStatus.textContent = `Erro: ${error.message}`;
            }
        });
    }

    // --- Ações do Funcionário (Registrar Entrega) ---
    if (entregaForm) {
        entregaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            entregaStatus.textContent = 'Registrando...';
            entregaStatus.style.color = 'var(--cor-primaria)';

            const descricao_mercadoria = document.getElementById('descricao_mercadoria').value;
            const numero_nota_fiscal = document.getElementById('numero_nota_fiscal').value;
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${API_URL}/ponto/registrar-entrega`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        descricao_mercadoria,
                        numero_nota_fiscal: numero_nota_fiscal || null
                    })
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.message); }
                entregaStatus.style.color = 'var(--cor-sucesso)';
                entregaStatus.textContent = data.message;
                entregaForm.reset();
            } catch (error) {
                entregaStatus.style.color = 'var(--cor-perigo)';
                entregaStatus.textContent = `Erro: ${error.message}`;
            }
        });
    }

    // --- Ações do RH ---
    if (registroFuncionarioForm) {
        registroFuncionarioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            rhStatus.textContent = 'Registrando...';
            rhStatus.style.color = 'var(--cor-primaria)';

            const nome_completo = document.getElementById('reg_nome').value;
            const cpf = document.getElementById('reg_cpf').value;
            const email = document.getElementById('reg_email').value;
            const senha = document.getElementById('reg_senha').value;
            const data_admissao = document.getElementById('reg_data_admissao').value;
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${API_URL}/rh/registrar-funcionario`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nome_completo, cpf, email, senha, data_admissao
                    })
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.message); }
                rhStatus.style.color = 'var(--cor-sucesso)';
                rhStatus.textContent = data.message;
                registroFuncionarioForm.reset();
            } catch (error) {
                rhStatus.style.color = 'var(--cor-perigo)';
                rhStatus.textContent = `Erro: ${error.message}`;
            }
        });
    }

    // --- Ações do RH (Carregar Lista de Funcionários) ---
    async function carregarListaFuncionariosParaRH() {
        if (!rhSelectFuncionario) return;
        rhSelectFuncionario.innerHTML = '<option value="">-- Carregando... --</option>';
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/rh/funcionarios`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }

            rhSelectFuncionario.innerHTML = '<option value="">-- Selecione um funcionário --</option>';
            if (data.funcionarios && data.funcionarios.length > 0) {
                data.funcionarios.forEach(func => {
                    const option = document.createElement('option');
                    option.value = func.id_funcionario;
                    option.textContent = func.nome_completo;
                    rhSelectFuncionario.appendChild(option);
                });
            } else {
                rhSelectFuncionario.innerHTML = '<option value="">-- Nenhum funcionário cadastrado --</option>';
            }
        } catch (error) {
            rhSelectFuncionario.innerHTML = `<option value="">-- Erro ao carregar --</option>`;
        }
    }

    // --- Ações do RH (Gerar Relatório) ---
    if (rhBtnGerarRelatorio) {
        rhBtnGerarRelatorio.addEventListener('click', async () => {
            const id_funcionario = rhSelectFuncionario.value;
            const token = localStorage.getItem('token');

            if (!id_funcionario) {
                rhRelatorioStatus.textContent = 'Por favor, selecione um funcionário.';
                rhRelatorioStatus.style.color = 'var(--cor-perigo)';
                return;
            }

            rhRelatorioStatus.textContent = 'Gerando relatório...';
            rhRelatorioStatus.style.color = 'var(--cor-primaria)';
            rhRelatorioResultado.style.display = 'none';

            try {
                const response = await fetch(`${API_URL}/rh/relatorio/${id_funcionario}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json(); // Espera { pontos: [], entregas: [] }
                if (!response.ok) { throw new Error(data.message); }

                // 1. Renderizar Registros de Ponto
                relatorioPontosContent.innerHTML = '';
                if (data.pontos && data.pontos.length > 0) {
                    data.pontos.forEach(ponto => {
                        const dataHora = new Date(ponto.data_hora);
                        const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                        const p = document.createElement('p');
                        if (ponto.tipo_registro === 'Entrada') {
                            p.style.color = 'var(--cor-primaria)';
                        } else {
                            p.style.color = 'var(--cor-perigo)';
                        }
                        p.textContent = `[${ponto.tipo_registro}] - ${formatado}`;
                        relatorioPontosContent.appendChild(p);
                    });
                } else {
                    relatorioPontosContent.innerHTML = '<p>Nenhum registro de ponto encontrado.</p>';
                }

                // 2. Renderizar Entregas
                relatorioEntregasContent.innerHTML = '';
                if (data.entregas && data.entregas.length > 0) {
                    data.entregas.forEach(entrega => {
                        const dataHora = new Date(entrega.data_hora_entrega);
                        const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                        const p = document.createElement('p');
                        p.textContent = `[${formatado}] - ${entrega.descricao_mercadoria} (NF: ${entrega.numero_nota_fiscal || 'N/A'})`;
                        relatorioEntregasContent.appendChild(p);
                    });
                } else {
                    relatorioEntregasContent.innerHTML = '<p>Nenhum registro de entrega encontrado.</p>';
                }

                // 3. Mostrar resultados
                rhRelatorioStatus.textContent = `Relatório de: ${rhSelectFuncionario.options[rhSelectFuncionario.selectedIndex].text}`;
                rhRelatorioStatus.style.color = 'black';
                rhRelatorioResultado.style.display = 'block';

            } catch (error) {
                rhRelatorioStatus.textContent = `Erro: ${error.message}`;
                rhRelatorioStatus.style.color = 'var(--cor-perigo)';
            }
        });
    }

    // --- Ações do RH (Carregar Solicitações Pendentes) ---
    async function carregarSolicitacoesPendentes() {
        if (!rhSolicitacoesPendentes) return;
        rhSolicitacoesPendentes.innerHTML = '<p>Carregando solicitações...</p>';
        rhSolicitacaoStatus.textContent = '';
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/rh/solicitacoes-pendentes`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }

            rhSolicitacoesPendentes.innerHTML = ''; // Limpa a lista

            if (data.solicitacoes && data.solicitacoes.length > 0) {
                data.solicitacoes.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'solicitacao-card';
                    card.id = `solicitacao-${s.id_solicitacao}`; // ID único para remover depois

                    // Formata a data
                    const dataHora = new Date(s.data_solicitacao);
                    const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;

                    let anexoHTML = '';
                    if (s.anexo_atestado) {
                        // Importante: target="_blank" abre o link em nova aba
                        anexoHTML = `<p><strong>Anexo:</strong> <a href="${s.anexo_atestado}" target="_blank" rel="noopener noreferrer">Ver Anexo</a></p>`;
                    }

                    card.innerHTML = `
                        <p><strong>Funcionário:</strong> ${s.nome_completo}</p>
                        <p><strong>Tipo:</strong> ${s.tipo_solicitacao}</p>
                        <p><strong>Data:</strong> ${formatado}</p>
                        <p><strong>Justificativa:</strong> ${s.justificativa}</p>
                        ${anexoHTML}
                        <div class="solicitacao-botoes">
                            <button class="btn-aprovar" data-id="${s.id_solicitacao}">Aprovar</button>
                            <button class="btn-rejeitar" data-id="${s.id_solicitacao}">Rejeitar</button>
                        </div>
                    `;
                    rhSolicitacoesPendentes.appendChild(card);
                });

                // Adiciona os event listeners para os novos botões
                document.querySelectorAll('.btn-aprovar').forEach(btn => {
                    btn.addEventListener('click', () => processarSolicitacao(btn.dataset.id, 'Aprovado'));
                });
                document.querySelectorAll('.btn-rejeitar').forEach(btn => {
                    btn.addEventListener('click', () => processarSolicitacao(btn.dataset.id, 'Rejeitado'));
                });

            } else {
                rhSolicitacoesPendentes.innerHTML = '<p>Nenhuma solicitação pendente.</p>';
            }
        } catch (error) {
            rhSolicitacoesPendentes.innerHTML = `<p style="color: var(--cor-perigo);">Erro ao carregar solicitações: ${error.message}</p>`;
        }
    }

    // --- Ações do RH (Processar Solicitação) ---
    async function processarSolicitacao(id_solicitacao, novo_status) {
        rhSolicitacaoStatus.textContent = 'Processando...';
        rhSolicitacaoStatus.style.color = 'var(--cor-primaria)';
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/rh/processar-solicitacao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id_solicitacao, novo_status })
            });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message); }

            rhSolicitacaoStatus.style.color = 'var(--cor-sucesso)';
            rhSolicitacaoStatus.textContent = data.message;
            
            // Recarrega a lista de pendentes (o item processado irá desaparecer)
            carregarSolicitacoesPendentes(); 

        } catch (error) {
            rhSolicitacaoStatus.style.color = 'var(--cor-perigo)';
            rhSolicitacaoStatus.textContent = `Erro: ${error.message}`;
        }
    }

    // --- Verificação Inicial ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const tipo = localStorage.getItem('userType');
    if (token && user && tipo) {
        showAppView(tipo, user);
    }

}); // <-- FIM DO document.addEventListener