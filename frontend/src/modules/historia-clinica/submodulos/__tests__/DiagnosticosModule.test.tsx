import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiagnosticosModule, type DiagnosticoItem, type DiagnosticosData } from '../DiagnosticosModule';

const HTA: DiagnosticoItem = { id: 'd1', codigoCie10: 'I10', descripcion: 'Hipertensión esencial', tipo: 'CONFIRMADO_REPETIDO' };
const DM2: DiagnosticoItem = { id: 'd2', codigoCie10: 'E119', descripcion: 'Diabetes mellitus tipo 2', tipo: 'CONFIRMADO_REPETIDO' };
const DISLIPIDEMIA: DiagnosticoItem = { id: 'd3', codigoCie10: 'E785', descripcion: 'Hiperlipidemia', tipo: 'CONFIRMADO_NUEVO' };

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as DiagnosticosData;

const seccionPrincipal = () => within(screen.getByRole('region', { name: /Diagnóstico Principal/ }));
const seccionRelacionados = () => within(screen.getByRole('region', { name: /Diagnósticos Relacionados/ }));

describe('DiagnosticosModule', () => {
  afterEach(cleanup);

  it('un borrador vacío muestra el principal en blanco y ningún relacionado', () => {
    render(<DiagnosticosModule data={{}} onChange={vi.fn()} />);

    expect(seccionPrincipal().getByLabelText('CIE-10')).toHaveValue('');
    expect(seccionPrincipal().getByLabelText('Tipo')).toHaveValue('IMPRESION_DIAGNOSTICA');
    expect(screen.getByText('Sin diagnósticos relacionados.')).toBeInTheDocument();
  });

  describe('principal', () => {
    it('editarlo emite solo data.principal, como objeto nuevo', () => {
      const onChange = vi.fn();
      const data: DiagnosticosData = { principal: HTA, relacionados: [DM2] };
      render(<DiagnosticosModule data={data} onChange={onChange} />);

      fireEvent.change(seccionPrincipal().getByLabelText('Descripción'), { target: { value: 'HTA estadio 2' } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(ultimo(onChange)).toEqual({ principal: { ...HTA, descripcion: 'HTA estadio 2' } });
      expect(ultimo(onChange)).not.toHaveProperty('relacionados');
      expect(HTA.descripcion).toBe('Hipertensión esencial');
    });

    it('en un borrador vacío, escribir el código crea el principal', () => {
      const onChange = vi.fn();
      render(<DiagnosticosModule data={{}} onChange={onChange} />);

      fireEvent.change(seccionPrincipal().getByLabelText('CIE-10'), { target: { value: 'j06.9 ' } });

      expect(ultimo(onChange)).toEqual({
        principal: { id: 'diag-principal', codigoCie10: 'J06.9', descripcion: '', tipo: 'IMPRESION_DIAGNOSTICA' },
      });
    });

    it('un código con formato inválido muestra el error; vacío no', () => {
      const { rerender } = render(<DiagnosticosModule data={{ principal: { ...HTA, codigoCie10: '110' } }} onChange={vi.fn()} />);
      expect(screen.getByRole('alert')).toHaveTextContent('Código CIE-10 inválido');

      rerender(<DiagnosticosModule data={{}} onChange={vi.fn()} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('relacionados', () => {
    it('agregar emite un array nuevo con los previos intactos y uno en blanco', async () => {
      const onChange = vi.fn();
      const data: DiagnosticosData = { principal: HTA, relacionados: [DM2] };
      render(<DiagnosticosModule data={data} onChange={onChange} />);

      await userEvent.setup().click(screen.getByRole('button', { name: /Agregar relacionado/ }));

      const { relacionados } = ultimo(onChange);
      expect(ultimo(onChange)).not.toHaveProperty('principal');
      expect(relacionados).not.toBe(data.relacionados);
      expect(relacionados?.[0]).toBe(DM2);
      expect(relacionados?.[1]).toEqual(expect.objectContaining({ codigoCie10: '', descripcion: '', tipo: 'CONFIRMADO_NUEVO' }));
      expect(data.relacionados).toHaveLength(1);
    });

    it('eliminar quita solo ese relacionado sin mutar el array original', async () => {
      const onChange = vi.fn();
      const data: DiagnosticosData = { principal: HTA, relacionados: [DM2, DISLIPIDEMIA] };
      render(<DiagnosticosModule data={data} onChange={onChange} />);

      await userEvent.setup().click(screen.getByRole('button', { name: 'Quitar relacionado 1' }));

      expect(ultimo(onChange)).toEqual({ relacionados: [DISLIPIDEMIA] });
      expect(data.relacionados).toEqual([DM2, DISLIPIDEMIA]);
    });

    it('editar un relacionado clona el array y cambia solo ese', () => {
      const onChange = vi.fn();
      render(<DiagnosticosModule data={{ principal: HTA, relacionados: [DM2, DISLIPIDEMIA] }} onChange={onChange} />);

      fireEvent.change(seccionRelacionados().getAllByLabelText('Tipo')[1], { target: { value: 'IMPRESION_DIAGNOSTICA' } });

      const { relacionados } = ultimo(onChange);
      expect(relacionados).toEqual([DM2, { ...DISLIPIDEMIA, tipo: 'IMPRESION_DIAGNOSTICA' }]);
      expect(relacionados?.[0]).toBe(DM2);
      expect(DISLIPIDEMIA.tipo).toBe('CONFIRMADO_NUEVO');
    });
  });

  it('readOnly bloquea todos los campos del principal y los relacionados, y oculta los botones', () => {
    render(<DiagnosticosModule data={{ principal: HTA, relacionados: [DM2, DISLIPIDEMIA] }} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('textbox').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByRole('combobox').forEach((c) => expect(c).toBeDisabled());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
