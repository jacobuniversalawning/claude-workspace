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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-l border border-r-0 border-gray-300 text-gray-700 font-bold"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full border-t border-b border-gray-300 px-3 py-2 text-center text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-r border border-l-0 border-gray-300 text-gray-700 font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
