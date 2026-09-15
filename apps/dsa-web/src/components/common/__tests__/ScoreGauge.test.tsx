import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreGauge } from '../ScoreGauge';

describe('ScoreGauge', () => {
  it.each([
    [0, 'fear', 'hsl(var(--danger))'],
    [40, 'fear', 'hsl(var(--danger))'],
    [41, 'neutral', 'hsl(var(--warning))'],
    [60, 'neutral', 'hsl(var(--warning))'],
    [61, 'greed', 'hsl(var(--success))'],
    [100, 'greed', 'hsl(var(--success))'],
  ])('maps score %s to the expected visual band and color', (score, expectedBand, expectedColor) => {
    const { container } = render(<ScoreGauge score={score} />);

    expect(container.firstChild).toHaveAttribute('data-sentiment', expectedBand);
    expect(container.querySelector('.gauge-progress')).toHaveStyle({ stroke: expectedColor });
    expect(container.querySelector('.gauge-sentiment-label')).toHaveStyle({ color: expectedColor });
  });
});