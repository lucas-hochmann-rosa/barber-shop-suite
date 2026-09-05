/* Navegação, menu recolhível, modal e utilidades compartilhadas */

/* Formatação */

const Formato = {
    /** Formata um número como moeda brasileira: 45 -> "R$ 45,00". */
    moeda(valor) {
        return (Number(valor) || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    /** Aplica singular ou plural a uma quantidade: 1 atendimento, 2 atendimentos. */
    quantidade(valor, singular, plural) {
        const numero = Number(valor) || 0;
        return `${numero} ${numero === 1 ? singular : plural}`;
    },

    /** Data no padrão brasileiro: Date -> "13/08/2026". */
    data(data) {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /** Hora com dois dígitos: Date -> "14:20". */
    hora(data) {
        return data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /** Converte "2026-08-13T14:30" em objeto Date. */
    paraData(texto) {
        return new Date(texto);
    },

    /** Iniciais para o avatar: "Lucas Rosa" -> "LR". */
    iniciais(nome) {
        const partes = String(nome).trim().split(/\s+/);
        const primeira = partes[0] ? partes[0][0] : '';
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (primeira + ultima).toUpperCase();
    }
};

/* Dados vindos da API */

const OrigemContato = ['INSTAGRAM', 'WHATSAPP', 'PRESENCIAL', 'TELEFONE', 'OUTRO'];

function normalizarDataHora(valor) {
    if (valor instanceof Date) return valor;
    return valor ? new Date(valor) : null;
}

function normalizarAgendamento(a) {
    return {
        ...a,
        dataHora: normalizarDataHora(a.dataHora),
        valor: Number(a.valor ?? a.preco ?? 0),
        preco: Number(a.preco ?? a.valor ?? 0),
        duracaoMinutos: Number(a.duracaoMinutos || 30)
    };
}

function imagemBase64ParaSrc(valor) {
    if (!valor) return null;
    if (String(valor).startsWith('data:')) return valor;
    return `data:image/png;base64,${valor}`;
}

function imagemServico(servico) {
    if (servico && servico.imagemBase64) return imagemBase64ParaSrc(servico.imagemBase64);
    const mapa = {
        'corte masculino': '/shared-assets/img/servico-corte.svg',
        'barba tradicional': '/shared-assets/img/servico-barba.svg',
        'corte + barba': '/shared-assets/img/servico-combo.svg',
        'pezinho': '/shared-assets/img/servico-pezinho.svg',
        'sobrancelha': '/shared-assets/img/servico-sobrancelha.svg',
        'platinado': '/shared-assets/img/servico-platinado.svg'
    };
    return mapa[String(servico && servico.nome || '').toLowerCase()] || '/shared-assets/img/servico-corte.svg';
}

function imagemBarbeiro(barbeiro) {
    if (barbeiro && barbeiro.imagemBase64) return imagemBase64ParaSrc(barbeiro.imagemBase64);
    const indice = barbeiro && barbeiro.id ? ((Number(barbeiro.id) - 1) % 4) + 1 : 1;
    return `/shared-assets/img/avatar-${indice}.svg`;
}

function mostrarErroNaTela(seletor, erro, fallback) {
    const painel = document.querySelector(seletor);
    if (!painel) return;
    painel.hidden = false;
    painel.className = 'aviso aviso--erro';
    painel.textContent = erro && erro.message ? erro.message : fallback;
}

/* Menu recolhível */

const Menu = {
    iniciar() {
        const botao = document.querySelector('[data-abrir-menu]');
        const barra = document.querySelector('.barra-lateral');
        if (!botao || !barra) return;

        // O véu escurece o fundo e fecha o menu ao ser clicado
        const veu = document.createElement('div');
        veu.className = 'veu-menu';
        document.body.appendChild(veu);

        const fechar = () => {
            barra.classList.remove('esta-aberta');
            veu.classList.remove('esta-visivel');
            botao.setAttribute('aria-expanded', 'false');
        };

        botao.addEventListener('click', () => {
            const aberto = barra.classList.toggle('esta-aberta');
            veu.classList.toggle('esta-visivel', aberto);
            botao.setAttribute('aria-expanded', String(aberto));
        });

        veu.addEventListener('click', fechar);

        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape') fechar();
        });
    }
};

/* Navegação */

const Navegacao = {
    /** Marca o item da barra lateral correspondente à página aberta. */
    marcarPaginaAtual() {
        const arquivo = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.barra-lateral__link').forEach((link) => {
            const destino = link.getAttribute('href');
            if (destino === arquivo) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    },

    /** Preenche a data de hoje no topo. */
    preencherData() {
        const alvo = document.querySelector('[data-data-hoje]');
        if (alvo) alvo.textContent = Formato.data(new Date());
    }
};

/* Modal */

const Modal = {
    _elemento: null,
    _focoAnterior: null,

    /**
     * Abre o modal indicado. Guarda o elemento que tinha o foco para
     * devolvê-lo ao fechar, prende o foco dentro da caixa enquanto aberta.
     */
    abrir(seletor) {
        const modal = document.querySelector(seletor);
        if (!modal) return null;

        this._focoAnterior = document.activeElement;
        this._elemento = modal;
        modal.hidden = false;

        const primeiro = modal.querySelector(
            'input, select, textarea, button:not(.modal__fechar)'
        );
        if (primeiro) primeiro.focus();

        return modal;
    },

    fechar() {
        if (!this._elemento) return;
        this._elemento.hidden = true;
        if (this._focoAnterior) this._focoAnterior.focus();
        this._elemento = null;
        this._focoAnterior = null;
    },

    iniciar() {
        document.addEventListener('click', (evento) => {
            const fechador = evento.target.closest('[data-fechar-modal]');
            if (fechador) {
                evento.preventDefault();
                Modal.fechar();
                return;
            }
            // Clique no fundo escuro fecha
            if (evento.target.classList.contains('modal')) {
                Modal.fechar();
            }
        });

        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && Modal._elemento) {
                Modal.fechar();
            }
            // Mantém o foco preso dentro do modal aberto
            if (evento.key === 'Tab' && Modal._elemento) {
                const focaveis = Modal._elemento.querySelectorAll(
                    'a[href], button:not([disabled]), input, select, textarea'
                );
                if (!focaveis.length) return;
                const primeiro = focaveis[0];
                const ultimo = focaveis[focaveis.length - 1];
                if (evento.shiftKey && document.activeElement === primeiro) {
                    evento.preventDefault();
                    ultimo.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                    evento.preventDefault();
                    primeiro.focus();
                }
            }
        });
    }
};

/* Sessão */

const Sessao = {
    CHAVE_USUARIO: 'barbershop.usuario',
    CHAVE_USUARIO_ID: 'barbershop.usuarioId',
    CHAVE_BARBEARIA_ID: 'barbershop.barbeariaId',
    CHAVE_BARBEARIA_NOME: 'barbershop.barbeariaNome',

    entrar(usuario, dados = {}) {
        try {
            sessionStorage.setItem(this.CHAVE_USUARIO, usuario);
            if (dados.usuarioId) sessionStorage.setItem(this.CHAVE_USUARIO_ID, String(dados.usuarioId));
            if (dados.barbeariaId) sessionStorage.setItem(this.CHAVE_BARBEARIA_ID, String(dados.barbeariaId));
            if (dados.barbeariaNome) sessionStorage.setItem(this.CHAVE_BARBEARIA_NOME, dados.barbeariaNome);
        } catch (erro) {
            // Navegar com armazenamento bloqueado não deve quebrar a navegação
        }
        this.atualizarVisual();
    },

    sair() {
        try {
            sessionStorage.removeItem(this.CHAVE_USUARIO);
            sessionStorage.removeItem(this.CHAVE_USUARIO_ID);
            sessionStorage.removeItem(this.CHAVE_BARBEARIA_ID);
            sessionStorage.removeItem(this.CHAVE_BARBEARIA_NOME);
        } catch (erro) {
            /* ignora */
        }
        window.location.href = 'index.html';
    },

    usuario() {
        try {
            return sessionStorage.getItem(this.CHAVE_USUARIO);
        } catch (erro) {
            return null;
        }
    },

    usuarioId() {
        try {
            return Number(sessionStorage.getItem(this.CHAVE_USUARIO_ID) || 0);
        } catch (erro) {
            return 0;
        }
    },

    barbeariaId() {
        try {
            return Number(sessionStorage.getItem(this.CHAVE_BARBEARIA_ID) || 0);
        } catch (erro) {
            return 0;
        }
    },

    barbeariaNome() {
        try {
            return sessionStorage.getItem(this.CHAVE_BARBEARIA_NOME);
        } catch (erro) {
            return null;
        }
    },

    atualizarVisual() {
        const nome = this.barbeariaNome();
        if (nome) {
            document.querySelectorAll('.barra-lateral__barbearia')
                .forEach((e) => { e.textContent = nome; });
        }

        const usuario = this.usuario();
        if (usuario) {
            document.querySelectorAll('.topo__avatar')
                .forEach((e) => {
                    e.textContent = Formato.iniciais(usuario);
                    e.title = usuario;
                });
        }
    },

    iniciar() {
        this.atualizarVisual();

        const sair = document.querySelector('[data-sair]');
        if (sair) {
            sair.addEventListener('click', (evento) => {
                evento.preventDefault();
                Sessao.sair();
            });
        }
    }
};

/* Partida */

document.addEventListener('DOMContentLoaded', () => {
    Navegacao.marcarPaginaAtual();
    Navegacao.preencherData();
    Menu.iniciar();
    Modal.iniciar();
    Sessao.iniciar();
});
