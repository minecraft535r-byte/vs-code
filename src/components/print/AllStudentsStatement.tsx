/**
 * AllStudentsStatement.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useState, useEffect } from "react";
import { ArrowRight, Download, School } from "lucide-react";
import type { Student, SystemSettings } from "@/types";

const AllStudentsStatement = ({ onClose, students, schools, grades, systemSettings }: {
  onClose: () => void; students: Student[]; schools: string[]; grades: string[]; systemSettings: SystemSettings;
}) => {
  const [filterSchool, setFilterSchool] = useState("جميع المدارس");
  const [filterGrade,  setFilterGrade]  = useState("جميع المراحل");
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const fmtDate = (ds: string) => { try { const d=new Date(ds); return `${d.getFullYear()}\\${d.getMonth()+1}\\${d.getDate()}`; } catch { return ds; } };
  const today = (() => { const d=new Date(); return `${d.getFullYear()}\\${d.getMonth()+1}\\${d.getDate()}`; })();
  const filtered = students.filter(s =>
    (filterSchool==="جميع المدارس"||s.school===filterSchool) && (filterGrade==="جميع المراحل"||s.grade===filterGrade));
  const totals = filtered.reduce((acc,s) => {
    const net=s.tuition-(s.discount||0), paid=(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0);
    return {net:acc.net+net,paid:acc.paid+paid,rem:acc.rem+Math.max(0,net-paid)};
  },{net:0,paid:0,rem:0});
  const getLastPay = (s: Student) => {
    if(!s.payments?.length) return "لا يوجد";
    return fmtDate([...s.payments].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())[0].date);
  };
  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{document.body.style.overflow="";}; },[]);
  const PAGE_ROWS=30, totalPages=Math.ceil(filtered.length/PAGE_ROWS)||1;
  const B="1px solid #000";
  const cell=(x?:any):any=>({border:B,padding:"4px 7px",fontSize:12,...(x||{})});
  const th=(x?:any):any=>({border:B,padding:"5px 7px",fontSize:12,fontWeight:700,background:"#f0f0f0",textAlign:"center",...(x||{})});
  return (
    <div className="fixed inset-0 z-[9000] flex flex-col bg-slate-100" dir="rtl" style={{isolation:"isolate"}}>
      <div className="no-print bg-white border-b px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm"><ArrowRight size={18}/> رجوع</button>
          <span className="text-slate-300">|</span>
          <span className="font-black text-sm">بيانات حسابات الطلبة</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">{filtered.length} طالب</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white">
            <option>جميع المراحل</option>{grades.map(g=><option key={g}>{g}</option>)}
          </select>
          <button onClick={()=>window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-slate-900">
            <Download size={15}/> طباعة / PDF
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="print-document py-6 px-4 flex flex-col items-center gap-6">
          {Array.from({length:totalPages},(_,pi)=>{
            const rows=filtered.slice(pi*PAGE_ROWS,(pi+1)*PAGE_ROWS), isLast=pi===totalPages-1;
            return (
              <div key={pi} className="a4-page bg-white shadow-md"
                style={{width:"210mm",minHeight:"297mm",padding:"10mm",boxSizing:"border-box",
                        pageBreakAfter:isLast?"auto":"always",fontFamily:"Cairo,Arial,sans-serif",
                        position:"relative",flexShrink:0}}>
                {/* School header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4mm",paddingBottom:"3mm",borderBottom:"1px solid #ccc"}}>
                  <div style={{fontSize:11,color:"#555"}}>
                    <div>التاريخ: {today}</div>
                    <div>عدد الطلاب: {filtered.length}</div>
                    {totalPages>1&&<div>صفحة {pi+1} من {totalPages}</div>}
                  </div>
                  <div style={{textAlign:"center"}}>
                    {systemSettings.schoolLogo&&<img src={systemSettings.schoolLogo} alt="" style={{width:50,height:50,objectFit:"contain",display:"block",margin:"0 auto 3px"}}/>}
                    <div style={{fontSize:15,fontWeight:900}}>{systemSettings.schoolName||"مدارس مرتضى"}</div>
                    {systemSettings.academicYear&&<div style={{fontSize:10,color:"#666"}}>{systemSettings.academicYear}</div>}
                  </div>
                  <div style={{fontSize:11,color:"#555",textAlign:"left",minWidth:80}}>
                    {filterSchool!=="جميع المدارس"&&<div>{filterSchool}</div>}
                    {filterGrade!=="جميع المراحل"&&<div>{filterGrade}</div>}
                  </div>
                </div>
                {/* Title box */}
                <div style={{border:"2px solid #000",padding:"5px 0",textAlign:"center",fontSize:16,fontWeight:900,marginBottom:"5mm",width:"60%",margin:"0 auto 5mm"}}>
                  بيانات حسابات الطلبة
                </div>
                {/* Table */}
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={th({width:"4%"})}>ت</th>
                      <th style={th({textAlign:"right",width:"28%"})}>اسم الطالب</th>
                      <th style={th({width:"14%"})}>القسط (بعد الخصم)</th>
                      <th style={th({width:"13%"})}>المدفوعات</th>
                      <th style={th({width:"11%"})}>الباقي</th>
                      <th style={th({width:"14%"})}>تاريخ اخر قسط</th>
                      <th style={th({width:"16%",textAlign:"right"})}>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s,i)=>{
                      const net=s.tuition-(s.discount||0),paid=(s.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0),rem=Math.max(0,net-paid);
                      return (
                        <tr key={s.id}>
                          <td style={cell({textAlign:"center",color:"#555"})}>{pi*PAGE_ROWS+i+1}</td>
                          <td style={cell({textAlign:"right",fontWeight:600})}>{s.name}</td>
                          <td style={cell({textAlign:"center"})}>{fmt(net)}</td>
                          <td style={cell({textAlign:"center"})}>{fmt(paid)}</td>
                          <td style={cell({textAlign:"center",color:rem===0?"#dc2626":"#0f172a",fontWeight:rem===0?700:400})}>{rem===0?"0":fmt(rem)}</td>
                          <td style={cell({textAlign:"center",fontSize:11})}>{getLastPay(s)}</td>
                          <td style={cell({textAlign:"right",fontSize:11,color:"#666"})}>{s.notes||""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {isLast&&(
                    <tfoot>
                      <tr style={{background:"#f0f0f0"}}>
                        <td colSpan={2} style={cell({textAlign:"right",fontWeight:700,fontSize:13})}>المجموع</td>
                        <td style={cell({textAlign:"center",fontWeight:700})}>{fmt(totals.net)}</td>
                        <td style={cell({textAlign:"center",fontWeight:700})}>{fmt(totals.paid)}</td>
                        <td style={cell({textAlign:"center",fontWeight:700,color:totals.rem===0?"#dc2626":"#0f172a"})}>{totals.rem===0?"0":fmt(totals.rem)}</td>
                        <td style={cell()}></td><td style={cell()}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                <div style={{position:"absolute",bottom:"8mm",left:"10mm",right:"10mm",borderTop:"1px solid #ccc",paddingTop:4,fontSize:9,color:"#999",textAlign:"center"}}>
                  جميع الأرقام بالدينار العراقي
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@media print{.no-print{display:none!important}body{background:white!important;margin:0!important;overflow:visible!important}.print-document{padding:0!important;gap:0!important;display:block!important}.a4-page{box-shadow:none!important;border:none!important;margin:0!important;min-height:auto!important;width:100%!important}}`}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// INDIVIDUAL STUDENT ACCOUNT CARD — كشف حساب الطالب
// ══════════════════════════════════════════════════════════════

export default AllStudentsStatement;
