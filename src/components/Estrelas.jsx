// Estrelas de avaliação. Com "aoEscolher", vira um campo clicável (nota 1 a 5).
export default function Estrelas({ nota = 0, aoEscolher }) {
  const cheias = Math.round(nota || 0);
  return (
    <span className={`estrelas ${aoEscolher ? 'estrelas-campo' : ''}`} aria-label={`Nota ${nota || 0} de 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        aoEscolher ? (
          <button key={n} type="button" className={n <= cheias ? 'cheia' : ''} onClick={() => aoEscolher(n)} aria-label={`${n} estrela(s)`}>
            ★
          </button>
        ) : (
          <span key={n} className={n <= cheias ? 'cheia' : ''}>★</span>
        )
      )}
    </span>
  );
}
