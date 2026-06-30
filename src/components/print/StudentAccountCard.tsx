/**
 * StudentAccountCard.tsx
 * Extracted and refactored from App.tsx monolith
 */

import React, { useEffect, useRef } from "react";
import { FileText, GraduationCap, ArrowRight, Download } from "lucide-react";
import html2canvas from "html2canvas";
import type { Student, SystemSettings } from "@/types";

const StudentAccountCard = ({ student, onClose, systemSettings }: {
  student: Student; onClose: () => void; systemSettings: SystemSettings;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const fmtDate = (ds: string) => { try{const d=new Date(ds);return `${d.getFullYear()}\\${d.getMonth()+1}\\${d.getDate()}`;}catch{return ds;} };
  const nowDate = (()=>{const d=new Date();return `${d.getFullYear()}\\${d.getMonth()+1}\\${d.getDate()}`;})();
  const nowTime = new Date().toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"});
  const net  = student.tuition-(student.discount||0);
  const paid = (student.payments||[]).filter((p:any)=>!p.isWithdrawn).reduce((a,p)=>a+p.amount,0);
  const rem  = Math.max(0,net-paid);
  const sortedPays = [...(student.payments||[])].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]); 
  const saveImg = async () => {
    if(!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff"});
      const a=document.createElement("a"); a.download=`كشف-حساب-${student.name}.png`; a.href=canvas.toDataURL(); a.click();
    } catch(e){console.error(e);}
  };
  const B="1px solid #000";
  const cell=(x?:any):any=>({border:B,padding:"6px 10px",fontSize:13,...(x||{})});
  const th=(x?:any):any=>({border:B,padding:"7px 10px",fontSize:13,fontWeight:700,background:"#f5f5f5",textAlign:"center",...(x||{})});
  return (
    <div className="fixed inset-0 z-[9000] flex flex-col bg-slate-200" dir="rtl" style={{isolation:"isolate"}}>
      <div className="no-print bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm"><ArrowRight size={18}/> رجوع</button>
        <div className="flex gap-2">
          <button onClick={saveImg} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700"><Download size={14}/> حفظ صورة</button>
          <button onClick={()=>window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-900"><FileText size={14}/> طباعة</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto flex justify-center py-6 px-4">
        <div ref={cardRef} className="bg-white"
          style={{width:"190mm",fontFamily:"Cairo,Arial,sans-serif",boxShadow:"0 2px 12px rgba(0,0,0,0.15)",padding:"12mm"}}>
          {/* Header: right=school name, center=logo, left=date */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",marginBottom:"5mm"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:900,color:"#0f172a"}}>{systemSettings.schoolName||"مدارس مرتضى"}</div>
              {systemSettings.address&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{systemSettings.address}</div>}
            </div>
            <div style={{textAlign:"center",padding:"0 10px"}}>
              {systemSettings.schoolLogo
                ? <img src={systemSettings.schoolLogo} alt="" style={{width:80,height:80,objectFit:"contain"}}/>
                : <div style={{width:80,height:80,background:"#1d4ed8",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <GraduationCap color="white" size={36}/>
                  </div>}
            </div>
            <div style={{textAlign:"left",fontSize:12,color:"#333",lineHeight:1.8}}>
              <div>التاريخ: {nowDate}</div>
              <div>الساعة: {nowTime}</div>
            </div>
          </div>
          <div style={{borderBottom:"2px solid #000",marginBottom:"5mm"}}/>
          {/* Title */}
          <div style={{textAlign:"center",fontSize:18,fontWeight:900,textDecoration:"underline",marginBottom:"6mm"}}>
            كشف حساب الطالب: {student.name}
          </div>
          {/* Financial 2x2 */}
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"6mm"}}>
            <tbody>
              <tr>
                <td style={cell({textAlign:"center",width:"25%"})}>{fmt(student.tuition)}</td>
                <td style={cell({fontWeight:700,textAlign:"center",width:"25%",background:"#fafafa"})}>القسط الكلي</td>
                <td style={cell({textAlign:"center",width:"25%"})}>{student.discount?fmt(student.discount):""}</td>
                <td style={cell({fontWeight:700,textAlign:"center",width:"25%",background:"#fafafa"})}>الخصم</td>
              </tr>
              <tr>
                <td style={cell({textAlign:"center"})}>{fmt(paid)}</td>
                <td style={cell({fontWeight:700,textAlign:"center",background:"#fafafa"})}>المبالغ المدفوعة</td>
                <td style={cell({textAlign:"center",fontWeight:700,color:rem===0?"#dc2626":"#0f172a"})}>{rem===0?"0":fmt(rem)}</td>
                <td style={cell({fontWeight:700,textAlign:"center",background:"#fafafa"})}>الباقي</td>
              </tr>
            </tbody>
          </table>
          {/* Payments */}
          {sortedPays.length>0?(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  <th style={th({width:"5%"})}>ت</th>
                  <th style={th({width:"18%"})}>رقم الوصل</th>
                  <th style={th({width:"22%"})}>قيمة الوصل</th>
                  <th style={th({width:"22%"})}>تاريخ الوصل</th>
                  <th style={th({textAlign:"right",width:"33%"})}>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {sortedPays.map((p,i)=>(
                  <tr key={p.id}>
                    <td style={cell({textAlign:"center",color:"#555"})}>{i+1}</td>
                    <td style={cell({textAlign:"center"})}>{(p as any).receiptNumber||p.id?.slice(-4)||(i+1)}</td>
                    <td style={cell({textAlign:"center"})}>{fmt(p.amount)}</td>
                    <td style={cell({textAlign:"center"})}>{fmtDate(p.date)}</td>
                    <td style={cell({textAlign:"right",color:"#666",fontSize:11})}>{p.notes||"لا توجد ملاحظات"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ):(
            <div style={{border:B,padding:"12px",textAlign:"center",color:"#999",fontSize:13}}>لا توجد دفعات مسجّلة</div>
          )}
          {/* Signature */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"10mm",borderTop:"1px solid #ccc",paddingTop:"5mm",fontSize:11,color:"#555"}}>
            <span>توقيع المحاسب: _______________</span>
            <span>الختم الرسمي</span>
            <span>توقيع الإدارة: _______________</span>
          </div>
        </div>
      </div>
      <style>{`@media print{.no-print{display:none!important}body{background:white!important;margin:0!important;overflow:visible!important}.fixed.inset-0{position:static!important;background:none!important}.flex-1{overflow:visible!important}}`}</style>
    </div>
  );
}

export default StudentAccountCard;
