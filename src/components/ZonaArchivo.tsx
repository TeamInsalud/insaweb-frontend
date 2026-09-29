import { useRef, useState, type ReactNode } from 'react';

interface Props {
  onArchivos: (archivos: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  titulo: ReactNode;
  detalle?: ReactNode;
}

// Zona para arrastrar archivos o hacer clic y buscarlos
export default function ZonaArchivo({ onArchivos, accept, multiple, disabled, titulo, detalle }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const entregar = (lista: FileList | null) => {
    const archivos = lista ? Array.from(lista) : [];
    if (archivos.length) onArchivos(multiple ? archivos : archivos.slice(0, 1));
    if (input.current) input.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        if (!disabled) entregar(e.dataTransfer.files);
      }}
      onClick={() => !disabled && input.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && input.current?.click()}
      className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
        disabled
          ? 'cursor-not-allowed border-slate-200 opacity-60'
          : arrastrando
            ? 'cursor-pointer border-sky-500 bg-sky-50'
            : 'cursor-pointer border-slate-300 hover:border-sky-400 hover:bg-slate-50'
      }`}
    >
      <p className="font-medium text-slate-700">{titulo}</p>
      {detalle && <p className="mt-1 text-sm text-slate-500">{detalle}</p>}
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => entregar(e.target.files)}
      />
    </div>
  );
}
