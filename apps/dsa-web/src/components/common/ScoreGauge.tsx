import type React from 'react';
import { getSentimentLabel, type ReportLanguage } from '../../types/analysis';
import { cn } from '../../utils/cn';
import { normalizeReportLanguage, getReportText } from '../../utils/reportLanguage';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  language?: ReportLanguage;
}

type SentimentKey = 'greed' | 'neutral' | 'fear';

/**
 * Sentiment score gauge using the shared financial theme tokens.
 */
export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
  language = 'zh',
}) => {
  const reportLanguage = normalizeReportLanguage(language);
  const text = getReportText(reportLanguage);
  const normalizedScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const displayScore = Math.round(normalizedScore);
  const label = getSentimentLabel(normalizedScore, reportLanguage);

  const sizeConfig = {
    sm: { width: 100, stroke: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
    md: { width: 140, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
    lg: { width: 180, stroke: 12, fontSize: 'text-5xl', labelSize: 'text-base' },
  };

  const { width, stroke, fontSize, labelSize } = sizeConfig[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const progress = (normalizedScore / 100) * arcLength;

  const getSentimentKey = (value: number): SentimentKey => {
    if (value > 60) return 'greed';
    if (value > 40) return 'neutral';
    return 'fear';
  };

  const sentimentKey = getSentimentKey(normalizedScore);
  const sentimentColor = {
    greed: 'hsl(var(--success))',
    neutral: 'hsl(var(--warning))',
    fear: 'hsl(var(--danger))',
  }[sentimentKey];

  return (
    <div className={cn('score-gauge flex flex-col items-center', className)} data-sentiment={sentimentKey}>
      {showLabel && (
        <span className="label-uppercase mb-3 text-secondary-text">
          {text.fearGreedIndex}
        </span>
      )}

      <div className="relative" style={{ width, height: width }}>
        <svg className="gauge-ring overflow-visible" width={width} height={width}>
          <circle
            className="gauge-track"
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="var(--home-gauge-track)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(135 ${width / 2} ${width / 2})`}
          />
          <circle
            className="gauge-progress"
            style={{ stroke: sentimentColor }}
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"

            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            transform={`rotate(135 ${width / 2} ${width / 2})`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums text-foreground', fontSize)}>
            {displayScore}
          </span>
          {showLabel && (
            <span className={`gauge-sentiment-label ${labelSize} mt-1 font-semibold`} style={{ color: sentimentColor }}>
              {label.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
