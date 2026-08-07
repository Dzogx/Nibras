export type DailyLesson={title:string;kind:string;competence?:string;minutes:number;resources:string[]};
export function nextDailyLesson(items:DailyLesson[]){return items.find(x=>x.kind==='learning')??items[0]??null;}
export function dailyPrompt(item:DailyLesson){return{title:item.title,questions:['هل تم إنجاز الحصة؟','ما الصعوبة الأكثر ظهوراً؟','ما الملاحظة المهمة؟','ما الخطوة التالية؟'],resources:item.resources};}
