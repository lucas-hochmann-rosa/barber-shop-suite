package br.com.barbershop.api.controller;

import br.com.barbershop.api.dto.MensagemResponse;
import br.com.barbershop.seed.DadosDemonstracaoSeeder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;

/**
 * Endpoint de desenvolvimento para semear dados de demonstração no banco.
 */
@RestController
@RequestMapping("/api/dev")
public class DevSeedController {

    private final DadosDemonstracaoSeeder seeder;

    public DevSeedController(DadosDemonstracaoSeeder seeder) {
        this.seeder = seeder;
    }

    @PostMapping("/seed")
    public ResponseEntity<MensagemResponse> semear() throws SQLException {
        boolean semeou = seeder.semearSeNecessario();
        if (semeou) {
            return ResponseEntity.ok(new MensagemResponse(true, "Dados de demonstração semeados com sucesso."));
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MensagemResponse(false, "Já existe barbearia cadastrada no banco de dados."));
        }
    }
}
