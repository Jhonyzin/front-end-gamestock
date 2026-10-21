// Biblioteca com duas abas: "Meus jogos" e "Histórico de compras"
import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import { moeda, data, dataHora, copiar, NOMES_METODO, NOMES_ORIGEM } from '../util/formatar.js';
import Imagem from '../components/Imagem.jsx';
import Estrelas from '../components/Estrelas.jsx';
import Selo from '../components/Selo.jsx';
import { Carregando, ErroCarregar, ExigirLogin, Vazio } from '../components/Estado.jsx';

export default function Biblioteca({ aba }) {
  const historico = aba === 'historico';
  return (
    <ExigirLogin mensagem="Entre na sua conta para ver seus jogos e suas compras.">
      <div className="conteudo biblioteca">
        <h1>{historico ? 'Minhas compras' : 'Minha biblioteca'}</h1>
        <div className="abas">
          <a href="#/biblioteca" className={!historico ? 'ativa' : ''}>Meus jogos</a>
          <a href="#/biblioteca/historico" className={historico ? 'ativa' : ''}>Histórico de compras</a>
        </div>
        {historico ? <Historico /> : <MeusJogos />}
      </div>
    </ExigirLogin>
  );
}

// Botão que revela o código de resgate (só busca na API depois do clique)
function VerCodigo({ itemId }) {
  const { mostrarToast } = useToast();
  const [codigo, setCodigo] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function revelar() {
    setCarregando(true);
    try {
      const r = await api(`/compras/itens/${itemId}/codigo`);
      setCodigo(r.codigo_resgate);
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    } finally {
      setCarregando(false);
    }
  }

  if (!itemId) return null;
  if (!codigo) {
    return (
      <button className="botao botao-secundario botao-pequeno" onClick={revelar} disabled={carregando}>
        {carregando ? 'Buscando…' : 'Ver código'}
      </button>
    );
  }
  return (
    <span className="codigo-revelado">
      <code>{codigo}</code>
      <button className="botao botao-secundario botao-pequeno" onClick={async () => mostrarToast((await copiar(codigo)) ? 'Código copiado!' : 'Não foi possível copiar.', 'info')}>
        Copiar
      </button>
    </span>
  );
}

function MeusJogos() {
  const [busca, setBusca] = useState('');
  const estado = useCarregar(() => api('/biblioteca'), []);

  if (estado.carregando) return <Carregando />;
  if (estado.erro) return <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;
  if (!estado.dados.length) {
    return (
      <Vazio>
        <p>Você ainda não tem jogos.</p>
        <a href="#/loja" className="botao botao-principal">Ir para a loja</a>
      </Vazio>
    );
  }

  const lista = estado.dados.filter((j) => j.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <input className="campo-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na biblioteca…" />
      {lista.length === 0 && <Vazio>Nenhum jogo com esse nome.</Vazio>}
      <div className="grade-biblioteca">
        {lista.map((j) => (
          <article key={j.produto_id} className="card-biblioteca">
            <a href={`#/jogo/${j.produto_id}`}><Imagem src={j.capa} alt={j.nome} /></a>
            <div className="card-biblioteca-info">
              <strong>{j.nome}</strong>
              <small>{j.categorias.join(', ')}</small>
              <small>Adquirido em {data(j.data_aquisicao)} · <Selo>{NOMES_ORIGEM[j.origem]}</Selo></small>
              <div className="botoes">
                <VerCodigo itemId={j.item_id} />
                <a href={`#/jogo/${j.produto_id}`} className="botao botao-secundario botao-pequeno">Página do jogo</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Historico() {
  const estado = useCarregar(() => api('/compras'), []);

  if (estado.carregando) return <Carregando />;
  if (estado.erro) return <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;
  if (!estado.dados.length) return <Vazio>Você ainda não fez nenhuma compra.</Vazio>;

  return (
    <div className="lista-pedidos">
      {estado.dados.map((pedido) => (
        <section key={pedido.id} className="pedido">
          <header className="pedido-topo">
            <strong>Pedido nº {pedido.id}</strong>
            <span>{dataHora(pedido.data_criacao)}</span>
            <span>{pedido.pagamento ? NOMES_METODO[pedido.pagamento.metodo] : 'Gratuito'}
              {pedido.pagamento?.parcelas > 1 && ` (${pedido.pagamento.parcelas}x)`}
              {pedido.pagamento?.ultimos_4_digitos && ` · •••• ${pedido.pagamento.ultimos_4_digitos}`}
            </span>
            <Selo tipo={pedido.status === 'CONCLUIDO' ? 'ok' : 'neutro'}>{pedido.status === 'CONCLUIDO' ? 'Concluído' : pedido.status}</Selo>
            <strong className="pedido-total">{moeda(pedido.valor_total)}</strong>
          </header>
          <ul>
            {pedido.itens.map((item) => (
              <ItemHistorico key={item.item_id} item={item} aoAvaliar={estado.recarregar} />
            ))}
          </ul>
          {pedido.desconto > 0 && <p className="aviso-pequeno">Cupom {pedido.cupom}: - {moeda(pedido.desconto)}</p>}
        </section>
      ))}
    </div>
  );
}

// Um item do histórico: [Ver código] [Ir para a página do jogo] [Avaliar jogo]
function ItemHistorico({ item, aoAvaliar }) {
  const { mostrarToast } = useToast();
  const [avaliando, setAvaliando] = useState(false);
  const [nota, setNota] = useState(item.avaliacao?.nota || 0);
  const [comentario, setComentario] = useState(item.avaliacao?.comentario || '');
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    if (nota < 1) {
      mostrarToast('Escolha uma nota de 1 a 5 estrelas.', 'erro');
      return;
    }
    setSalvando(true);
    try {
      await api(`/jogos/${item.produto_id}/avaliacoes`, { metodo: 'POST', corpo: { nota, comentario } });
      mostrarToast('Avaliação salva. Obrigado!', 'sucesso');
      setAvaliando(false);
      aoAvaliar();
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li className="item-historico">
      <Imagem src={item.capa} alt="" />
      <div className="item-info">
        <strong>{item.nome}</strong>
        <small>Pago: {item.preco_unitario > 0 ? moeda(item.preco_unitario) : 'Grátis'} · Código: {item.codigo_resgate}</small>
        {item.avaliacao && !avaliando && (
          <small>Sua avaliação <Estrelas nota={item.avaliacao.nota} /></small>
        )}
        <div className="botoes">
          <VerCodigo itemId={item.item_id} />
          <a href={`#/jogo/${item.produto_id}`} className="botao botao-secundario botao-pequeno">Ir para a página do jogo</a>
          <button className="botao botao-secundario botao-pequeno" onClick={() => setAvaliando(!avaliando)}>
            {item.avaliacao ? 'Editar avaliação' : 'Avaliar jogo'}
          </button>
        </div>
        {avaliando && (
          <form className="formulario form-avaliacao" onSubmit={salvar}>
            <Estrelas nota={nota} aoEscolher={setNota} />
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} rows={2} placeholder="Comentário (opcional)" />
            <div className="botoes">
              <button className="botao botao-principal botao-pequeno" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
              <button type="button" className="link-botao" onClick={() => setAvaliando(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </li>
  );
}
