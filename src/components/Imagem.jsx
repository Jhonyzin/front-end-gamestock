// <img> que troca pela imagem padrão quando o arquivo não existe
import { urlImagem } from '../util/formatar.js';

const PADRAO = '/capas/padrao.svg';

export default function Imagem({ src, alt = '', className = '' }) {
  function aoFalhar(e) {
    if (!e.currentTarget.src.endsWith(PADRAO)) e.currentTarget.src = PADRAO;
  }
  return <img src={urlImagem(src)} alt={alt} className={className} onError={aoFalhar} loading="lazy" />;
}
