'use client';

interface PrintButtonProps {
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon';
}

export function PrintButton({
  label = 'Print Estimate',
  className = '',
  variant = 'primary'
}: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  // Printer SVG icon
  const PrinterIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  );

  const baseClasses = "no-print transition-all duration-150 flex items-center gap-2 font-medium";

  const variantClasses = {
    primary: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md",
    secondary: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700",
    icon: "p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
  };

  return (
    <button
      onClick={handlePrint}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={label}
      type="button"
    >
      <PrinterIcon />
      {variant !== 'icon' && <span>{label}</span>}
    </button>
  );
}

export default PrintButton;
