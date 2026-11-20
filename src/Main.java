import java.util.Scanner;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        LoginUsuario usuarioCadastrado = new LoginUsuario("001", "valdisonjunioor90@gmail.com", "Va22082004_");

        System.out.println("=== BEM-VINDO AO JAVA QUEST ===");
        System.out.println("Por favor, faça o login para iniciar a masmorra.");

        boolean loginSucesso = false;

        while (!loginSucesso && !usuarioCadastrado.isContaBloqueada()) {
            System.out.print("\nDigite seu email: ");
            String emailDigitado = scanner.nextLine();

            System.out.print("Digite sua senha: ");
            String senhaDigitada = scanner.nextLine();

            loginSucesso = usuarioCadastrado.fazerLogin(emailDigitado, senhaDigitada);

            if (!loginSucesso && !usuarioCadastrado.isContaBloqueada()) {
                System.out.println("Por favor, tente digitar novamente.");
            }
        }

        if (loginSucesso) {
            boolean jogando = true;

            while (jogando) {
                // Utilizando a sua classe PersonagemHeroi (com as 3 vidas iniciais)
                PersonagemHeroi heroi = new PersonagemHeroi("Junin", "M", "Programador");
                System.out.println("\n========================================================");
                System.out.println(" NOVA AVENTURA INICIADA!");
                System.out.println("Bem-vindo, " + heroi.getNomeHeroi() + "! Você tem " + heroi.getVidas() + " corações.");

                boolean gameOver = false;
                boolean desistiu = false;

                for (int nivel = 1; nivel <= 10; nivel++) {
                    if (gameOver || desistiu) break;

                    // Restaura as vidas sempre que passa para uma nova fase
                    heroi.restaurarVidas();

                    System.out.println("\n\n>>> CARREGANDO NÍVEL " + nivel + "...");
                    DesafioProgramacao[] desafiosDoNivel = GerenciadorDeNiveis.carregarNivel(nivel);

                    List<DesafioProgramacao> listaDesafios = Arrays.asList(desafiosDoNivel);
                    Collections.shuffle(listaDesafios);
                    listaDesafios.toArray(desafiosDoNivel);

                    for (int q = 0; q < desafiosDoNivel.length; q++) {
                        if (gameOver || desistiu) break;

                        boolean respondeu = false;

                        while (!respondeu && !gameOver && !desistiu) {
                            System.out.println("\n--- Batalha " + (q + 1) + " de 10 (Fase " + nivel + ") ---");

                            // 1. Inimigo mostra o código
                            desafiosDoNivel[q].exibirAtaqueInimigo();

                            System.out.print("\nPressione [ENTER] quando tiver decorado o código para atacar...");
                            scanner.nextLine();

                            // Imprime várias linhas em branco para "apagar" o código da tela e forçar a memória
                            for (int i = 0; i < 30; i++) System.out.println();

                            // 2. Herói tenta montar o código
                            desafiosDoNivel[q].exibirDesafioBlocos();
                            String escolha = scanner.nextLine();

                            if (escolha.equals("6")) {
                                System.out.println("\n Você escolheu abandonar a masmorra. Até a próxima!");
                                desistiu = true;
                                jogando = false;
                                break;
                            }

                            // Verifica se acertou a sequência dos blocos
                            boolean acertou = desafiosDoNivel[q].tentarResolver(escolha);

                            if (acertou) {
                                respondeu = true;
                            } else {
                                // Reduz 1 coração se errar
                                heroi.perderVida();

                                // Verifica se as 3 vidas acabaram
                                if (heroi.estaDerrotado()) {
                                    System.out.println("\n GAME OVER! Você perdeu todos os corações nesta fase.");
                                    gameOver = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (!gameOver && !desistiu) {
                        System.out.println("\n Parabéns, você limpou a fase " + nivel + "!");
                        if (nivel < 10) {
                            System.out.println("Preparando para avançar... Suas vidas serão restauradas!");
                        } else {
                            System.out.println("\n ZEROU O JOGO! Você chegou ao final dos 10 níveis!");
                            jogando = false;
                        }
                    }
                }

                if (gameOver && !desistiu) {
                    System.out.println("\n========================================================");
                    System.out.println(" Deseja tentar novamente do início?");
                    System.out.println("[1] Sim, voltar ao Nível 1");
                    System.out.println("[2] Não, sair do jogo");
                    System.out.print("Sua escolha: ");

                    String opcao = scanner.nextLine();
                    if (opcao.equals("2")) {
                        jogando = false;
                        System.out.println("Saindo da masmorra... Até a próxima, Herói!");
                    }
                }
            }

        } else {
            System.out.println("\nJogo encerrado. Acesso permanentemente bloqueado por segurança.");
        }

        scanner.close();
    }
}