// Barras do topo (inspiradas na loja da Steam):
// 1ª: logo + LOJA · BIBLIOTECA · MINHAS COMPRAS + usuário
// 2ª: menus Explorar / Categorias / Plataformas / Ofertas + busca + lista de desejos
import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { navegar } from '../rota.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import Imagem from './Imagem.jsx';

export default function Navbar({ rota }) {
  const { usuario, ehAdmin, sair, abrirLogin, desejos } = useAuth();
  const { quantidade } = useCarrinho();
  const [categorias, setCategorias] = useState([]);
  const [plataformas, setPlataformas] = useState([]);
  const [busca, setBusca] = useState('');
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [menuCelular, setMenuCelular] = useState(false);
  const refMenu = useRef(null);

  // Listas dos menus suspensos
  useEffect(() => {
    api('/categorias').then(setCategorias).catch(() => setCategorias([]));
    api('/plataformas').then(setPlataformas).catch(() => setPlataformas([]));
  }, []);

  // Fecha o menu do usuário ao clicar fora
  useEffect(() => {
    function clicarFora(e) {
      if (refMenu.current && !refMenu.current.contains(e.target)) setMenuUsuario(false);
    }
    document.addEventListener('mousedown', clicarFora);
    return () => document.removeEventListener('mousedown', clicarFora);
  }, []);

  // Fecha os menus quando a página muda
  useEffect(() => {
    setMenuUsuario(false);
    setMenuCelular(false);
  }, [rota.caminho, rota.query]);

  function buscar(e) {
    e.preventDefault();
    navegar(`/loja?busca=${encodeURIComponent(busca.trim())}`);
  }

  const aba = rota.partes[0] || '';

  return (
    <header className="topo">
      <div className="barra-principal">
        <div className="conteudo barra-principal-conteudo">
          <a href="#/" className="logo">GAME<span>STOCK</span></a>

          <button className="botao-menu-celular" onClick={() => setMenuCelular(!menuCelular)} aria-label="Abrir menu">☰</button>

          <nav className={`abas-principais ${menuCelular ? 'aberto' : ''}`}>
            <a href="#/" className={aba === '' || aba === 'loja' || aba === 'jogo' ? 'ativa' : ''}>LOJA</a>
            <a href="#/biblioteca" className={aba === 'biblioteca' && rota.partes[1] !== 'historico' ? 'ativa' : ''}>BIBLIOTECA</a>
            <a href="#/biblioteca/historico" className={rota.partes[1] === 'historico' ? 'ativa' : ''}>MINHAS COMPRAS</a>
            {usuario && (
              <span className="aba-usuario-nome">{usuario.nome_exibicao.toUpperCase()}</span>
            )}
          </nav>

          <div className="area-usuario">
            <a href="#/carrinho" className="botao-carrinho">
              🛒 Carrinho <strong>({quantidade})</strong>
            </a>

            {usuario ? (
              <div className="menu-usuario" ref={refMenu}>
                <button className="menu-usuario-botao" onClick={() => setMenuUsuario(!menuUsuario)}>
                  <Imagem src={usuario.foto_perfil || '/capas/avatar.svg'} alt="" className="avatar-pequeno" />
                  <span>{usuario.nome_exibicao}</span> ▾
                </button>
                {menuUsuario && (
                  <div className="menu-usuario-itens">
                    <a href="#/perfil">Meu perfil</a>
                    <a href="#/pagamentos">Formas de pagamento</a>
                    <a href="#/desejos">Lista de desejos</a>
                    {ehAdmin && <a href="#/admin">Painel admin</a>}
                    <button onClick={sair}>Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <button className="botao botao-principal botao-pequeno" onClick={() => abrirLogin('login')}>Entrar</button>
            )}
          </div>
        </div>
      </div>

      <div className="conteudo">
        <div className="barra-loja">
          <div className="menus-loja">
            <div className="menu-suspenso">
              <button>Explorar ▾</button>
              <div className="menu-suspenso-itens">
                <a href="#/loja">Todos os jogos</a>
                <a href="#/loja?ordem=populares">Mais vendidos</a>
                <a href="#/loja?ordem=lancamentos">Lançamentos</a>
              </div>
            </div>
            <div className="menu-suspenso">
              <button>Categorias ▾</button>
              <div className="menu-suspenso-itens menu-colunas">
                {categorias.map((c) => (
                  <a key={c.id} href={`#/loja?categoria=${c.id}`}>{c.nome}</a>
                ))}
              </div>
            </div>
            <div className="menu-suspenso">
              <button>Plataformas ▾</button>
              <div className="menu-suspenso-itens">
                {plataformas.map((p) => (
                  <a key={p.id} href={`#/loja?plataforma=${p.id}`}>{p.nome}</a>
                ))}
              </div>
            </div>
            <a href="#/loja?promocao=1" className="menu-link">Ofertas</a>
          </div>

          <form className="busca-loja" onSubmit={buscar}>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na loja" aria-label="Buscar na loja" />
            <button aria-label="Buscar">🔍</button>
          </form>

          <a href="#/desejos" className="link-desejos">★ Lista de desejos ({desejos.length})</a>
        </div>
      </div>
    </header>
  );
}
