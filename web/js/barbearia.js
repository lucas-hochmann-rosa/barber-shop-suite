/* Abas (dados, serviços, barbeiros), cartões e modal (RF03, RF04) */

const TelaBarbearia = {
    tipoEmEdicao: null,
    itemEmEdicao: null,
    barbearia: null,
    servicos: [],
    barbeiros: [],
    agendamentos: [],

    trocarAba(nome) {
        const paineis = {
            dados: 'painelDados',
            servicos: 'painelServicos',
            barbeiros: 'painelBarbeiros'
        };

        document.querySelectorAll('.aba').forEach((aba) => {
            const ativa = aba.dataset.aba === nome;
            aba.setAttribute('aria-selected', String(ativa));
        });

        Object.entries(paineis).forEach(([chave, id]) => {
            document.getElementById(id).hidden = chave !== nome;
        });
    },

    async carregarTudo() {
        const barbeariaId = Sessao.barbeariaId();
        const [barbearia, servicos, barbeiros, agendamentos] = await Promise.all([
            Api.obterBarbearia(),
            Api.listarServicos(barbeariaId),
            Api.listarBarbeiros(barbeariaId),
            Api.listarTodosAgendamentos(barbeariaId).catch(() => [])
        ]);

        this.barbearia = barbearia;
        this.servicos = servicos;
        this.barbeiros = barbeiros;
        this.agendamentos = agendamentos.map(normalizarAgendamento);

        Sessao.entrar(Sessao.usuario() || 'Usuário', {
            barbeariaId: barbearia.id,
            barbeariaNome: barbearia.nome
        });
    },

    carregarDados() {
        const b = this.barbearia;
        document.getElementById('barbeariaNome').value = b.nome || '';
        document.getElementById('barbeariaCep').value = b.cep || '';
        document.getElementById('barbeariaCultura').value = b.culturaValores || '';
        document.getElementById('barbeariaAbertura').value = b.horarioAbertura || '';
        document.getElementById('barbeariaFechamento').value = b.horarioFechamento || '';
    },

    async salvarDados(evento) {
        evento.preventDefault();
        const self = TelaBarbearia;
        const formulario = document.getElementById('formBarbearia');
        Validacao.limparTodos(formulario);

        const nome = document.getElementById('barbeariaNome');
        const abertura = document.getElementById('barbeariaAbertura');
        const fechamento = document.getElementById('barbeariaFechamento');

        let valido = Validacao.obrigatorio(nome, 'Informe o nome da barbearia.');

        if (abertura.value && fechamento.value && abertura.value >= fechamento.value) {
            Validacao.marcarErro(abertura, 'A abertura deve ser antes do fechamento.');
            valido = false;
        }
        if (!valido) return;

        const payload = {
            id: self.barbearia.id,
            nome: nome.value.trim(),
            cep: document.getElementById('barbeariaCep').value.trim(),
            culturaValores: document.getElementById('barbeariaCultura').value.trim(),
            horarioAbertura: abertura.value,
            horarioFechamento: fechamento.value
        };

        try {
            await Api.atualizarBarbearia(payload);
            self.barbearia = { ...self.barbearia, ...payload };
            Sessao.entrar(Sessao.usuario() || 'Usuário', {
                barbeariaId: self.barbearia.id,
                barbeariaNome: self.barbearia.nome
            });
            self.avisar('Dados da barbearia atualizados.');
        } catch (erro) {
            self.avisar(erro.message || 'Não foi possível atualizar os dados da barbearia.', 'erro');
        }
    },

    desenharServicos() {
        const grade = document.getElementById('gradeServicos');
        grade.innerHTML = this.servicos.map((s) => `
            <li class="cartao-item">
                <img class="cartao-item__foto" src="${imagemServico(s)}" alt="" width="320" height="180">
                <div class="cartao-item__corpo">
                    <h3 class="cartao-item__nome">${s.nome}</h3>
                    <p class="cartao-item__detalhe">
                        <span class="valor">${Formato.moeda(s.preco)}</span>
                        <span class="texto-secundario texto-pequeno"> · ${s.duracaoMinutos} min</span>
                    </p>
                </div>
                <div class="cartao-item__acoes">
                    <button class="botao botao--secundario" type="button" data-editar="servico" data-id="${s.id}">Editar</button>
                    <button class="botao botao--perigo" type="button" data-excluir="servico" data-id="${s.id}">Excluir</button>
                </div>
            </li>`).join('');
    },

    desenharBarbeiros() {
        const grade = document.getElementById('gradeBarbeiros');
        grade.innerHTML = this.barbeiros.map((b) => `
            <li class="cartao-item">
                <div class="cartao-item__avatar">
                    <img src="${imagemBarbeiro(b)}" alt="" width="96" height="96">
                </div>
                <div class="cartao-item__corpo">
                    <h3 class="cartao-item__nome">${b.nome}</h3>
                    <p class="cartao-item__detalhe texto-secundario texto-pequeno">
                        ${TelaBarbearia.contarAtendimentos(b.id)} atendimentos concluídos
                    </p>
                </div>
                <div class="cartao-item__acoes">
                    <button class="botao botao--secundario" type="button" data-editar="barbeiro" data-id="${b.id}">Editar</button>
                    <button class="botao botao--perigo" type="button" data-excluir="barbeiro" data-id="${b.id}">Excluir</button>
                </div>
            </li>`).join('');
    },

    contarAtendimentos(barbeiroId) {
        return this.agendamentos.filter(
            (a) => a.barbeiroId === barbeiroId && a.status === StatusAgendamento.CONCLUIDO
        ).length;
    },

    abrirModal(tipo, item) {
        this.tipoEmEdicao = tipo;
        this.itemEmEdicao = item || null;

        const ehServico = tipo === 'servico';
        const titulo = (item ? 'Editar ' : 'Novo ') + (ehServico ? 'serviço' : 'barbeiro');
        document.getElementById('modalTitulo').textContent = titulo;

        document.getElementById('camposServico').hidden = !ehServico;

        document.getElementById('itemNome').value = item ? item.nome : '';
        document.getElementById('itemPreco').value = item && ehServico ? item.preco : '';
        document.getElementById('itemDuracao').value = item && ehServico ? item.duracaoMinutos : 30;

        Validacao.limparTodos(document.getElementById('formModal'));
        Modal.abrir('#modalCadastro');
    },

    async salvarModal(evento) {
        evento.preventDefault();
        const self = TelaBarbearia;
        const formulario = document.getElementById('formModal');
        Validacao.limparTodos(formulario);

        const nome = document.getElementById('itemNome');
        const ehServico = self.tipoEmEdicao === 'servico';

        let valido = Validacao.obrigatorio(nome, 'Informe o nome.');

        let preco = 0;
        let duracao = 30;
        if (ehServico) {
            const campoPreco = document.getElementById('itemPreco');
            const campoDuracao = document.getElementById('itemDuracao');

            preco = Number(campoPreco.value);
            duracao = Number(campoDuracao.value);

            if (!campoPreco.value.trim() || isNaN(preco) || preco <= 0) {
                Validacao.marcarErro(campoPreco, 'Informe um preço maior que zero.');
                valido = false;
            }
            if (isNaN(duracao) || duracao < 5 || duracao > 480) {
                Validacao.marcarErro(campoDuracao, 'A duração deve ficar entre 5 e 480 minutos.');
                valido = false;
            }
        }

        if (!valido) return;

        try {
            if (ehServico) {
                const payload = {
                    barbeariaId: self.barbearia.id,
                    nome: nome.value.trim(),
                    preco,
                    duracaoMinutos: duracao,
                    imagemBase64: self.itemEmEdicao ? self.itemEmEdicao.imagemBase64 : null
                };

                if (self.itemEmEdicao) {
                    await Api.atualizarServico(self.itemEmEdicao.id, payload);
                    self.avisar('Serviço atualizado.');
                } else {
                    await Api.criarServico(payload);
                    self.avisar('Serviço cadastrado.');
                }
            } else {
                const payload = {
                    barbeariaId: self.barbearia.id,
                    nome: nome.value.trim(),
                    imagemBase64: self.itemEmEdicao ? self.itemEmEdicao.imagemBase64 : null
                };

                if (self.itemEmEdicao) {
                    await Api.atualizarBarbeiro(self.itemEmEdicao.id, payload);
                    self.avisar('Barbeiro atualizado.');
                } else {
                    await Api.criarBarbeiro(payload);
                    self.avisar('Barbeiro cadastrado.');
                }
            }

            Modal.fechar();
            await self.carregarTudo();
            self.carregarDados();
            self.desenharServicos();
            self.desenharBarbeiros();
        } catch (erro) {
            self.avisar(erro.message || 'Não foi possível salvar o cadastro.', 'erro');
        }
    },

    async excluir(tipo, id) {
        const ehServico = tipo === 'servico';
        const lista = ehServico ? this.servicos : this.barbeiros;
        const item = lista.find((i) => i.id === Number(id));
        if (!item) return;

        const emUso = this.agendamentos.filter(
            (a) => (ehServico ? a.servicoId : a.barbeiroId) === item.id
        ).length;

        try {
            if (ehServico) {
                await Api.excluirServico(item.id);
            } else {
                await Api.excluirBarbeiro(item.id);
            }

            await this.carregarTudo();
            this.desenharServicos();
            this.desenharBarbeiros();
            this.avisar(
                `${item.nome} foi excluído.`
                + (emUso ? ` ${emUso} agendamento(s) mantêm o nome registrado no histórico.` : ''),
                emUso ? 'alerta' : 'sucesso'
            );
        } catch (erro) {
            this.avisar(erro.message || `Não foi possível excluir ${item.nome}.`, 'erro');
        }
    },

    avisar(mensagem, tipo) {
        const painel = document.getElementById('avisoBarbearia');
        painel.hidden = false;
        painel.className = 'aviso aviso--' + (tipo || 'sucesso');
        painel.textContent = mensagem;

        clearTimeout(this._temporizador);
        if (tipo !== 'erro') {
            this._temporizador = setTimeout(() => { painel.hidden = true; }, 5000);
        }
    },

    async iniciar() {
        if (!document.getElementById('painelServicos')) return;

        try {
            await this.carregarTudo();
            this.carregarDados();
            this.desenharServicos();
            this.desenharBarbeiros();
            this.trocarAba('servicos');
        } catch (erro) {
            this.avisar(erro.message || 'Não foi possível carregar os dados da barbearia.', 'erro');
        }

        document.querySelectorAll('.aba').forEach((aba) => {
            aba.addEventListener('click', () => this.trocarAba(aba.dataset.aba));
        });

        document.getElementById('formBarbearia').addEventListener('submit', this.salvarDados);
        document.getElementById('formModal').addEventListener('submit', this.salvarModal);

        document.addEventListener('click', (evento) => {
            const novo = evento.target.closest('[data-novo]');
            if (novo) return this.abrirModal(novo.dataset.novo, null);

            const editar = evento.target.closest('[data-editar]');
            if (editar) {
                const tipo = editar.dataset.editar;
                const item = tipo === 'servico'
                    ? this.servicos.find((s) => s.id === Number(editar.dataset.id))
                    : this.barbeiros.find((b) => b.id === Number(editar.dataset.id));
                return this.abrirModal(tipo, item);
            }

            const excluir = evento.target.closest('[data-excluir]');
            if (excluir) return this.excluir(excluir.dataset.excluir, excluir.dataset.id);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => TelaBarbearia.iniciar());
