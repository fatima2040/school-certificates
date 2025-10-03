// Drawer behavior
const drawer = document.getElementById('drawer');
document.getElementById('menuBtn').onclick = () => drawer.classList.remove('closed');
document.getElementById('closeDrawer').onclick = () => drawer.classList.add('closed');
// Collapse drawer on small screens when clicking a nav link
document.querySelectorAll('.nav-link').forEach(a => a.addEventListener('click', () => {
  if (window.innerWidth < 900) drawer.classList.add('closed');
}));

// Helpers
function fmtDate(input) {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d)) return input;
  return d.toLocaleDateString('ar-SA');
}

// Certificate: Thanks
window.renderThanks = function (){
  document.getElementById('ct_out_name').textContent    = document.getElementById('ct_name').value || '—';
  document.getElementById('ct_out_reason').textContent  = document.getElementById('ct_reason').value || 'جهودها المتميزة';
  document.getElementById('ct_out_date').textContent    = fmtDate(document.getElementById('ct_date').value);
  document.getElementById('ct_out_teacher').textContent = document.getElementById('ct_teacher').value || '—';
  const sn = document.getElementById('ct_serial').value.trim();
  document.getElementById('ct_out_serial').textContent  = sn ? ('رقم: ' + sn) : '';
}

// Certificate: Generic
window.renderGeneric = function (){
  document.getElementById('cg_out_name').textContent    = document.getElementById('cg_name').value || '—';
  document.getElementById('cg_out_reason').textContent  = document.getElementById('cg_reason').value || 'تفوقها الدراسي';
  document.getElementById('cg_out_date').textContent    = fmtDate(document.getElementById('cg_date').value);
  document.getElementById('cg_out_teacher').textContent = document.getElementById('cg_teacher').value || '—';
}

// Report: Weekly
window.renderWeekly = function (){
  document.getElementById('rw_out_teacher').textContent = document.getElementById('rw_teacher').value || '—';
  document.getElementById('rw_out_week').textContent    = document.getElementById('rw_week').value || '—';
  document.getElementById('rw_out_date').textContent    = fmtDate(document.getElementById('rw_date').value);
  document.getElementById('rw_out_done').textContent    = document.getElementById('rw_done').value || '—';
  document.getElementById('rw_out_chal').textContent    = document.getElementById('rw_chal').value || '—';
  document.getElementById('rw_out_reco').textContent    = document.getElementById('rw_reco').value || '—';
}

// Report: Parent
window.renderParent = function (){
  document.getElementById('rp_out_student').textContent = document.getElementById('rp_student').value || '—';
  document.getElementById('rp_out_subject').textContent = document.getElementById('rp_subject').value || '—';
  document.getElementById('rp_out_date').textContent    = fmtDate(document.getElementById('rp_date').value);
  document.getElementById('rp_out_summary').textContent = document.getElementById('rp_summary').value || '—';
}

// Export visible area to PDF
window.downloadPDF = async function (elementId, filename){
  const el = document.getElementById(elementId);
  const canvas = await html2canvas(el, {scale:2});
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jspdf.jsPDF('p','mm','a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  pdf.save(filename + '.pdf');
}

// Batch CSV -> many PDFs in ZIP
async function readCSV(file){
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter(Boolean).map(r=>r.split(','));
  const header = rows.shift().map(h=>h.trim());
  return rows.map(cells => {
    const obj = {};
    header.forEach((h,i)=> obj[h] = (cells[i]||'').trim());
    return obj;
  });
}

window.batchGenerate = async function(type){
  const file = document.getElementById('csvFile').files[0];
  if (!file){ alert('اختاري ملف CSV أولاً'); return; }
  const records = await readCSV(file);
  const log = document.getElementById('batchLog');
  log.textContent = `جارٍ إنشاء ${records.length} ملف...\n`;

  // Create a hidden canvas area to reuse one preview target
  const tmpId = type === 'thanks' ? 'preview-thanks' : 'preview-generic';
  let count = 0;

  // Use JSZip from CDN dynamically (to keep the HTML cleaner)
  if (!window.JSZip){
    await new Promise((res,rej)=>{
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload=res; s.onerror=rej; document.body.appendChild(s);
    });
  }
  const zip = new JSZip();

  for (const rec of records){
    if (type==='thanks'){
      document.getElementById('ct_name').value = rec.name || '';
      document.getElementById('ct_reason').value = rec.reason || '';
      document.getElementById('ct_date').value = rec.date || '';
      document.getElementById('ct_teacher').value = rec.teacher || '';
      document.getElementById('ct_serial').value = rec.serial || '';
      renderThanks();
    }else{
      document.getElementById('cg_name').value = rec.name || '';
      document.getElementById('cg_reason').value = rec.reason || '';
      document.getElementById('cg_date').value = rec.date || '';
      document.getElementById('cg_teacher').value = rec.teacher || '';
      renderGeneric();
    }

    const el = document.getElementById(tmpId);
    const canvas = await html2canvas(el,{scale:2});
    const data = canvas.toDataURL('image/png').split(',')[1];
    const fname = ( (type==='thanks'?'شهادة-شكر-':'شهادة-تفوق-') + (rec.name||('بدون-اسم-'+(++count))) + '.png' );
    zip.file(fname, data, {base64:true});
    log.textContent += '✔︎ ' + fname + '\n';
  }

  const blob = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (type==='thanks'?'شهادات-شكر':'شهادات-تفوق') + '.zip';
  a.click();
}
