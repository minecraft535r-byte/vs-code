import React, { useState, useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  isMoney?: boolean;
  suffix?: string;
  isDark?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value, isMoney = false, suffix = "", isDark = false,
}) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplayed(0); return; }
    const duration = 900;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <p className={`text-sm md:text-base font-black leading-tight relative z-10 ${isDark ? "text-white" : "text-slate-800"}`}>
      {isMoney
        ? new Intl.NumberFormat("en-US").format(displayed) + " د.ع"
        : displayed.toLocaleString("en") + (suffix ? " " + suffix : "")}
    </p>
  );
};

export default AnimatedCounter;
