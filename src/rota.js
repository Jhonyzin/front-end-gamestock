// Mini-roteador por "hash" (a parte da URL depois do #).
// Ex.: #/jogo/161  ->  { caminho: '/jogo/161', partes: ['jogo', '161'], query: {} }
// Assim o botão "voltar" e o F5 funcionam sem precisar de React Router.
import { useEffect, useState } from 'react';

function lerHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [caminho, busca = ''] = hash.split('?');
  return {
    caminho,
    partes: caminho.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(busca)),
  };
}

// Hook que devolve a rota atual e se atualiza quando o hash muda
export function useRota() {
  const [rota, setRota] = useState(lerHash);

  useEffect(() => {
    function aoMudar() {
      const nova = lerHash();
      setRota((antiga) => {
        // só volta ao topo quando muda de página (não quando muda um filtro)
        if (antiga.caminho !== nova.caminho) window.scrollTo(0, 0);
        return nova;
      });
    }
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  return rota;
}

// Vai para outra página: navegar('/carrinho')
export function navegar(caminho) {
  window.location.hash = caminho;
}
