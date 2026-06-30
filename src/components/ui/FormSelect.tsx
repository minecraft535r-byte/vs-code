import React from "react";
import { ChevronDown } from "lucide-react";

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: string[];
}

const FormSelect: React.FC<FormSelectProps> = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <label className="text-[11px] sm:text-xs font-black text-slate-500">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full bg-slate-50/50 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all border border-blue-50/50 focus:border-blue-300 font-bold appearance-none cursor-pointer text-sm sm:text-base"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown size={18} />
      </div>
    </div>
  </div>
);

export default FormSelect;
