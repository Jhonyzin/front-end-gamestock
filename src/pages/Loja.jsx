// Catálogo da loja: busca, filtros, ordenação e "carregar mais" (12 por vez)
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CardJogo from '../components/CardJogo.jsx';
import Filtros, { FAIXAS_PRECO, NOTAS } from '../components/Filtros.jsx';
import { Carregando, ErroCarregar, Vazio } from '../components/Estado.jsx';

const POR_PAGINA = 12;

const ORDENS = [
  { valor: 'populares', texto: 'Mais populares' },
  { valor: 'preco-asc', texto: 'Menor preço' },
  { valor: 'preco-desc', texto: 'Maior preço' },
  { valor: 'avaliacao', texto: 'Mais bem avaliados' },
  { valor: 'lancamentos', texto: 'Lançamentos recentes' },
  { valor: 'nome', texto: 'Nome (A-Z)' },
];

// Filtros iniciais a partir da URL (#/loja?categoria=3&busca=zelda)
function filtrosDaUrl(query) {
  return {
    busca: query.busca || '',
    categoria: query.categoria || '',
    plataforma: query.plataforma || '',
    preco: query.preco || '',
    promocao: query.promocao || '',
    nota_min: query.nota_min || '',
    ordem: query.ordem || 'populares',
  };
}

export default function Loja({ rota }) {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState(() => filtrosDaUrl(rota.query));
  const [textoBusca, setTextoBusca] = useState(filtros.busca);
  const [jogos, setJogos] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [tentativa, setTentativa] = useState(0);

  // Listas para os filtros
  useEffect(() => {
    api('/categorias').then(setCategorias).catch(() => {});
    api('/plataformas').then(setPlataformas).catch(() => {});
  }, []);

  // Se o menu do topo mudar a URL, recomeça com os novos filtros
  const chaveUrl = JSON.stringify(rota.query);
  useEffect(() => {
    const novos = filtrosDaUrl(rota.query);
    setFiltros(novos);
    setTextoBusca(novos.busca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveUrl]);

  // Volta para a página 1 sempre que um filtro muda
  useEffect(() => {
    setPagina(1);
  }, [filtros, usuario?.id]);

  // Busca os jogos (página 1 substitui a lista; as outras somam no fim)
  useEffect(() => {
    let ativo = true;
    const parametros = new URLSearchParams({ pagina, limite: POR_PAGINA });
    Object.entries(filtros).forEach(([chave, valor]) => valor && parametros.set(chave, valor));

    setCarregando(true);
    setErro(null);
    api(`/jogos?${parametros}`)
      .then((r) => {
        if (!ativo) return;
        setJogos((lista) => (pagina === 1 ? r.itens : [...lista, ...r.itens]));
        setTotal(r.total);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [filtros, pagina, usuario?.id, tentativa]);

  function alterar(mudanca) {
    setFiltros((f) => ({ ...f, ...mudanca }));
  }

  function buscar(e) {
    e.preventDefault();
    alterar({ busca: textoBusca.trim() });
  }

  function limparTodos() {
    setTextoBusca('');
    setFiltros({ ...filtrosDaUrl({}), ordem: filtros.ordem });
  }

  // "Chips" com os filtros ativos
  const chips = [];
  if (filtros.busca) chips.push({ chave: 'busca', texto: `Busca: "${filtros.busca}"` });
  if (filtros.categoria) chips.push({ chave: 'categoria', texto: categorias.find((c) => String(c.id) === filtros.categoria)?.nome || 'Categoria' });
  if (filtros.plataforma) chips.push({ chave: 'plataforma', texto: plataformas.find((p) => String(p.id) === filtros.plataforma)?.nome || 'Plataforma' });
  if (filtros.preco) chips.push({ chave: 'preco', texto: FAIXAS_PRECO.find((f) => f.valor === filtros.preco)?.texto });
  if (filtros.promocao) chips.push({ chave: 'promocao', texto: 'Com desconto' });
  if (filtros.nota_min) chips.push({ chave: 'nota_min', texto: NOTAS.find((n) => n.valor === filtros.nota_min)?.texto });

  return (
    <div className="conteudo loja">
      <div className="loja-topo">
        <h1>{filtros.promocao ? 'Ofertas' : 'Todos os jogos'}</h1>
        <form className="busca-catalogo" onSubmit={buscar}>
          <input value={textoBusca} onChange={(e) => setTextoBusca(e.target.value)} placeholder="Buscar por nome…" />
          <button className="botao botao-principal">Buscar</button>
        </form>
      </div>

      <div className="loja-colunas">
        <Filtros filtros={filtros} alterar={alterar} categorias={categorias} plataformas={plataformas} />

        <div className="loja-resultados">
          <div className="loja-barra">
            <span>{carregando && pagina === 1 ? 'Buscando…' : `${total} resultado(s)`}</span>
            <label>
              Ordenar por{' '}
              <select value={filtros.ordem} onChange={(e) => alterar({ ordem: e.target.value })}>
                {ORDENS.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="chips">
              {chips.map((c) => (
                <button key={c.chave} className="chip" onClick={() => {
                  if (c.chave === 'busca') setTextoBusca('');
                  alterar({ [c.chave]: '' });
                }}>
                  {c.texto} ×
                </button>
              ))}
              <button className="link-botao" onClick={limparTodos}>Limpar todos</button>
            </div>
          )}

          {erro && <ErroCarregar mensagem={erro} aoTentarDeNovo={() => setTentativa((t) => t + 1)} />}
          {!erro && carregando && pagina === 1 && <Carregando />}
          {!erro && !(carregando && pagina === 1) && jogos.length === 0 && (
            <Vazio>Nenhum jogo encontrado com esses filtros.</Vazio>
          )}

          {!(carregando && pagina === 1) && (
            <div className="grade-jogos">
              {jogos.map((j) => <CardJogo key={j.id} jogo={j} />)}
            </div>
          )}

          {!erro && jogos.length < total && (
            <div className="centro">
              <button className="botao botao-secundario" disabled={carregando} onClick={() => setPagina((p) => p + 1)}>
                {carregando ? 'Carregando…' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
