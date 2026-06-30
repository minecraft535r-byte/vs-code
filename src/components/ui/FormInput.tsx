import React from "react";
import { formatWithCommas, handleDirectMoneyChange } from "@/utils/format";

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  type?: string;
  full?: boolean;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label, name, value, onChange, placeholder, type = "text", full = false, required = false,
}) => {
  const isMoney =
    type === "number" &&
    (name === "tuition" || name === "discount" || name === "amount" ||
     name === "salary" || name === "price" ||
     name?.toLowerCase().includes("price") ||
     name?.toLowerCase().includes("amount"));

  const isPhone = name?.toLowerCase().includes("phone");

  const inputCls = "w-full bg-slate-50/50 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold text-sm sm:text-base";

  if (isMoney) {
    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDirectMoneyChange(e, (cleanVal) => {
        onChange(name, cleanVal);
      });
    };

    return (
      <div className={`${full ? "col-span-1 md:col-span-2" : ""} space-y-1.5 sm:space-y-2`}>
        <label className="text-[11px] sm:text-xs font-black text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={formatWithCommas(value)}
          onChange={handleMoneyChange}
          required={required}
          className={inputCls + " font-mono text-left"}
        />
      </div>
    );
  }

  return (
    <div className={`${full ? "col-span-1 md:col-span-2" : ""} space-y-1.5 sm:space-y-2`}>
      <label className="text-[11px] sm:text-xs font-black text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        inputMode={isPhone ? "tel" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        required={required}
        className={inputCls}
      />
    </div>
  );
};

export default FormInput;
