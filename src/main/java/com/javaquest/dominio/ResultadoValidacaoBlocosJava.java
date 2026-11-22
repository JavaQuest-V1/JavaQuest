package com.javaquest.dominio;

import java.util.List;

// retorno detalhado do validador de blocos pra alimentar o combate e o banco
public record ResultadoValidacaoBlocosJava(
        ResultadoExecucaoSubmissao resultadoExecucao,
        CategoriaErro categoriaErroDetectada,
        String identificadorLacunaComErro,
        String codigoJavaMontadoFinal,
        List<AcaoHeroi> acoesHeroiNaArena,
        long tempoExecucaoEmMilissegundos,
        String versaoValidadorBlocos,
        String mensagemFeedbackPedagogico) {

    public boolean submissaoFoiAprovada() {
        return resultadoExecucao == ResultadoExecucaoSubmissao.CORRETA;
    }
}
