// Admin > Promoções: criar (nome/etiqueta, %, início, fim), escolher jogos e ligar/desligar
import { useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import { dataHora } from '../../util/formatar.js';
import Modal from '../../components/Modal.jsx';
import Selo from '../../components/Selo.jsx';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

// "2025-06-10 14:30:00" -> "2025-06-10T14:30" (formato do input datetime-local)
const paraInput = (texto) => (texto ? texto.slice(0, 16).replace(' ', 'T') : '');

function agoraMais(dias) {
  const d = new Date(Date.now() + dias * 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const CORES_SITUACAO = { 'Ativa agora': 'ok', Agendada: 'baixo', Encerrada: 'neutro', Desligada: 'esgotado' };

export default function Promocoes() {
  const { mostrarToast } = useToast();
  const promocoes = useCarregar(() => api('/admin/promocoes'), []);
  const jogos = useCarregar(() => api('/admin/jogos'), []);
  const [editando, setEditando] = useState(undefined);   // undefined fechado | null nova | objeto

  // Monta o corpo esperado pela API a partir de uma promoção
  const corpoDe = (p) => ({
    nome: p.nome, descricao: p.descricao, percentual: p.percentual,
    data_inicio: p.data_inicio, data_fim: p.data_fim, ativo: p.ativo, jogos: p.jogos,
  });

  async function executar(acao, mensagem) {
    try {
      await acao();
      mostrarToast(mensagem, 'sucesso');
      promocoes.recarregar();
      return true;
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
      return false;
    }
  }

  const nomeJogo = (id) => jogos.dados?.find((j) => j.id === id)?.nome || `#${id}`;

  return (
    <div>
      <div className="admin-cabecalho">
        <h1>Promoções</h1>
        <button className="botao botao-principal" onClick={() => setEditando(null)}>＋ Nova promoção</button>
      </div>
      <p className="info-campo">Os jogos de uma promoção ativa aparecem sozinhos nos cards grandes “Descontos e eventos” da Home. O nome da promoção vira a etiqueta.</p>

      {promocoes.carregando && <Carregando />}
      {promocoes.erro && <ErroCarregar mensagem={promocoes.erro} aoTentarDeNovo={promocoes.recarregar} />}
      {promocoes.dados && (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Nome (etiqueta)</th><th>%</th><th>Início</th><th>Fim</th><th>Situação</th><th>Jogos</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {promocoes.dados.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nome}</strong><small className="bloco-texto">{p.descricao}</small></td>
                  <td>{p.percentual}%</td>
                  <td>{dataHora(p.data_inicio)}</td>
                  <td>{dataHora(p.data_fim)}</td>
                  <td><Selo tipo={CORES_SITUACAO[p.situacao]}>{p.situacao}</Selo></td>
                  <td title={p.jogos.map(nomeJogo).join(', ')}>{p.jogos.length} jogo(s)</td>
                  <td className="acoes-tabela">
                    <button className="botao botao-secundario botao-pequeno" onClick={() => setEditando(p)}>Editar</button>
                    <button className="botao botao-secundario botao-pequeno" onClick={() => executar(() => api(`/admin/promocoes/${p.id}`, { metodo: 'PUT', corpo: { ...corpoDe(p), ativo: !p.ativo } }), p.ativo ? 'Promoção desligada.' : 'Promoção ligada.')}>
                      {p.ativo ? 'Desligar' : 'Ligar'}
                    </button>
                    <button className="botao botao-perigo botao-pequeno" onClick={() => window.confirm(`Excluir a promoção "${p.nome}"?`) && executar(() => api(`/admin/promocoes/${p.id}`, { metodo: 'DELETE' }), 'Promoção excluída.')}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando !== undefined && (
        <FormPromocao
          promocao={editando}
          jogos={jogos.dados || []}
          aoFechar={() => setEditando(undefined)}
          aoSalvar={async (corpo) => {
            const ok = await executar(
              () => (editando ? api(`/admin/promocoes/${editando.id}`, { metodo: 'PUT', corpo }) : api('/admin/promocoes', { metodo: 'POST', corpo })),
              editando ? 'Promoção atualizada!' : 'Promoção criada!'
            );
            if (ok) setEditando(undefined);
          }}
        />
      )}
    </div>
  );
}

function FormPromocao({ promocao, jogos, aoFechar, aoSalvar }) {
  const [campos, setCampos] = useState({
    nome: promocao?.nome || '',
    descricao: promocao?.descricao || '',
    percentual: promocao?.percentual || 10,
    data_inicio: paraInput(promocao?.data_inicio) || agoraMais(0),
    data_fim: paraInput(promocao?.data_fim) || agoraMais(7),
    ativo: promocao ? promocao.ativo : true,
    jogos: promocao?.jogos || [],
  });
  const [busca, setBusca] = useState('');

  const alterar = (nome, valor) => setCampos((c) => ({ ...c, [nome]: valor }));
  const alternarJogo = (id) => alterar('jogos', campos.jogos.includes(id) ? campos.jogos.filter((j) => j !== id) : [...campos.jogos, id]);

  const visiveis = jogos.filter((j) => j.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <Modal titulo={promocao ? 'Editar promoção' : 'Nova promoção'} aoFechar={aoFechar} largo>
      <form className="formulario" onSubmit={(e) => { e.preventDefault(); aoSalvar(campos); }}>
        <div className="linha-campos">
          <label>
            Nome / etiqueta *
            <input value={campos.nome} onChange={(e) => alterar('nome', e.target.value)} required maxLength={120} placeholder="Oferta do Fim de Semana" />
          </label>
          <label>
            Desconto (%) *
            <input type="number" min="1" max="100" step="0.01" value={campos.percentual} onChange={(e) => alterar('percentual', e.target.value)} required />
          </label>
        </div>
        <label>
          Descrição
          <input value={campos.descricao} onChange={(e) => alterar('descricao', e.target.value)} maxLength={300} />
        </label>
        <div className="linha-campos">
          <label>
            Início *
            <input type="datetime-local" value={campos.data_inicio} onChange={(e) => alterar('data_inicio', e.target.value)} required />
          </label>
          <label>
            Fim *
            <input type="datetime-local" value={campos.data_fim} onChange={(e) => alterar('data_fim', e.target.value)} required />
          </label>
        </div>
        <label className="opcao">
          <input type="checkbox" checked={campos.ativo} onChange={(e) => alterar('ativo', e.target.checked)} /> Promoção ligada
        </label>

        <fieldset>
          <legend>Jogos da promoção ({campos.jogos.length} selecionado(s))</legend>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar jogos…" />
          <div className="multi-escolha multi-escolha-alta">
            {visiveis.map((j) => (
              <label key={j.id} className="opcao">
                <input type="checkbox" checked={campos.jogos.includes(j.id)} onChange={() => alternarJogo(j.id)} />
                {j.nome}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="botoes rodape-formulario">
          <button className="botao botao-principal">Salvar promoção</button>
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
