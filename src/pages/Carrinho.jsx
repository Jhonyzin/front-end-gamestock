// Carrinho: os ids ficam no navegador e os dados/preços vêm da API (/jogos?ids=)
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { navegar } from '../rota.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import { moeda, estadoEstoque } from '../util/formatar.js';
import Imagem from '../components/Imagem.jsx';
import Preco from '../components/Preco.jsx';
import Selo from '../components/Selo.jsx';
import { Carregando, ErroCarregar, Vazio } from '../components/Estado.jsx';

// Busca os jogos do carrinho na ordem em que foram adicionados
export async function buscarJogosDoCarrinho(ids) {
  if (!ids.length) return [];
  const r = await api(`/jogos?ids=${ids.join(',')}&limite=100`);
  return ids.map((id) => r.itens.find((j) => j.id === id)).filter(Boolean);
}

// Soma do carrinho com o cupom aplicado sobre o total já com promoções
export function calcularTotais(jogos, cupom) {
  const subtotal = jogos.reduce((soma, j) => soma + j.preco_final, 0);
  const desconto = cupom ? Math.round(subtotal * cupom.percentual) / 100 : 0;
  return { subtotal, desconto, total: Math.max(0, subtotal - desconto) };
}

export default function Carrinho() {
  const { usuario, abrirLogin } = useAuth();
  const carrinho = useCarrinho();
  const { mostrarToast } = useToast();
  const [codigoCupom, setCodigoCupom] = useState('');
  const [erroCupom, setErroCupom] = useState('');
  const chave = carrinho.ids.join(',');

  const estado = useCarregar(() => buscarJogosDoCarrinho(carrinho.ids), [chave, usuario?.id]);
  const jogos = estado.dados || [];

  // Jogo que sumiu da loja (excluído/inativo) sai do carrinho sozinho
  useEffect(() => {
    if (!estado.dados) return;
    carrinho.ids.filter((id) => !estado.dados.some((j) => j.id === id)).forEach(carrinho.remover);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.dados]);

  async function aplicarCupom(e) {
    e.preventDefault();
    setErroCupom('');
    if (!usuario) {
      mostrarToast('Entre na sua conta para usar cupons.', 'info');
      abrirLogin('login');
      return;
    }
    try {
      const cupom = await api('/cupons/validar', { metodo: 'POST', corpo: { codigo: codigoCupom } });
      carrinho.setCupom(cupom);
      setCodigoCupom('');
      mostrarToast(`Cupom ${cupom.codigo} aplicado: ${cupom.percentual}% de desconto!`, 'sucesso');
    } catch (falha) {
      setErroCupom(falha.message);
    }
  }

  function finalizar() {
    if (!usuario) {
      mostrarToast('Entre na sua conta para finalizar a compra.', 'info');
      abrirLogin('login');
      return;
    }
    if (jogos.some((j) => j.possui)) {
      mostrarToast('Remova do carrinho os jogos que você já possui.', 'erro');
      return;
    }
    if (jogos.some((j) => j.estoque <= 0)) {
      mostrarToast('Há jogos esgotados no carrinho. Remova-os para continuar.', 'erro');
      return;
    }
    navegar('/checkout');
  }

  if (!carrinho.ids.length) {
    return (
      <div className="conteudo">
        <h1>Seu carrinho</h1>
        <Vazio>
          <p>Seu carrinho está vazio.</p>
          <a href="#/loja" className="botao botao-principal">Continuar comprando</a>
        </Vazio>
      </div>
    );
  }
  if (estado.carregando && !estado.dados) return <div className="conteudo"><Carregando /></div>;
  if (estado.erro) return <div className="conteudo"><ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} /></div>;

  const { subtotal, desconto, total } = calcularTotais(jogos, carrinho.cupom);

  return (
    <div className="conteudo carrinho">
      <h1>Seu carrinho</h1>
      <div className="carrinho-colunas">
        <div>
          <ul className="lista-carrinho">
            {jogos.map((j) => {
              const estoque = estadoEstoque(j.estoque);
              return (
                <li key={j.id}>
                  <a href={`#/jogo/${j.id}`}><Imagem src={j.capa} alt="" /></a>
                  <div className="item-info">
                    <a href={`#/jogo/${j.id}`} className="item-nome">{j.nome}</a>
                    <small>{j.plataformas.join(' · ')}</small>
                    <div className="selos-linha">
                      {j.possui && <Selo tipo="biblioteca">VOCÊ JÁ POSSUI ESTE JOGO</Selo>}
                      {estoque.esgotado && <Selo tipo="esgotado">Esgotado</Selo>}
                      {estoque.classe === 'baixo' && <Selo tipo="baixo">{estoque.texto}</Selo>}
                    </div>
                  </div>
                  <div className="item-preco">
                    <Preco jogo={j} />
                    <button className="link-botao" onClick={() => carrinho.remover(j.id)}>Remover</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="carrinho-acoes">
            <a href="#/loja" className="botao botao-secundario">Continuar comprando</a>
            <button className="link-botao" onClick={carrinho.esvaziar}>Esvaziar carrinho</button>
          </div>
        </div>

        <aside className="resumo-pedido">
          <h3>Resumo</h3>
          <form className="form-cupom" onSubmit={aplicarCupom}>
            <input value={codigoCupom} onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())} placeholder="Cupom de desconto" />
            <button className="botao botao-secundario" disabled={!codigoCupom.trim()}>Aplicar</button>
          </form>
          {erroCupom && <p className="erro-campo">{erroCupom}</p>}
          {carrinho.cupom && (
            <p className="cupom-aplicado">
              Cupom <strong>{carrinho.cupom.codigo}</strong> (-{carrinho.cupom.percentual}%)
              <button className="link-botao" onClick={() => carrinho.setCupom(null)}>remover</button>
            </p>
          )}
          <dl className="linhas-resumo">
            <dt>Subtotal</dt><dd>{moeda(subtotal)}</dd>
            {carrinho.cupom && <><dt>Cupom</dt><dd>- {moeda(desconto)}</dd></>}
            <dt>Taxa de ativação</dt><dd>Grátis (Digital)</dd>
            <dt className="total">Total</dt><dd className="total">{moeda(total)}</dd>
          </dl>
          <p className="aviso-pequeno">À vista ou em até 12x sem juros no cartão.</p>
          <button className="botao botao-principal botao-largo" onClick={finalizar}>Finalizar compra</button>
          <p className="aviso-pequeno">🔒 Ambiente seguro SSL 256-bit</p>
        </aside>
      </div>
    </div>
  );
}
