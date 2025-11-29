const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const authMiddleware = require('./authMiddleware');

const app = express();
const port = 3000;
const JWT_SECRET = 'seu-segredo-super-secreto-aqui'; 

app.use(cors());
app.use(express.json());

// --- Rota de Login (Pública) ---
app.post('/login', (req, res) => {
    const { email, senha, tipo } = req.body;

    if (!email || !senha || !tipo) {
        return res.status(400).json({ message: 'Email, senha e tipo são obrigatórios.' });
    }

    let Tabela, CampoEmail, CampoID;
    if (tipo === 'funcionario') {
        Tabela = 'Funcionario';
        CampoEmail = 'email'; // O campo no DB é 'email'
        CampoID = 'id_funcionario';
    } else if (tipo === 'rh') {
        Tabela = 'UsuarioRH';
        CampoEmail = 'login'; // O campo no DB é 'login'
        CampoID = 'id_usuario_rh';
    } else {
        return res.status(400).json({ message: 'Tipo de usuário inválido.' });
    }

    const sql = `SELECT * FROM ${Tabela} WHERE ${CampoEmail} = ?`;
    
    db.get(sql, [email], (err, user) => {
        if (err) { return res.status(500).json({ message: 'Erro no servidor.' }); }
        if (!user) { return res.status(404).json({ message: 'Usuário não encontrado.' }); }

        const senhaValida = bcrypt.compareSync(senha, user.senha_hash);
        if (!senhaValida) { return res.status(401).json({ message: 'Senha inválida.' }); }

        const tokenPayload = {
            id: user[CampoID],
            email: user[CampoEmail],
            tipo: tipo
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        res.json({ 
            message: 'Login bem-sucedido!', 
            token: token,
            user: { nome: user.nome_completo || user.nome, email: user.email || user.login }
        });
    });
});

// --- Rota de Bater Ponto (Protegida) ---
app.post('/ponto/registrar', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado. Apenas funcionários podem bater ponto.' });
    }
    
    const { tipo_registro } = req.body;
    const id_funcionario = req.user.id;
    const data_hora = new Date().toISOString();

    const sql = `INSERT INTO RegistroPonto (id_funcionario, data_hora, tipo_registro) VALUES (?, ?, ?)`;
    
    db.run(sql, [id_funcionario, data_hora, tipo_registro], function(err) {
        if (err) { return res.status(500).json({ message: 'Erro ao registrar ponto.' }); }
        res.status(201).json({ message: `Ponto (${tipo_registro}) registrado com sucesso!`, id: this.lastID });
    });
});

// --- Rota do Funcionário: Listar Meus Registros (Protegida) ---
app.get('/ponto/meus-registros', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const id_funcionario = req.user.id;
    const sql = `SELECT data_hora, tipo_registro 
                 FROM RegistroPonto 
                 WHERE id_funcionario = ? 
                 ORDER BY data_hora DESC`;
    
    db.all(sql, [id_funcionario], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao buscar registros.' });
        }
        res.json({ registros: rows });
    });
});

// --- Rota do Funcionário: Enviar Solicitação de Ajuste/Atestado (Protegida) ---
app.post('/ponto/solicitar-ajuste', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const id_funcionario = req.user.id;
    const { tipo_solicitacao, justificativa, anexo_atestado } = req.body;
    if (!tipo_solicitacao || !justificativa) {
        return res.status(400).json({ message: 'Tipo da solicitação e justificativa são obrigatórios.' });
    }
    const data_solicitacao = new Date().toISOString();
    const status_aprovacao = 'Pendente';
    const sql = `INSERT INTO SolicitacaoAjuste 
        (id_funcionario, tipo_solicitacao, data_solicitacao, justificativa, anexo_atestado, status_aprovacao, visto_pelo_funcionario) 
        VALUES (?, ?, ?, ?, ?, ?, 0)`; // Adiciona visto_pelo_funcionario = 0
    
    db.run(sql, [id_funcionario, tipo_solicitacao, data_solicitacao, justificativa, anexo_atestado, status_aprovacao], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao enviar solicitação.' });
        }
        res.status(201).json({ 
            message: 'Solicitação enviada com sucesso! Aguarde aprovação do RH.', 
            id_solicitacao: this.lastID 
        });
    });
});

// --- Rota do Funcionário: Registrar Entrega (Protegida) ---
app.post('/ponto/registrar-entrega', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const id_funcionario = req.user.id;
    const { descricao_mercadoria, numero_nota_fiscal } = req.body;
    if (!descricao_mercadoria) {
        return res.status(400).json({ message: 'A descrição da mercadoria é obrigatória.' });
    }
    const data_hora_entrega = new Date().toISOString();
    const status_entrega = 'Concluída';
    const sql = `INSERT INTO Entrega 
        (id_funcionario, descricao_mercadoria, numero_nota_fiscal, data_hora_entrega, status_entrega) 
        VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [id_funcionario, descricao_mercadoria, numero_nota_fiscal, data_hora_entrega, status_entrega], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao registrar entrega.' });
        }
        res.status(201).json({ 
            message: 'Entrega registrada com sucesso!', 
            id_entrega: this.lastID 
        });
    });
});

// --- Rota do Funcionário: Buscar Notificações (Alertas) ---
app.get('/ponto/notificacoes', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const id_funcionario = req.user.id;

    // Busca solicitações processadas (Aprovado/Rejeitado) que ainda não foram vistas
    const sql = `
        SELECT id_solicitacao, tipo_solicitacao, status_aprovacao, justificativa
        FROM SolicitacaoAjuste
        WHERE id_funcionario = ?
        AND status_aprovacao != 'Pendente'
        AND visto_pelo_funcionario = 0
    `;
    
    db.all(sql, [id_funcionario], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao buscar notificações.' });
        }
        res.json({ notificacoes: rows });
    });
});

// --- Rota do Funcionário: Marcar Notificação como Vista ---
app.post('/ponto/marcar-notificacao-vista', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'funcionario') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const id_funcionario = req.user.id;
    const { id_solicitacao } = req.body;

    if (!id_solicitacao) {
        return res.status(400).json({ message: 'ID da solicitação é obrigatório.' });
    }

    const sql = `
        UPDATE SolicitacaoAjuste
        SET visto_pelo_funcionario = 1
        WHERE id_solicitacao = ? AND id_funcionario = ?
    `;

    db.run(sql, [id_solicitacao, id_funcionario], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao marcar notificação como vista.' });
        }
        res.json({ message: 'Notificação marcada como vista.' });
    });
});


// --- Rota de RH: Buscar Cargos e Departamentos ---
app.get('/rh/cargos-departamentos', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    
    const resposta = {
        cargos: [],
        departamentos: []
    };

    db.all(`SELECT * FROM Cargo`, [], (err, cargos) => {
        if (err) { return res.status(500).json({ message: 'Erro ao buscar cargos.' }); }
        resposta.cargos = cargos;

        db.all(`SELECT * FROM Departamento`, [], (err, departamentos) => {
            if (err) { return res.status(500).json({ message: 'Erro ao buscar departamentos.' }); }
            resposta.departamentos = departamentos;
            res.json(resposta);
        });
    });
});

// --- Rota de RH: Registrar Novo Funcionário (Atualizada) ---
app.post('/rh/registrar-funcionario', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado. Apenas o RH pode registrar funcionários.' });
    }
    
    // Adiciona id_cargo e id_departamento
    const { nome_completo, cpf, email, senha, data_admissao, id_cargo, id_departamento } = req.body;

    if (!nome_completo || !cpf || !email || !senha || !data_admissao) {
        return res.status(400).json({ message: 'Campos principais são obrigatórios.' });
    }
    
    const senha_hash = bcrypt.hashSync(senha, 10);
    const status = 'Ativo'; 
    
    const sql = `INSERT INTO Funcionario 
        (nome_completo, cpf, email, senha_hash, data_admissao, status, id_cargo, id_departamento) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [nome_completo, cpf, email, senha_hash, data_admissao, status, id_cargo, id_departamento], function(err) {
        if (err) {
            console.error(err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: 'Erro: Email ou CPF já cadastrado.' });
            }
            return res.status(500).json({ message: 'Erro ao registrar funcionário no banco de dados.' });
        }
        res.status(201).json({ 
            message: 'Funcionário registrado com sucesso!', 
            id: this.lastID 
        });
    });
});

// --- Rota de RH: Listar todos os funcionários (para o <select>) ---
app.get('/rh/funcionarios', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }
    const sql = `SELECT id_funcionario, nome_completo FROM Funcionario ORDER BY nome_completo`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao buscar funcionários.' });
        }
        res.json({ funcionarios: rows });
    });
});

// --- Rota de RH: Gerar Relatório de um Funcionário ---
app.get('/rh/relatorio/:id_funcionario', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }

    const id_funcionario = req.params.id_funcionario;
    const relatorio = {
        pontos: [],
        entregas: []
    };

    const sql_pontos = `SELECT data_hora, tipo_registro 
                        FROM RegistroPonto 
                        WHERE id_funcionario = ? 
                        ORDER BY data_hora DESC`;
    
    db.all(sql_pontos, [id_funcionario], (err, rowsPontos) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar registros de ponto.' });
        }
        relatorio.pontos = rowsPontos;

        const sql_entregas = `SELECT data_hora_entrega, descricao_mercadoria, numero_nota_fiscal 
                              FROM Entrega 
                              WHERE id_funcionario = ? 
                              ORDER BY data_hora_entrega DESC`;
        
        db.all(sql_entregas, [id_funcionario], (err, rowsEntregas) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao buscar entregas.' });
            }
            relatorio.entregas = rowsEntregas;
            res.json(relatorio);
        });
    });
});

// --- Rota de RH: Listar Solicitações Pendentes ---
app.get('/rh/solicitacoes-pendentes', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }

    const sql = `
        SELECT 
            s.id_solicitacao, 
            s.tipo_solicitacao, 
            s.data_solicitacao, 
            s.justificativa, 
            s.anexo_atestado,
            f.nome_completo
        FROM SolicitacaoAjuste s
        JOIN Funcionario f ON s.id_funcionario = f.id_funcionario
        WHERE s.status_aprovacao = 'Pendente'
        ORDER BY s.data_solicitacao ASC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao buscar solicitações.' });
        }
        res.json({ solicitacoes: rows });
    });
});

// --- Rota de RH: Processar Solicitação (Aprovar/Rejeitar) ---
app.post('/rh/processar-solicitacao', authMiddleware, (req, res) => {
    if (req.user.tipo !== 'rh') {
         return res.status(403).json({ message: 'Acesso negado.' });
    }

    const { id_solicitacao, novo_status } = req.body;
    const id_usuario_rh_aprovador = req.user.id; 

    if (!id_solicitacao || !novo_status || (novo_status !== 'Aprovado' && novo_status !== 'Rejeitado')) {
        return res.status(400).json({ message: 'Dados inválidos. Envie id_solicitacao e novo_status (Aprovado/Rejeitado).' });
    }

    const sql = `
        UPDATE SolicitacaoAjuste 
        SET 
            status_aprovacao = ?, 
            id_usuario_rh_aprovador = ?
        WHERE 
            id_solicitacao = ? AND status_aprovacao = 'Pendente'
    `;
    
    db.run(sql, [novo_status, id_usuario_rh_aprovador, id_solicitacao], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Erro ao processar solicitação.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Solicitação não encontrada ou já processada.' });
        }
        res.json({ message: `Solicitação ${novo_status.toLowerCase()} com sucesso!` });
    });
});


// --- Início do Servidor ---
app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});