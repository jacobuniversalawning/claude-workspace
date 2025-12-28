'use client';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  label,
  className = '',
  disabled = false,
}: NumberInputProps) {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(Number(newValue.toFixed(2)));
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(Number(newValue.toFixed(2)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.min(Math.max(newValue, min), max));
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#A1A1A1] mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="px-3 py-2.5 bg-[#111111] border border-[#333333] hover:bg-[#1F1F1F] hover:border-[#444444] disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg text-[#EDEDED] font-medium transition-all duration-150"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full border-t border-b border-[#333333] px-3 py-2.5 text-center text-[#EDEDED] bg-[#111111] focus:outline-none focus:border-[#0070F3] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-150"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="px-3 py-2.5 bg-[#111111] border border-[#333333] hover:bg-[#1F1F1F] hover:border-[#444444] disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg text-[#EDEDED] font-medium transition-all duration-150"
        >
          +
        </button>
      </div>
    </div>
  );
}
