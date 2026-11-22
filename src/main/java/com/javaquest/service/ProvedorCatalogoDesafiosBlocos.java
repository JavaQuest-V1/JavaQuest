package com.javaquest.service;

import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import java.util.List;
import java.util.Optional;

// contrato pra buscar variantes de blocos por andar (dps vai ler direto do Supabase)
public interface ProvedorCatalogoDesafiosBlocos {

    List<DefinicaoVarianteDesafioBlocos> listarVariantesAtivasPorAndar(int numeroAndarNaTorre);

    Optional<DefinicaoVarianteDesafioBlocos> buscarVariantePorIdentificador(Long identificadorDesafioNoBanco);
}
