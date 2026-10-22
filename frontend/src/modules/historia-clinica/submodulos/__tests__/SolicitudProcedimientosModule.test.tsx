import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SolicitudProcedimientosModule,
  type ProcedimientoItem,
  type SolicitudProcedimientosData,
} from '../SolicitudProcedimientosModule';

const CAUTERIZACION: ProcedimientoItem = { id: 'p1', codigoCups: '861501', descripcion: 'Cauterización', cantidad: 1, tipoAmbito: 'AMBULATORIO' };
const RESECCION: ProcedimientoItem = { id: 'p2', descripcion: 'Resección de lesión', cantidad: 1, tipoAmbito: 'QUIRURGICO' };

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as SolicitudProcedimientosData;

describe('SolicitudProcedimientosModule', () => {
  afterEach(cleanup);

  it('agregar emite un array nuevo con un procedimiento ambulatorio en blanco', async () => {
    const onChange = vi.fn();
    const data: SolicitudProcedimientosData = { items: [CAUTERIZACION] };
    render(<SolicitudProcedimientosModule data={data} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /Agregar procedimiento/ }));

    const { items } = ultimo(onChange);
    expect(items).not.toBe(data.items);
    expect(items?.[0]).toBe(CAUTERIZACION);
    expect(items?.[1]).toEqual(expect.objectContaining({ descripcion: '', cantidad: 1, tipoAmbito: 'AMBULATORIO' }));
    expect(data.items).toHaveLength(1);
  });

  it('eliminar quita solo ese procedimiento sin mutar el array original', async () => {
    const onChange = vi.fn();
    const data: SolicitudProcedimientosData = { items: [CAUTERIZACION, RESECCION] };
    render(<SolicitudProcedimientosModule data={data} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar orden 2' }));

    expect(ultimo(onChange)).toEqual({ items: [CAUTERIZACION] });
    expect(data.items).toEqual([CAUTERIZACION, RESECCION]);
  });

  it('cambiar el ámbito clona el array y cambia solo ese procedimiento', () => {
    const onChange = vi.fn();
    render(<SolicitudProcedimientosModule data={{ items: [CAUTERIZACION, RESECCION] }} onChange={onChange} />);

    fireEvent.change(screen.getAllByLabelText('Ámbito')[0], { target: { value: 'URGENCIAS' } });

    const { items } = ultimo(onChange);
    expect(items).toEqual([{ ...CAUTERIZACION, tipoAmbito: 'URGENCIAS' }, RESECCION]);
    expect(items?.[1]).toBe(RESECCION);
    expect(CAUTERIZACION.tipoAmbito).toBe('AMBULATORIO');
  });

  it('el código CUPS se normaliza a mayúsculas sin espacios', () => {
    const onChange = vi.fn();
    render(<SolicitudProcedimientosModule data={{ items: [RESECCION] }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Código CUPS'), { target: { value: ' 86ab01 ' } });

    expect(ultimo(onChange).items?.[0].codigoCups).toBe('86AB01');
  });

  it('readOnly desactiva campos y selectores y oculta agregar y quitar', () => {
    render(<SolicitudProcedimientosModule data={{ items: [CAUTERIZACION, RESECCION] }} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('textbox').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByRole('combobox').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByRole('spinbutton').forEach((c) => expect(c).toBeDisabled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
