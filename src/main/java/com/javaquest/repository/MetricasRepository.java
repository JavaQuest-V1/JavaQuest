package com.javaquest.repository;

import com.javaquest.service.MetricasService.RegistroDesempenhoCiclo;
import com.javaquest.service.MetricasService.RegistroOfensiva;
import com.javaquest.service.MetricasService.RegistroTempoSessao;
import java.util.Optional;

public interface MetricasRepository {

    Optional<RegistroOfensiva> buscarOfensiva(String email);

    RegistroOfensiva salvarOfensiva(String email, RegistroOfensiva ofensiva);

    Optional<RegistroTempoSessao> buscarTempo(String email);

    RegistroTempoSessao salvarTempo(String email, RegistroTempoSessao tempo);

    RegistroDesempenhoCiclo salvarHistoricoCiclo(String email, RegistroDesempenhoCiclo historico);
}