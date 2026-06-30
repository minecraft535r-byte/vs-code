import React from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendArrowProps {
  trend: "up" | "down" | "neutral";
  delay: number;
}

const TrendArrow: React.FC<TrendArrowProps> = ({ trend, delay }) => {
  if (trend === "neutral") return null;
  const isUp = trend === "up";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: isUp ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 18 }}
      className={`absolute top-3 left-3 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black text-[9px] ${
        isUp
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
          : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
      }`}
    >
      <motion.span
        animate={isUp ? { y: [-1, 1, -1] } : { y: [1, -1, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex"
      >
        {isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
      </motion.span>
    </motion.div>
  );
};

export default TrendArrow;
