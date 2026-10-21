// Lista de desejos: jogos marcados com o coração
import { api } from '../api.js';
import { navegar } from '../rota.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import CardJogo from '../components/CardJogo.jsx';
import { Carregando, ErroCarregar, ExigirLogin, Vazio } from '../components/Estado.jsx';

export default function Desejos() {
  return (
    <ExigirLogin mensagem="Entre na sua conta para ver sua lista de desejos.">
      <DesejosConteudo />
    </ExigirLogin>
  );
}

function DesejosConteudo() {
  const { desejos, alternarDesejo } = useAuth();
  const carrinho = useCarrinho();
  const { mostrarToast } = useToast();
  const estado = useCarregar(() => api('/desejos'), []);

  if (estado.carregando) return <div className="conteudo"><Carregando /></div>;
  if (estado.erro) return <div className="conteudo"><ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} /></div>;

  // Some da tela na hora quando o coração é desmarcado
  const lista = estado.dados.filter((j) => desejos.includes(j.id));

  function comprar(jogo) {
    if (jogo.possui) {
      mostrarToast('Você já possui este jogo.', 'info');
      return;
    }
    carrinho.adicionar(jogo.id);
    navegar('/carrinho');
  }

  return (
    <div className="conteudo">
      <h1>Lista de desejos ({lista.length})</h1>
      {lista.length === 0 && (
        <Vazio>
          <p>Sua lista de desejos está vazia. Clique no ♡ dos jogos para guardá-los aqui.</p>
          <a href="#/loja" className="botao botao-principal">Explorar a loja</a>
        </Vazio>
      )}
      <div className="grade-jogos">
        {lista.map((j) => (
          <div key={j.id} className="desejo-item">
            <CardJogo jogo={j} />
            <div className="botoes">
              <button className="botao botao-principal botao-pequeno" disabled={j.possui || j.estoque <= 0} onClick={() => comprar(j)}>
                {j.possui ? 'Já é seu' : j.estoque <= 0 ? 'Esgotado' : 'Comprar'}
              </button>
              <button className="botao botao-secundario botao-pequeno" onClick={() => alternarDesejo(j)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
