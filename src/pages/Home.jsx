// Página inicial: destaques, ofertas, mais vendidos, lançamentos e categorias
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import Carrossel from '../components/Carrossel.jsx';
import CardOferta from '../components/CardOferta.jsx';
import CardJogo from '../components/CardJogo.jsx';
import Imagem from '../components/Imagem.jsx';
import Preco from '../components/Preco.jsx';
import { Carregando, ErroCarregar, Vazio } from '../components/Estado.jsx';

// Visual dos blocos de categoria (cor + foto do Unsplash)
const FOTO = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
const VISUAL_CATEGORIAS = {
  'Ação': { cor: '#00e5ff', foto: FOTO('photo-1542751371-adc38448a05e') },
  'Aventura': { cor: '#38bdf8', foto: FOTO('photo-1550745165-9bc0b252726f') },
  'RPG': { cor: '#818cf8', foto: FOTO('photo-1579373903781-fd5c0c30c4cd') },
  'Corrida': { cor: '#00e5ff', foto: FOTO('photo-1511919884226-fd3cad34687c') },
  'Esportes': { cor: '#94a3b8', foto: FOTO('photo-1508098682722-e99c43a406b2') },
  'Terror': { cor: '#f43f5e', foto: FOTO('photo-1509198397868-475647b2a1e5') },
  'Estratégia': { cor: '#2dd4bf', foto: FOTO('photo-1451187580459-43490279c0fa') },
  'Simulação': { cor: '#a5b4fc', foto: FOTO('photo-1506703719100-a0f3a48c0f86') },
};

// Título de seção no estilo Steam, com botão "Ver mais" opcional
function TituloSecao({ titulo, link }) {
  return (
    <div className="titulo-secao">
      <h2>{titulo}</h2>
      {link && <a href={link} className="botao botao-secundario botao-pequeno">Ver mais</a>}
    </div>
  );
}

// Mostra carregando/erro ou o conteúdo da seção
function Secao({ estado, children, vazio = 'Nada por aqui ainda.' }) {
  if (estado.carregando) return <Carregando />;
  if (estado.erro) return <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;
  if (!estado.dados?.length) return <Vazio>{vazio}</Vazio>;
  return children(estado.dados);
}

export default function Home() {
  const { usuario } = useAuth();
  const quem = usuario?.id || 0;   // recarrega quando entra/sai (selo "NA BIBLIOTECA")

  const destaques = useCarregar(() => api('/jogos/destaques'), [quem]);
  const promocoes = useCarregar(() => api('/jogos/promocoes?limite=6'), [quem]);
  const maisVendidos = useCarregar(() => api('/jogos/mais-vendidos?limite=10'), [quem]);
  const lancamentos = useCarregar(() => api('/jogos/lancamentos?limite=8'), [quem]);
  const categorias = useCarregar(() => api('/categorias'), []);

  return (
    <div className="conteudo home">
      <section>
        <TituloSecao titulo="Destaques e recomendados" />
        <Secao estado={destaques} vazio="Nenhum jogo em destaque.">
          {(jogos) => <Carrossel jogos={jogos} />}
        </Secao>
      </section>

      <section>
        <TituloSecao titulo="Descontos e eventos" link="#/loja?promocao=1" />
        <Secao estado={promocoes} vazio="Nenhuma promoção ativa no momento.">
          {(jogos) => (
            <div className="grade-ofertas">
              {jogos.map((j) => <CardOferta key={j.id} jogo={j} />)}
            </div>
          )}
        </Secao>
      </section>

      <div className="home-colunas">
        <section>
          <TituloSecao titulo="Mais vendidos" link="#/loja?ordem=populares" />
          <Secao estado={maisVendidos}>
            {(jogos) => (
              <ol className="lista-mais-vendidos">
                {jogos.map((j, i) => (
                  <li key={j.id}>
                    <a href={`#/jogo/${j.id}`}>
                      <span className="posicao">{i + 1}</span>
                      <Imagem src={j.capa} alt="" />
                      <span className="nome">
                        {j.nome}
                        <small>{j.categorias.join(', ')}</small>
                      </span>
                      <Preco jogo={j} />
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </Secao>
        </section>

        <section>
          <TituloSecao titulo="Lançamentos" link="#/loja?ordem=lancamentos" />
          <Secao estado={lancamentos}>
            {(jogos) => (
              <div className="grade-jogos grade-compacta">
                {jogos.map((j) => <CardJogo key={j.id} jogo={j} />)}
              </div>
            )}
          </Secao>
        </section>
      </div>

      <section>
        <TituloSecao titulo="Navegue por categoria" />
        <Secao estado={categorias}>
          {(lista) => (
            <div className="grade-categorias">
              {lista.map((c) => {
                const visual = VISUAL_CATEGORIAS[c.nome] || { cor: '#66c0f4', foto: null };
                return (
                  <a
                    key={c.id}
                    href={`#/loja?categoria=${c.id}`}
                    className="bloco-categoria"
                    style={{
                      borderColor: visual.cor,
                      backgroundImage: visual.foto
                        ? `linear-gradient(to top, rgba(10,16,24,.95), rgba(10,16,24,.2)), url(${visual.foto})`
                        : `linear-gradient(135deg, ${visual.cor}55, #16202d)`,
                    }}
                  >
                    <span style={{ color: visual.cor }}>{c.nome}</span>
                    <small>{c.total_jogos} jogo(s)</small>
                  </a>
                );
              })}
            </div>
          )}
        </Secao>
      </section>
    </div>
  );
}
