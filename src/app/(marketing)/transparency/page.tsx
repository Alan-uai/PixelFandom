import Link from 'next/link';

export default function TransparencyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Transparência</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Como funcionam as denúncias, a moderação e as ações sobre Wikis no PixelFandom
      </p>

      <div className="prose prose-invert space-y-8">
        <section>
          <h2>Denúncias de Wiki</h2>
          <p>
            Qualquer usuário logado pode denunciar uma Wiki. A denúncia é enviada para
            avaliação da nossa equipe (admin do site) e do nosso sistema automatizado.
            Ao denunciar, o usuário informa um motivo (lista fechada) e pode descrever
            detalhes livres. Cada usuário conta como um denunciante distinto — denúncias
            repetidas do mesmo usuário não aumentam a contagem.
          </p>
          <ul>
            <li>Spam ou conteúdo enganoso</li>
            <li>Conteúdo ilegal</li>
            <li>Discurso de ódio ou preconceito</li>
            <li>Assédio ou bullying</li>
            <li>Conteúdo impróprio (NSFW)</li>
            <li>Violação de direitos autorais</li>
            <li>Golpe ou fraude</li>
            <li>Outro motivo</li>
          </ul>
        </section>

        <section>
          <h2>Restrição automática</h2>
          <p>
            Quando uma Wiki é denunciada por <strong>mais de 500 usuários diferentes</strong>,
            ela entra automaticamente em <strong>“Acesso restrito para análise de denúncias”</strong>.
            Nesse estado, o conteúdo fica temporariamente indisponível enquanto a equipe e o
            sistema realizam a análise. Denúncias rejeitadas ou arquivadas não contam para o limite.
          </p>
          <p>
            Qualquer volume acima de 500 denunciantes distintos aciona a restrição automática
            e recebe prioridade máxima (urgência) no painel de moderação.
          </p>
        </section>

        <section>
          <h2>Avaliação pela equipe</h2>
          <p>
            O admin do site analisa cada denúncia e pode: resolver, rejeitar ou arquivar
            denúncias individualmente; levantar ou manter a restrição da Wiki. A restrição
            só é levantada após a conclusão da análise.
          </p>
        </section>

        <section>
          <h2>Notificação aos donos (report)</h2>
          <p>
            Quando aplicável, a equipe envia um e-mail ao dono da Wiki informando:
          </p>
          <ul>
            <li>o resumo das denúncias recebidas (import);</li>
            <li>o motivo da avaliação;</li>
            <li>a <strong>multa</strong> cabível, se houver;</li>
            <li>o <strong>tempo de Wiki fora do ar</strong>, se aplicável;</li>
            <li>observações da equipe.</li>
          </ul>
        </section>

        <section>
          <h2>Exclusão da Wiki</h2>
          <p>
            Em casos graves, a equipe pode excluir definitivamente uma Wiki. A exclusão é
            precedida de um e-mail ao dono explicando o motivo, as provas, e a quebra das
            políticas do site e/ou do contrato de uso que motiva o desligamento.
          </p>
          <p>
            A decisão de exclusão é <strong>definitiva</strong>: não há reversão de acordos,
            restauração de dados ou reativação da Wiki. O dono é comunicado de forma transparente
            sobre o encerramento.
          </p>
        </section>

        <section>
          <h2>Compromisso de transparência</h2>
          <p>
            Todo o processo de moderação é conduzido de forma centralizada pelo admin do site,
            garantindo critérios consistentes para todas as Wikis. Dúvidas ou apelo sobre uma
            decisão podem ser encaminhados à nossa equipe.
          </p>
        </section>
      </div>

      <div className="mt-10 text-sm text-muted-foreground">
        <Link href="/privacy" className="text-primary hover:underline">Privacidade</Link>
        {' · '}
        <Link href="/terms" className="text-primary hover:underline">Termos</Link>
      </div>
    </div>
  );
}
