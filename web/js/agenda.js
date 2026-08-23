/* Régua do dia, cartões-resumo, grade de serviços e tabela de pendentes (RF08, RF11, RF07) */

const Agenda = {
    agendamentos: [],
    servicos: [],
    expediente: { inicio: 8, fim: 20 },

    async carregar() {
        const barbeariaId = Sessao.barbeariaId();
        const [barbearia, servicos, agendamentos] = await Promise.all([
            Api.obterBarbearia().catch(() => null),
            Api.listarServicos(barbeariaId),
            Api.listarAgendaHoje(barbeariaId)
        ]);

        this.servicos = servicos;
        this.agendamentos = agendamentos.map(normalizarAgendamento);

        if (barbearia) {
            this.expediente = {
                inicio: Number(String(barbearia.horarioAbertura || '08:00').slice(0, 2)),
                fim: Number(String(barbearia.horarioFechamento || '20:00').slice(0, 2))
            };
            Sessao.entrar(Sessao.usuario() || 'Usuário', {
                barbeariaId: barbearia.id,
                barbeariaNome: barbearia.nome
            });
        }
    },

    desenhar() {
        const agora = new Date();
        this.desenharRegua(this.agendamentos, agora);
        this.desenharResumo(this.agendamentos, agora);
        this.desenharTabela(agora);
    },

    posicao(data) {
        const { inicio, fim } = this.expediente;
        const minutos = data.getHours() * 60 + data.getMinutes() - inicio * 60;
        const total = (fim - inicio) * 60;
        return (minutos / total) * 100;
    },

    desenharRegua(doDia, agora) {
        const trilho = document.getElementById('reguaTrilho');
        const escala = document.getElementById('reguaEscala');
        if (!trilho) return;

        const { inicio, fim } = this.expediente;
        let marcas = '';
        for (let h = inicio; h <= fim; h += 2) {
            const pos = ((h - inicio) / (fim - inicio)) * 100;
            marcas += `<span class="regua__hora" style="left:${pos}%">${String(h).padStart(2, '0')}h</span>`;
        }
        escala.innerHTML = marcas;

        let blocos = '<span class="regua__barra"></span>';

        doDia.forEach((a) => {
            const pos = this.posicao(a.dataHora);
            if (pos < 0 || pos > 100) return;

            const cls = a.classificacao || classificar(a, agora);
            const hora = Formato.hora(a.dataHora);

            blocos += `
                <button type="button" class="regua__bloco cls-${cls}" style="left:${pos}%"
                        aria-label="${hora}, ${a.clienteNome}, ${a.servicoNome}, ${RotuloClassificacao[cls]}">
                    <span class="regua__balao" role="tooltip">
                        <strong>${a.clienteNome}</strong>
                        ${a.servicoNome}
                        <span class="hora">${hora}</span> &middot; ${a.barbeiroNome}
                    </span>
                </button>`;
        });

        const posAgora = this.posicao(agora);
        if (posAgora >= 0 && posAgora <= 100) {
            blocos += `<span class="regua__agulha" style="left:${posAgora}%" aria-hidden="true"></span>`;
        }

        trilho.innerHTML = blocos;

        const rotuloAgora = document.getElementById('reguaAgora');
        if (rotuloAgora) {
            let estadoExpediente = '';
            if (posAgora < 0) {
                estadoExpediente = ' · antes do expediente';
            } else if (posAgora > 100) {
                estadoExpediente = ' · expediente encerrado';
            }
            rotuloAgora.textContent = 'agora · ' + Formato.hora(agora) + estadoExpediente;
        }
    },

    desenharResumo(doDia, agora) {
        const atrasados = doDia.filter((a) => (a.classificacao || classificar(a, agora)) === ClassificacaoAgenda.ATRASADO).length;
        const emAtendimento = doDia.filter((a) => a.status === StatusAgendamento.EM_ATENDIMENTO).length;
        const previsto = doDia
            .filter((a) => a.status !== StatusAgendamento.CANCELADO)
            .reduce((soma, a) => soma + a.valor, 0);

        this.texto('resumoHoje', doDia.length + (doDia.length === 1 ? ' atendimento' : ' atendimentos'));
        this.texto('resumoAtrasados', String(atrasados));
        this.texto('resumoEmAtendimento', String(emAtendimento));
        this.texto('resumoFaturamento', Formato.moeda(previsto));
    },

    texto(id, valor) {
        const alvo = document.getElementById(id);
        if (alvo) alvo.textContent = valor;
    },

    desenharServicos() {
        const grade = document.getElementById('gradeServicos');
        if (!grade) return;

        grade.innerHTML = this.servicos.map((s) => `
            <li>
                <a class="cartao-servico" href="agendamento.html?servico=${s.id}">
                    <img class="cartao-servico__foto" src="${imagemServico(s)}" alt="" width="320" height="180">
                    <span class="cartao-servico__nome">${s.nome}</span>
                    <span class="cartao-servico__preco valor">${Formato.moeda(s.preco)}</span>
                    <span class="cartao-servico__duracao texto-pequeno texto-secundario">${s.duracaoMinutos} min</span>
                </a>
            </li>`).join('');
    },

    desenharTabela(agora) {
        const corpo = document.getElementById('corpoPendentes');
        const vazio = document.getElementById('pendentesVazio');
        if (!corpo) return;

        const pendentes = this.agendamentos.filter(
            (a) => a.status === StatusAgendamento.AGENDADO || a.status === StatusAgendamento.EM_ATENDIMENTO
        ).sort((a, b) => b.dataHora - a.dataHora);

        if (!pendentes.length) {
            corpo.innerHTML = '';
            if (vazio) vazio.hidden = false;
            return;
        }
        if (vazio) vazio.hidden = true;

        corpo.innerHTML = pendentes.map((a) => {
            const cls = a.classificacao || classificar(a, agora);
            const podeIniciar = a.status === StatusAgendamento.AGENDADO;
            const podeConcluir = a.status === StatusAgendamento.EM_ATENDIMENTO;
            const classeSelo = cls === ClassificacaoAgenda.ATRASADO
                ? 'atrasado'
                : (a.status === StatusAgendamento.EM_ATENDIMENTO ? 'em-atendimento' : 'agendado');
            const rotuloSelo = cls === ClassificacaoAgenda.ATRASADO ? RotuloClassificacao[cls] : RotuloStatus[a.status];

            return `
            <tr class="linha-${cls}">
                <td class="celula-faixa">
                    <span class="faixa-classificacao cls-${cls}" title="${RotuloClassificacao[cls]}"></span>
                    <span class="apenas-leitor-tela">${RotuloClassificacao[cls]}</span>
                </td>
                <td class="hora">${Formato.hora(a.dataHora)}</td>
                <td>${a.clienteNome}<br><span class="texto-pequeno texto-secundario">${a.contato}</span></td>
                <td>${a.servicoNome}</td>
                <td>${a.barbeiroNome}</td>
                <td><span class="selo selo--${classeSelo}">${rotuloSelo}</span></td>
                <td>
                    <div class="grupo-acoes">
                        <button type="button" class="botao-acao" data-acao="iniciar" data-id="${a.id}"
                                ${podeIniciar ? '' : 'disabled'} title="Iniciar atendimento" aria-label="Iniciar atendimento de ${a.clienteNome}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5Z"/></svg>
                        </button>
                        <button type="button" class="botao-acao" data-acao="concluir" data-id="${a.id}"
                                ${podeConcluir ? '' : 'disabled'} title="Concluir atendimento" aria-label="Concluir atendimento de ${a.clienteNome}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>
                        </button>
                        <a class="botao-acao" href="agendamento.html?id=${a.id}"
                           title="Editar agendamento" aria-label="Editar agendamento de ${a.clienteNome}">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="M14 6l4 4"/></svg>
                        </a>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    async tratarAcao(evento) {
        const botao = evento.target.closest('[data-acao]');
        if (!botao || botao.disabled) return;

        const agendamento = Agenda.agendamentos.find((a) => a.id === Number(botao.dataset.id));
        if (!agendamento) return;

        try {
            botao.disabled = true;
            if (botao.dataset.acao === 'iniciar') {
                await Api.iniciarAtendimento(agendamento.id);
                Agenda.anunciar(`Atendimento de ${agendamento.clienteNome} iniciado.`);
            } else if (botao.dataset.acao === 'concluir') {
                await Api.concluirAtendimento(agendamento.id);
                Agenda.anunciar(`Atendimento de ${agendamento.clienteNome} concluído.`);
            }

            await Agenda.carregar();
            Agenda.desenhar();
        } catch (erro) {
            Agenda.anunciarErro(erro.message || 'Não foi possível atualizar o atendimento.');
        }
    },

    anunciar(mensagem) {
        const painel = document.getElementById('avisoAgenda');
        if (!painel) return;

        painel.hidden = false;
        painel.className = 'aviso aviso--sucesso';
        painel.textContent = mensagem;

        clearTimeout(this._temporizador);
        this._temporizador = setTimeout(() => { painel.hidden = true; }, 4000);
    },

    anunciarErro(mensagem) {
        const painel = document.getElementById('avisoAgenda');
        if (!painel) return;

        painel.hidden = false;
        painel.className = 'aviso aviso--erro';
        painel.textContent = mensagem;
    },

    async iniciar() {
        try {
            await this.carregar();
            this.desenharServicos();
            this.desenhar();
        } catch (erro) {
            this.anunciarErro(erro.message || 'Não foi possível carregar a agenda. Confira se a API está em execução.');
        }

        document.addEventListener('click', this.tratarAcao);
        setInterval(() => this.desenhar(), 60000);
    }
};

document.addEventListener('DOMContentLoaded', () => Agenda.iniciar());
