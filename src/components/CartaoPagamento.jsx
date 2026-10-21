// Formulário de cartão com um CARTÃO VIRTUAL que muda enquanto a pessoa digita:
// - bandeira reconhecida na hora (no próprio JS)
// - banco reconhecido pela API quando os 6 primeiros dígitos ficam prontos
// modo: 'checkout' (mostra "Salvar este cartão") | 'cadastro' (mostra tipo, apelido e padrão)
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import {
  somenteDigitos, luhn, bandeira as detectarBandeira, tamanhoNumero, tamanhoCvv,
  formatarNumero, mascaraValidade, validadeOk, CARTOES_TESTE, CARTAO_RECUSADO,
} from '../util/cartao.js';

const CINZA = '#4b5563';

export default function CartaoPagamento({ modo = 'checkout', aoMudar }) {
  const [numero, setNumero] = useState('');     // só dígitos
  const [titular, setTitular] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [apelido, setApelido] = useState('');
  const [tipo, setTipo] = useState('CARTAO_CREDITO');
  const [padrao, setPadrao] = useState(false);
  const [salvar, setSalvar] = useState(false);
  const [banco, setBanco] = useState(null);     // resposta de /cartoes/identificar

  const marca = detectarBandeira(numero);
  const tamanho = tamanhoNumero(marca?.slug);
  const tamanhoDoCvv = tamanhoCvv(marca?.slug);
  const bin = numero.slice(0, 6);

  // Erros por campo (só aparecem depois que a pessoa digitou algo)
  const numeroCompleto = numero.length === tamanho;
  const numeroValido = numeroCompleto && luhn(numero) && !!marca;
  const erros = {
    numero: numero && numeroCompleto && !numeroValido ? 'Número inválido (verifique os dígitos).' : numero && !marca && numero.length >= 2 ? 'Bandeira não reconhecida.' : '',
    titular: titular && titular.trim().length < 3 ? 'Digite o nome como está no cartão.' : '',
    validade: validade.length === 5 && !validadeOk(validade) ? 'Validade inválida ou cartão vencido.' : '',
    cvv: cvv && cvv.length !== tamanhoDoCvv ? `O CVV tem ${tamanhoDoCvv} dígitos.` : '',
  };
  const valido = numeroValido && titular.trim().length >= 3 && validadeOk(validade) && cvv.length === tamanhoDoCvv;

  // Busca o banco quando os 6 primeiros dígitos estão prontos (espera 300 ms)
  useEffect(() => {
    if (bin.length < 6) {
      setBanco(null);
      return undefined;
    }
    let ativo = true;
    const espera = setTimeout(() => {
      api(`/cartoes/identificar?bin=${bin}`)
        .then((b) => ativo && setBanco(b))
        .catch(() => ativo && setBanco(null));
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [bin]);

  // Avisa o componente pai a cada mudança (o CVV nunca é salvo, só validado)
  useEffect(() => {
    aoMudar({ numero, titular, validade, cvv, apelido, tipo, padrao, salvar, valido });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero, titular, validade, cvv, apelido, tipo, padrao, salvar, valido]);

  function digitarNumero(texto) {
    const limite = tamanhoNumero(detectarBandeira(somenteDigitos(texto))?.slug);
    setNumero(somenteDigitos(texto).slice(0, limite));
  }

  // Aparência do cartão virtual
  const corFundo = banco?.encontrado ? banco.cor_hex : CINZA;
  const corTexto = banco?.banco_slug === 'banco-do-brasil' ? '#003882' : '#ffffff';
  const numeroNaTela = numero ? formatarNumero(numero.padEnd(tamanho, '•'), marca?.slug) : formatarNumero('•'.repeat(16));

  return (
    <div className="cartao-pagamento">
      <div className="cartao-virtual" style={{ background: `linear-gradient(135deg, ${corFundo}, ${corFundo}cc)`, color: corTexto }}>
        <div className="cartao-virtual-topo">
          {banco ? (
            <span className="cartao-banco">
              <img src={`/bancos/${banco.banco_slug}.svg`} alt="" />
              {banco.banco}
            </span>
          ) : (
            <span className="cartao-banco cartao-banco-vazio">Seu banco</span>
          )}
          <span className="cartao-chip" />
        </div>
        <div className="cartao-numero">{numeroNaTela}</div>
        <div className="cartao-virtual-rodape">
          <div>
            <small>TITULAR</small>
            <div>{titular.trim() ? titular.toUpperCase() : 'NOME IMPRESSO'}</div>
          </div>
          <div>
            <small>VALIDADE</small>
            <div>{validade || 'MM/AA'}</div>
          </div>
          {marca ? <img className="cartao-bandeira" src={`/bandeiras/${marca.slug}.svg`} alt={marca.nome} /> : <span className="cartao-bandeira" />}
        </div>
      </div>

      <div className="dica-teste">
        <strong>Para testar, use os números de teste</strong> (clique para preencher):
        <div>
          {CARTOES_TESTE.map((c) => (
            <button key={c.numero} type="button" className="chip" onClick={() => digitarNumero(c.numero)}>
              {formatarNumero(c.numero, detectarBandeira(c.numero)?.slug)} <small>{c.descricao}</small>
            </button>
          ))}
        </div>
        <small>Cartão terminado em 0000 (ex.: {formatarNumero(CARTAO_RECUSADO)}) é recusado na simulação.</small>
      </div>

      <div className="formulario">
        <label>
          Número do cartão
          <div className="campo-com-icone">
            <input
              inputMode="numeric"
              value={formatarNumero(numero, marca?.slug)}
              onChange={(e) => digitarNumero(e.target.value)}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
            />
            {numeroCompleto && <span className={numeroValido ? 'icone-ok' : 'icone-erro'}>{numeroValido ? '✓' : '✗'}</span>}
          </div>
          <small className="info-campo">
            {marca ? `Bandeira: ${marca.nome}` : 'Digite o número'}
            {banco && ` · ${banco.banco}`}
          </small>
          {erros.numero && <span className="erro-campo">{erros.numero}</span>}
        </label>

        <label>
          Nome impresso no cartão
          <input value={titular} onChange={(e) => setTitular(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))} autoComplete="cc-name" />
          {erros.titular && <span className="erro-campo">{erros.titular}</span>}
        </label>

        <div className="linha-campos">
          <label>
            Validade
            <input inputMode="numeric" value={validade} onChange={(e) => setValidade(mascaraValidade(e.target.value))} placeholder="MM/AA" autoComplete="cc-exp" />
            {erros.validade && <span className="erro-campo">{erros.validade}</span>}
          </label>
          <label>
            CVV
            <input
              inputMode="numeric"
              type="password"
              value={cvv}
              onChange={(e) => setCvv(somenteDigitos(e.target.value).slice(0, tamanhoDoCvv))}
              placeholder={'•'.repeat(tamanhoDoCvv)}
              autoComplete="cc-csc"
            />
            {erros.cvv && <span className="erro-campo">{erros.cvv}</span>}
          </label>
        </div>

        {modo === 'cadastro' && (
          <>
            <div className="linha-campos">
              <label>
                Tipo
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="CARTAO_CREDITO">Crédito</option>
                  <option value="CARTAO_DEBITO">Débito</option>
                </select>
              </label>
              <label>
                Apelido (opcional)
                <input value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={60} placeholder="Ex.: Cartão roxo" />
              </label>
            </div>
            <label className="opcao">
              <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} />
              Definir como padrão
            </label>
          </>
        )}

        {modo === 'checkout' && (
          <label className="opcao">
            <input type="checkbox" checked={salvar} onChange={(e) => setSalvar(e.target.checked)} />
            Salvar este cartão (guardamos só os 4 últimos dígitos)
          </label>
        )}
      </div>
    </div>
  );
}
