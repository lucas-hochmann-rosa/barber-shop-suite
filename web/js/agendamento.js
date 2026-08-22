/* Formulário de novo agendamento / edição (RF05, RF06, RF10) */

const TelaAgendamento = {
    emEdicao: null,
    servicos: [],
    barbeiros: [],

    async carregarDadosBase() {
        const barbeariaId = Sessao.barbeariaId();
        const [servicos, barbeiros] = await Promise.all([
            Api.listarServicos(barbeariaId),
            Api.listarBarbeiros(barbeariaId)
        ]);
        this.servicos = servicos;
        this.barbeiros = barbeiros;
    },

    preencherSelecoes() {
        const servico = document.getElementById('servico');
        const barbeiro = document.getElementById('barbeiro');
        const origem = document.getElementById('origemContato');

        servico.innerHTML = '<option value="">Selecione…</option>'
            + this.servicos.map((s) =>
                `<option value="${s.id}">${s.nome} - ${Formato.moeda(s.preco)} (${s.duracaoMinutos} min)</option>`
            ).join('');

        barbeiro.innerHTML = '<option value="">Selecione…</option>'
            + this.barbeiros.map((b) => `<option value="${b.id}">${b.nome}</option>`).join('');

        const rotulos = {
            INSTAGRAM: 'Instagram', WHATSAPP: 'WhatsApp', PRESENCIAL: 'Presencial',
            TELEFONE: 'Telefone', OUTRO: 'Outro'
        };
        origem.innerHTML = OrigemContato.map((o) => `<option value="${o}">${rotulos[o]}</option>`).join('');
    },

    async lerEndereco() {
        const parametros = new URLSearchParams(window.location.search);

        const idEdicao = parametros.get('id');
        if (idEdicao) {
            const agendamento = normalizarAgendamento(await Api.buscarAgendamentoPorId(idEdicao));
            this.emEdicao = agendamento;
            this.carregarParaEdicao(agendamento);
            return;
        }

        const servicoEscolhido = parametros.get('servico');
        if (servicoEscolhido && this.servicoPorId(servicoEscolhido)) {
            document.getElementById('servico').value = servicoEscolhido;
        }

        const sugestao = new Date();
        sugestao.setMinutes(sugestao.getMinutes() + 30, 0, 0);
        sugestao.setMinutes(sugestao.getMinutes() < 30 ? 0 : 30);
        document.getElementById('data').value = this.paraCampoData(sugestao);
        document.getElementById('hora').value = this.paraCampoHora(sugestao);
    },

    carregarParaEdicao(a) {
        document.getElementById('tituloPagina').textContent = 'Editar agendamento';
        document.title = 'Editar agendamento · Barbershop';

        document.getElementById('clienteNome').value = a.clienteNome;
        document.getElementById('contato').value = a.contato;
        document.getElementById('origemContato').value = a.origemContato;
        document.getElementById('data').value = this.paraCampoData(a.dataHora);
        document.getElementById('hora').value = this.paraCampoHora(a.dataHora);
        document.getElementById('servico').value = a.servicoId;
        document.getElementById('barbeiro').value = a.barbeiroId;
        document.getElementById('observacoes').value = a.observacoes || '';

        const excluir = document.getElementById('botaoExcluir');
        excluir.hidden = false;
        excluir.addEventListener('click', () => this.excluir());
    },

    paraCampoData(data) {
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${data.getFullYear()}-${mes}-${dia}`;
    },

    paraCampoHora(data) {
        return String(data.getHours()).padStart(2, '0') + ':'
            + String(data.getMinutes()).padStart(2, '0');
    },

    paraApiLocalDateTime(data) {
        return this.paraCampoData(data) + 'T' + this.paraCampoHora(data) + ':00';
    },

    dataHoraEscolhida() {
        const data = document.getElementById('data').value;
        const hora = document.getElementById('hora').value;
        if (!data || !hora) return null;
        return new Date(data + 'T' + hora);
    },

    servicoPorId(id) {
        return this.servicos.find((s) => s.id === Number(id));
    },

    barbeiroPorId(id) {
        return this.barbeiros.find((b) => b.id === Number(id));
    },

    servicoEscolhido() {
        return this.servicoPorId(document.getElementById('servico').value);
    },

    barbeiroEscolhido() {
        return this.barbeiroPorId(document.getElementById('barbeiro').value);
    },

    atualizarResumo() {
        const servico = this.servicoEscolhido();
        const barbeiro = this.barbeiroEscolhido();
        const quando = this.dataHoraEscolhida();

        document.getElementById('resumoServico').textContent = servico ? servico.nome : '-';
        document.getElementById('resumoDuracao').textContent = servico ? servico.duracaoMinutos + ' min' : '-';
        document.getElementById('resumoBarbeiro').textContent = barbeiro ? barbeiro.nome : '-';
        document.getElementById('resumoQuando').textContent = quando
            ? Formato.data(quando) + ' ' + Formato.hora(quando)
            : '-';
        document.getElementById('resumoTotal').textContent = Formato.moeda(servico ? servico.preco : 0);
    },

    async verificarConflito() {
        const painel = document.getElementById('painelConflito');
        const servico = this.servicoEscolhido();
        const barbeiro = this.barbeiroEscolhido();
        const quando = this.dataHoraEscolhida();

        const mostrar = (texto, tipo) => {
            painel.className = 'aviso aviso--' + tipo;
            painel.textContent = texto;
        };

        if (!barbeiro || !quando || !servico) {
            mostrar('Escolha serviço, barbeiro, data e hora para conferir a disponibilidade.', 'neutro');
            return true;
        }

        try {
            const resposta = await Api.verificarConflito(
                barbeiro.id,
                this.paraApiLocalDateTime(quando),
                servico.duracaoMinutos,
                Sessao.barbeariaId()
            );

            if (!resposta.dentroExpediente) {
                mostrar(resposta.mensagem, 'alerta');
                return false;
            }
            if (resposta.conflito) {
                mostrar(resposta.mensagem, 'erro');
                return false;
            }

            mostrar(`${barbeiro.nome} está livre neste horário.`, 'sucesso');
            return true;
        } catch (erro) {
            mostrar(erro.message || 'Não foi possível verificar a disponibilidade.', 'erro');
            return false;
        }
    },

    validar() {
        const formulario = document.getElementById('formAgendamento');
        Validacao.limparTodos(formulario);

        const clienteNome = document.getElementById('clienteNome');
        const contato = document.getElementById('contato');
        const data = document.getElementById('data');
        const hora = document.getElementById('hora');
        const servico = document.getElementById('servico');
        const barbeiro = document.getElementById('barbeiro');

        let valido = true;
        if (!Validacao.obrigatorio(clienteNome, 'Informe o nome do cliente.')) valido = false;

        if (!Validacao.obrigatorio(contato, 'Informe o contato do cliente.')) {
            valido = false;
        } else if (!Validacao.telefone(contato)) {
            valido = false;
        }

        if (!Validacao.obrigatorio(data, 'Escolha a data.')) {
            valido = false;
        } else if (!Validacao.dataNaoPassada(data, 'A data não pode ser anterior a hoje.')) {
            valido = false;
        }

        if (!Validacao.obrigatorio(hora, 'Escolha a hora.')) valido = false;
        if (!Validacao.obrigatorio(servico, 'Escolha o serviço.')) valido = false;
        if (!Validacao.obrigatorio(barbeiro, 'Escolha o barbeiro.')) valido = false;

        return valido;
    },

    montarPayload() {
        const quando = this.dataHoraEscolhida();
        return {
            barbeariaId: Sessao.barbeariaId(),
            clienteNome: document.getElementById('clienteNome').value.trim(),
            contato: document.getElementById('contato').value.trim(),
            origemContato: document.getElementById('origemContato').value,
            dataHora: this.paraApiLocalDateTime(quando),
            servicoId: Number(document.getElementById('servico').value),
            barbeiroId: Number(document.getElementById('barbeiro').value),
            status: this.emEdicao ? this.emEdicao.status : StatusAgendamento.AGENDADO
        };
    },

    async salvar(evento) {
        evento.preventDefault();
        const self = TelaAgendamento;

        Validacao.avisar('#avisoForm', '');

        if (!self.validar()) {
            Validacao.avisar('#avisoForm', 'Confira os campos destacados abaixo.', 'erro');
            const primeiroErro = document.querySelector('[aria-invalid="true"]');
            if (primeiroErro) primeiroErro.focus();
            return;
        }

        if (!await self.verificarConflito()) {
            Validacao.avisar('#avisoForm',
                'Não dá para salvar: veja a verificação de conflito ao lado.', 'erro');
            return;
        }

        try {
            const payload = self.montarPayload();
            if (self.emEdicao) {
                await Api.atualizarAgendamento(self.emEdicao.id, payload);
                Validacao.avisar('#avisoForm', 'Agendamento atualizado com sucesso.', 'sucesso');
                return;
            }

            await Api.criarAgendamento(payload);
            Validacao.avisar('#avisoForm', 'Agendamento salvo com sucesso.', 'sucesso');

            document.getElementById('formAgendamento').reset();
            self.atualizarResumo();
            await self.verificarConflito();
            document.getElementById('clienteNome').focus();
        } catch (erro) {
            Validacao.avisar('#avisoForm', erro.message || 'Não foi possível salvar o agendamento.', 'erro');
        }
    },

    async excluir() {
        if (!this.emEdicao) return;

        try {
            await Api.excluirAgendamento(this.emEdicao.id);
            this.emEdicao = null;
            document.getElementById('formAgendamento').reset();
            document.getElementById('botaoExcluir').hidden = true;
            this.atualizarResumo();
            Validacao.avisar('#avisoForm', 'Agendamento excluído com sucesso.', 'sucesso');
        } catch (erro) {
            Validacao.avisar('#avisoForm', erro.message || 'Não foi possível excluir o agendamento.', 'erro');
        }
    },

    async iniciar() {
        const formulario = document.getElementById('formAgendamento');
        if (!formulario) return;

        try {
            await this.carregarDadosBase();
            this.preencherSelecoes();
            await this.lerEndereco();
            this.atualizarResumo();
            await this.verificarConflito();
        } catch (erro) {
            Validacao.avisar('#avisoForm', erro.message || 'Não foi possível carregar os dados do agendamento.', 'erro');
        }

        Validacao.limparAoDigitar(formulario);

        ['servico', 'barbeiro', 'data', 'hora'].forEach((id) => {
            document.getElementById(id).addEventListener('change', async () => {
                this.atualizarResumo();
                await this.verificarConflito();
            });
        });

        formulario.addEventListener('submit', this.salvar);
    }
};

document.addEventListener('DOMContentLoaded', () => TelaAgendamento.iniciar());
