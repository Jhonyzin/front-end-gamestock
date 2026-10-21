// Etiqueta pequena: "NA BIBLIOTECA", "Esgotado", "Restam 3", "-50%"...
// tipo: biblioteca | esgotado | baixo | ok | desconto | destaque | neutro
export default function Selo({ tipo = 'neutro', children }) {
  return <span className={`selo selo-${tipo}`}>{children}</span>;
}
