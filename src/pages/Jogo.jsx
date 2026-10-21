// Página do jogo: galeria, trailer, caixa de preço, especificações,
// requisitos, avaliações e jogos relacionados
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { navegar } from '../rota.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import { moeda, data, estadoEstoque, resumoAvaliacoes, tempoRestante } from '../util/formatar.js';
import Imagem from '../components/Imagem.jsx';
import Preco from '../components/Preco.jsx';
import Selo from '../components/Selo.jsx';
import Estrelas from '../components/Estrelas.jsx';
import CardJogo from '../components/CardJogo.jsx';
import { Carregando, ErroCarregar } from '../components/Estado.jsx';

// Converte um link do YouTube no endereço de "embed" (para o iframe)
function linkEmbed(url) {
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url || '');
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

const NAO_INFORMADO = 'Não informado';

export default function Jogo({ id }) {
  const { usuario, desejos, alternarDesejo } = useAuth();
  const carrinho = useCarrinho();
  const { mostrarToast } = useToast();
  const [imagemAtual, setImagemAtual] = useState(0);
  const quem = usuario?.id || 0;

  const jogo = useCarregar(() => api(`/jogos/${id}`), [id, quem]);
  const avaliacoes = useCarregar(() => api(`/jogos/${id}/avaliacoes`), [id, quem]);
  const relacionados = useCarregar(() => api(`/jogos/${id}/relacionados`), [id, quem]);

  useEffect(() => setImagemAtual(0), [id]);

  if (jogo.carregando) return <div className="conteudo"><Carregando /></div>;
  if (jogo.erro) return <div className="conteudo"><ErroCarregar mensagem={jogo.erro} aoTentarDeNovo={jogo.recarregar} /></div>;

  const j = jogo.dados;
  const estoque = estadoEstoque(j.estoque);
  const imagens = j.imagens.length ? j.imagens : [{ id: 0, caminho_url: j.capa }];
  const trailer = j.videos[0];
  const embed = trailer && linkEmbed(trailer.url);
  const desejado = desejos.includes(j.id);
  const resumo = resumoAvaliacoes(j.total_avaliacoes, j.avaliacoes_positivas);
  const bloqueado = j.possui || estoque.esgotado;

  function adicionarAoCarrinho() {
    if (j.possui) {
      mostrarToast('Você já possui este jogo.', 'info');
      return false;
    }
    carrinho.adicionar(j.id);
    return true;
  }

  function comprarAgora() {
    if (adicionarAoCarrinho()) navegar('/carrinho');
  }

  function botaoCarrinho() {
    if (carrinho.contem(j.id)) {
      navegar('/carrinho');
      return;
    }
    if (adicionarAoCarrinho()) mostrarToast(`${j.nome} foi adicionado ao carrinho.`, 'sucesso');
  }

  return (
    <div className="conteudo pagina-jogo">
      <div className="trilha">
        <a href="#/loja">Todos os jogos</a> › {j.categorias[0] && <a href="#/loja">{j.categorias[0]}</a>} › {j.nome}
      </div>
      <h1>{j.nome}</h1>

      <div className="jogo-topo">
        {/* Galeria com miniaturas */}
        <div className="galeria">
          <div className="galeria-principal">
            <Imagem src={imagens[imagemAtual]?.caminho_url} alt={j.nome} />
          </div>
          {imagens.length > 1 && (
            <div className="galeria-miniaturas">
              {imagens.map((img, i) => (
                <button key={img.id || i} className={i === imagemAtual ? 'ativa' : ''} onClick={() => setImagemAtual(i)}>
                  <Imagem src={img.caminho_url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Resumo ao lado da galeria */}
        <aside className="jogo-resumo">
          <Imagem src={j.capa} alt="" className="jogo-resumo-capa" />
          <p>{j.descricao_curta}</p>
          <dl>
            <dt>Análises</dt>
            <dd className={`resumo-${resumo.classe}`}>{resumo.texto} {j.total_avaliacoes > 0 && `(${j.total_avaliacoes})`}</dd>
            <dt>Lançamento</dt>
            <dd>{j.ano_lancamento || NAO_INFORMADO}</dd>
            <dt>Desenvolvedora</dt>
            <dd>{j.marca?.nome || NAO_INFORMADO}</dd>
            <dt>Editora</dt>
            <dd>{j.editora?.nome || NAO_INFORMADO}</dd>
          </dl>
          <div className="selos-linha">
            {j.categorias.map((c) => <Selo key={c}>{c}</Selo>)}
          </div>
        </aside>
      </div>

      <div className="jogo-colunas">
        <div className="jogo-principal">
          {/* Caixa de compra */}
          <div className="caixa-compra">
            <div>
              <h3>Comprar {j.nome}</h3>
              {j.possui && <Selo tipo="biblioteca">NA SUA BIBLIOTECA</Selo>}
              <p className={`disponibilidade disponibilidade-${estoque.classe}`}>{estoque.texto}</p>
              {j.promocao && (
                <p className="promocao-info">
                  {j.promocao.nome}: termina em {tempoRestante(j.promocao.fim)}.{' '}
                  <strong>Economize {moeda(j.preco_base - j.preco_final)}</strong>
                </p>
              )}
            </div>
            <div className="caixa-compra-acoes">
              <Preco jogo={j} grande />
              <div className="botoes">
                {j.possui ? (
                  <a href="#/biblioteca" className="botao botao-secundario">Ver na biblioteca</a>
                ) : (
                  <>
                    <button className="botao botao-principal" disabled={bloqueado} onClick={comprarAgora}>Comprar agora</button>
                    <button className="botao botao-secundario" disabled={bloqueado} onClick={botaoCarrinho}>
                      {carrinho.contem(j.id) ? 'No carrinho ✓' : 'Adicionar ao carrinho'}
                    </button>
                  </>
                )}
                <button className={`botao botao-secundario ${desejado ? 'desejado' : ''}`} onClick={() => alternarDesejo(j)}>
                  {desejado ? '♥ Desejado' : '♡ Desejar'}
                </button>
              </div>
            </div>
          </div>

          {embed && (
            <section className="bloco">
              <h2>Trailer</h2>
              <div className="video">
                <iframe src={embed} title={trailer.titulo || 'Trailer'} allowFullScreen />
              </div>
            </section>
          )}
          {trailer && !embed && (
            <p><a href={trailer.url} target="_blank" rel="noreferrer">▶ Assistir trailer</a></p>
          )}

          <section className="bloco">
            <h2>Sobre este jogo</h2>
            <p className="texto-longo">{j.descricao || 'Descrição em breve.'}</p>
          </section>

          <section className="bloco">
            <h2>Requisitos mínimos do sistema</h2>
            <table className="tabela-specs">
              <tbody>
                <tr><th>Sistema operacional</th><td>{j.requisitos.so || NAO_INFORMADO}</td></tr>
                <tr><th>Processador</th><td>{j.requisitos.cpu || NAO_INFORMADO}</td></tr>
                <tr><th>Placa de vídeo</th><td>{j.requisitos.gpu || NAO_INFORMADO}</td></tr>
                <tr><th>Memória RAM</th><td>{j.requisitos.ram || NAO_INFORMADO}</td></tr>
                <tr><th>Espaço em disco</th><td>{j.requisitos.espaco || NAO_INFORMADO}</td></tr>
              </tbody>
            </table>
          </section>

          <Avaliacoes jogoId={j.id} possui={j.possui} estado={avaliacoes} aoSalvar={() => { avaliacoes.recarregar(); jogo.recarregar(); }} />
        </div>

        <aside className="jogo-lateral">
          <section className="bloco">
            <h3>Especificações</h3>
            <table className="tabela-specs">
              <tbody>
                <tr><th>Categorias</th><td>{j.categorias.join(', ') || NAO_INFORMADO}</td></tr>
                <tr><th>Plataformas</th><td>{j.plataformas.join(', ') || NAO_INFORMADO}</td></tr>
                <tr><th>Editora</th><td>{j.editora?.nome || NAO_INFORMADO}</td></tr>
                <tr><th>Desenvolvedora</th><td>{j.marca?.nome || NAO_INFORMADO}</td></tr>
                <tr><th>Ano</th><td>{j.ano_lancamento || NAO_INFORMADO}</td></tr>
                <tr><th>Mídia</th><td>{j.tipo_midia === 'FISICA' ? 'Física' : 'Digital (Key)'}</td></tr>
                <tr><th>Edição</th><td>{j.edicao || NAO_INFORMADO}</td></tr>
                <tr><th>Espaço mínimo</th><td>{j.espaco_minimo_requerido || NAO_INFORMADO}</td></tr>
              </tbody>
            </table>
            <p className="aviso-pequeno">Taxa de ativação: Grátis (Digital). O código de resgate aparece na hora, depois da compra.</p>
          </section>
        </aside>
      </div>

      <section className="bloco">
        <h2>Jogos relacionados</h2>
        {relacionados.carregando && <Carregando />}
        {relacionados.dados && relacionados.dados.length === 0 && <p>Nenhum jogo relacionado.</p>}
        {relacionados.dados && (
          <div className="grade-jogos grade-tres">
            {relacionados.dados.map((r) => <CardJogo key={r.id} jogo={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// Bloco de avaliações: resumo, formulário (só para quem possui) e lista
function Avaliacoes({ jogoId, possui, estado, aoSalvar }) {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const minha = estado.dados?.avaliacoes.find((a) => a.usuario_id === usuario?.id);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Preenche o formulário com a avaliação que a pessoa já fez
  useEffect(() => {
    setNota(minha?.nota || 0);
    setComentario(minha?.comentario || '');
  }, [minha?.id, minha?.nota, minha?.comentario]);

  async function salvar(e) {
    e.preventDefault();
    if (nota < 1) {
      mostrarToast('Escolha uma nota de 1 a 5 estrelas.', 'erro');
      return;
    }
    setSalvando(true);
    try {
      await api(`/jogos/${jogoId}/avaliacoes`, { metodo: 'POST', corpo: { nota, comentario } });
      mostrarToast('Avaliação salva. Obrigado!', 'sucesso');
      aoSalvar();
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  if (estado.carregando) return <section className="bloco"><h2>Avaliações</h2><Carregando /></section>;
  if (estado.erro) return <section className="bloco"><h2>Avaliações</h2><ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} /></section>;

  const { media, total, positivas, avaliacoes } = estado.dados;
  const resumo = resumoAvaliacoes(total, positivas);

  return (
    <section className="bloco avaliacoes">
      <h2>Avaliações</h2>
      <div className="avaliacoes-resumo">
        <strong className="nota-grande">{media ? media.toFixed(1).replace('.', ',') : '–'}</strong>
        <div>
          <Estrelas nota={media || 0} />
          <p className={`resumo-${resumo.classe}`}>{resumo.texto} · {total} avaliação(ões)</p>
        </div>
      </div>

      {possui && usuario ? (
        <form className="formulario form-avaliacao" onSubmit={salvar}>
          <h4>{minha ? 'Editar sua avaliação' : 'Avalie este jogo'}</h4>
          <Estrelas nota={nota} aoEscolher={setNota} />
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} rows={3} placeholder="Conte o que achou (opcional)" />
          <button className="botao botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar avaliação'}</button>
        </form>
      ) : (
        <p className="aviso-pequeno">Compre o jogo para poder avaliar.</p>
      )}

      {avaliacoes.length === 0 && <p>Ainda não há avaliações. Seja o primeiro!</p>}
      <ul className="lista-avaliacoes">
        {avaliacoes.map((a) => (
          <li key={a.id}>
            <div className="avaliacao-autor">
              <Imagem src={a.foto_autor || '/capas/avatar.svg'} alt="" className="avatar-pequeno" />
              <strong>{a.autor}</strong>
              <Estrelas nota={a.nota} />
              <small>{data(a.data)}</small>
            </div>
            {a.comentario && <p>{a.comentario}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
