import { useCallback, useEffect, useRef, useState } from 'react';
import {
  accionEnvioCorreo,
  crearEnvioCorreo,
  enviarCorreoPrueba,
  erroresEnvioCorreo,
  estadoCorreos,
  leerDestinatariosCorreo,
  SessionExpiredError,
} from '../lib/api';
import type { AdjuntoCorreo, EnvioCorreo, EstadoCorreos } from '../lib/types';
import ZonaArchivo from './ZonaArchivo';

type Destinatarios = { correos: string[]; duplicados: number; invalidos: { celda: string; valor: string }[] };
type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const MB = 1024 * 1024;
const tamano = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const leerBase64 = (archivo: File) =>
  new Promise<string>((ok, fallo) => {
    const lector = new FileReader();
    lector.onload = () => ok(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => fallo(new Error(`No se pudo leer ${archivo.name}`));
    lector.readAsDataURL(archivo);
  });

const ESTADO: Record<EnvioCorreo['estado'], { texto: string; clase: string }> = {
  activo: { texto: 'Enviando', clase: 'bg-sky-100 text-sky-800' },
  pausado: { texto: 'Pausado', clase: 'bg-amber-100 text-amber-800' },
  cancelado: { texto: 'Cancelado', clase: 'bg-slate-200 text-slate-700' },
  terminado: { texto: 'Terminado', clase: 'bg-emerald-100 text-emerald-800' },
};

const BOTONES_FORMATO: { comando: string; etiqueta: string; titulo: string; clase?: string }[] = [
  { comando: 'bold', etiqueta: 'N', titulo: 'Negrita', clase: 'font-bold' },
  { comando: 'italic', etiqueta: 'K', titulo: 'Cursiva', clase: 'italic' },
  { comando: 'underline', etiqueta: 'S', titulo: 'Subrayado', clase: 'underline' },
  { comando: 'insertUnorderedList', etiqueta: '• Lista', titulo: 'Lista con viñetas' },
  { comando: 'insertOrderedList', etiqueta: '1. Lista', titulo: 'Lista numerada' },
  { comando: 'removeFormat', etiqueta: 'Quitar formato', titulo: 'Quitar formato' },
];

// Tarjeta de Master RRHH: envío masivo de correos desde la cuenta de RRHH, en lotes según los límites de Gmail
export default function EnvioCorreos({ onLogout }: { onLogout: () => void }) {
  const [estado, setEstado] = useState<EstadoCorreos | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [destinatarios, setDestinatarios] = useState<Destinatarios | null>(null);
  const [asunto, setAsunto] = useState('');
  const [adjuntos, setAdjuntos] = useState<AdjuntoCorreo[]>([]);
  const [correoPrueba, setCorreoPrueba] = useState('');
  const [ocupado, setOcupado] = useState<null | 'leyendo' | 'adjuntando' | 'prueba' | 'programando'>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [errores, setErrores] = useState<{ id: number; lista: { correo: string; error: string }[] } | null>(null);
  const editor = useRef<HTMLDivElement>(null);

  const manejarError = useCallback(
    (err: unknown) => {
      if (err instanceof SessionExpiredError) return onLogout();
      setAviso({ tipo: 'error', texto: (err as Error).message });
    },
    [onLogout],
  );

  const actualizar = useCallback(async () => {
    try {
      setEstado(await estadoCorreos());
    } catch (err) {
      if (err instanceof SessionExpiredError) onLogout();
    }
  }, [onLogout]);

  // Progreso de los envíos: se actualiza cada 10 segundos
  useEffect(() => {
    actualizar();
    const t = setInterval(actualizar, 10_000);
    return () => clearInterval(t);
  }, [actualizar]);

  const config = estado?.config;
  const totalAdjuntos = adjuntos.reduce((s, a) => s + a.tamano, 0);
  const maxAdjuntos = config?.maxAdjuntosBytes ?? 18 * MB;

  const cargarExcel = async ([f]: File[]) => {
    if (!/\.xlsx$/i.test(f.name)) return setAviso({ tipo: 'error', texto: 'Seleccione un archivo de Excel (.xlsx)' });
    setAviso(null);
    setOcupado('leyendo');
    try {
      const r = await leerDestinatariosCorreo(f);
      setArchivo(f);
      setDestinatarios(r);
      if (r.correos.length === 0) setAviso({ tipo: 'error', texto: 'El archivo no tiene direcciones de correo válidas' });
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupado(null);
    }
  };

  const agregarAdjuntos = async (archivos: File[]) => {
    const total = totalAdjuntos + archivos.reduce((s, f) => s + f.size, 0);
    if (total > maxAdjuntos) {
      return setAviso({
        tipo: 'error',
        texto: `Los adjuntos sumarían ${tamano(total)}; Gmail admite como máximo ${tamano(maxAdjuntos)} por correo`,
      });
    }
    setAviso(null);
    setOcupado('adjuntando');
    try {
      const nuevos = await Promise.all(
        archivos.map(async (f) => ({
          nombre: f.name,
          tipo: f.type || 'application/octet-stream',
          tamano: f.size,
          base64: await leerBase64(f),
        })),
      );
      setAdjuntos((prev) => [...prev, ...nuevos]);
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupado(null);
    }
  };

  const cuerpoHtml = () => editor.current?.innerHTML ?? '';
  const cuerpoVacio = () => !editor.current?.innerText.trim() && !editor.current?.querySelector('img');

  const validarMensaje = () => {
    if (!asunto.trim()) return 'Escriba el asunto del correo';
    if (cuerpoVacio()) return 'Escriba o pegue el cuerpo del correo';
    return null;
  };

  const probar = async () => {
    const falta = validarMensaje() ?? (correoPrueba.trim() ? null : 'Escriba el correo donde recibir la prueba');
    if (falta) return setAviso({ tipo: 'error', texto: falta });
    setAviso(null);
    setOcupado('prueba');
    try {
      await enviarCorreoPrueba(correoPrueba.trim(), { asunto, cuerpoHtml: cuerpoHtml(), adjuntos });
      setAviso({
        tipo: 'ok',
        texto:
          config?.modo === 'prueba'
            ? 'Prueba procesada (modo prueba: el correo no se envía realmente)'
            : `Correo de prueba enviado a ${correoPrueba.trim()}`,
      });
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupado(null);
    }
  };

  const programar = async () => {
    const falta = destinatarios?.correos.length ? validarMensaje() : 'Cargue el Excel con los destinatarios';
    if (falta) return setAviso({ tipo: 'error', texto: falta });
    const n = destinatarios!.correos.length;
    const limite = config?.limite24h ?? 450;
    const enCola = (estado?.envios ?? [])
      .filter((e) => e.estado === 'activo' || e.estado === 'pausado')
      .reduce((s, e) => s + e.pendientes, 0);
    const dias = Math.max(1, Math.ceil((n + enCola) / limite));
    const ok = window.confirm(
      `Se enviará el correo "${asunto.trim()}" a ${n} destinatarios` +
        (adjuntos.length ? ` con ${adjuntos.length} adjunto(s)` : '') +
        `.\n\nGmail permite ${limite} correos cada 24 horas, así que el envío tomará aproximadamente ` +
        `${dias === 1 ? 'menos de 1 día' : `${dias} días`}` +
        (enCola ? ` (hay ${enCola} correos de otros envíos en cola)` : '') +
        '. Se enviará en lotes automáticamente.\n\n¿Desea programar el envío?',
    );
    if (!ok) return;
    setAviso(null);
    setOcupado('programando');
    try {
      const r = await crearEnvioCorreo({
        asunto,
        cuerpoHtml: cuerpoHtml(),
        adjuntos,
        correos: destinatarios!.correos,
        archivo: archivo?.name ?? '',
      });
      setAviso({ tipo: 'ok', texto: `Envío programado para ${r.total} destinatarios. Puede seguir su progreso abajo.` });
      setArchivo(null);
      setDestinatarios(null);
      setAsunto('');
      setAdjuntos([]);
      if (editor.current) editor.current.innerHTML = '';
      actualizar();
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupado(null);
    }
  };

  const accion = async (id: number, a: 'pausar' | 'reanudar' | 'cancelar') => {
    if (a === 'cancelar' && !window.confirm('¿Cancelar este envío? Los correos pendientes ya no se enviarán.')) return;
    try {
      await accionEnvioCorreo(id, a);
      actualizar();
    } catch (err) {
      manejarError(err);
    }
  };

  const verErrores = async (id: number) => {
    if (errores?.id === id) return setErrores(null);
    try {
      setErrores({ id, lista: await erroresEnvioCorreo(id) });
    } catch (err) {
      manejarError(err);
    }
  };

  const e = estado?.estado;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Envío de correos</h2>
      <p className="mt-1 text-sm text-slate-600">
        Envía un correo a todas las direcciones de un Excel desde <b>{config?.remitente || 'la cuenta de RRHH'}</b>.
        Cada persona recibe su propio correo. El envío se hace por lotes para respetar los límites de Gmail.
      </p>

      {/* Estado del servicio de correo */}
      {config && (
        <div className="mt-4 space-y-2 text-sm">
          {!config.configurado && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
              Falta configurar en el servidor la contraseña de aplicación de Gmail (CORREO_CLAVE_APLICACION). Los envíos
              quedarán en cola y saldrán cuando se configure.
            </p>
          )}
          {config.modo === 'prueba' && (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
              Modo prueba: el sistema simula los envíos y no se envía ningún correo real.
            </p>
          )}
          <p className="text-slate-600">
            Enviados en las últimas 24 horas: <b>{e?.enviados24h ?? 0}</b> de {config.limite24h} · Lotes de {config.lote}{' '}
            correos con pausas de {config.pausaLoteMin} min
          </p>
          {e?.pausaHasta && (
            <p className="text-amber-800">
              En pausa hasta {fecha(e.pausaHasta)} — {e.motivoPausa}
            </p>
          )}
          {e?.ultimoError && (e.ultimoError.tipo === 'autenticacion' || e.ultimoError.tipo === 'conexion') && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Último error de Gmail: {e.ultimoError.mensaje}</p>
          )}
        </div>
      )}

      {/* 1. Destinatarios */}
      <div className="mt-5 space-y-2">
        <h3 className="font-medium text-slate-800">1. Destinatarios</h3>
        {destinatarios && archivo ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                <b>{archivo.name}</b>: {destinatarios.correos.length} direcciones válidas
                {destinatarios.duplicados > 0 && ` · ${destinatarios.duplicados} repetidas (se envía una sola vez)`}
                {destinatarios.invalidos.length > 0 && ` · ${destinatarios.invalidos.length} inválidas (se omiten)`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setArchivo(null);
                  setDestinatarios(null);
                }}
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                Cambiar archivo
              </button>
            </div>
            {destinatarios.invalidos.length > 0 && (
              <p className="mt-1 text-amber-700">
                Inválidas:{' '}
                {destinatarios.invalidos
                  .slice(0, 10)
                  .map((i) => `${i.celda} "${i.valor}"`)
                  .join(', ')}
                {destinatarios.invalidos.length > 10 && ` y ${destinatarios.invalidos.length - 10} más`}
              </p>
            )}
          </div>
        ) : (
          <ZonaArchivo
            onArchivos={cargarExcel}
            accept=".xlsx"
            disabled={ocupado !== null}
            titulo={ocupado === 'leyendo' ? 'Leyendo el archivo…' : 'Arrastre aquí el Excel con los correos o haga clic para buscarlo'}
            detalle="Se toman las direcciones de correo de cualquier columna de la primera hoja"
          />
        )}
      </div>

      {/* 2. Mensaje */}
      <div className="mt-5 space-y-3">
        <h3 className="font-medium text-slate-800">2. Mensaje</h3>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Asunto</span>
          <input
            value={asunto}
            onChange={(ev) => setAsunto(ev.target.value)}
            maxLength={255}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </label>
        <div>
          <span className="text-sm font-medium text-slate-700">Cuerpo del correo</span>
          <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-sky-500">
            <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
              {BOTONES_FORMATO.map((b) => (
                <button
                  key={b.comando}
                  type="button"
                  title={b.titulo}
                  onMouseDown={(ev) => ev.preventDefault()} // conserva la selección del texto
                  onClick={() => document.execCommand(b.comando)}
                  className={`rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-200 ${b.clase ?? ''}`}
                >
                  {b.etiqueta}
                </button>
              ))}
            </div>
            <div
              ref={editor}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Cuerpo del correo"
              data-placeholder="Escriba o pegue aquí el texto del correo (se conserva el formato copiado de Word o Gmail)"
              className="min-h-48 px-3 py-2 text-sm text-slate-800 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Adjuntos {adjuntos.length > 0 && `(${tamano(totalAdjuntos)} de ${tamano(maxAdjuntos)})`}
          </span>
          {adjuntos.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              {adjuntos.map((a, i) => (
                <li key={`${a.nombre}-${i}`} className="flex items-center justify-between gap-3 px-3 py-1.5">
                  <span className="truncate">
                    {a.nombre} <span className="text-slate-500">({tamano(a.tamano)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdjuntos((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 text-red-700 hover:underline"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ZonaArchivo
            onArchivos={agregarAdjuntos}
            multiple
            disabled={ocupado !== null}
            titulo={ocupado === 'adjuntando' ? 'Cargando adjuntos…' : 'Arrastre aquí los archivos adjuntos o haga clic para buscarlos'}
            detalle={`Máximo ${tamano(maxAdjuntos)} en total (límite de Gmail por correo)`}
          />
        </div>
      </div>

      {/* 3. Prueba y envío */}
      <div className="mt-5 space-y-3">
        <h3 className="font-medium text-slate-800">3. Enviar</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-64 flex-1">
            <span className="text-sm font-medium text-slate-700">Enviar primero una prueba a</span>
            <input
              type="email"
              value={correoPrueba}
              onChange={(ev) => setCorreoPrueba(ev.target.value)}
              placeholder="su.correo@ejemplo.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </label>
          <button
            type="button"
            onClick={probar}
            disabled={ocupado !== null}
            className="rounded-lg border border-sky-700 px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-60"
          >
            {ocupado === 'prueba' ? 'Enviando prueba…' : 'Enviar prueba'}
          </button>
        </div>
        <button
          type="button"
          onClick={programar}
          disabled={ocupado !== null || !destinatarios?.correos.length}
          className="rounded-lg bg-sky-700 px-5 py-2.5 font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
        >
          {ocupado === 'programando'
            ? 'Programando…'
            : `Programar envío${destinatarios?.correos.length ? ` a ${destinatarios.correos.length} destinatarios` : ''}`}
        </button>
        {aviso && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              aviso.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-600'
            }`}
          >
            {aviso.texto}
          </p>
        )}
      </div>

      {/* Envíos programados */}
      {estado && estado.envios.length > 0 && (
        <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
          <h3 className="font-medium text-slate-800">Envíos</h3>
          {estado.envios.map((env) => {
            const procesados = env.enviados + env.errores;
            const pct = env.total ? Math.round((procesados / env.total) * 100) : 0;
            return (
              <div key={env.id} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{env.asunto}</p>
                    <p className="text-slate-500">
                      {fecha(env.creado)}
                      {env.archivo && ` · ${env.archivo}`}
                      {env.adjuntos.length > 0 && ` · Adjuntos: ${env.adjuntos.join(', ')}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO[env.estado].clase}`}>
                    {ESTADO[env.estado].texto}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-sky-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-600">
                    {env.enviados} enviados de {env.total} ({pct}%) · {env.pendientes} pendientes
                    {env.errores > 0 && (
                      <>
                        {' · '}
                        <button type="button" onClick={() => verErrores(env.id)} className="text-red-700 hover:underline">
                          {env.errores} con error
                        </button>
                      </>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {env.estado === 'activo' && (
                      <button type="button" onClick={() => accion(env.id, 'pausar')} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
                        Pausar
                      </button>
                    )}
                    {env.estado === 'pausado' && (
                      <button type="button" onClick={() => accion(env.id, 'reanudar')} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
                        Reanudar
                      </button>
                    )}
                    {(env.estado === 'activo' || env.estado === 'pausado') && (
                      <button type="button" onClick={() => accion(env.id, 'cancelar')} className="rounded border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                {errores?.id === env.id && (
                  <ul className="mt-2 max-h-48 overflow-auto rounded border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {errores.lista.map((x) => (
                      <li key={x.correo}>
                        <b>{x.correo}</b>: {x.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
