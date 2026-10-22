import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlergiasModule, alergiaVacia, type AlergiaItem, type AlergiaPrevia, type AlergiasData } from '../AlergiasModule';

const fila = (id: string, cambios: Partial<AlergiaItem> = {}): AlergiaItem => ({ ...alergiaVacia(), id, ...cambios });

const PENICILINA = fila('a1', { sustancia: 'Penicilina', criticidad: 'high', severidad: 'SEVERA', manifestacion: 'Anafilaxia' });
const MANI = fila('a2', { sustancia: 'Maní', categoria: 'food', severidad: '' });

const PREVIA: AlergiaPrevia = {
  id: 'p1',
  sustanciaAlergeno: 'Dipirona',
  categoria: 'MEDICAMENTO',
  tipo: 'ALERGIA',
  criticidad: 'ALTA',
  numeroFolio: 12,
};

/** Último parche emitido por onChange. */
const ultimo = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as AlergiasData;

describe('AlergiasModule', () => {
  afterEach(cleanup);

  describe('estado inicial', () => {
    it('sin datos muestra una fila en blanco, sin botón eliminar ni aviso de fila incompleta', () => {
      render(<AlergiasModule data={{}} onChange={vi.fn()} />);

      expect(screen.getByLabelText('Alérgeno / Sustancia')).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Eliminar alérgeno' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('alergia-incompleta-0')).not.toBeInTheDocument();
    });

    it('escribir en la fila en blanco la incorpora al array', async () => {
      const onChange = vi.fn();
      render(<AlergiasModule data={{}} onChange={onChange} />);

      await userEvent.setup().type(screen.getByLabelText('Alérgeno / Sustancia'), 'L');

      expect(ultimo(onChange)).toEqual({ alergias: [expect.objectContaining({ id: 'alergia-inicial', sustancia: 'L' })] });
    });
  });

  describe('lista inmutable', () => {
    it('editar una fila emite el array completo con solo esa fila cambiada, sin mutar data', () => {
      const onChange = vi.fn();
      const data: AlergiasData = { alergias: [PENICILINA, MANI] };
      render(<AlergiasModule data={data} onChange={onChange} />);

      fireEvent.change(screen.getAllByLabelText(/Severidad/)[1], { target: { value: 'MODERADA' } });

      const { alergias } = ultimo(onChange);
      expect(alergias).toEqual([PENICILINA, { ...MANI, severidad: 'MODERADA' }]);
      expect(alergias?.[0]).toBe(PENICILINA);
      expect(alergias).not.toBe(data.alergias);
      expect(MANI.severidad).toBe('');
    });

    it('agregar emite el array con una fila nueva en blanco y un id propio', async () => {
      const onChange = vi.fn();
      render(<AlergiasModule data={{ alergias: [PENICILINA] }} onChange={onChange} />);

      await userEvent.setup().click(screen.getByRole('button', { name: /Adicionar alérgeno/ }));

      const { alergias } = ultimo(onChange);
      expect(alergias).toHaveLength(2);
      expect(alergias?.[0]).toBe(PENICILINA);
      expect(alergias?.[1]).toEqual(expect.objectContaining({ sustancia: '', manifestacion: '' }));
      expect(alergias?.[1].id).not.toBe(PENICILINA.id);
    });

    it('eliminar emite el array sin la fila elegida', async () => {
      const onChange = vi.fn();
      render(<AlergiasModule data={{ alergias: [PENICILINA, MANI] }} onChange={onChange} />);

      await userEvent.setup().click(screen.getAllByRole('button', { name: 'Eliminar alérgeno' })[0]);

      expect(ultimo(onChange)).toEqual({ alergias: [MANI] });
    });

    it('señala la fila iniciada sin severidad como incompleta', () => {
      render(<AlergiasModule data={{ alergias: [PENICILINA, MANI] }} onChange={vi.fn()} />);

      expect(screen.queryByTestId('alergia-incompleta-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('alergia-incompleta-1')).toHaveTextContent('severidad');
    });
  });

  describe('"Sin alergias conocidas" frente al historial', () => {
    it('marcar la casilla emite sinAlergiasConocidas', async () => {
      const onChange = vi.fn();
      render(<AlergiasModule data={{}} onChange={onChange} />);

      await userEvent.setup().click(screen.getByLabelText(/Sin alergias ni intolerancias/));

      expect(onChange).toHaveBeenCalledWith({ sinAlergiasConocidas: true });
    });

    it('con alergias previas activas, marcar "Sin alergias" muestra la alerta de inconsistencia', () => {
      render(<AlergiasModule data={{ sinAlergiasConocidas: true, alergiasPrevias: [PREVIA] }} onChange={vi.fn()} />);

      expect(screen.getByTestId('alerta-nka-conflicto')).toHaveTextContent('Dipirona');
    });

    it('sin historial, "Sin alergias" no alerta y oculta las filas', () => {
      render(<AlergiasModule data={{ sinAlergiasConocidas: true, alergias: [PENICILINA] }} onChange={vi.fn()} />);

      expect(screen.queryByTestId('alerta-nka-conflicto')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Alérgeno / Sustancia')).not.toBeInTheDocument();
    });

    it('las alergias previas se muestran aunque no se marque "Sin alergias", sin alerta', () => {
      render(<AlergiasModule data={{ alergiasPrevias: [PREVIA] }} onChange={vi.fn()} />);

      expect(screen.getByText('Alergias previas registradas (1)')).toBeInTheDocument();
      expect(screen.queryByTestId('alerta-nka-conflicto')).not.toBeInTheDocument();
    });
  });

  it('readOnly deshabilita los campos y oculta agregar y eliminar', () => {
    render(<AlergiasModule data={{ alergias: [PENICILINA, MANI] }} onChange={vi.fn()} readOnly />);

    screen.getAllByLabelText('Alérgeno / Sustancia').forEach((c) => expect(c).toBeDisabled());
    expect(screen.getByLabelText(/Sin alergias ni intolerancias/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Adicionar alérgeno/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar alérgeno' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('alergia-incompleta-1')).not.toBeInTheDocument();
  });
});
