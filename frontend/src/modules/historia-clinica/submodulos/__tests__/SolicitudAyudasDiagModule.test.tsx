import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolicitudAyudasDiagModule, type AyudaDiagnosticaItem, type SolicitudAyudasDiagData } from '../SolicitudAyudasDiagModule';

const HEMOGRAMA: AyudaDiagnosticaItem = { id: 'a1', codigoCups: '902210', descripcion: 'Hemograma IV', cantidad: 1, justificacion: '' };
const RX_TORAX: AyudaDiagnosticaItem = { id: 'a2', codigoCups: '871121', descripcion: 'Radiografía de tórax', cantidad: 1 };

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as SolicitudAyudasDiagData;

describe('SolicitudAyudasDiagModule', () => {
  afterEach(cleanup);

  it('sin órdenes muestra el estado vacío', () => {
    render(<SolicitudAyudasDiagModule data={{}} onChange={vi.fn()} />);

    expect(screen.getByText('Sin estudios solicitados.')).toBeInTheDocument();
    expect(screen.getByText('(0 estudios)')).toBeInTheDocument();
  });

  it('agregar emite un array nuevo con las órdenes previas intactas y una orden en blanco', async () => {
    const onChange = vi.fn();
    const data: SolicitudAyudasDiagData = { items: [HEMOGRAMA] };
    render(<SolicitudAyudasDiagModule data={data} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /Agregar estudio/ }));

    const { items } = ultimo(onChange);
    expect(items).not.toBe(data.items);
    expect(items).toHaveLength(2);
    expect(items?.[0]).toBe(HEMOGRAMA);
    expect(items?.[1]).toEqual(expect.objectContaining({ descripcion: '', cantidad: 1 }));
    expect(items?.[1].id).not.toBe(HEMOGRAMA.id);
    expect(data.items).toHaveLength(1);
  });

  it('eliminar quita solo esa orden sin mutar el array original', async () => {
    const onChange = vi.fn();
    const data: SolicitudAyudasDiagData = { items: [HEMOGRAMA, RX_TORAX] };
    render(<SolicitudAyudasDiagModule data={data} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar orden 1' }));

    expect(ultimo(onChange)).toEqual({ items: [RX_TORAX] });
    expect(data.items).toEqual([HEMOGRAMA, RX_TORAX]);
  });

  it('editar una orden clona el array y cambia solo esa orden', () => {
    const onChange = vi.fn();
    const data: SolicitudAyudasDiagData = { items: [HEMOGRAMA, RX_TORAX] };
    render(<SolicitudAyudasDiagModule data={data} onChange={onChange} />);

    fireEvent.change(screen.getAllByLabelText('Cant.')[1], { target: { value: '2' } });

    const { items } = ultimo(onChange);
    expect(items).toEqual([HEMOGRAMA, { ...RX_TORAX, cantidad: 2 }]);
    expect(items?.[0]).toBe(HEMOGRAMA);
    expect(RX_TORAX.cantidad).toBe(1);
  });

  it('las observaciones generales se emiten aparte de la lista', () => {
    const onChange = vi.fn();
    render(<SolicitudAyudasDiagModule data={{ items: [HEMOGRAMA] }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Observaciones generales'), { target: { value: 'Ayuno de 8 horas' } });

    expect(ultimo(onChange)).toEqual({ observacionesGenerales: 'Ayuno de 8 horas' });
  });

  it('readOnly desactiva campos y oculta agregar y quitar', () => {
    render(<SolicitudAyudasDiagModule data={{ items: [HEMOGRAMA, RX_TORAX] }} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('textbox').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByRole('spinbutton').forEach((c) => expect(c).toBeDisabled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
