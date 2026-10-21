// Admin > Configurações do site (tabela configuracoes_site)
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCarregar } from '../../util/useCarregar.js';
import { Carregando, ErroCarregar } from '../../components/Estado.jsx';

export default function Configuracoes() {
  const { mostrarToast } = useToast();
  const estado = useCarregar(() => api('/admin/configuracoes'), []);
  const [valores, setValores] = useState({});
  const [salvando, setSalvando] = useState(false);

  // Copia os valores vindos da API para os campos
  useEffect(() => {
    if (estado.dados) setValores(Object.fromEntries(estado.dados.map((c) => [c.chave, c.valor || ''])));
  }, [estado.dados]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api('/admin/configuracoes', { metodo: 'PUT', corpo: valores });
      mostrarToast('Configurações salvas!', 'sucesso');
    } catch (falha) {
      mostrarToast(falha.message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  if (estado.carregando) return <Carregando />;
  if (estado.erro) return <ErroCarregar mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;

  return (
    <div>
      <div className="admin-cabecalho"><h1>Configurações do site</h1></div>
      <form className="bloco formulario" onSubmit={salvar}>
        {estado.dados.map((c) => (
          <label key={c.chave}>
            {c.descricao || c.chave} <small>({c.chave})</small>
            <input value={valores[c.chave] ?? ''} onChange={(e) => setValores((v) => ({ ...v, [c.chave]: e.target.value }))} maxLength={500} />
          </label>
        ))}
        <button className="botao botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar configurações'}</button>
      </form>
    </div>
  );
}
