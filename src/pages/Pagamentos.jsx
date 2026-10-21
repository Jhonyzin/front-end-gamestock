// Formas de pagamento: cartões salvos (mini-cartões) e cadastro de novo cartão
import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCarregar } from '../util/useCarregar.js';
import CartaoPagamento from '../components/CartaoPagamento.jsx';
import MiniCartao from '../components/MiniCartao.jsx';
import { Carregando, ErroCarregar, ExigirLogin, Vazio } from '../components/Estado.jsx';

export default function Pagamentos() {
  return (
    <ExigirLogin>
      <PagamentosConteudo />
    </ExigirLogin>
  );
}

function PagamentosConteudo() {
  const { mostrarToast } = useToast();
  const cartoes = useCarregar(() => api('/formas-pagamento'), []);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [dados, setDados] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [versaoForm, setVersaoForm] = useState(0);   // trocar a "key" limpa o formulário

  async function acao(chamada, mensagem) {
    try {
      await chamada();
      mostrarToast(mensagem, 'sucesso');
      cartoes.recarregar();
      return true;
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
      return false;
    }
  }

  async function adicionar(e) {
    e.preventDefault();
    if (!dados?.valido) {
      mostrarToast('Confira os dados do cartão.', 'erro');
      return;
    }
    setSalvando(true);
    // O CVV é só validado na tela: NÃO é enviado para ser salvo
    const deuCerto = await acao(() => api('/formas-pagamento', {
      metodo: 'POST',
      corpo: { numero: dados.numero, titular: dados.titular, validade: dados.validade, tipo: dados.tipo, apelido: dados.apelido, padrao: dados.padrao },
    }), 'Cartão adicionado!');
    setSalvando(false);
    if (deuCerto) {
      setMostrarForm(false);
      setVersaoForm((v) => v + 1);
    }
  }

  return (
    <div className="conteudo pagamentos">
      <h1>Formas de pagamento</h1>
      <p className="aviso-pequeno">PIX e boleto não precisam ser cadastrados: é só escolher na hora de finalizar a compra.</p>

      {cartoes.carregando && <Carregando />}
      {cartoes.erro && <ErroCarregar mensagem={cartoes.erro} aoTentarDeNovo={cartoes.recarregar} />}
      {cartoes.dados && cartoes.dados.length === 0 && <Vazio>Você ainda não tem cartões salvos.</Vazio>}

      {cartoes.dados && cartoes.dados.length > 0 && (
        <div className="grade-cartoes">
          {cartoes.dados.map((c) => (
            <div key={c.id} className="cartao-salvo">
              <MiniCartao cartao={c} />
              {c.vencido && <span className="erro-campo">Cartão vencido</span>}
              <div className="botoes">
                {!c.padrao && (
                  <button className="botao botao-secundario botao-pequeno" onClick={() => acao(() => api(`/formas-pagamento/${c.id}/padrao`, { metodo: 'PUT' }), 'Cartão definido como padrão.')}>
                    Tornar padrão
                  </button>
                )}
                <button
                  className="botao botao-perigo botao-pequeno"
                  onClick={() => window.confirm('Remover este cartão?') && acao(() => api(`/formas-pagamento/${c.id}`, { metodo: 'DELETE' }), 'Cartão removido.')}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!mostrarForm ? (
        <button className="botao botao-principal" onClick={() => setMostrarForm(true)}>＋ Adicionar cartão</button>
      ) : (
        <form className="bloco form-novo-cartao" onSubmit={adicionar}>
          <h3>Novo cartão</h3>
          <CartaoPagamento key={versaoForm} modo="cadastro" aoMudar={setDados} />
          <div className="botoes">
            <button className="botao botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar cartão'}</button>
            <button type="button" className="botao botao-secundario" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
