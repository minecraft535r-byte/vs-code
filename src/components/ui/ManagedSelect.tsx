import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Plus, X, Trash2 } from "lucide-react";
import { verifyDeletePassword } from "@/utils/security";

interface ManagedSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (n: string, v: string) => void;
  options: string[];
  onUpdateList: (k: string, l: string[]) => void;
  listKey: string;
  disableAdd?: boolean;
}

const ManagedSelect: React.FC<ManagedSelectProps> = ({
  label, name, value, onChange, options, onUpdateList, listKey, disableAdd = false,
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && !options.includes(newItem.trim())) {
      onUpdateList(listKey, [...options, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleDelete = async (item: string) => {
    const __ok = await verifyDeletePassword(); if (!__ok) return;
    onUpdateList(listKey, options.filter((opt) => opt !== item));
  };

  return (
    <div className="space-y-1.5 sm:space-y-2 relative">
      <label className="text-[11px] sm:text-xs font-black text-slate-500">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
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
        {!disableAdd && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsManaging(true)}
            className="w-11 sm:w-14 bg-white border border-blue-100 text-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm shrink-0"
          >
            <Plus size={18} />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isManaging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed inset-x-3 sm:inset-x-auto sm:absolute top-auto sm:top-full left-0 right-0 z-[70] mt-2 sm:mt-4 bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-100 p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-72 sm:max-h-80 flex flex-col"
            style={{ bottom: "env(safe-area-inset-bottom, 20px)" }}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h4 className="text-xs font-black text-slate-400">إدارة القائمة</h4>
              <button type="button" onClick={() => setIsManaging(false)} className="text-slate-400 hover:text-rose-500 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="إضافة جديد..."
                className="flex-1 min-w-0 bg-slate-50 py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl border border-slate-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="bg-blue-500 text-white p-2.5 sm:p-3 rounded-xl hover:bg-blue-600 transition-colors shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
              {options.map((opt) => (
                <motion.div
                  layout
                  key={opt}
                  className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-50 group hover:border-rose-100"
                >
                  <span className="text-sm font-bold text-slate-700">{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(opt)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagedSelect;
