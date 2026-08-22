package br.com.barbershop.seed;

import br.com.barbershop.model.Agendamento;
import br.com.barbershop.model.Barbearia;
import br.com.barbershop.model.Barbeiro;
import br.com.barbershop.model.OrigemContato;
import br.com.barbershop.model.Servico;
import br.com.barbershop.model.StatusAgendamento;
import br.com.barbershop.service.AgendaService;
import br.com.barbershop.service.BarbeariaService;
import br.com.barbershop.service.CatalogoService;
import br.com.barbershop.service.SetupService;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeder de dados de demonstração compartilhado entre desktop e web.
 * Utiliza exclusivamente os métodos públicos dos services de domínio para
 * popular o banco com dados consistentes e realistas.
 */
public class DadosDemonstracaoSeeder {

    private final SetupService setupService;
    private final CatalogoService catalogoService;
    private final AgendaService agendaService;
    private final BarbeariaService barbeariaService;

    public DadosDemonstracaoSeeder(SetupService setupService, CatalogoService catalogoService,
                                   AgendaService agendaService, BarbeariaService barbeariaService) {
        this.setupService = setupService;
        this.catalogoService = catalogoService;
        this.agendaService = agendaService;
        this.barbeariaService = barbeariaService;
    }

    /**
     * Semeia a base de dados apenas se nenhuma barbearia estiver cadastrada.
     *
     * @return {@code true} se os dados foram inseridos; {@code false} se já existia barbearia.
     */
    public boolean semearSeNecessario() throws SQLException {
        if (barbeariaService.buscarPrimeira() != null) {
            return false;
        }

        // 1. Barbearia
        Barbearia barbearia = new Barbearia(
                "Barbearia do Lucas",
                "90010-150",
                java.time.LocalDate.of(2020, 1, 1),
                "Tradição e excelência no corte clássico e moderno."
        );
        barbearia.setHorarioAbertura(LocalTime.of(8, 0));
        barbearia.setHorarioFechamento(LocalTime.of(20, 0));

        // 2. Serviços
        List<Servico> servicosIniciais = new ArrayList<>();
        servicosIniciais.add(criarServico("Corte Masculino", new BigDecimal("45.00"), 30));
        servicosIniciais.add(criarServico("Barba Tradicional", new BigDecimal("35.00"), 30));
        servicosIniciais.add(criarServico("Corte + Barba", new BigDecimal("70.00"), 60));
        servicosIniciais.add(criarServico("Pezinho / Acabamento", new BigDecimal("20.00"), 15));
        servicosIniciais.add(criarServico("Sobrancelha", new BigDecimal("15.00"), 15));
        servicosIniciais.add(criarServico("Platinado / Nevou", new BigDecimal("120.00"), 90));

        // 3. Barbeiros
        List<Barbeiro> barbeirosIniciais = new ArrayList<>();
        barbeirosIniciais.add(criarBarbeiro("Lucas Rosa"));
        barbeirosIniciais.add(criarBarbeiro("Matheus Silva"));
        barbeirosIniciais.add(criarBarbeiro("Gabriel Santos"));
        barbeirosIniciais.add(criarBarbeiro("Bruno Costa"));

        // 4. Criação do cadastro inicial com usuário admin: login barbershop / senha barbershop
        setupService.criarCadastroInicial(barbearia, "barbershop", "barbershop", servicosIniciais, barbeirosIniciais);

        int bId = barbearia.getId();
        List<Servico> servicos = catalogoService.listarServicos(bId);
        List<Barbeiro> barbeiros = catalogoService.listarBarbeiros(bId);

        Servico sCorte = servicos.get(0);
        Servico sBarba = servicos.get(1);
        Servico sCombo = servicos.get(2);
        Servico sPezinho = servicos.get(3);
        Servico sSobrancelha = servicos.get(4);
        Servico sPlatinado = servicos.get(5);

        Barbeiro bLucas = barbeiros.get(0);
        Barbeiro bMatheus = barbeiros.get(1);
        Barbeiro bGabriel = barbeiros.get(2);
        Barbeiro bBruno = barbeiros.get(3);

        LocalDateTime agora = LocalDateTime.now().withSecond(0).withNano(0);

        // 5. Agendamentos cobrindo todas as classificações visuais do RF11

        // (A) EM_ATENDIMENTO (1 agendamento)
        int idAtend = criarAgendamento(bId, sCombo, bLucas, "Carlos Eduardo", "(49) 99999-9901",
                agora.minusMinutes(10), OrigemContato.WHATSAPP);
        agendaService.iniciarAtendimento(idAtend);

        // (B) ATRASADOS (2 agendamentos com horário passado e status AGENDADO)
        criarAgendamento(bId, sCorte, bMatheus, "Rafael Souza", "(49) 99999-9902",
                agora.minusMinutes(45), OrigemContato.INSTAGRAM);
        criarAgendamento(bId, sBarba, bGabriel, "Felipe Andrade", "(49) 99999-9903",
                agora.minusMinutes(20), OrigemContato.PRESENCIAL);

        // (C) IMINENTES (2 agendamentos em até 30-45 min)
        criarAgendamento(bId, sCorte, bLucas, "Rodrigo Lima", "(49) 99999-9904",
                agora.plusMinutes(15), OrigemContato.WHATSAPP);
        criarAgendamento(bId, sPezinho, bBruno, "Gustavo Pereira", "(49) 99999-9905",
                agora.plusMinutes(25), OrigemContato.TELEFONE);

        // (D) PROXIMOS (2 agendamentos em até 60-90 min)
        criarAgendamento(bId, sBarba, bMatheus, "André Martins", "(49) 99999-9906",
                agora.plusMinutes(60), OrigemContato.WHATSAPP);
        criarAgendamento(bId, sSobrancelha, bGabriel, "Thiago Oliveira", "(49) 99999-9907",
                agora.plusMinutes(80), OrigemContato.OUTRO);

        // (E) DISTANTES / FUTUROS (3 agendamentos)
        criarAgendamento(bId, sCombo, bLucas, "Diego Ribeiro", "(49) 99999-9908",
                agora.plusMinutes(140), OrigemContato.WHATSAPP);
        criarAgendamento(bId, sCorte, bMatheus, "Marcelo Castro", "(49) 99999-9909",
                agora.plusDays(1).withHour(10).withMinute(0), OrigemContato.WHATSAPP);
        criarAgendamento(bId, sPlatinado, bBruno, "Leonardo Silva", "(49) 99999-9910",
                agora.plusDays(1).withHour(14).withMinute(30), OrigemContato.INSTAGRAM);

        // (F) CONCLUÍDOS (5 agendamentos)
        int idC1 = criarAgendamento(bId, sCorte, bLucas, "Vinicius Rocha", "(49) 99999-9911",
                agora.minusHours(4), OrigemContato.WHATSAPP);
        agendaService.concluirAtendimento(idC1);

        int idC2 = criarAgendamento(bId, sBarba, bMatheus, "Alexandre Pires", "(49) 99999-9912",
                agora.minusHours(3), OrigemContato.TELEFONE);
        agendaService.concluirAtendimento(idC2);

        int idC3 = criarAgendamento(bId, sCombo, bGabriel, "Henrique Costa", "(49) 99999-9913",
                agora.minusHours(2), OrigemContato.PRESENCIAL);
        agendaService.concluirAtendimento(idC3);

        int idC4 = criarAgendamento(bId, sCorte, bBruno, "Samuel Barbosa", "(49) 99999-9914",
                agora.minusDays(1).withHour(11).withMinute(0), OrigemContato.WHATSAPP);
        agendaService.concluirAtendimento(idC4);

        int idC5 = criarAgendamento(bId, sCombo, bLucas, "Danilo Mendes", "(49) 99999-9915",
                agora.minusDays(1).withHour(16).withMinute(0), OrigemContato.OUTRO);
        agendaService.concluirAtendimento(idC5);

        // (G) CANCELADOS (2 agendamentos com motivo)
        int idCanc1 = criarAgendamento(bId, sCorte, bBruno, "Fernando Ramos", "(49) 99999-9916",
                agora.minusHours(1), OrigemContato.WHATSAPP);
        agendaService.cancelarAgendamento(idCanc1, "Imprevisto no trabalho");

        int idCanc2 = criarAgendamento(bId, sBarba, bMatheus, "Julio Cesar", "(49) 99999-9917",
                agora.plusMinutes(45), OrigemContato.TELEFONE);
        agendaService.cancelarAgendamento(idCanc2, "Desistência do cliente");

        return true;
    }

    private static Servico criarServico(String nome, BigDecimal preco, int duracaoMinutos) {
        Servico s = new Servico();
        s.setNome(nome);
        s.setPreco(preco);
        s.setDuracaoMinutos(duracaoMinutos);
        return s;
    }

    private static Barbeiro criarBarbeiro(String nome) {
        Barbeiro b = new Barbeiro();
        b.setNome(nome);
        return b;
    }

    private int criarAgendamento(int barbeariaId, Servico servico, Barbeiro barbeiro, String clienteNome,
                                 String contato, LocalDateTime dataHora, OrigemContato origem) throws SQLException {
        Agendamento ag = new Agendamento(
                barbeariaId,
                servico.getId(),
                barbeiro.getId(),
                clienteNome,
                contato,
                dataHora,
                origem,
                StatusAgendamento.AGENDADO
        );
        ag.setServicoNome(servico.getNome());
        ag.setBarbeiroNome(barbeiro.getNome());
        ag.setDuracaoMinutos(servico.getDuracaoMinutos());
        return agendaService.criarAgendamento(ag);
    }
}
