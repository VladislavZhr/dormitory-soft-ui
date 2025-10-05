// src/features/students/ui/dashboardElement/ComboBox.tsx
"use client";

import { useCombobox, type UseComboboxGetInputPropsOptions } from "downshift";
import * as React from "react";

import type { ComboBoxProps } from "../../model/contracts";

export default function ComboBox({ label, items, placeholder = "Почніть вводити або оберіть…", className = "w-56", inputProps, value, onChange, disabled, id }: ComboBoxProps) {
  const [filtered, setFiltered] = React.useState<string[]>(items);

  React.useEffect(() => {
    setFiltered(items);
  }, [items]);

  const { isOpen, getLabelProps, getInputProps, getMenuProps, getItemProps, getToggleButtonProps, highlightedIndex, selectedItem } = useCombobox<string>({
    items: filtered,
    // Важливо: null, а не undefined (exactOptionalPropertyTypes)
    selectedItem: value ?? null,
    itemToString: (item) => item ?? "",
    onInputValueChange({ inputValue }) {
      const q = (inputValue ?? "").toLowerCase().trim();
      setFiltered(q ? items.filter((i) => i.toLowerCase().includes(q)) : items);
    },
    onSelectedItemChange({ selectedItem: sel }) {
      onChange?.(sel ?? null);
    },
  });

  // 1) Опції для Downshift (строгі типи, без undefined для boolean)
  const dsInputOpts: UseComboboxGetInputPropsOptions = {
    placeholder,
    disabled: !!disabled,
    id,
  };
  const dsInputProps = getInputProps(dsInputOpts);

  // 2) HTML-пропси від користувача без конфліктних ключів
  const {
    id: _rid, // прибираємо щоб не дублювалося
    disabled: _rdis, // прибираємо щоб не дублювалося
    placeholder: _rph, // прибираємо щоб не дублювалося
    ...restInputProps
  } = inputProps ?? {};

  const dsToggleProps = getToggleButtonProps({
    disabled: !!disabled,
    "aria-label": "Відкрити список",
  });

  return (
    <div className="relative flex flex-none items-center gap-2" aria-disabled={disabled}>
      <label className="shrink-0 text-sm font-medium text-slate-700" {...getLabelProps({ htmlFor: id })}>
        {label}
      </label>

      <div className={`relative ${className}`}>
        <div className="flex rounded-lg border border-slate-300 bg-white">
          <input
            {...dsInputProps}
            {...restInputProps}
            className="h-9 w-full rounded-l-lg bg-white px-3 text-sm text-black placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button type="button" {...dsToggleProps} className="h-9 rounded-r-lg px-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
            ▾
          </button>
        </div>

        {/* Меню: чітке позиціювання під інпутом + високий z-index */}
        <ul
          {...getMenuProps()}
          className={`absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white text-black shadow-lg ${
            !(isOpen && filtered.length) ? "hidden" : ""
          }`}
        >
          {isOpen &&
            filtered.map((item, index) => (
              <li
                key={`${item}-${index}`}
                {...getItemProps({ item, index })}
                className={`cursor-pointer px-3 py-2 text-sm ${highlightedIndex === index ? "bg-blue-50" : "bg-white"} ${selectedItem === item ? "font-medium" : ""}`}
              >
                {item}
              </li>
            ))}

          {isOpen && filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Нічого не знайдено</li>}
        </ul>
      </div>
    </div>
  );
}
