const fs = require('fs');
const path = 'E:/Github project/ai-travel-marketplace/frontend/src/pages/customer/PaymentPages.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldPageStart = code.indexOf('export const PaymentHistoryPage: React.FC = () => {');
const detailPageStart = code.indexOf('export const PaymentDetailPage: React.FC = () => {');
if (oldPageStart > -1 && detailPageStart > -1) {
    code = code.substring(0, oldPageStart) + code.substring(detailPageStart);
}

code = code.replace('const PaymentHistoryDashboard: React.FC = () => {', 'export const PaymentHistoryPage: React.FC = () => {');

code = code.replace(
    /'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500\/20'/g,
    "'border-indigo-200 bg-[#EEF2FF] text-blue-700 shadow-md'"
);
code = code.replace(
    /\`flex h-8 w-8 items-center justify-center rounded-full \$\{isActive \? 'bg-white\/20 text-white' : config.icon\}\`/g,
    "`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-white text-blue-600 shadow-sm' : config.icon}`"
);
code = code.replace(
    /\`rounded-full px-2\.5 py-1 text-xs \$\{isActive \? 'bg-white text-blue-600' : 'bg-slate-50 text-slate-700'\}\`/g,
    "`rounded-full px-2.5 py-1 text-xs ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'bg-slate-50 text-slate-700'}`"
);
code = code.replace(
    '<h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">Hi Traveler!<Sparkles className="h-5 w-5 text-blue-600" /></h2>',
    '<h2 className="text-2xl font-black text-slate-950">Hi Traveler! 🌎</h2>'
);
code = code.replace(
    /lg:grid-cols-\[104px_72px_minmax\(180px,1fr\)_minmax\(120px,auto\)_minmax\(140px,auto\)_auto\]/g,
    'lg:grid-cols-[80px_72px_minmax(180px,1fr)_minmax(120px,auto)_minmax(140px,auto)_auto]'
);
code = code.replace(
    /md:h-20 md:w-\[88px\] lg:h-20 lg:w-\[104px\]/g,
    'md:h-20 md:w-20 lg:h-20 lg:w-20'
);

fs.writeFileSync(path, code);
console.log('Update complete');
