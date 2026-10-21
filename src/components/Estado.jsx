// Mensagens padrão de carregamento, erro e lista vazia
import { useAuth } from '../context/AuthContext.jsx';

export function Carregando({ texto = 'Carregando…' }) {
  return <div className="estado estado-carregando">{texto}</div>;
}

export function ErroCarregar({ mensagem, aoTentarDeNovo }) {
  return (
    <div className="estado estado-erro">
      <p>Não foi possível carregar. Tente novamente.</p>
      {mensagem && <small>{mensagem}</small>}
      {aoTentarDeNovo && <button className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>}
    </div>
  );
}

export function Vazio({ children }) {
  return <div className="estado estado-vazio">{children}</div>;
}

// Bloqueia a página para quem não está logado
export function ExigirLogin({ children, mensagem = 'Entre na sua conta para ver esta página.' }) {
  const { usuario, verificando, abrirLogin } = useAuth();
  if (verificando) return <Carregando />;
  if (!usuario) {
    return (
      <div className="estado estado-login">
        <h2>Área do cliente</h2>
        <p>{mensagem}</p>
        <button className="botao botao-principal" onClick={() => abrirLogin('login')}>Entrar</button>
      </div>
    );
  }
  return children;
}
