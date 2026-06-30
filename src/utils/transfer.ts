import type { Student, SystemSettings } from "@/types";

export function processTransferStudent(
  student: Student,
  school: string,
  newGrade: string,
  section?: string,
  systemSettings?: SystemSettings,
): Student {
  const paid = (student.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
  const remaining = Math.max(0, student.tuition - (student.discount || 0) - paid);
  const gradePrices = systemSettings?.gradePrices || {};
  const newTuition = gradePrices[newGrade] || student.tuition;
  return {
    ...student,
    school,
    grade: newGrade,
    section: section || student.section,
    previousGrade: student.grade,
    previousDebt: remaining,
    tuition: newTuition,
    payments: [],
    discount: 0,
  };
}
