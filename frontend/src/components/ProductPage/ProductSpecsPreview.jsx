import React from 'react';

export default function ProductSpecsPreview({
  optionsConfig,
  selectedOption,
  setSelectedOption,
  parsedSpecs = [],
  setActiveTab,
  scrollToSection,
  formatPrice,
  product,
}) {
  return (
    <div className="space-y-4">
      {/* Variant selector options */}
      {optionsConfig && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {optionsConfig.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {optionsConfig.items.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!opt.available}
                onClick={() => setSelectedOption?.(opt.value)}
                className={`relative px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  !opt.available
                    ? 'border border-slate-200 bg-slate-50 text-slate-350 border-dashed cursor-not-allowed'
                    : selectedOption === opt.value
                    ? 'bg-[#0070f3] text-white border border-[#0070f3] shadow-xs'
                    : 'bg-[#f3f4f6] hover:bg-[#eaecef] text-slate-800 border border-transparent'
                }`}
                title={opt.reason || ''}
              >
                <span>{opt.value}</span>
                {opt.price && parseFloat(opt.price) !== product?.price && formatPrice && (
                  <span
                    className={`block text-[10px] font-bold mt-0.5 ${
                      selectedOption === opt.value ? 'text-white/90' : 'text-slate-500'
                    }`}
                  >
                    {formatPrice(parseFloat(opt.price))}
                  </span>
                )}
                {!opt.available && opt.reason && (
                  <span className="block text-[8px] font-medium text-slate-400 mt-0.5">
                    {opt.reason}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Specs list with dotted leader line */}
      {parsedSpecs.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Характеристики:
          </h3>
          <div className="space-y-2">
            {parsedSpecs.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-baseline text-xs font-semibold leading-relaxed w-full min-w-0"
              >
                <span
                  className="text-slate-500 shrink-0 pr-1 max-w-[50%] truncate"
                  title={item.label}
                >
                  {item.label}
                </span>
                {item.value ? (
                  <>
                    <span className="border-b border-dotted border-slate-200 flex-grow mb-1 min-w-[10px]"></span>
                    <span className="text-slate-900 font-bold pl-1 shrink-0 break-words text-right max-w-[50%]">
                      {item.value}
                    </span>
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {parsedSpecs.length > 5 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab?.('specs');
                scrollToSection?.('tabs-section');
              }}
              className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-extrabold block text-left mt-2 cursor-pointer bg-transparent border-0"
            >
              Все характеристики ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
