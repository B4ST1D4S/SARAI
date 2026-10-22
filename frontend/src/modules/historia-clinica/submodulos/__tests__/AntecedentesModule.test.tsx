import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AntecedentesPersonalesModule,
  antecedentePersonalVacio,
  type AntecedentePersonalItem,
  type AntecedentePrevio,
  type AntecedentesPersonalesData,
} from '../AntecedentesPersonalesModule';
import {
  AntecedentesFamiliaresModule,
  antecedenteFamiliarVacio,
  type AntecedenteFamiliarItem,
  type AntecedentesFamiliaresData,
} from '../AntecedentesFamiliaresModule';

/** Último parche emitido por onChange. */
const ultimo = <T,>(onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0] as T;

describe('AntecedentesPersonalesModule', () => {
  afterEach(cleanup);

  const fila = (id: string, cambios: Partial<AntecedentePersonalItem> = {}): AntecedentePersonalItem => ({
    ...antecedentePersonalVacio(),
    id,
    ...cambios,
  });
  const HTA = fila('p1', { diagnostico: 'Hipertensión arterial esencial', codigoCie10: 'I10' });
  const DM2 = fila('p2', { diagnostico: 'Diabetes mellitus tipo 2', estadoClinico: 'active' });

  it('sin datos muestra una fila en blanco que entra al array al escribir', async () => {
    const onChange = vi.fn();
    render(<AntecedentesPersonalesModule data={{}} onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'Eliminar antecedente' })).not.toBeInTheDocument();
    await userEvent.setup().type(screen.getByLabelText('Patología / Condición'), 'A');

    expect(ultimo<AntecedentesPersonalesData>(onChange)).toEqual({
      antecedentesPersonales: [expect.objectContaining({ id: 'antecedente-inicial', diagnostico: 'A' })],
    });
  });

  it('editar clona el array y cambia solo esa fila, sin mutar data', () => {
    const onChange = vi.fn();
    const data: AntecedentesPersonalesData = { antecedentesPersonales: [HTA, DM2] };
    render(<AntecedentesPersonalesModule data={data} onChange={onChange} />);

    fireEvent.change(screen.getAllByLabelText('Estado Clínico')[1], { target: { value: 'remission' } });
    fireEvent.change(screen.getAllByLabelText('Edad Inicio')[0], { target: { value: '45' } });

    const [primero, segundo] = onChange.mock.calls.map(([p]) => (p as AntecedentesPersonalesData).antecedentesPersonales!);
    expect(primero).toEqual([HTA, { ...DM2, estadoClinico: 'remission' }]);
    expect(primero[0]).toBe(HTA);
    expect(segundo).toEqual([{ ...HTA, edadInicio: 45 }, DM2]);
    expect(primero).not.toBe(data.antecedentesPersonales);
    expect(DM2.estadoClinico).toBe('active');
  });

  it('agregar y eliminar emiten el array completo', async () => {
    const onChange = vi.fn();
    const usuario = userEvent.setup();
    render(<AntecedentesPersonalesModule data={{ antecedentesPersonales: [HTA, DM2] }} onChange={onChange} />);

    await usuario.click(screen.getByRole('button', { name: /Registrar otra patología/ }));
    const agregado = ultimo<AntecedentesPersonalesData>(onChange).antecedentesPersonales!;
    expect(agregado).toHaveLength(3);
    expect(agregado.slice(0, 2)).toEqual([HTA, DM2]);
    expect(agregado[2]).toEqual(expect.objectContaining({ diagnostico: '' }));

    await usuario.click(screen.getAllByRole('button', { name: 'Eliminar antecedente' })[0]);
    expect(ultimo<AntecedentesPersonalesData>(onChange)).toEqual({ antecedentesPersonales: [DM2] });
  });

  it('"niega antecedentes" emite el booleano y oculta las filas', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<AntecedentesPersonalesModule data={{ antecedentesPersonales: [HTA] }} onChange={onChange} />);

    await userEvent.setup().click(screen.getByLabelText(/niega antecedentes patológicos/));
    expect(onChange).toHaveBeenCalledWith({ niegaAntecedentes: true });

    rerender(<AntecedentesPersonalesModule data={{ niegaAntecedentes: true, antecedentesPersonales: [HTA] }} onChange={onChange} />);
    expect(screen.queryByLabelText('Patología / Condición')).not.toBeInTheDocument();
  });

  it('muestra los antecedentes previos personales y excluye los familiares', () => {
    const previos: AntecedentePrevio[] = [
      { id: 'h1', descripcion: 'Asma bronquial', codigoEstandar: 'J45', categoria: 'PATOLOGICO', numeroFolio: 3 },
      { id: 'h2', descripcion: 'Cáncer gástrico en padre', categoria: 'FAMILIAR', numeroFolio: 3 },
    ];
    render(<AntecedentesPersonalesModule data={{ antecedentesPrevios: previos }} onChange={vi.fn()} />);

    expect(screen.getByText('Antecedentes previos registrados (1)')).toBeInTheDocument();
    expect(screen.getByText('Asma bronquial')).toBeInTheDocument();
    expect(screen.queryByText('Cáncer gástrico en padre')).not.toBeInTheDocument();
  });

  it('readOnly deshabilita los campos y oculta agregar y eliminar', () => {
    render(<AntecedentesPersonalesModule data={{ antecedentesPersonales: [HTA, DM2] }} onChange={vi.fn()} readOnly />);

    screen.getAllByLabelText('Patología / Condición').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByLabelText('Estado Clínico').forEach((c) => expect(c).toBeDisabled());
    expect(screen.getByLabelText(/niega antecedentes patológicos/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Registrar otra patología/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar antecedente' })).not.toBeInTheDocument();
  });
});

describe('AntecedentesFamiliaresModule', () => {
  afterEach(cleanup);

  const fila = (id: string, cambios: Partial<AntecedenteFamiliarItem> = {}): AntecedenteFamiliarItem => ({
    ...antecedenteFamiliarVacio(),
    id,
    ...cambios,
  });
  const MADRE = fila('f1', { parentesco: 'MTH', condicion: 'Diabetes mellitus tipo 2', edadDiagnostico: 50 });
  const PADRE = fila('f2', { parentesco: 'FTH', condicion: 'Cáncer gástrico' });

  it('sin datos muestra una fila en blanco que entra al array al escribir', async () => {
    const onChange = vi.fn();
    render(<AntecedentesFamiliaresModule data={{}} onChange={onChange} />);

    await userEvent.setup().type(screen.getByLabelText('Patología / Cáncer / Trastorno'), 'H');

    expect(ultimo<AntecedentesFamiliaresData>(onChange)).toEqual({
      antecedentesFamiliares: [expect.objectContaining({ id: 'familiar-inicial', condicion: 'H', parentesco: 'MTH' })],
    });
  });

  it('editar parentesco y estado vital clona el array y cambia solo esa fila', async () => {
    const onChange = vi.fn();
    render(<AntecedentesFamiliaresModule data={{ antecedentesFamiliares: [MADRE, PADRE] }} onChange={onChange} />);

    fireEvent.change(screen.getAllByLabelText('Parentesco')[1], { target: { value: 'GRFTH' } });
    expect(ultimo<AntecedentesFamiliaresData>(onChange).antecedentesFamiliares).toEqual([MADRE, { ...PADRE, parentesco: 'GRFTH' }]);

    await userEvent.setup().click(screen.getAllByLabelText('Fallecido')[1]);
    const lista = ultimo<AntecedentesFamiliaresData>(onChange).antecedentesFamiliares!;
    expect(lista).toEqual([MADRE, { ...PADRE, fallecido: true }]);
    expect(lista[0]).toBe(MADRE);
    expect(PADRE.fallecido).toBe(false);
  });

  it('agregar y eliminar emiten el array completo', async () => {
    const onChange = vi.fn();
    const usuario = userEvent.setup();
    render(<AntecedentesFamiliaresModule data={{ antecedentesFamiliares: [MADRE, PADRE] }} onChange={onChange} />);

    await usuario.click(screen.getByRole('button', { name: /Registrar otro familiar/ }));
    const agregado = ultimo<AntecedentesFamiliaresData>(onChange).antecedentesFamiliares!;
    expect(agregado).toHaveLength(3);
    expect(agregado[2]).toEqual(expect.objectContaining({ condicion: '', fallecido: false }));

    await usuario.click(screen.getAllByRole('button', { name: 'Eliminar antecedente familiar' })[1]);
    expect(ultimo<AntecedentesFamiliaresData>(onChange)).toEqual({ antecedentesFamiliares: [MADRE] });
  });

  it('readOnly deshabilita los campos y oculta agregar y eliminar', () => {
    render(<AntecedentesFamiliaresModule data={{ antecedentesFamiliares: [MADRE, PADRE] }} onChange={vi.fn()} readOnly />);

    screen.getAllByLabelText('Parentesco').forEach((c) => expect(c).toBeDisabled());
    screen.getAllByLabelText('Fallecido').forEach((c) => expect(c).toBeDisabled());
    expect(screen.getByLabelText(/Sin antecedentes patológicos familiares/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Registrar otro familiar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar antecedente familiar' })).not.toBeInTheDocument();
  });
});
