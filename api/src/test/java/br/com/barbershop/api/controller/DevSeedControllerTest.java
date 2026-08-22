package br.com.barbershop.api.controller;

import br.com.barbershop.api.helper.InMemoryAgendamentoRepository;
import br.com.barbershop.api.helper.InMemoryBarbeariaRepository;
import br.com.barbershop.api.helper.InMemoryBarbeiroRepository;
import br.com.barbershop.api.helper.InMemoryClienteRepository;
import br.com.barbershop.api.helper.InMemoryServicoRepository;
import br.com.barbershop.api.helper.InMemoryUsuarioRepository;
import br.com.barbershop.api.helper.TestUtils;
import br.com.barbershop.seed.DadosDemonstracaoSeeder;
import br.com.barbershop.service.AgendaService;
import br.com.barbershop.service.BarbeariaService;
import br.com.barbershop.service.CatalogoService;
import br.com.barbershop.service.SetupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DevSeedControllerTest {

    private MockMvc mockMvc;
    private InMemoryBarbeariaRepository barbeariaRepo;
    private InMemoryUsuarioRepository usuarioRepo;
    private InMemoryServicoRepository servicoRepo;
    private InMemoryBarbeiroRepository barbeiroRepo;
    private InMemoryAgendamentoRepository agendamentoRepo;
    private InMemoryClienteRepository clienteRepo;

    @BeforeEach
    void setUp() {
        barbeariaRepo = new InMemoryBarbeariaRepository(null);
        usuarioRepo = new InMemoryUsuarioRepository();
        servicoRepo = new InMemoryServicoRepository();
        barbeiroRepo = new InMemoryBarbeiroRepository();
        agendamentoRepo = new InMemoryAgendamentoRepository();
        clienteRepo = new InMemoryClienteRepository();

        SetupService setupService = new SetupService(barbeariaRepo, usuarioRepo, servicoRepo, barbeiroRepo);
        CatalogoService catalogoService = new CatalogoService(servicoRepo, barbeiroRepo);
        AgendaService agendaService = new AgendaService(agendamentoRepo, clienteRepo);
        BarbeariaService barbeariaService = new BarbeariaService(barbeariaRepo);

        DadosDemonstracaoSeeder seeder = new DadosDemonstracaoSeeder(setupService, catalogoService, agendaService, barbeariaService);
        DevSeedController controller = new DevSeedController(seeder);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(TestUtils.createJsonConverter())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/dev/seed deve semear com sucesso quando banco está vazio")
    void semearSucesso() throws Exception {
        mockMvc.perform(post("/api/dev/seed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sucesso").value(true));
    }

    @Test
    @DisplayName("POST /api/dev/seed deve retornar 409 quando barbearia já existe")
    void semearConflitoQuandoJaExiste() throws Exception {
        // Primeira semeadura
        mockMvc.perform(post("/api/dev/seed"))
                .andExpect(status().isOk());

        // Segunda tentativa deve falhar com conflito
        mockMvc.perform(post("/api/dev/seed"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.sucesso").value(false));
    }
}
