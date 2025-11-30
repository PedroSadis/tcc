// frontend/app.js - COMPLETO E ATUALIZADO

document.addEventListener('DOMContentLoaded', () => {

    // Endereço da sua API backend
    const API_URL = 'http://localhost:3000';

    // Elementos da DOM
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logoutButton');
    
    // Área do Funcionário
    const funcionarioArea = document.getElementById('funcionario-area');
    const btnEntrada = document.getElementById('btnEntrada');
    const btnSaida = document.getElementById('btnSaida');
    const pontoStatus = document.getElementById('ponto-status');
    const listaRegistrosDiv = document.getElementById('lista-registros');
    const solicitacaoForm = document.getElementById('solicitacaoForm');
    const solicitacaoStatus = document.getElementById('solicitacao-status');
    const entregaForm = document.getElementById('entregaForm');
    const entregaStatus = document.getElementById('entrega-status');
    
    // Área do RH
    const rhArea = document.getElementById('rh-area');
    const registroFuncionarioForm = document.getElementById('registroFuncionarioForm');
    const rhStatus = document.getElementById('rh-status');
    const regCargo = document.getElementById('reg_cargo');
    const regDepartamento = document.getElementById('reg_departamento');
    const rhSelectFuncionario = document.getElementById('rh_select_funcionario');
    const rhBtnGerarRelatorio = document.getElementById('rh_btn_gerar_relatorio');
    const rhRelatorioStatus = document.getElementById('rh-relatorio-status');
    const rhRelatorioResultado = document.getElementById('rh_relatorio_resultado');
    const relatorioPontosContent = document.getElementById('relatorio_pontos_content');
    const relatorioEntregasContent = document.getElementById('relatorio_entregas_content');
    const rhSolicitacoesPendentes = document.getElementById('rh_solicitacoes_pendentes');
    const rhSolicitacaoStatus = document.getElementById('rh-solicitacao-status');

    // NOVOS ELEMENTOS: Lançamento Manual e Modal de Edição
    const rhLancamentoManualForm = document.getElementById('rhLancamentoManualForm');
    const rhManualFuncionario = document.getElementById('rh_manual_funcionario');
    const rhManualStatus = document.getElementById('rh-manual-status');

    const modalEditar = document.getElementById('modal-editar-ponto');
    const editIdPonto = document.getElementById('edit_id_ponto');
    const editData = document.getElementById('edit_data');
    const editHora = document.getElementById('edit_hora');
    const editTipo = document.getElementById('edit_tipo');
    const btnCancelarEdit = document.getElementById('btn-cancelar-edit');
    const btnSalvarEdit = document.getElementById('btn-salvar-edit');
    const btnExcluirPonto = document.getElementById('btn-excluir-ponto');


    // Cria área de notificação para funcionário
    const notificacaoArea = document.createElement('div');
    notificacaoArea.id = 'notificacao-area';
    notificacaoArea.style.marginBottom = '20px';
    notificacaoArea.style.padding = '15px';
    notificacaoArea.style.backgroundColor = 'var(--cor-aviso)';
    notificacaoArea.style.borderRadius = 'var(--radius)';
    notificacaoArea.style.display = 'none'; 
    if (funcionarioArea) {
        const h3Ponto = funcionarioArea.querySelector('h3');
        if (h3Ponto) h3Ponto.parentNode.insertBefore(notificacaoArea, h3Ponto);
    }

    // --- Gerenciamento de Autenticação ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = ''; 
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const tipo = document.getElementById('tipo').value; 

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha, tipo }) 
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.message); }

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userType', tipo); 

                showAppView(tipo, data.user); 
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
            fetchAndDisplayNotifications();
        } else if (tipo === 'rh') {
            funcionarioArea.style.display = 'none';
            rhArea.style.display = 'block';
            carregarListaFuncionariosParaRH();
            carregarCargosEDepartamentos();
            carregarSolicitacoesPendentes(); 
        }
    }

    function showLoginView() {
        loginView.style.display = 'block';
        appView.style.display = 'none';
        // Limpa mensagens anteriores
        [pontoStatus, loginError, solicitacaoStatus, entregaStatus, rhStatus, rhRelatorioStatus, rhSolicitacaoStatus, rhManualStatus].forEach(el => {
            if(el) el.textContent = '';
        });
        if (rhRelatorioResultado) rhRelatorioResultado.style.display = 'none';
        if (notificacaoArea) notificacaoArea.style.display = 'none';
    }

    // --- Ações do Funcionário ---

    if (btnEntrada) btnEntrada.addEventListener('click', () => registrarPonto('Entrada'));
    if (btnSaida) btnSaida.addEventListener('click', () => registrarPonto('Saida'));

    async function registrarPonto(tipo) {
        pontoStatus.textContent = 'Registrando...';
        pontoStatus.style.color = 'var(--cor-primaria)';
        constSN = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/ponto/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tipo_registro: tipo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            pontoStatus.style.color = 'var(--cor-sucesso)';
            pontoStatus.textContent = data.message;
            carregarMeusRegistros();
        } catch (error) {
            pontoStatus.style.color = 'var(--cor-perigo)';
            pontoStatus.textContent = `Erro: ${error.message}`;
        }
    }

    async function carregarMeusRegistros() {
        if (!listaRegistrosDiv) return;
        listaRegistrosDiv.innerHTML = '<p>Carregando...</p>';
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/ponto/meus-registros`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            listaRegistrosDiv.innerHTML = '';
            if (data.registros && data.registros.length > 0) {
                const ul = document.createElement('ul');
                data.registros.forEach(registro => {
                    const li = document.createElement('li');
                    const dataHora = new Date(registro.data_hora);
                    const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                    li.style.color = registro.tipo_registro === 'Entrada' ? 'var(--cor-primaria)' : 'var(--cor-perigo)';
                    li.textContent = `[${registro.tipo_registro}] - ${formatado}`;
                    ul.appendChild(li);
                });
                listaRegistrosDiv.appendChild(ul);
            } else {
                listaRegistrosDiv.innerHTML = '<p>Nenhum registro encontrado.</p>';
            }
        } catch (error) {
            listaRegistrosDiv.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        }
    }
    
    // Notificações
    async function fetchAndDisplayNotifications() {
        if (!notificacaoArea || localStorage.getItem('userType') !== 'funcionario') return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/ponto/notificacoes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            if (data.notificacoes && data.notificacoes.length > 0) {
                notificacaoArea.style.display = 'block';
                notificacaoArea.innerHTML = '<h4>🔔 Notificações</h4>';
                
                data.notificacoes.forEach(n => {
                    const card = document.createElement('div');
                    card.className = 'solicitacao-card'; 
                    card.style.marginBottom = '10px';
                    card.style.backgroundColor = n.status_aprovacao === 'Aprovado' ? 'var(--cor-sucesso)' : 'var(--cor-perigo)';
                    card.style.color = 'white'; 
                    card.innerHTML = `
                        <p>Solicitação de <strong>${n.tipo_solicitacao}</strong> foi <strong>${n.status_aprovacao.toUpperCase()}</strong>.</p>
                        <p style="font-size: 0.8em;">${n.justificativa}</p>
                        <button class="btn-marcar-vista" data-id="${n.id_solicitacao}">Marcar como Vista</button>
                    `;
                    notificacaoArea.appendChild(card);
                });
                
                document.querySelectorAll('.btn-marcar-vista').forEach(btn => {
                    btn.addEventListener('click', () => markNotificationAsSeen(btn.dataset.id));
                });
            } else {
                notificacaoArea.style.display = 'none';
            }
        } catch (error) { console.error(error); }
    }

    async function markNotificationAsSeen(id_solicitacao) {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/ponto/marcar-notificacao-vista`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id_solicitacao })
        });
        fetchAndDisplayNotifications();
    }

    // Formulários Funcionário
    if (solicitacaoForm) {
        solicitacaoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const body = {
                tipo_solicitacao: document.getElementById('tipo_solicitacao').value,
                justificativa: document.getElementById('justificativa').value,
                anexo_atestado: document.getElementById('anexo_atestado').value || null
            };
            try {
                const response = await fetch(`${API_URL}/ponto/solicitar-ajuste`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if(response.ok) {
                    solicitacaoStatus.textContent = data.message;
                    solicitacaoStatus.style.color = 'var(--cor-sucesso)';
                    solicitacaoForm.reset();
                } else throw new Error(data.message);
            } catch (err) { solicitacaoStatus.textContent = err.message; solicitacaoStatus.style.color = 'red'; }
        });
    }

    if (entregaForm) {
        entregaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const body = {
                descricao_mercadoria: document.getElementById('descricao_mercadoria').value,
                numero_nota_fiscal: document.getElementById('numero_nota_fiscal').value || null
            };
            try {
                const response = await fetch(`${API_URL}/ponto/registrar-entrega`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if(response.ok) {
                    entregaStatus.textContent = data.message;
                    entregaStatus.style.color = 'var(--cor-sucesso)';
                    entregaForm.reset();
                } else throw new Error(data.message);
            } catch (err) { entregaStatus.textContent = err.message; entregaStatus.style.color = 'red'; }
        });
    }

    // --- Ações do RH ---
    
    async function carregarCargosEDepartamentos() {
        if (!regCargo || !regDepartamento) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/rh/cargos-departamentos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json(); 
            if (!response.ok) throw new Error(data.message);

            regCargo.innerHTML = '<option value="">-- Selecione --</option>';
            data.cargos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_cargo; opt.textContent = c.nome_cargo;
                regCargo.appendChild(opt);
            });

            regDepartamento.innerHTML = '<option value="">-- Selecione --</option>';
            data.departamentos.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id_departamento; opt.textContent = d.nome_departamento;
                regDepartamento.appendChild(opt);
            });
        } catch (error) { console.error(error); }
    }

    if (registroFuncionarioForm) {
        registroFuncionarioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const body = {
                nome_completo: document.getElementById('reg_nome').value,
                cpf: document.getElementById('reg_cpf').value,
                email: document.getElementById('reg_email').value,
                senha: document.getElementById('reg_senha').value,
                data_admissao: document.getElementById('reg_data_admissao').value,
                id_cargo: regCargo.value,
                id_departamento: regDepartamento.value
            };
            
            try {
                const response = await fetch(`${API_URL}/rh/registrar-funcionario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                rhStatus.textContent = data.message;
                rhStatus.style.color = 'var(--cor-sucesso)';
                registroFuncionarioForm.reset();
                carregarListaFuncionariosParaRH(); 
            } catch (error) {
                rhStatus.textContent = error.message;
                rhStatus.style.color = 'red';
            }
        });
    }

    async function carregarListaFuncionariosParaRH() {
        if (!rhSelectFuncionario) return;
        rhSelectFuncionario.innerHTML = '<option value="">-- Carregando... --</option>';
        if (rhManualFuncionario) rhManualFuncionario.innerHTML = '<option value="">-- Carregando... --</option>';
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/rh/funcionarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            rhSelectFuncionario.innerHTML = '<option value="">-- Selecione um funcionário --</option>';
            if (rhManualFuncionario) rhManualFuncionario.innerHTML = '<option value="">-- Selecione um funcionário --</option>';

            if (data.funcionarios) {
                data.funcionarios.forEach(func => {
                    const option = document.createElement('option');
                    option.value = func.id_funcionario;
                    option.textContent = func.nome_completo;
                    rhSelectFuncionario.appendChild(option);

                    if (rhManualFuncionario) {
                        const optionManual = option.cloneNode(true);
                        rhManualFuncionario.appendChild(optionManual);
                    }
                });
            }
        } catch (error) { console.error(error); }
    }

    // --- Lançamento Manual (RH) ---
    if (rhLancamentoManualForm) {
        rhLancamentoManualForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            rhManualStatus.textContent = 'Processando...';
            
            const token = localStorage.getItem('token');
            const dados = {
                id_funcionario: rhManualFuncionario.value,
                data: document.getElementById('rh_manual_data').value,
                hora: document.getElementById('rh_manual_hora').value,
                tipo_registro: document.getElementById('rh_manual_tipo').value,
                justificativa: document.getElementById('rh_manual_justificativa').value
            };

            try {
                const response = await fetch(`${API_URL}/rh/ponto/manual`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(dados)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                rhManualStatus.textContent = data.message;
                rhManualStatus.style.color = 'green';
                rhLancamentoManualForm.reset();
                
                // Se estiver vendo o relatório desse funcionário, atualiza
                if (rhSelectFuncionario.value == dados.id_funcionario) {
                    rhBtnGerarRelatorio.click();
                }
            } catch (error) {
                rhManualStatus.textContent = error.message;
                rhManualStatus.style.color = 'red';
            }
        });
    }

    // --- Relatórios e Edição ---
    if (rhBtnGerarRelatorio) {
        rhBtnGerarRelatorio.addEventListener('click', async () => {
            const id_funcionario = rhSelectFuncionario.value;
            const token = localStorage.getItem('token');
            if (!id_funcionario) return;

            rhRelatorioStatus.textContent = 'Gerando...';
            rhRelatorioResultado.style.display = 'none';

            try {
                const response = await fetch(`${API_URL}/rh/relatorio/${id_funcionario}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json(); 
                if (!response.ok) throw new Error(data.message);

                relatorioPontosContent.innerHTML = '';
                if (data.pontos && data.pontos.length > 0) {
                    data.pontos.forEach(ponto => {
                        const dataHora = new Date(ponto.data_hora);
                        const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                        
                        const p = document.createElement('p');
                        p.style.display = 'flex';
                        p.style.justifyContent = 'space-between';
                        p.style.alignItems = 'center';
                        p.style.borderBottom = '1px solid #eee';
                        p.style.padding = '5px 0';

                        const texto = document.createElement('span');
                        texto.textContent = `[${ponto.tipo_registro}] - ${formatado}`;
                        texto.style.color = ponto.tipo_registro === 'Entrada' ? 'var(--cor-primaria)' : 'var(--cor-perigo)';

                        // Botão de Editar
                        const btnEdit = document.createElement('button');
                        btnEdit.textContent = 'Editar';
                        btnEdit.style.padding = '2px 8px';
                        btnEdit.style.fontSize = '12px';
                        btnEdit.style.marginLeft = '10px';
                        btnEdit.style.width = 'auto'; // Override do estilo padrão
                        btnEdit.onclick = () => abrirModalEdicao(ponto);

                        p.appendChild(texto);
                        p.appendChild(btnEdit);
                        relatorioPontosContent.appendChild(p);
                    });
                } else {
                    relatorioPontosContent.innerHTML = '<p>Nenhum registro.</p>';
                }

                relatorioEntregasContent.innerHTML = '';
                if (data.entregas) {
                    data.entregas.forEach(entrega => {
                        const dataHora = new Date(entrega.data_hora_entrega);
                        const formatado = `${dataHora.toLocaleDateString('pt-BR')} ${dataHora.toLocaleTimeString('pt-BR')}`;
                        const p = document.createElement('p');
                        p.textContent = `[${formatado}] - ${entrega.descricao_mercadoria}`;
                        relatorioEntregasContent.appendChild(p);
                    });
                }

                rhRelatorioStatus.textContent = '';
                rhRelatorioResultado.style.display = 'block';

            } catch (error) {
                rhRelatorioStatus.textContent = `Erro: ${error.message}`;
            }
        });
    }

    // --- Lógica do Modal de Edição ---
    function abrirModalEdicao(ponto) {
        if(!modalEditar) return;
        modalEditar.style.display = 'flex';
        
        // Converte string ISO para value de inputs date/time
        const dataObj = new Date(ponto.data_hora);
        const ano = dataObj.getFullYear();
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const hora = String(dataObj.getHours()).padStart(2, '0');
        const min = String(dataObj.getMinutes()).padStart(2, '0');

        editIdPonto.value = ponto.id_registro_ponto;
        editData.value = `${ano}-${mes}-${dia}`;
        editHora.value = `${hora}:${min}`;
        editTipo.value = ponto.tipo_registro;
    }

    if (btnCancelarEdit) {
        btnCancelarEdit.addEventListener('click', () => {
            modalEditar.style.display = 'none';
        });
    }

    if (btnSalvarEdit) {
        btnSalvarEdit.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            const id = editIdPonto.value;
            const body = {
                data: editData.value,
                hora: editHora.value,
                tipo_registro: editTipo.value
            };

            try {
                const response = await fetch(`${API_URL}/rh/ponto/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(body)
                });
                if(response.ok) {
                    alert('Atualizado com sucesso!');
                    modalEditar.style.display = 'none';
                    rhBtnGerarRelatorio.click(); // Atualiza a lista
                } else {
                    alert('Erro ao atualizar');
                }
            } catch (e) { console.error(e); }
        });
    }

    if (btnExcluirPonto) {
        btnExcluirPonto.addEventListener('click', async () => {
            if(!confirm('Tem certeza que deseja excluir este registro?')) return;
            const token = localStorage.getItem('token');
            const id = editIdPonto.value;
            try {
                const response = await fetch(`${API_URL}/rh/ponto/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(response.ok) {
                    alert('Excluído com sucesso!');
                    modalEditar.style.display = 'none';
                    rhBtnGerarRelatorio.click();
                } else {
                    alert('Erro ao excluir');
                }
            } catch (e) { console.error(e); }
        });
    }

    // --- Solicitações Pendentes (RH) ---
    async function carregarSolicitacoesPendentes() {
        if (!rhSolicitacoesPendentes) return;
        rhSolicitacoesPendentes.innerHTML = '<p>Carregando...</p>';
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/rh/solicitacoes-pendentes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            rhSolicitacoesPendentes.innerHTML = ''; 
            if (data.solicitacoes && data.solicitacoes.length > 0) {
                data.solicitacoes.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'solicitacao-card';
                    card.innerHTML = `
                        <p><strong>${s.nome_completo}</strong> (${s.tipo_solicitacao})</p>
                        <p>Justif: ${s.justificativa}</p>
                        <div class="solicitacao-botoes">
                            <button class="btn-aprovar" data-id="${s.id_solicitacao}">Aprovar</button>
                            <button class="btn-rejeitar" data-id="${s.id_solicitacao}">Rejeitar</button>
                        </div>
                    `;
                    rhSolicitacoesPendentes.appendChild(card);
                });
                document.querySelectorAll('.btn-aprovar').forEach(btn => 
                    btn.addEventListener('click', () => processarSolicitacao(btn.dataset.id, 'Aprovado')));
                document.querySelectorAll('.btn-rejeitar').forEach(btn => 
                    btn.addEventListener('click', () => processarSolicitacao(btn.dataset.id, 'Rejeitado')));
            } else {
                rhSolicitacoesPendentes.innerHTML = '<p>Nenhuma pendência.</p>';
            }
        } catch (error) { rhSolicitacoesPendentes.innerHTML = `<p style="color:red">${error.message}</p>`; }
    }

    async function processarSolicitacao(id, status) {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/rh/processar-solicitacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id_solicitacao: id, novo_status: status })
            });
            carregarSolicitacoesPendentes(); 
        } catch (e) { console.error(e); }
    }

    // --- Verificação Inicial ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const tipo = localStorage.getItem('userType');
    if (token && user && tipo) showAppView(tipo, user);

});