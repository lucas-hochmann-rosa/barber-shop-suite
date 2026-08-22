/* Relatórios: faturamento, serviços mais vendidos e ranking (RF09) */

const Relatorios = {
    periodo() {
        return {
            de: document.getElementById('periodoDe').value,
            ate: document.getElementById('periodoAte').value
        };
    },

    desenharFaturamento(relatorio) {
        const total = Number(relatorio.faturamentoTotal || 0);
        document.getElementById('faturamentoTotal').textContent = Formato.moeda(total);

        const grafico = document.getElementById('graficoFaturamento');
        if (!total) {
            grafico.innerHTML = '<p class="texto-secundario texto-pequeno">Sem dados no período.</p>';
            return;
        }

        const inicio = relatorio.inicio ? relatorio.inicio.split('-').reverse().join('/') : 'início';
        const fim = relatorio.fim ? relatorio.fim.split('-').reverse().join('/') : 'fim';
        grafico.innerHTML = `
            <div class="grafico-barras__coluna">
                <span class="grafico-barras__valor mono">${Math.round(total).toLocaleString('pt-BR')}</span>
                <div class="grafico-barras__area">
                    <div class="grafico-barras__barra" style="height:100%"
                         title="${inicio} a ${fim}: ${Formato.moeda(total)}"></div>
                </div>
                <span class="grafico-barras__rotulo mono">Total</span>
            </div>`;
        grafico.setAttribute('aria-label', `Faturamento de ${inicio} a ${fim}: ${Formato.moeda(total)}`);
    },

    desenharVendidos(relatorio) {
        const lista = document.getElementById('listaVendidos');
        const vazio = document.getElementById('vendidosVazio');
        const ordenados = (relatorio.servicosMaisVendidos || []).slice(0, 5);

        if (!ordenados.length) {
            lista.innerHTML = '';
            vazio.hidden = false;
            return;
        }
        vazio.hidden = true;

        const maior = Math.max(...ordenados.map((item) => Number(item.quantidade || 0)), 1);

        lista.innerHTML = ordenados.map((item) => `
            <li class="barra-horizontal">
                <span class="barra-horizontal__nome">${item.nome}</span>
                <span class="barra-horizontal__trilho">
                    <span class="barra-horizontal__preenchimento"
                          style="width:${Math.round((Number(item.quantidade || 0) / maior) * 100)}%"></span>
                </span>
                <span class="barra-horizontal__numero mono">${item.quantidade}</span>
            </li>`).join('');
    },

    desenharRanking(relatorio) {
        const podio = document.getElementById('podio');
        const vazio = document.getElementById('rankingVazio');
        const ordenados = (relatorio.rankingBarbeiros || []).slice(0, 3);

        if (!ordenados.length) {
            podio.innerHTML = '';
            vazio.hidden = false;
            return;
        }
        vazio.hidden = true;

        podio.innerHTML = ordenados.map((item, indice) => `
            <li class="podio__lugar">
                <span class="podio__posicao">${indice + 1}º</span>
                <img class="podio__foto" src="/shared-assets/img/avatar-${(indice % 4) + 1}.svg" alt="" width="96" height="96">
                <span class="podio__nome">${item.nome}</span>
                <strong class="podio__numero">${item.quantidade} atendimentos</strong>
                <span class="texto-pequeno texto-secundario valor">${Formato.moeda(item.total)}</span>
            </li>`).join('');
    },

    async gerar(evento) {
        if (evento) evento.preventDefault();
        const self = Relatorios;

        const { de, ate } = self.periodo();
        const aviso = document.getElementById('avisoRelatorio');

        if (de && ate && de > ate) {
            aviso.hidden = false;
            aviso.textContent = 'A data inicial não pode ser depois da data final.';
            return;
        }
        aviso.hidden = true;

        try {
            const relatorio = await Api.gerarRelatorio(de, ate);
            self.desenharFaturamento(relatorio);
            self.desenharVendidos(relatorio);
            self.desenharRanking(relatorio);
        } catch (erro) {
            aviso.hidden = false;
            aviso.textContent = erro.message || 'Não foi possível gerar o relatório.';
        }
    },

    iniciar() {
        if (!document.getElementById('formPeriodo')) return;

        const hoje = new Date();
        const trintaDias = new Date();
        trintaDias.setDate(trintaDias.getDate() - 30);

        document.getElementById('periodoDe').value = this.paraCampo(trintaDias);
        document.getElementById('periodoAte').value = this.paraCampo(hoje);

        document.getElementById('formPeriodo').addEventListener('submit', this.gerar);
        this.gerar();
    },

    paraCampo(data) {
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${data.getFullYear()}-${mes}-${dia}`;
    }
};

document.addEventListener('DOMContentLoaded', () => Relatorios.iniciar());
