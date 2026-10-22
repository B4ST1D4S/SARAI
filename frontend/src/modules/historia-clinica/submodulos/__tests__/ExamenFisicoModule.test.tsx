import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExamenFisicoModule, SEGMENTOS, TEXTO_NORMAL } from '../ExamenFisicoModule';

const HALLAZGO = 'Dolor a la palpación profunda en fosa iliaca derecha';

/** Examen con todos los segmentos en el mismo valor. */
const todosCon = (valor: string) => Object.fromEntries(SEGMENTOS.map((s) => [s.id, valor]));

describe('ExamenFisicoModule', () => {
  afterEach(cleanup);

  it('"Marcar vacíos como normales" no sobrescribe un hallazgo anormal previo', async () => {
    const onChange = vi.fn();
    render(<ExamenFisicoModule data={{ abdomen: HALLAZGO }} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Marcar vacíos como normales' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ ...todosCon(TEXTO_NORMAL), abdomen: HALLAZGO });
  });

  it('"Desmarcar todo" limpia los segmentos cuando todos están normales', async () => {
    const onChange = vi.fn();
    render(<ExamenFisicoModule data={todosCon(TEXTO_NORMAL)} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Desmarcar todo' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(todosCon(''));
  });

  it('el botón maestro se deshabilita si no hay vacíos y algún hallazgo es anormal', () => {
    render(<ExamenFisicoModule data={{ ...todosCon(TEXTO_NORMAL), abdomen: HALLAZGO }} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Marcar vacíos como normales' })).toBeDisabled();
  });

  it('el toggle de un segmento alterna solo ese segmento entre normal y vacío', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ExamenFisicoModule data={{}} onChange={onChange} />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getAllByRole('button', { name: 'Marcar normal' })[0]);
    expect(onChange).toHaveBeenLastCalledWith({ [SEGMENTOS[0].id]: TEXTO_NORMAL });

    rerender(<ExamenFisicoModule data={{ [SEGMENTOS[0].id]: TEXTO_NORMAL }} onChange={onChange} />);
    await usuario.click(screen.getByRole('button', { name: 'Normal' }));
    expect(onChange).toHaveBeenLastCalledWith({ [SEGMENTOS[0].id]: '' });
  });

  it('readOnly deshabilita botones y campos', () => {
    render(<ExamenFisicoModule data={{}} onChange={vi.fn()} readOnly />);

    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
    screen.getAllByRole('textbox').forEach((t) => expect(t).toBeDisabled());
  });
});
