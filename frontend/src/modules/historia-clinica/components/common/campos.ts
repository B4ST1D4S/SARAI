/**
 * Tokens de estilo de los campos de historia clínica. Un solo lugar para la
 * altura, el foco y los estados deshabilitado y de error, para que todos los
 * submódulos se vean y se comporten igual. Solo usa tokens semánticos del
 * sistema: el modo oscuro lo resuelven los tokens, no variantes `dark:`.
 */

/** Borde, fondo, texto, foco y estado deshabilitado comunes a todo campo. */
const BASE_CAMPO =
  'w-full rounded-xl text-sm bg-subtle border border-border text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed';

/** Input de una línea (texto, número, fecha): altura estándar h-10. */
export const ESTILO_INPUT = `${BASE_CAMPO} h-10 px-3`;

/** Select con la misma altura, padding y foco que los inputs. */
export const ESTILO_SELECT = `${BASE_CAMPO} h-10 px-3 cursor-pointer`;

/** Textarea: padding más amplio para escribir texto clínico largo. */
export const ESTILO_TEXTAREA = `${BASE_CAMPO} p-3.5 leading-relaxed resize-y`;

/** Etiqueta de campo clínico. */
export const ESTILO_LABEL = 'text-xs font-semibold text-secondary uppercase tracking-wider';

/** Mensaje de error de validación (acompaña a role="alert"). */
export const ESTILO_ERROR_MSG = 'text-xs text-danger mt-1';

/**
 * Borde y foco de un campo con error de validación. Lleva `!` para imponerse
 * al `border-border` / `focus:border-primary` de la base sin depender del
 * orden de las clases en el CSS generado.
 */
export const ESTILO_CAMPO_ERROR = '!border-danger focus:!border-danger focus:!ring-danger/40';

/**
 * Compone un token con clases propias del campo, descartando las condiciones
 * falsas. No resuelve conflictos: una clase que deba imponerse a la base
 * (como ESTILO_CAMPO_ERROR) usa el modificador `!`.
 */
export const clasesCampo = (...clases: Array<string | false | null | undefined>) =>
  clases.filter((c): c is string => Boolean(c)).join(' ');
