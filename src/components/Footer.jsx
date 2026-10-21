// Rodapé simples
export default function Footer() {
  return (
    <footer className="rodape">
      <div className="conteudo rodape-conteudo">
        <div>
          <div className="logo">GAME<span>STOCK</span></div>
          <p>Sua loja de jogos digitais. Chave de ativação liberada na hora.</p>
        </div>
        <div className="rodape-links">
          <a href="#/loja">Todos os jogos</a>
          <a href="#/loja?promocao=1">Ofertas</a>
          <a href="#/biblioteca">Minha biblioteca</a>
          <a href="#/carrinho">Carrinho</a>
        </div>
        <p className="rodape-credito">
          © 2026 GameStock. Todos os direitos reservados. 
        </p>
        <p>
          Projeto 100% veridico, para usar deve informar em quem votou em 2026
        </p>
      </div>
    </footer>
  );
}
