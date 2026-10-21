// Janela sobreposta (modal). Fecha no X, no ESC ou clicando fora.
import { useEffect } from 'react';

export default function Modal({ titulo, aoFechar, children, largo = false }) {
  useEffect(() => {
    function teclar(e) {
      if (e.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', teclar);
    document.body.style.overflow = 'hidden';   // trava a rolagem da página
    return () => {
      document.removeEventListener('keydown', teclar);
      document.body.style.overflow = '';
    };
  }, [aoFechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className={`modal ${largo ? 'modal-largo' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-topo">
          <h2>{titulo}</h2>
          <button className="modal-fechar" onClick={aoFechar} aria-label="Fechar">×</button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}
