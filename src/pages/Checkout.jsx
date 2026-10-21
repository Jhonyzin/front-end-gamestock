// Checkout: escolha do pagamento (PIX, cartão ou boleto) e compra simulada.
// O preço final é sempre recalculado pelo servidor.
import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import { moeda, copiar } from '../util/formatar.js';
import { somenteDigitos } from '../util/cartao.js';
import { buscarJogosDoCarrinho, calcularTotais } from './Carrinho.jsx';
import Imagem from '../components/Imagem.jsx';
import CartaoPagamento from '../components/CartaoPagamento.jsx';
import SeletorCartao from '../components/SeletorCartao.jsx';
import { Carregando, ErroCarregar, ExigirLogin, Vazio } from '../components/Estado.jsx';

export default function Checkout() {
  return (
    <ExigirLogin mensagem="Entre na sua conta para finalizar a compra.">
      <CheckoutConteudo />
    </ExigirLogin>
  );
}

// "QR Code" de mentira: desenha quadradinhos a partir do texto
function QrFalso({ texto }) {
  const tamanho = 25;
  let semente = [...texto].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const quadrados = [];
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      semente = (semente * 1103515245 + 12345) >>> 0;
      const canto = (x < 7 && y < 7) || (x >= tamanho - 7 && y < 7) || (x < 7 && y >= tamanho - 7);
      const preenchido = canto ? (x % 6 === 0 || y % 6 === 0 || (x % 6 >= 2 && x % 6 <= 4 && y % 6 >= 2 && y % 6 <= 4)) : (semente >> 16) % 2 === 0;
      if (preenchido) quadrados.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg className="qr-falso" viewBox={`-2 -2 ${tamanho + 4} ${tamanho + 4}`} role="img" aria-label="QR Code simulado">
      <rect x="-2" y="-2" width={tamanho + 4} height={tamanho + 4} fill="#fff" />
      <g fill="#111">{quadrados}</g>
    </svg>
  );
}

function CheckoutConteudo() {
  const carrinho = useCarrinho();
  const { mostrarToast } = useToast();
  const [metodo, setMetodo] = useState('PIX');                 // PIX | CARTAO | BOLETO
  const [tipoCartao, setTipoCartao] = useState('CARTAO_CREDITO');
  const [parcelas, setParcelas] = useState(1);
  const [cartaoEscolhido, setCartaoEscolhido] = useState(null); // id salvo ou 'novo'
  const [novoCartao, setNovoCartao] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(null);

  const chave = carrinho.ids.join(',');
  const jogos = useCarregar(() => buscarJogosDoCarrinho(carrinho.ids), [chave]);
  const cartoes = useCarregar(() => api('/formas-pagamento'), []);

  // Códigos falsos de PIX e boleto (só para a tela)
  const codigoFalso = useMemo(() => Math.random().toString(36).slice(2, 12).toUpperCase(), []);

  if (sucesso) return <TelaSucesso resultado={sucesso} />;
  if (!carrinho.ids.length) {
    return (
      <div className="conteudo">
        <Vazio>
          <p>Seu carrinho está vazio.</p>
          <a href="#/loja" className="botao botao-principal">Voltar à loja</a>
        </Vazio>
      </div>
    );
  }
  if (jogos.carregando || cartoes.carregando) return <div className="conteudo"><Carregando /></div>;
  if (jogos.erro) return <div className="conteudo"><ErroCarregar mensagem={jogos.erro} aoTentarDeNovo={jogos.recarregar} /></div>;

  const lista = jogos.dados;
  const salvos = cartoes.dados || [];
  const { subtotal, desconto, total } = calcularTotais(lista, carrinho.cupom);
  const gratis = total <= 0;
  const escolhido = cartaoEscolhido ?? (salvos.find((c) => c.padrao && !c.vencido)?.id || 'novo');

  const pix = `00020126580014BR.GOV.BCB.PIX0136gamestock-simulacao-${codigoFalso}5204000053039865406${total.toFixed(2)}5802BR5909GAMESTOCK6009SAOPAULO62070503***6304${codigoFalso.slice(0, 4)}`;
  const boleto = `34191.79001 01043.510047 91020.150008 8 ${(9000 + Number(total.toFixed(0))) % 10000}${somenteDigitos(total.toFixed(2)).padStart(10, '0')}`;

  async function confirmar() {
    setErro('');
    const corpo = { itens: carrinho.ids, cupom: carrinho.cupom?.codigo || '' };

    if (!gratis) {
      if (metodo === 'CARTAO') {
        corpo.metodo = tipoCartao;
        corpo.parcelas = tipoCartao === 'CARTAO_CREDITO' ? parcelas : 1;
        if (escolhido === 'novo') {
          if (!novoCartao?.valido) {
            setErro('Confira os dados do cartão.');
            return;
          }
          corpo.cartao = {
            numero: novoCartao.numero,
            titular: novoCartao.titular,
            validade: novoCartao.validade,
            cvv: novoCartao.cvv,
            salvar: novoCartao.salvar,
          };
        } else {
          corpo.forma_pagamento_id = escolhido;
        }
      } else {
        corpo.metodo = metodo;
      }
    }

    setEnviando(true);
    try {
      const resultado = await api('/checkout', { metodo: 'POST', corpo });
      carrinho.esvaziar();
      setSucesso(resultado);
      mostrarToast('Compra concluída! Suas chaves foram liberadas.', 'sucesso');
    } catch (falha) {
      setErro(falha.message);
      mostrarToast(falha.message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="conteudo checkout">
      <h1>Finalizar compra</h1>
      <div className="carrinho-colunas">
        <div className="bloco">
          {gratis ? (
            <div className="pagamento-gratis">
              <h3>Nenhum pagamento necessário</h3>
              <p>O total do pedido é {moeda(0)}. Clique abaixo para resgatar seus jogos.</p>
              <button className="botao botao-principal" onClick={confirmar} disabled={enviando}>
                {enviando ? 'Processando…' : 'Confirmar e ativar jogos'}
              </button>
            </div>
          ) : (
            <>
              <h3>Forma de pagamento</h3>
              <div className="abas-pagamento">
                {[['PIX', 'PIX'], ['CARTAO', 'Cartão'], ['BOLETO', 'Boleto']].map(([valor, texto]) => (
                  <button key={valor} className={metodo === valor ? 'ativa' : ''} onClick={() => { setMetodo(valor); setErro(''); }}>
                    {texto}
                  </button>
                ))}
              </div>

              {metodo === 'PIX' && (
                <div className="pagamento-pix">
                  <QrFalso texto={pix} />
                  <div>
                    <p>Escaneie o QR Code ou use o PIX copia e cola (simulação):</p>
                    <textarea readOnly value={pix} rows={3} />
                    <button className="botao botao-secundario" onClick={async () => mostrarToast((await copiar(pix)) ? 'Código PIX copiado!' : 'Não foi possível copiar.', 'info')}>
                      Copiar código
                    </button>
                    <button className="botao botao-principal" onClick={confirmar} disabled={enviando}>
                      {enviando ? 'Processando…' : 'Confirmar pagamento (simulado)'}
                    </button>
                  </div>
                </div>
              )}

              {metodo === 'BOLETO' && (
                <div className="pagamento-boleto">
                  <p>Linha digitável (simulação — não pague este boleto):</p>
                  <code className="linha-digitavel">{boleto}</code>
                  <div className="botoes">
                    <button className="botao botao-secundario" onClick={async () => mostrarToast((await copiar(boleto)) ? 'Linha digitável copiada!' : 'Não foi possível copiar.', 'info')}>
                      Copiar linha digitável
                    </button>
                    <button className="botao botao-principal" onClick={confirmar} disabled={enviando}>
                      {enviando ? 'Processando…' : 'Confirmar pagamento (simulado)'}
                    </button>
                  </div>
                </div>
              )}

              {metodo === 'CARTAO' && (
                <div className="pagamento-cartao">
                  <div className="abas-pagamento abas-pequenas">
                    <button className={tipoCartao === 'CARTAO_CREDITO' ? 'ativa' : ''} onClick={() => setTipoCartao('CARTAO_CREDITO')}>Crédito</button>
                    <button className={tipoCartao === 'CARTAO_DEBITO' ? 'ativa' : ''} onClick={() => { setTipoCartao('CARTAO_DEBITO'); setParcelas(1); }}>Débito</button>
                  </div>

                  {salvos.length > 0 && <SeletorCartao cartoes={salvos} selecionado={escolhido} aoSelecionar={setCartaoEscolhido} />}
                  {escolhido === 'novo' && <CartaoPagamento modo="checkout" aoMudar={setNovoCartao} />}

                  {tipoCartao === 'CARTAO_CREDITO' && (
                    <label className="campo-parcelas">
                      Parcelas
                      <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}x de {moeda(total / n)} sem juros</option>
                        ))}
                      </select>
                    </label>
                  )}

                  <button className="botao botao-principal botao-largo" onClick={confirmar} disabled={enviando}>
                    {enviando ? 'Processando…' : 'Confirmar e ativar jogos'}
                  </button>
                </div>
              )}
            </>
          )}
          {erro && <p className="erro-formulario">{erro}</p>}
        </div>

        <aside className="resumo-pedido">
          <h3>Seu pedido</h3>
          <ul className="resumo-itens">
            {lista.map((j) => (
              <li key={j.id}>
                <Imagem src={j.capa} alt="" />
                <span>{j.nome}</span>
                <strong>{j.preco_final > 0 ? moeda(j.preco_final) : 'Grátis'}</strong>
              </li>
            ))}
          </ul>
          <dl className="linhas-resumo">
            <dt>Subtotal</dt><dd>{moeda(subtotal)}</dd>
            {carrinho.cupom && <><dt>Cupom {carrinho.cupom.codigo}</dt><dd>- {moeda(desconto)}</dd></>}
            <dt>Taxa de ativação</dt><dd>Grátis (Digital)</dd>
            <dt className="total">Total</dt><dd className="total">{moeda(total)}</dd>
          </dl>
          <a href="#/carrinho" className="link-botao">← Voltar ao carrinho</a>
          <p className="aviso-pequeno">🔒 Ambiente seguro SSL 256-bit · Pagamento simulado</p>
        </aside>
      </div>
    </div>
  );
}

// Tela depois da compra aprovada: mostra os códigos de resgate
function TelaSucesso({ resultado }) {
  const { mostrarToast } = useToast();
  const { pedido, itens, pagamento } = resultado;

  return (
    <div className="conteudo">
      <div className="bloco sucesso-compra">
        <h1>✔ Compra concluída!</h1>
        <p>Pedido nº <strong>{pedido.id}</strong> · Total {moeda(pedido.valor_total)}
          {pagamento && pagamento.parcelas > 1 && ` em ${pagamento.parcelas}x de ${moeda(pagamento.valor_parcela)}`}
        </p>
        <h2>Chaves de ativação liberadas</h2>
        <p className="aviso-pequeno">Resgate cada código na plataforma do jogo. Você também encontra os códigos em Minhas compras.</p>
        <ul className="lista-codigos">
          {itens.map((item) => (
            <li key={item.item_id}>
              <span>{item.nome}</span>
              <code>{item.codigo_resgate}</code>
              <button className="botao botao-secundario botao-pequeno" onClick={async () => mostrarToast((await copiar(item.codigo_resgate)) ? 'Código copiado!' : 'Não foi possível copiar.', 'info')}>
                Copiar
              </button>
            </li>
          ))}
        </ul>
        <div className="botoes">
          <a href="#/biblioteca" className="botao botao-principal">Minha biblioteca</a>
          <a href="#/" className="botao botao-secundario">Voltar à loja</a>
        </div>
      </div>
    </div>
  );
}
