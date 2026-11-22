package com.javaquest.repository;

import com.javaquest.dominio.Jogador;
import java.util.Optional;

public interface JogadorRepository {

    Optional<Jogador> buscarPorEmail(String email);

    Jogador salvar(Jogador jogador);
}