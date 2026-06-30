import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import type { DashboardTile } from "@/types";

interface DashboardCardProps {
  tile: DashboardTile;
  isDark?: boolean;
  onClick?: () => void;
  isArrangeMode?: boolean;
  isDragging?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  [key: string]: any;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  tile, isDark, onClick, isArrangeMode = false, isDragging = false,
  onMoveLeft, onMoveRight, canMoveLeft = false, canMoveRight = false, ...dragProps
}) => (
  <motion.div layout
    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
    whileHover={isArrangeMode ? { scale: 1.03 } : { y: -10, scale: 1.08, zIndex: 10 }}
    whileTap={{ scale: 0.93 }}
    transition={{ type: "spring", stiffness: 400, damping: 22 }}
    onClick={onClick}
    style={{ willChange: "transform" }}
    className={`group ${isArrangeMode ? "cursor-grab active:cursor-grabbing select-none" : "cursor-pointer"}`}
    {...dragProps}
  >
    <div className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-3 border transition-all duration-300 min-h-[110px] md:min-h-[120px] relative overflow-hidden ${
      isDragging ? "opacity-40 border-dashed border-sky-400"
      : isArrangeMode ? "border-amber-300 bg-amber-50/30"
      : isDark ? "bg-slate-800/70 border-slate-700/60 hover:border-blue-500/40 hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/15"
      : "bg-white border-slate-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/15"
    }`}>
      {!isArrangeMode && !isDragging && (
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-blue-500/0 group-hover:from-blue-500/5" : "from-blue-50/0 group-hover:from-blue-50/60"} to-transparent transition-all duration-500`} />
      )}
      {isArrangeMode && (
        <div className="absolute top-2 left-2 bg-amber-500/20 text-amber-600 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
          <LayoutGrid size={9} />
        </div>
      )}
      <div className={`p-2.5 rounded-xl ${tile.bgColor} ${tile.color} relative z-10 group-hover:scale-125 group-hover:rotate-3 transition-transform duration-300`}>
        {React.cloneElement(tile.icon as React.ReactElement, { size: 22, strokeWidth: 2 })}
      </div>
      <span className={`text-[11px] md:text-xs font-bold text-center leading-snug px-1 relative z-10 transition-colors ${isDark ? "text-slate-300 group-hover:text-blue-300" : "text-slate-600 group-hover:text-blue-700"}`}>
        {tile.label}
      </span>
      {isArrangeMode && (
        <div className="flex items-center gap-1.5 relative z-20">
          <button type="button" disabled={!canMoveRight} onClick={(e) => { e.stopPropagation(); if (onMoveRight) onMoveRight(); }}
            className={`p-1 bg-white border rounded-lg transition-all ${!canMoveRight ? "opacity-30 cursor-not-allowed" : "hover:bg-amber-50 border-amber-200 text-amber-600"}`}>
            <ChevronRight size={12} />
          </button>
          <button type="button" disabled={!canMoveLeft} onClick={(e) => { e.stopPropagation(); if (onMoveLeft) onMoveLeft(); }}
            className={`p-1 bg-white border rounded-lg transition-all ${!canMoveLeft ? "opacity-30 cursor-not-allowed" : "hover:bg-amber-50 border-amber-200 text-amber-600"}`}>
            <ChevronLeft size={12} />
          </button>
        </div>
      )}
    </div>
  </motion.div>
);

export default DashboardCard;
