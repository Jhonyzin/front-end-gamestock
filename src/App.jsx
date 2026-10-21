// Componente principal: provedores (contextos) + barra do topo + página da rota atual
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CarrinhoProvider } from './context/CarrinhoContext.jsx';
import { useRota } from './rota.js';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import LoginModal from './components/LoginModal.jsx';
import Home from './pages/Home.jsx';
import Loja from './pages/Loja.jsx';
import Jogo from './pages/Jogo.jsx';
import Carrinho from './pages/Carrinho.jsx';
import Checkout from './pages/Checkout.jsx';
import Biblioteca from './pages/Biblioteca.jsx';
import Perfil from './pages/Perfil.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import Desejos from './pages/Desejos.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';

// Escolhe a página pela primeira parte do endereço (#/loja, #/jogo/161...)
function Pagina({ rota }) {
  const [pagina, parametro] = rota.partes;
  switch (pagina) {
    case undefined: return <Home />;
    case 'loja': return <Loja rota={rota} />;
    case 'jogo': return <Jogo key={parametro} id={Number(parametro)} />;
    case 'carrinho': return <Carrinho />;
    case 'checkout': return <Checkout />;
    case 'biblioteca': return <Biblioteca aba={parametro} />;
    case 'perfil': return <Perfil />;
    case 'pagamentos': return <Pagamentos />;
    case 'desejos': return <Desejos />;
    case 'admin': return <AdminLayout aba={parametro} />;
    default:
      return (
        <div className="conteudo estado">
          <h2>Página não encontrada</h2>
          <a href="#/" className="botao botao-principal">Voltar à loja</a>
        </div>
      );
  }
}

export default function App() {
  const rota = useRota();
  return (
    <ToastProvider>
      <AuthProvider>
        <CarrinhoProvider>
          <Navbar rota={rota} />
          <main className="principal">
            <Pagina rota={rota} />
          </main>
          <Footer />
          <LoginModal />
        </CarrinhoProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
