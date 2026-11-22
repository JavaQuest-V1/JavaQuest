package com.javaquest.repository;

import com.javaquest.dominio.SessaoAutenticada;
import java.util.Optional;

public interface SessaoRepository {

    Optional<SessaoAutenticada> buscarPorToken(String tokenJwt);

    SessaoAutenticada salvar(String tokenJwt, SessaoAutenticada sessao);
}