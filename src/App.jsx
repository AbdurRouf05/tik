import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Monitor, Keyboard, FileText, AlertCircle, 
  RefreshCcw, User, ArrowRight, ArrowLeft, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Mail, Send, Timer, Globe,
  Save, Printer, Bold, Italic, Underline, Wifi, WifiOff, X, Folder,
  Search, Trash2, ShieldAlert, Eye, Award, MousePointer2,
  Minus, Square, Bluetooth, Plane, MapPin, LayoutGrid, AppWindow
} from 'lucide-react';

// ==========================================
// [1] DOMAIN LAYER & STRICT VALIDATION
// ==========================================
const validateSession = (data) => {
  if (typeof data !== 'object' || data === null) return false;
  return (
    typeof data.nis === 'string' &&
    typeof data.name === 'string' &&
    typeof data.score === 'number' &&
    typeof data.completedAt === 'string' &&
    Array.isArray(data.reviews)
  );
};

// ==========================================
// [2] DATA LAYER (OFFLINE-FIRST REPOSITORY)
// ==========================================
const STORAGE_KEY = 'cbt_offline_session_v5_interactive';

const CBTRepository = {
  saveSession: (sessionData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan ke Local Storage', e);
      return false;
    }
  },
  getSession: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (validateSession(parsed)) return parsed;
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch (e) {
      return null;
    }
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ==========================================
// [3] DATA SOAL & KUNCI JAWABAN (Statis)
// ==========================================
const EXAM_KEYS = {
  // P1
  q1: { ans: 'Hardware', exp: 'Perangkat keras (Hardware) adalah komponen yang berwujud fisik.' },
  q2: { ans: 'Software', exp: 'Aplikasi seperti Word dan Game disebut perangkat lunak (Software).' },
  q3: { ans: 'CPU', exp: 'CPU (Central Processing Unit) adalah otak komputer.' },
  q4: { ans: 'Windows', exp: 'Windows adalah OS buatan Microsoft yang paling umum digunakan.' },
  q5: { ans: 'Ctrl + C', exp: 'Ctrl+C digunakan untuk Copy (Menyalin).' },
  q6: { ans: 'Ctrl + V', exp: 'Ctrl+V digunakan untuk Paste (Menempel).' },
  q7: { ans: 'Ctrl + Z', exp: 'Ctrl+Z digunakan untuk Undo (Membatalkan aksi terakhir).' },
  q8: { ans: 'Hardisk / SSD', exp: 'Hardisk/SSD adalah tempat menyimpan file secara permanen.' },
  q9: { ans: 'Backspace', exp: 'Backspace menghapus huruf di sebelah kiri kursor.' },
  q10: { ans: 'Browser', exp: 'Chrome, Firefox, dan Edge adalah Web Browser.' },
  
  // P2
  q11: { ans: 'Belajar TIK itu Menyenangkan!', exp: 'Mengetik harus memperhatikan huruf besar/kecil dan tanda baca presisi.' },
  q12: { ans: 'center', exp: 'Ikon garis rata tengah (Center Alignment).' },
  q13: { ans: 'save', exp: 'Ikon disket melambangkan aksi Simpan (Save).' },
  q14: { ans: 'print', exp: 'Ikon mesin cetak melambangkan aksi Cetak (Print).' },
  q15: { ans: 'bold', exp: 'Ikon huruf B tebal digunakan untuk menebalkan teks (Bold).' },
  // q16 dievaluasi secara dinamis
  q17: { ans: 'minimized', exp: 'Tombol minus (-) digunakan untuk me-minimize aplikasi ke Taskbar.' },
  q18: { ans: 'double_clicked', exp: 'Untuk membuka folder di desktop, kita harus melakukan Double-Click.' },
  q19: { ans: 'dropped', exp: 'Memindahkan file dilakukan dengan cara klik, tahan, lalu geser ke target (Drag & Drop).' },
  q20: { ans: 'browser_active', exp: 'Alt+Tab digunakan untuk bertukar aplikasi yang aktif di layar.' },

  // P3
  q21_to: { ans: 'guru.tik@sekolah.sch.id', exp: 'Alamat email yang valid memiliki format nama@domain.com.' },
  q21_sub: { ans: 'Tugas Praktek TIK - Budi', exp: 'Subjek email harus jelas, mencantumkan tujuan dan identitas pengirim.' },
  q21_msg: { ans: 'Selamat pagi Pak, berikut saya lampirkan tugas praktek saya. Terima kasih.', exp: 'Isi email (body) harus memiliki salam pembuka, maksud yang jelas, dan penutup sopan.' },
  q22: { ans: 'Downloads', exp: 'File yang diunduh dari internet biasanya otomatis masuk ke folder Downloads.' },
  q23: { ans: 'Restore', exp: 'Untuk mengembalikan file dari Recycle Bin, klik kanan lalu pilih Restore.' },
  q24: { ans: 'https://www.google.com', exp: 'URL yang aman dimulai dengan https://.' },
  q25: { ans: 'Budi!2024#Aman', exp: 'Password kuat harus gabungan huruf besar, kecil, angka, dan simbol khusus.' },

  // P4
  q26: { ans: '[Akurasi Ketikan]', exp: 'Nilai diambil dari persentase akurasi ketikan dalam 45 detik.' },
  q27: { ans: 'Kompoter', exp: 'Penulisan yang benar adalah Komputer, bukan Kompoter.' },
  q28: { ans: '15', exp: 'Jika A1=10 dan B1=5, maka =A1+B1 adalah 10+5 = 15.' },
  q29: { ans: '8492', exp: 'Ini adalah tes daya ingat memori jangka pendek.' },
  q30: { ans: 'http://hadiah-gratis-login.com', exp: 'Situs tanpa HTTPS dan URL mencurigakan adalah ciri-ciri Phishing.' },
};

// ==========================================
// [4] PRESENTATION LAYER (UI & STATE)
// ==========================================
export default function App() {
  const [appState, setAppState] = useState('LOADING'); // LOADING, LOGIN, EXAM, WARNING, RESULT, REVIEW
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Identitas
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  
  // Slide Management
  const [currentSlide, setCurrentSlide] = useState(0);
  const TOTAL_SLIDES = 4;

  // Answers State
  const [answers, setAnswers] = useState({
    // Part 1
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '',
    // Part 2
    q11: '', q12: '', q13: '', q14: '', q15: '', 
    q16_wifi: false, q16_bt: false, q16_air: false, q16_loc: false, // Toggles
    q17: 'open', q18: '', q19: '', q20: 'word_active',
    // Part 3
    q21_to: '', q21_sub: '', q21_msg: '', q22: '', q23: '', q24: '', q25: '',
    // Part 4
    q26: '', q27: '', q28: '', q29: '', q30: ''
  });

  // Dynamic Target for Q16 (Toggles)
  const [q16Target, setQ16Target] = useState(null);

  // Specific States
  const TYPING_TIME_LIMIT = 45;
  const [timeLeft, setTimeLeft] = useState(TYPING_TIME_LIMIT);
  const [typingStarted, setTypingStarted] = useState(false);
  const [typingFinished, setTypingFinished] = useState(false);
  const typingTargetText = "Komputer dan internet sangat membantu tugas sekolah. Kita bisa mencari informasi dengan cepat. Namun, kita harus berhati-hati dan selalu menjaga etika saat menggunakan media sosial.";

  const [pinVisible, setPinVisible] = useState(false);
  const [pinUsed, setPinUsed] = useState(false);

  // Initialization
  useEffect(() => {
    const existingSession = CBTRepository.getSession();
    if (existingSession && existingSession.reviews) {
      setSession(existingSession);
      setAppState('RESULT');
    } else {
      setAppState('LOGIN');
    }
    
    // Generate Random Toggles for Q16 on Load
    setQ16Target({
      wifi: Math.random() > 0.5,
      bt: Math.random() > 0.5,
      air: Math.random() > 0.5,
      loc: Math.random() > 0.5
    });
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval;
    if (currentSlide === 3 && typingStarted && timeLeft > 0 && !typingFinished) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && typingStarted && !typingFinished) {
      setTypingFinished(true);
    }
    return () => clearInterval(interval);
  }, [typingStarted, timeLeft, currentSlide, typingFinished]);

  // --- Handlers ---
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (nis.trim().length < 4 || name.trim().length < 3) {
      setErrorMsg('NIS (min 4 angka) dan Nama (min 3 huruf) wajib diisi valid.');
      return;
    }
    setAppState('EXAM');
  };

  const showPinTask = () => {
    if (pinUsed) return;
    setPinVisible(true);
    setPinUsed(true);
    setTimeout(() => {
      setPinVisible(false);
    }, 2000); // Tampil hanya 2 detik
  };

  const handleNextSlide = () => {
    setErrorMsg('');
    if (currentSlide === 0) {
      const p1Keys = ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'];
      if (p1Keys.some(k => !answers[k])) return setErrorMsg('Jawab semua soal Pilihan Ganda (Bagian 1) terlebih dahulu.');
    }
    if (currentSlide === 1) {
      const p2Keys = ['q11','q12','q13','q14','q15','q17','q18','q19','q20'];
      if (p2Keys.some(k => !answers[k])) return setErrorMsg('Selesaikan semua simulasi visual (Bagian 2). Jangan ada yang terlewat.');
    }
    if (currentSlide === 2) {
      const p3Keys = ['q21_to','q21_sub','q21_msg','q22','q23','q24','q25'];
      if (p3Keys.some(k => !answers[k])) return setErrorMsg('Pilih semua jawaban dropdown pada simulasi (Bagian 3).');
    }
    setCurrentSlide(prev => prev + 1);
  };

  const handlePrevSlide = () => {
    setErrorMsg('');
    setCurrentSlide(prev => prev - 1);
  };

  // Drag & Drop Handlers (Native HTML5)
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', 'drag_file_19');
  };
  const handleDragOver = (e) => {
    e.preventDefault(); // Membolehkan drop
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.getData('text/plain') === 'drag_file_19') {
      setAnswers(prev => ({...prev, q19: 'dropped'}));
    }
  };

  // Alt Tab Handler
  const handleAltTab = () => {
    setAnswers(prev => ({
      ...prev, 
      q20: prev.q20 === 'word_active' ? 'browser_active' : 'word_active'
    }));
  };

  const handleExamSubmit = () => {
    setErrorMsg('');
    const p4Keys = ['q27','q28','q29','q30'];
    if (p4Keys.some(k => !answers[k])) return setErrorMsg('Jawab semua tantangan logika (Bagian 4) sebelum mengumpulkan.');

    // --- ALGORITMA PENILAIAN ---
    let totalScore = 0;
    const reviewData = [];

    const addReview = (id, isCorrect, ptsEarned, maxPts, customAns = null, customQ = null, customExp = null) => {
      totalScore += ptsEarned;
      reviewData.push({
        id, q: customQ || id, userAnswer: customAns || answers[id],
        correctAnswer: EXAM_KEYS[id]?.ans || 'Variatif',
        isCorrect, pointsEarned: ptsEarned, maxPoints: maxPts,
        exp: customExp || EXAM_KEYS[id]?.exp || ''
      });
    };

    // Part 1 (30 pts = 10 x 3)
    ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].forEach(q => {
      const correct = answers[q] === EXAM_KEYS[q].ans;
      addReview(q, correct, correct ? 3 : 0, 3);
    });

    // Part 2 (30 pts = 10 x 3)
    let q11Correct = 0;
    if (answers.q11.trim() === EXAM_KEYS.q11.ans) q11Correct = 3;
    else if (answers.q11.toLowerCase().includes('belajar tik')) q11Correct = 1;
    addReview('q11', q11Correct === 3, q11Correct, 3);

    ['q12','q13','q14','q15'].forEach(q => {
      const correct = answers[q] === EXAM_KEYS[q].ans;
      addReview(q, correct, correct ? 3 : 0, 3);
    });

    // Evaluasi Dinamis Q16 (Toggles)
    let q16Pts = 0;
    if (answers.q16_wifi === q16Target.wifi) q16Pts += 0.75;
    if (answers.q16_bt === q16Target.bt) q16Pts += 0.75;
    if (answers.q16_air === q16Target.air) q16Pts += 0.75;
    if (answers.q16_loc === q16Target.loc) q16Pts += 0.75;
    
    let q16UserAns = `WiFi:${answers.q16_wifi}, BT:${answers.q16_bt}, Air:${answers.q16_air}, Loc:${answers.q16_loc}`;
    addReview('q16', q16Pts === 3, q16Pts, 3, q16UserAns, '16. Simulasi Panel Koneksi', 'Semua toggle harus disesuaikan dengan instruksi acak yang diberikan.');

    ['q17','q18','q19','q20'].forEach(q => {
      const correct = answers[q] === EXAM_KEYS[q].ans;
      addReview(q, correct, correct ? 3 : 0, 3);
    });

    // Part 3 (20 pts = 5 x 4) -> Q21 dipecah 3 agar jelas di review
    let q21ToCorrect = answers.q21_to === EXAM_KEYS.q21_to.ans;
    addReview('q21_to', q21ToCorrect, q21ToCorrect ? 1.5 : 0, 1.5, answers.q21_to || '[Kosong]', '21a. Email (Kepada)', EXAM_KEYS.q21_to.exp);

    let q21SubCorrect = answers.q21_sub === EXAM_KEYS.q21_sub.ans;
    addReview('q21_sub', q21SubCorrect, q21SubCorrect ? 1 : 0, 1, answers.q21_sub || '[Kosong]', '21b. Email (Subjek)', EXAM_KEYS.q21_sub.exp);

    let q21MsgCorrect = answers.q21_msg === EXAM_KEYS.q21_msg.ans;
    addReview('q21_msg', q21MsgCorrect, q21MsgCorrect ? 1.5 : 0, 1.5, answers.q21_msg || '[Kosong]', '21c. Email (Isi Pesan)', EXAM_KEYS.q21_msg.exp);

    ['q22','q23','q24','q25'].forEach(q => {
      const correct = answers[q] === EXAM_KEYS[q].ans;
      addReview(q, correct, correct ? 4 : 0, 4);
    });

    // Part 4 (20 pts)
    let q26Pts = 0;
    if (answers.q26.length > 0) {
      let correctChars = 0;
      const targetLen = typingTargetText.length;
      const typedLen = answers.q26.length;
      for(let i=0; i < Math.min(targetLen, typedLen); i++) {
        if (answers.q26[i] === typingTargetText[i]) correctChars++;
      }
      const acc = correctChars / targetLen;
      if (acc >= 0.95) q26Pts = 10;
      else if (acc >= 0.8) q26Pts = 8;
      else if (acc >= 0.5) q26Pts = 5;
      else if (acc >= 0.2) q26Pts = 2;
    }
    addReview('q26', q26Pts >= 8, q26Pts, 10, answers.q26 || '[Kosong]', '26. Typing Cepat', EXAM_KEYS.q26.exp);

    ['q27','q28','q29','q30'].forEach(q => {
      // Pastikan komparasi string yang presisi
      const correct = answers[q].toString().toLowerCase().trim() === EXAM_KEYS[q].ans.toLowerCase();
      addReview(q, correct, correct ? 2.5 : 0, 2.5);
    });

    // Simpan Data
    const newSession = {
      id: `CBT-${Date.now()}`,
      nis: nis.trim(),
      name: name.trim(),
      score: Math.round(totalScore),
      completedAt: new Date().toLocaleString('id-ID'),
      reviews: reviewData
    };

    if (CBTRepository.saveSession(newSession)) {
      setSession(newSession);
      setAppState('WARNING'); // Menuju Warning Screen anti nyontek
    } else {
      setErrorMsg('Gagal mengunci ujian ke penyimpanan perangkat.');
    }
  };

  const handleTeacherReset = () => {
    if(window.confirm('Mode Guru: Hapus data siswa ini agar PC bisa dipakai murid lain?')) {
      CBTRepository.clearSession();
      window.location.reload();
    }
  };

  // UI Components
  const PointBadge = ({ points }) => (
    <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded shadow-sm border border-green-200 ml-2 align-middle whitespace-nowrap">
      [{points} Poin]
    </span>
  );

  const TitleBadge = ({ icon, text }) => (
    <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-6 flex items-center">
      {icon} <span className="ml-2">{text}</span>
    </h2>
  );

  // ==========================================
  // RENDERERS
  // ==========================================
  if (appState === 'LOADING') return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Memuat...</div>;

  if (appState === 'WARNING') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl max-w-lg text-center shadow-2xl animate-in zoom-in duration-500">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-2xl font-black text-slate-800 mb-4">PERINGATAN KEJUJURAN</h1>
          <p className="text-slate-600 mb-6 text-lg">Sistem sedang memproses hasil Anda. <br/><br/><b>DILARANG KERAS</b> membocorkan tugas visual/logika ini kepada teman yang belum ujian.</p>
          <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm mb-6 border border-red-200">
            Pola jawaban Anda telah direkam secara unik di perangkat ini. Memberitahu teman akan merusak algoritma penilaian kelas.
          </div>
          <button onClick={() => setAppState('RESULT')} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition-colors shadow-lg">
            Saya Mengerti & Tampilkan Nilai Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white font-sans text-slate-800">
      <div className="w-full h-screen h-[100dvh] bg-white overflow-hidden flex flex-col">
        
        {/* Header (Global) */}
        <div className="bg-blue-600 p-4 md:p-5 text-white flex items-center justify-between shadow-md relative z-10">
          <div className="flex items-center">
             <Monitor className="w-8 h-8 mr-3 opacity-90 hidden sm:block" />
             <div className="text-left">
               <h1 className="text-lg md:text-xl font-black tracking-tight">Simulasi Praktek TIK</h1>
               {appState === 'EXAM' && <p className="text-blue-200 text-xs font-medium">{name} ({nis})</p>}
             </div>
          </div>
          {appState === 'EXAM' && (
             <div className="bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-500 shadow-inner">
                <span className="text-xs md:text-sm font-bold tracking-wider uppercase">Bagian {currentSlide + 1} / {TOTAL_SLIDES}</span>
             </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 flex items-start text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto overflow-x-hidden scroll-smooth">
          
          {/* --- VIEW: LOGIN --- */}
          {appState === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 w-full max-w-lg mx-auto py-4 sm:py-8 md:py-12 animate-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Monitor className="w-10 h-10"/>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">CBT Interaktif</h2>
                <p className="text-slate-500 text-sm mt-2">Ujian berbasis simulasi visual dan logika.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">NIS Siswa</label>
                  {/* type="text" + inputMode="numeric" digunakan agar input angka aman dari scroll wheel bug */}
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={nis} onChange={(e) => setNis(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base sm:text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Contoh: 10293" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nama Lengkap</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base sm:text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" placeholder="Masukkan nama..." />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center transition-all shadow-md active:scale-95">
                Mulai Ujian <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          )}

          {/* --- VIEW: EXAM SLIDES --- */}
          {appState === 'EXAM' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              
              {/* === SLIDE 1: TEORI DASAR (10 Pilihan Ganda) === */}
              {currentSlide === 0 && (
                <div className="space-y-5 sm:space-y-8">
                  <TitleBadge icon={<FileText className="text-blue-600"/>} text="Bagian 1: Teori Dasar Komputer" />
                  
                  {[
                    { id: 'q1', q: 'Perangkat fisik komputer yang bisa disentuh disebut?', opts: ['Software', 'Hardware', 'Brainware', 'Malware'] },
                    { id: 'q2', q: 'Aplikasi seperti Microsoft Word dan Game termasuk dalam kategori...', opts: ['Hardware', 'Brainware', 'Software', 'Freeware'] },
                    { id: 'q3', q: 'Komponen yang berfungsi sebagai "Otak" pemroses utama pada komputer adalah...', opts: ['Hardisk', 'Monitor', 'CPU', 'RAM'] },
                    { id: 'q4', q: 'Sistem Operasi (OS) bawaan pabrik yang paling umum digunakan pada PC/Laptop adalah...', opts: ['Android', 'Linux', 'MacOS', 'Windows'] },
                    { id: 'q5', q: 'Kombinasi tombol keyboard untuk menyalin teks (Copy) adalah...', opts: ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z'] },
                    { id: 'q6', q: 'Kombinasi tombol keyboard untuk menempelkan teks (Paste) adalah...', opts: ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z'] },
                    { id: 'q7', q: 'Jika Anda tidak sengaja menghapus teks, kombinasi tombol apa untuk membatalkannya (Undo)?', opts: ['Ctrl + S', 'Ctrl + Z', 'Ctrl + Y', 'Ctrl + A'] },
                    { id: 'q8', q: 'Komponen tempat menyimpan data, dokumen, dan foto secara permanen adalah...', opts: ['RAM', 'VGA', 'Hardisk / SSD', 'Processor'] },
                    { id: 'q9', q: 'Tombol keyboard untuk menghapus huruf di sebelah KIRI kursor adalah...', opts: ['Delete', 'Backspace', 'Shift', 'Enter'] },
                    { id: 'q10', q: 'Google Chrome, Mozilla Firefox, dan Microsoft Edge adalah contoh dari program...', opts: ['Antivirus', 'Media Player', 'Browser', 'Sistem Operasi'] },
                  ].map((soal, i) => (
                    <div key={soal.id} className="space-y-3 bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
                      <p className="font-medium text-base sm:text-lg leading-snug"><span className="text-blue-600 font-black mr-2">{i+1}.</span>{soal.q} <PointBadge points={3}/></p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pl-0 sm:pl-6">
                        {soal.opts.map(opt => (
                          <label key={opt} className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${answers[soal.id] === opt ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                            <input type="radio" name={soal.id} value={opt} onChange={(e) => setAnswers({...answers, [soal.id]: e.target.value})} className="hidden"/>
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${answers[soal.id] === opt ? 'border-blue-500' : 'border-slate-300'}`}>
                              {answers[soal.id] === opt && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                            <span className="font-medium text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === SLIDE 2: SIMULASI VISUAL (10 Soal) === */}
              {currentSlide === 1 && (
                <div className="space-y-8">
                  <TitleBadge icon={<Monitor className="text-blue-600"/>} text="Bagian 2: Simulasi Office & OS" />
                  
                  {/* Q11: Mengetik */}
                  <div className="space-y-3 bg-blue-50 p-3 sm:p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <p className="font-medium text-lg text-blue-900"><span className="font-black mr-2">11.</span>Ujian Mengetik Presisi <PointBadge points={3}/></p>
                    <p className="text-sm text-blue-700 mb-2">Ketik <b>PERSIS</b> kalimat di bawah ini (Perhatikan Huruf Besar/Kecil & Tanda Baca!)</p>
                    <div className="bg-white border-2 border-dashed border-blue-300 p-3 sm:p-4 text-center font-mono font-bold text-base sm:text-xl select-none mb-3 text-slate-800">
                      Belajar TIK itu Menyenangkan!
                    </div>
                    <input 
                      type="text" value={answers.q11} onChange={(e) => setAnswers({...answers, q11: e.target.value})}
                      className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl font-mono text-lg text-center focus:ring-4 focus:ring-blue-100 outline-none"
                      placeholder="Mulai mengetik di sini..." spellCheck="false" autoComplete="off"
                    />
                  </div>

                  {/* Q12 - Q15: Ikon Office */}
                  {[
                    { id: 'q12', q: 'Pilih ikon perataan teks untuk memposisikan paragraf di Tengah (Center).', icons: [{id:'left', i:<AlignLeft/>},{id:'center', i:<AlignCenter/>},{id:'right', i:<AlignRight/>},{id:'justify', i:<AlignJustify/>}] },
                    { id: 'q13', q: 'Pilih ikon yang digunakan untuk Menyimpan (Save) dokumen.', icons: [{id:'print', i:<Printer/>},{id:'save', i:<Save/>},{id:'folder', i:<Folder/>},{id:'search', i:<Search/>}] },
                    { id: 'q14', q: 'Pilih ikon yang digunakan untuk Mencetak (Print) dokumen ke kertas.', icons: [{id:'save', i:<Save/>},{id:'trash', i:<Trash2/>},{id:'print', i:<Printer/>},{id:'globe', i:<Globe/>}] },
                    { id: 'q15', q: 'Pilih ikon untuk membuat tulisan menjadi Tebal (Bold).', icons: [{id:'italic', i:<Italic/>},{id:'bold', i:<Bold/>},{id:'underline', i:<Underline/>},{id:'align', i:<AlignLeft/>}] },
                  ].map((soal, idx) => (
                    <div key={soal.id} className="space-y-3 bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
                      <p className="font-medium text-base sm:text-lg"><span className="text-blue-600 font-black mr-2">{idx+12}.</span>{soal.q} <PointBadge points={3}/></p>
                      <div className="flex flex-wrap gap-3 sm:gap-4 pl-0 sm:pl-6 py-2">
                        {soal.icons.map(icon => (
                          <button key={icon.id} type="button" onClick={() => setAnswers({...answers, [soal.id]: icon.id})}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center ${answers[soal.id] === icon.id ? 'bg-blue-100 border-blue-600 text-blue-700 scale-110 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                          >
                            {React.cloneElement(icon.i, { className: 'w-8 h-8' })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Q16: 4 Toggles Dinamis */}
                  <div className="space-y-4 bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="font-medium text-lg"><span className="text-blue-600 font-black mr-2">16.</span>Simulasi Panel Koneksi (Control Center) <PointBadge points={3}/></p>
                    
                    {/* Instruksi Acak */}
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 text-sm font-medium">
                      <p className="mb-2 uppercase tracking-wide font-black text-xs">Instruksi Tugas:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Atur WiFi menjadi: <b>{q16Target?.wifi ? 'AKTIF (ON)' : 'NON-AKTIF (OFF)'}</b></li>
                        <li>Atur Bluetooth menjadi: <b>{q16Target?.bt ? 'AKTIF (ON)' : 'NON-AKTIF (OFF)'}</b></li>
                        <li>Atur Mode Pesawat menjadi: <b>{q16Target?.air ? 'AKTIF (ON)' : 'NON-AKTIF (OFF)'}</b></li>
                        <li>Atur Lokasi (GPS) menjadi: <b>{q16Target?.loc ? 'AKTIF (ON)' : 'NON-AKTIF (OFF)'}</b></li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
                      {/* WiFi Toggle */}
                      <div className="flex flex-col items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                        <Wifi className={`w-8 h-8 mb-3 ${answers.q16_wifi ? 'text-blue-600' : 'text-slate-400'}`}/>
                        <button type="button" onClick={() => setAnswers(p => ({...p, q16_wifi: !p.q16_wifi}))}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${answers.q16_wifi ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${answers.q16_wifi ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className="mt-2 text-xs font-bold text-slate-600 uppercase">WiFi</span>
                      </div>
                      {/* Bluetooth Toggle */}
                      <div className="flex flex-col items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                        <Bluetooth className={`w-8 h-8 mb-3 ${answers.q16_bt ? 'text-blue-600' : 'text-slate-400'}`}/>
                        <button type="button" onClick={() => setAnswers(p => ({...p, q16_bt: !p.q16_bt}))}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${answers.q16_bt ? 'bg-blue-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${answers.q16_bt ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className="mt-2 text-xs font-bold text-slate-600 uppercase">Bluetooth</span>
                      </div>
                      {/* Airplane Toggle */}
                      <div className="flex flex-col items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                        <Plane className={`w-8 h-8 mb-3 ${answers.q16_air ? 'text-orange-500' : 'text-slate-400'}`}/>
                        <button type="button" onClick={() => setAnswers(p => ({...p, q16_air: !p.q16_air}))}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${answers.q16_air ? 'bg-orange-500' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${answers.q16_air ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className="mt-2 text-xs font-bold text-slate-600 uppercase text-center">Airplane Mode</span>
                      </div>
                      {/* Location Toggle */}
                      <div className="flex flex-col items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                        <MapPin className={`w-8 h-8 mb-3 ${answers.q16_loc ? 'text-green-600' : 'text-slate-400'}`}/>
                        <button type="button" onClick={() => setAnswers(p => ({...p, q16_loc: !p.q16_loc}))}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${answers.q16_loc ? 'bg-green-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${answers.q16_loc ? 'translate-x-8' : 'translate-x-1'}`} />
                        </button>
                        <span className="mt-2 text-xs font-bold text-slate-600 uppercase">Location</span>
                      </div>
                    </div>
                  </div>

                  {/* Q17 & Q18: Interaksi OS Lanjutan (Minimize & Double Click) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    
                    {/* Q17: Minimize */}
                    <div className="bg-slate-800 text-white p-3 sm:p-5 rounded-xl shadow-md border border-slate-700 relative overflow-hidden flex flex-col min-h-[280px] sm:min-h-[300px]">
                      <p className="font-medium mb-4"><span className="text-blue-400 font-black mr-2">17.</span>Simulasikan <b>Minimize</b> aplikasi. (Klik tombol yang benar pada jendela). <PointBadge points={3}/></p>
                      
                      {/* App Window */}
                      {answers.q17 === 'open' ? (
                        <div className="bg-slate-100 text-slate-800 rounded-lg flex flex-col mt-auto shadow-2xl animate-in zoom-in-95">
                          <div className="bg-slate-300 text-slate-800 rounded-t-lg flex justify-between items-center p-2 border-b border-slate-400">
                            <span className="text-sm font-bold pl-2 flex items-center"><FileText className="w-4 h-4 mr-1 text-blue-600"/> Laporan.docx</span>
                            <div className="flex space-x-1">
                              {/* Minimize Button */}
                              <button type="button" onClick={() => setAnswers({...answers, q17: 'minimized'})} className="w-8 h-8 flex items-center justify-center bg-slate-300 hover:bg-slate-400 rounded transition-colors" title="Minimize">
                                <Minus className="w-4 h-4" />
                              </button>
                              {/* Maximize Mock */}
                              <button type="button" className="w-8 h-8 flex items-center justify-center bg-slate-300 hover:bg-slate-400 rounded cursor-not-allowed">
                                <Square className="w-3 h-3" />
                              </button>
                              {/* Close Mock */}
                              <button type="button" className="w-8 h-8 flex items-center justify-center bg-slate-300 hover:bg-red-500 hover:text-white rounded cursor-not-allowed">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-white h-24 rounded-b-lg p-4 text-xs text-slate-400 flex items-center justify-center">
                            Isi dokumen sedang dikerjakan...
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm text-center px-4">
                          Jendela disembunyikan ke Taskbar.<br/>(Klik ikon di taskbar bawah untuk membuka kembali)
                        </div>
                      )}

                      {/* Mock Taskbar */}
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-900 border-t border-slate-700 flex items-center px-4 space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-600 mr-4"></div> {/* Start button mock */}
                        {/* Taskbar Item */}
                        <button type="button" onClick={() => setAnswers({...answers, q17: 'open'})} 
                          className={`p-2 rounded-lg flex items-center transition-all ${answers.q17 === 'minimized' ? 'bg-blue-600/30 border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'hover:bg-slate-800 border border-transparent'}`}>
                          <FileText className="w-5 h-5 text-blue-400" />
                          {answers.q17 === 'minimized' && <div className="w-1 h-1 bg-white rounded-full absolute bottom-1 left-1/2 transform -translate-x-1/2"></div>}
                        </button>
                      </div>
                    </div>

                    {/* Q18: Double Click */}
                    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[250px] sm:min-h-[280px]">
                      <p className="font-medium mb-4"><span className="text-blue-600 font-black mr-2">18.</span>Lakukan <b>Double Click</b> (Klik Ganda) cepat pada folder ini untuk membukanya! <PointBadge points={3}/></p>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <button type="button" onDoubleClick={() => setAnswers({...answers, q18: 'double_clicked'})} className="flex flex-col items-center p-4 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer group outline-none focus:bg-blue-50">
                          <Folder className={`w-16 h-16 transition-transform ${answers.q18==='double_clicked' ? 'text-blue-600 fill-blue-200 scale-110' : 'text-yellow-400 fill-yellow-100 group-hover:scale-105'}`}/>
                          <span className="mt-2 font-medium text-sm text-slate-700 select-none bg-transparent group-focus:bg-blue-200 px-2 rounded">Tugas Sekolah</span>
                        </button>
                        {answers.q18 === 'double_clicked' && <p className="text-center text-green-600 text-sm font-bold mt-4 animate-in slide-in-from-bottom-2">✓ Folder Terbuka!</p>}
                      </div>
                    </div>

                  </div>

                  {/* Q19: Interactive Drag & Drop */}
                  <div className="bg-slate-50 p-3 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-medium text-lg mb-4"><span className="text-blue-600 font-black mr-2">19.</span>Simulasi Drag & Drop: Pindahkan file "Laporan.docx" ke dalam "Folder Tujuan". <PointBadge points={3}/></p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-around bg-white p-4 sm:p-8 rounded-xl border border-slate-200 gap-6 sm:gap-8">
                      {/* Draggable File */}
                      <div className="flex flex-col items-center w-32 h-32 justify-center border-2 border-dashed border-transparent">
                        {answers.q19 !== 'dropped' ? (
                          <div 
                            draggable 
                            onDragStart={handleDragStart}
                            className="flex flex-col items-center cursor-grab active:cursor-grabbing hover:bg-slate-50 p-4 rounded-xl transition-colors"
                          >
                            <FileText className="w-16 h-16 text-blue-500 fill-blue-50" />
                            <span className="text-sm font-bold text-slate-700 mt-2 select-none">Laporan.docx</span>
                            <span className="text-xs text-slate-400 mt-1">(Geser saya)</span>
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-slate-300 italic flex items-center justify-center h-full">File dipindahkan</div>
                        )}
                      </div>

                      <ArrowRight className="w-8 h-8 text-slate-300 hidden md:block" />

                      {/* Drop Zone */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center w-40 h-40 rounded-2xl border-4 transition-all duration-300 ${answers.q19 === 'dropped' ? 'bg-green-50 border-green-400 scale-105' : 'bg-slate-50 border-slate-300 border-dashed hover:bg-slate-100 hover:border-slate-400'}`}
                      >
                        <Folder className={`w-20 h-20 transition-colors ${answers.q19 === 'dropped' ? 'text-green-500 fill-green-100' : 'text-yellow-500 fill-yellow-100'}`} />
                        <span className={`text-sm font-bold mt-2 ${answers.q20 === 'dropped' ? 'text-green-700' : 'text-slate-700'}`}>
                          Folder Tujuan
                        </span>
                        {answers.q19 === 'dropped' && <CheckCircle className="w-6 h-6 text-green-500 absolute bg-white rounded-full mt-10 ml-16 shadow-sm"/>}
                      </div>
                    </div>
                  </div>

                  {/* Q20: Interactive Alt + Tab */}
                  <div className="bg-slate-800 p-3 sm:p-6 rounded-xl border border-slate-700 shadow-md">
                    <p className="font-medium text-lg text-white mb-2"><span className="text-blue-400 font-black mr-2">20.</span>Simulasi Alt+Tab (Multitasking) <PointBadge points={3}/></p>
                    <p className="text-sm text-slate-400 mb-6">Gunakan tombol simulasi di bawah untuk memindahkan aplikasi <b>Browser Web</b> agar berada di posisi paling depan (Aktif).</p>
                    
                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-600 mb-6">
                      
                      {/* Window 1: Word (Inactive by default, but starts active) */}
                      <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 right-6 sm:right-12 bottom-8 sm:bottom-12 rounded-lg shadow-2xl border flex flex-col transition-all duration-300 ${answers.q20 === 'word_active' ? 'z-20 border-blue-400 opacity-100 scale-100' : 'z-10 border-slate-500 opacity-60 scale-95 cursor-pointer bg-slate-200'}`}>
                        <div className={`px-4 py-2 flex items-center rounded-t-lg font-bold text-sm ${answers.q20 === 'word_active' ? 'bg-blue-600 text-white' : 'bg-slate-400 text-slate-800'}`}>
                          <FileText className="w-4 h-4 mr-2"/> Microsoft Word
                        </div>
                        <div className="bg-white flex-1 rounded-b-lg p-3 sm:p-6">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                          <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
                          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                        </div>
                        {answers.q20 !== 'word_active' && <div className="absolute inset-0 bg-black/10 rounded-lg"></div>}
                      </div>

                      {/* Window 2: Browser (Active when toggled) */}
                      <div className={`absolute top-6 sm:top-10 left-6 sm:left-12 right-2 sm:right-4 bottom-2 sm:bottom-4 rounded-lg shadow-2xl border flex flex-col transition-all duration-300 ${answers.q20 === 'browser_active' ? 'z-20 border-green-400 opacity-100 scale-100' : 'z-10 border-slate-500 opacity-60 scale-95 cursor-pointer bg-slate-200'}`}>
                        <div className={`px-4 py-2 flex items-center rounded-t-lg font-bold text-sm ${answers.q20 === 'browser_active' ? 'bg-slate-700 text-white' : 'bg-slate-400 text-slate-800'}`}>
                          <Globe className="w-4 h-4 mr-2"/> Browser Web - Google
                        </div>
                        <div className="bg-white flex-1 rounded-b-lg p-3 sm:p-6 flex flex-col items-center justify-center">
                          <div className="text-2xl sm:text-4xl font-black text-slate-300 mb-4 sm:mb-6">Google</div>
                          <div className="w-3/4 h-10 border-2 border-slate-200 rounded-full"></div>
                        </div>
                        {answers.q20 !== 'browser_active' && <div className="absolute inset-0 bg-black/10 rounded-lg"></div>}
                      </div>

                    </div>

                    <div className="flex justify-center">
                      <button type="button" onClick={handleAltTab} className="group bg-slate-700 hover:bg-slate-600 text-white font-mono font-bold py-3 px-8 rounded-xl shadow-[0_4px_0_rgb(51,65,85)] active:shadow-[0_0px_0_rgb(51,65,85)] active:translate-y-1 transition-all flex items-center">
                        <Keyboard className="w-5 h-5 mr-3 group-hover:text-blue-400"/>
                        Tekan [ Alt + Tab ]
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* === SLIDE 3: SIMULASI INTERNET & EMAIL (5 Soal) === */}
              {currentSlide === 2 && (
                <div className="space-y-5 sm:space-y-8">
                  <TitleBadge icon={<Globe className="text-blue-600"/>} text="Bagian 3: Simulasi Internet & Email" />
                  
                  {/* Q21: Email (Pilih Dropdown) */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 px-4 py-3 flex text-sm text-white font-bold items-center justify-between">
                      <div className="flex items-center"><Mail className="w-5 h-5 mr-2"/> Tulis Pesan Baru</div>
                      <PointBadge points={4}/>
                    </div>
                    <div className="p-3 sm:p-5 space-y-4">
                      <p className="text-sm font-bold text-slate-500 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        21. Selesaikan penulisan email formal untuk mengirim tugas ke guru dengan memilih opsi yang paling tepat pada form di bawah ini.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row border-b border-slate-200 pb-3 sm:items-center gap-2">
                        <span className="w-24 text-slate-500 font-medium shrink-0">Kepada:</span>
                        <select value={answers.q21_to} onChange={e => setAnswers({...answers, q21_to: e.target.value})} className="flex-1 bg-slate-50 outline-none p-2 rounded border border-slate-300 font-medium">
                          <option value="">- Pilih Alamat Email Tujuan -</option>
                          <option value="guru.tik@sekolah.sch.id">guru.tik@sekolah.sch.id</option>
                          <option value="www.guru-tik.com">www.guru-tik.com</option>
                          <option value="guru tik tugas">guru tik tugas</option>
                        </select>
                      </div>

                      <div className="flex flex-col sm:flex-row border-b border-slate-200 pb-3 sm:items-center gap-2">
                        <span className="w-24 text-slate-500 font-medium shrink-0">Subjek:</span>
                        <select value={answers.q21_sub} onChange={e => setAnswers({...answers, q21_sub: e.target.value})} className="flex-1 bg-slate-50 outline-none p-2 rounded border border-slate-300 font-medium">
                          <option value="">- Pilih Judul Email -</option>
                          <option value="(kosong)">(kosong)</option>
                          <option value="Woy pak ini tugasnya">Woy pak ini tugasnya</option>
                          <option value="Tugas Praktek TIK - Budi">Tugas Praktek TIK - Budi</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <span className="block text-slate-500 font-medium mb-2">Isi Pesan:</span>
                        <select value={answers.q21_msg} onChange={e => setAnswers({...answers, q21_msg: e.target.value})} className="w-full bg-slate-50 outline-none p-3 rounded-xl border border-slate-300 h-24 text-slate-700">
                          <option value="">- Pilih Isi Pesan -</option>
                          <option value="Nih tugasnya pak, maaf telat.">Nih tugasnya pak, maaf telat.</option>
                          <option value="Selamat pagi Pak, berikut saya lampirkan tugas praktek saya. Terima kasih.">Selamat pagi Pak, berikut saya lampirkan tugas praktek saya. Terima kasih.</option>
                          <option value="Tugas Terlampir.">Tugas Terlampir.</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Q22 - Q25: Internet Logika */}
                  {[
                    { id: 'q22', q: 'File yang baru saja Anda unduh (download) dari internet secara otomatis akan tersimpan di folder mana?', opts: ['Documents', 'Downloads', 'Pictures', 'Music'] },
                    { id: 'q23', q: 'Anda tidak sengaja menghapus file penting. Apa opsi yang harus dipilih di dalam Recycle Bin untuk mengembalikannya?', opts: ['Empty Recycle Bin', 'Delete', 'Restore', 'Cut'] },
                    { id: 'q24', q: 'Manakah dari alamat URL berikut yang menggunakan koneksi aman (terenkripsi)?', opts: ['http://www.google.com', 'https://www.google.com', 'www.google.com', 'google.com'] },
                    { id: 'q25', q: 'Pilih password di bawah ini yang dikategorikan paling KUAT dan aman dari peretasan.', opts: ['12345678', 'password123', 'Budi!2024#Aman', 'tanggal_lahir_saya'] },
                  ].map((soal, i) => (
                    <div key={soal.id} className="space-y-3 bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
                      <p className="font-medium text-base sm:text-lg"><span className="text-blue-600 font-black mr-2">{i+22}.</span>{soal.q} <PointBadge points={4}/></p>
                      <select value={answers[soal.id]} onChange={e => setAnswers({...answers, [soal.id]: e.target.value})} className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50 font-medium">
                        <option value="">-- Pilih Jawaban --</option>
                        {soal.opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* === SLIDE 4: TANTANGAN LOGIKA & KECEPATAN === */}
              {currentSlide === 3 && (
                <div className="space-y-5 sm:space-y-8">
                  <TitleBadge icon={<Award className="text-blue-600"/>} text="Bagian 4: Tantangan Khusus" />

                  {/* Q26: Typing (10 pts) */}
                  <div className="bg-slate-800 text-white p-3 sm:p-6 rounded-2xl relative shadow-xl border border-slate-700">
                    <p className="font-medium text-lg text-blue-300 mb-4"><span className="font-black mr-2 text-white">26.</span>Tantangan Mengetik Cepat! <PointBadge points={10}/></p>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-600 gap-3">
                      <div className="flex items-center font-mono text-xl sm:text-2xl font-bold bg-slate-900 px-3 sm:px-4 py-2 rounded-lg">
                        <Timer className={`w-6 h-6 mr-3 ${timeLeft <= 10 && typingStarted ? 'text-red-500 animate-bounce' : 'text-green-400'}`} />
                        <span className={`${timeLeft <= 10 && typingStarted ? 'text-red-500' : 'text-green-400'}`}>00:{timeLeft.toString().padStart(2, '0')}</span>
                      </div>
                      
                      {!typingStarted && !typingFinished && (
                        <button onClick={() => setTypingStarted(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg animate-pulse">
                          MULAI TIMER!
                        </button>
                      )}
                      {typingFinished && <span className="bg-red-500 text-white font-bold py-2 px-6 rounded-xl">WAKTU HABIS</span>}
                    </div>

                    <p className="font-serif text-base sm:text-lg leading-relaxed text-slate-200 mb-4 select-none bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-700 shadow-inner">
                      {typingTargetText}
                    </p>

                    <textarea 
                      disabled={!typingStarted || typingFinished}
                      value={answers.q26} onChange={(e) => setAnswers({...answers, q26: e.target.value})}
                      placeholder={!typingStarted ? "Klik MULAI TIMER untuk membuka gembok area ini..." : typingFinished ? "Waktu selesai." : "Mulai mengetik secepat mungkin..."}
                      className="w-full bg-white text-slate-900 p-3 sm:p-5 text-base sm:text-lg rounded-xl h-28 sm:h-32 focus:ring-4 focus:ring-blue-500 outline-none disabled:bg-slate-300 resize-none font-serif shadow-inner transition-colors"
                      spellCheck="false" autoComplete="off"
                    ></textarea>
                  </div>

                  {/* Q27: Cari Typo */}
                  <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-medium text-lg mb-3"><span className="text-blue-600 font-black mr-2">27.</span>Deteksi Typo: Temukan 1 kata yang salah eja/typo pada kalimat di bawah, lalu ketik kata yang salah tersebut di kolom! <PointBadge points={2.5}/></p>
                    <div className="bg-orange-50 text-orange-900 p-4 rounded-lg font-serif italic text-lg mb-3 text-center border border-orange-200 shadow-inner">
                      "Kompoter adalah alat elektronik yang memanipulasi informasi."
                    </div>
                    <input type="text" value={answers.q27} onChange={e=>setAnswers({...answers, q27: e.target.value})} placeholder="Ketik kata yang salah di sini..." className="w-full p-4 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-500 font-mono text-center text-lg uppercase bg-slate-50"/>
                  </div>

                  {/* Q28: Logika Excel (Fix Mouse Wheel scroll bug with inputMode numeric) */}
                  <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
                    <div className="flex-1">
                      <p className="font-medium text-lg mb-3"><span className="text-blue-600 font-black mr-2">28.</span>Logika Excel <PointBadge points={2.5}/></p>
                      <p className="text-slate-600 mb-2">Jika kotak <b>A1</b> berisi angka <b>10</b>, dan kotak <b>B1</b> berisi angka <b>5</b>. Berapakah hasil dari rumus <b>=A1+B1</b>?</p>
                    </div>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={answers.q28} onChange={e=>setAnswers({...answers, q28: e.target.value.replace(/[^0-9]/g, '')})} placeholder="Hasil..." className="w-full sm:w-32 p-4 border-2 border-slate-300 rounded-xl outline-none focus:border-green-500 font-black text-center text-2xl text-green-700 bg-green-50"/>
                  </div>

                  {/* Q29: Memory Game (Fix Mouse Wheel scroll bug with inputMode numeric) */}
                  <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-medium text-lg mb-3"><span className="text-blue-600 font-black mr-2">29.</span>Tes Memori: Klik tombol di bawah, ingat 4 digit PIN yang muncul selama 2 detik, lalu ketikkan! <PointBadge points={2.5}/></p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <button onClick={showPinTask} disabled={pinUsed} className="w-full sm:w-auto bg-slate-800 text-white px-6 py-4 rounded-xl font-bold disabled:bg-slate-300 flex items-center justify-center transition-transform active:scale-95 shadow-md">
                        <Eye className="w-5 h-5 mr-2"/> {pinUsed ? 'PIN Terkunci' : 'Lihat PIN'}
                      </button>
                      <div className="text-4xl font-black font-mono tracking-[0.5em] text-slate-800 bg-slate-100 px-6 py-3 rounded-xl border-2 border-dashed border-slate-300 min-w-[160px] text-center shadow-inner">
                        {pinVisible ? '8492' : '****'}
                      </div>
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={answers.q29} onChange={e=>setAnswers({...answers, q29: e.target.value.replace(/[^0-9]/g, '')})} placeholder="Ketik PIN..." className="w-full sm:flex-1 p-4 border-2 border-slate-300 rounded-xl outline-none focus:border-blue-500 font-mono text-2xl tracking-[0.2em] text-center bg-slate-50"/>
                    </div>
                  </div>

                  {/* Q30: Phishing Detect */}
                  <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="font-medium text-lg mb-4"><span className="text-blue-600 font-black mr-2">30.</span>Security: Anda menerima pesan undian. Link mana yang merupakan link berbahaya (Phishing / Penipuan)? <PointBadge points={2.5}/></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['https://www.bank-bca.co.id', 'http://hadiah-gratis-login.com', 'https://www.tokopedia.com', 'https://mail.google.com'].map(opt => (
                        <label key={opt} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${answers.q30 === opt ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-md' : 'border-slate-200 hover:border-red-200 hover:bg-slate-50'}`}>
                          <input type="radio" name="q30" value={opt} onChange={(e) => setAnswers({...answers, q30: e.target.value})} className="hidden"/>
                          <Globe className={`w-6 h-6 mr-3 flex-shrink-0 ${answers.q30 === opt ? 'text-red-500' : 'text-slate-400'}`}/>
                          <span className="font-mono text-sm break-all">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- VIEW: WARNING (ANTI-NYONTEK) --- */}
          {appState === 'WARNING' && (
            <div className="text-center py-10 animate-in zoom-in duration-500 max-w-lg mx-auto">
              <ShieldAlert className="w-24 h-24 text-red-500 mx-auto mb-6 animate-pulse drop-shadow-md" />
              <h1 className="text-3xl font-black text-slate-800 mb-4">PERINGATAN KEJUJURAN</h1>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Sistem telah berhasil memproses dan mengunci hasil Anda. <br/><br/><b>DILARANG KERAS</b> membocorkan tugas visual/logika ini kepada teman yang belum ujian.</p>
              <div className="bg-red-50 text-red-800 p-5 rounded-2xl text-sm mb-8 border-2 border-red-200 shadow-inner">
                <b>Peringatan Algoritma:</b> Pola interaksi Anda (terutama pada koneksi dan simulasi taskbar) direkam secara unik. Jika terdapat kesamaan data yang tidak wajar dengan komputer sebelah, nilai dapat dibatalkan otomatis.
              </div>
              <button onClick={() => setAppState('RESULT')} className="w-full bg-slate-800 text-white font-bold py-5 rounded-xl hover:bg-slate-900 transition-colors shadow-xl text-lg">
                Saya Mengerti & Tampilkan Nilai Saya
              </button>
            </div>
          )}

          {/* --- VIEW: RESULT --- */}
          {appState === 'RESULT' && session && (
            <div className="text-center py-8 animate-in zoom-in duration-500 max-w-lg mx-auto">
              <Award className="w-28 h-28 text-yellow-400 mx-auto mb-6 drop-shadow-xl" />
              <h2 className="text-4xl font-black text-slate-800 mb-2">Ujian Selesai!</h2>
              <p className="text-slate-500 text-lg mb-8 font-medium">{session.name} ({session.nis})</p>
              
              <div className="bg-slate-50 border-4 border-slate-100 p-8 rounded-3xl mb-8 shadow-inner relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-3 ${session.score >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Skor Akhir Anda</p>
                <p className={`text-6xl md:text-8xl font-black tracking-tighter ${session.score >= 75 ? 'text-green-600' : 'text-orange-500'}`}>
                  {session.score}<span className="text-xl md:text-3xl text-slate-300 font-medium tracking-normal">/100</span>
                </p>
              </div>

              <div className="space-y-4">
                <button onClick={() => setAppState('REVIEW')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 flex items-center justify-center shadow-lg transition-colors text-lg active:scale-95">
                  <Eye className="w-6 h-6 mr-2"/> Lihat Review Koreksi
                </button>
                <div className="pt-6 border-t-2 border-slate-100 border-dashed">
                  <button onClick={handleTeacherReset} className="w-full bg-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-300 flex items-center justify-center transition-colors">
                    <RefreshCcw className="w-5 h-5 mr-2" /> Selesai & Keluar [Mode Guru]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: REVIEW (KOREKSI) --- */}
          {appState === 'REVIEW' && session && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-200">
                <h2 className="text-2xl font-black text-slate-800">Review Jawaban</h2>
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-black text-lg border border-yellow-300 shadow-sm">Skor: {session.score}</span>
              </div>

              <div className="space-y-4">
                {session.reviews.map((rev, i) => (
                  <div key={i} className={`p-3 sm:p-5 rounded-2xl border-2 shadow-sm ${rev.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-slate-800 pr-4 text-base sm:text-lg">{rev.q === rev.id ? `Soal ${i+1}` : rev.q}</p>
                      <span className={`px-3 py-1 rounded-lg text-sm font-black whitespace-nowrap shadow-sm ${rev.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {rev.pointsEarned} / {rev.maxPoints} Pts
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                        <span className="font-bold text-slate-400 w-32 shrink-0 mb-1 sm:mb-0">Jawaban Anda:</span>
                        <span className={`font-mono font-bold break-all ${rev.isCorrect ? 'text-green-700' : 'text-red-600 line-through'}`}>
                          {rev.userAnswer || '[Kosong/Tidak Dijawab]'}
                        </span>
                      </div>
                      {!rev.isCorrect && (
                        <div className="flex flex-col sm:flex-row sm:items-start bg-green-50 p-3 rounded-xl border border-green-200 shadow-inner">
                          <span className="font-bold text-green-600 w-32 shrink-0 mb-1 sm:mb-0">Kunci Benar:</span>
                          <span className="font-mono font-bold text-green-800 break-all">{rev.correctAnswer}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-start mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <span className="font-bold text-blue-500 w-32 shrink-0 mb-1 sm:mb-0">Penjelasan:</span>
                        <span className="text-slate-700 italic leading-relaxed">{rev.exp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t-2 border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur pb-4">
                <button onClick={() => setAppState('RESULT')} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 shadow-xl text-lg active:scale-95 transition-transform">
                  Kembali ke Skor Akhir
                </button>
              </div>
            </div>
          )}

        </div>

        {/* NAVIGATION BUTTONS (FIXED BOTTOM) */}
        {appState === 'EXAM' && (
          <div className="p-3 sm:p-4 md:p-6 bg-slate-50 border-t-2 border-slate-200 flex justify-between items-center">
            {currentSlide > 0 ? (
              <button type="button" onClick={handlePrevSlide} className="px-3 sm:px-4 md:px-8 py-3 md:py-4 border-2 border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-100 flex items-center transition-colors shadow-sm active:scale-95">
                <ArrowLeft className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Kembali</span>
              </button>
            ) : <div></div>}

            {currentSlide < TOTAL_SLIDES - 1 ? (
              <button type="button" onClick={handleNextSlide} className="px-5 sm:px-6 md:px-10 py-3 md:py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex items-center transition-transform active:scale-95 text-base sm:text-lg">
                Lanjut <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button type="button" onClick={handleExamSubmit} disabled={typingStarted && !typingFinished} className="px-5 sm:px-6 md:px-10 py-3 md:py-4 bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black rounded-xl hover:bg-green-700 shadow-lg flex items-center transition-transform active:scale-95 text-base sm:text-lg">
                {typingStarted && !typingFinished ? 'Tunggu...' : 'Selesai'} <Send className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
