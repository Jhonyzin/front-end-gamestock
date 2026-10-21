// Painel admin: barra lateral + conteúdo da aba escolhida (#/admin/<aba>)
import { useAuth } from '../../context/AuthContext.jsx';
import { Carregando } from '../../components/Estado.jsx';
import Dashboard from './Dashboard.jsx';
import Jogos from './Jogos.jsx';
import Promocoes from './Promocoes.jsx';
import Pedidos from './Pedidos.jsx';
import Usuarios from './Usuarios.jsx';
import Avaliacoes from './Avaliacoes.jsx';
import Categorias from './Categorias.jsx';
import Plataformas from './Plataformas.jsx';
import Configuracoes from './Configuracoes.jsx';

const ABAS = [
  { id: 'dashboard', texto: '📊 Dashboard', componente: Dashboard },
  { id: 'jogos', texto: '🎮 Produtos', componente: Jogos },
  { id: 'promocoes', texto: '🏷️ Promoções', componente: Promocoes },
  { id: 'pedidos', texto: '🧾 Pedidos', componente: Pedidos },
  { id: 'usuarios', texto: '👥 Usuários', componente: Usuarios },
  { id: 'categorias', texto: '📁 Categorias', componente: Categorias },
  { id: 'plataformas', texto: '🖥️ Plataformas', componente: Plataformas },
  { id: 'avaliacoes', texto: '⭐ Avaliações', componente: Avaliacoes },
  { id: 'configuracoes', texto: '⚙️ Configurações', componente: Configuracoes },
];

export default function AdminLayout({ aba = 'dashboard' }) {
  const { usuario, ehAdmin, verificando, abrirLogin } = useAuth();

  if (verificando) return <div className="conteudo"><Carregando /></div>;

  // Só o ADMINISTRADOR (vendedor) entra aqui
  if (!usuario || !ehAdmin) {
    return (
      <div className="conteudo">
        <div className="estado estado-login">
          <h2>Acesso restrito</h2>
          <p>Esta área é exclusiva para administradores da loja.</p>
          {!usuario && <button className="botao botao-principal" onClick={() => abrirLogin('login')}>Entrar</button>}
        </div>
      </div>
    );
  }

  const atual = ABAS.find((a) => a.id === aba) || ABAS[0];
  const Componente = atual.componente;

  return (
    <div className="admin">
      <aside className="admin-lateral">
        <div className="admin-titulo">Painel do vendedor</div>
        <nav>
          {ABAS.map((a) => (
            <a key={a.id} href={`#/admin/${a.id}`} className={a.id === atual.id ? 'ativa' : ''}>{a.texto}</a>
          ))}
        </nav>
        <a href="#/" className="admin-voltar">← Ver loja</a>
      </aside>
      <main className="admin-conteudo">
        <Componente />
      </main>
    </div>
  );
}
