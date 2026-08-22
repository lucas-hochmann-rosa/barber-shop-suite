package br.com.barbershop.app;

import br.com.barbershop.seed.DadosDemonstracaoSeeder;

import java.io.PrintStream;
import java.nio.charset.StandardCharsets;

/**
 * Utilitário de linha de comando para semear os dados de demonstração no MySQL
 * antes de apresentações ou testes manuais.
 *
 * Uso via JAR:
 * {@code java -cp desktop/target/barber-shop-desktop-1.0-SNAPSHOT.jar br.com.barbershop.app.SeedDemoData}
 */
public class SeedDemoData {

    public static void main(String[] args) {
        System.setOut(new PrintStream(System.out, true, StandardCharsets.UTF_8));
        System.setErr(new PrintStream(System.err, true, StandardCharsets.UTF_8));

        System.out.println("==================================================");
        System.out.println("💈 Barbershop - Semeador de Dados de Demonstração");
        System.out.println("==================================================");

        try {
            FabricaDeServicos fabrica = new FabricaDeServicos();
            fabrica.criarDatabaseInitService().ensureSchema();

            DadosDemonstracaoSeeder seeder = fabrica.criarDadosDemonstracaoSeeder();
            boolean semeou = seeder.semearSeNecessario();

            if (semeou) {
                System.out.println("✔ Base de demonstração semeada com sucesso!");
                System.out.println("  Barbearia: Barbearia do Lucas");
                System.out.println("  Usuário:   barbershop");
                System.out.println("  Senha:     barbershop");
                System.out.println("  Serviços:  6 cadastrados");
                System.out.println("  Barbeiros: 4 cadastrados");
                System.out.println("  Agenda:    17 agendamentos gerados (cobrindo RF11)");
            } else {
                System.out.println("ℹ Nenhuma alteração feita: já existe uma barbearia cadastrada no banco.");
            }
            System.out.println("==================================================");
        } catch (Exception e) {
            System.err.println("✖ Erro ao semear dados de demonstração: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
