// Reciters for ayah-by-ayah recitation. Audio files are served by EveryAyah.com
// (https://everyayah.com/data/<folder>/<sss><aaa>.mp3) — one file per ayah, so playback can start at any ayah.
export const RECITERS = [
  { id: "sudais", name: "Abdur-Rahman As-Sudais", ar: "عبد الرحمن السديس", place: "Masjid al-Haram, Makkah", folder: "Abdurrahmaan_As-Sudais_64kbps" },
  { id: "shuraim", name: "Saud Ash-Shuraim", ar: "سعود الشريم", place: "Masjid al-Haram, Makkah", folder: "Saood_ash-Shuraym_64kbps" },
  { id: "maher", name: "Maher Al-Muaiqly", ar: "ماهر المعيقلي", place: "Masjid al-Haram, Makkah", folder: "Maher_AlMuaiqly_64kbps" },
  { id: "yasser", name: "Yasser Ad-Dosari", ar: "ياسر الدوسري", place: "Masjid al-Haram, Makkah", folder: "Yasser_Ad-Dussary_128kbps" },
  { id: "budair", name: "Salah Al-Budair", ar: "صلاح البدير", place: "Masjid an-Nabawi, Madinah", folder: "Salah_Al_Budair_128kbps" },
  { id: "hudhaify", name: "Ali Al-Hudhaify", ar: "علي الحذيفي", place: "Masjid an-Nabawi, Madinah", folder: "Hudhaify_64kbps" },
  { id: "alafasy", name: "Mishary Rashid Alafasy", ar: "مشاري راشد العفاسي", place: "Kuwait", folder: "Alafasy_64kbps" },
  { id: "ghamadi", name: "Saad Al-Ghamdi", ar: "سعد الغامدي", place: "Saudi Arabia", folder: "Ghamadi_40kbps" },
  { id: "shatri", name: "Abu Bakr Ash-Shatri", ar: "أبو بكر الشاطري", place: "Saudi Arabia", folder: "Abu_Bakr_Ash-Shaatree_64kbps" },
  { id: "ajamy", name: "Ahmed Al-Ajamy", ar: "أحمد العجمي", place: "Saudi Arabia", folder: "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com" },
  { id: "qatami", name: "Nasser Al-Qatami", ar: "ناصر القطامي", place: "Saudi Arabia", folder: "Nasser_Alqatami_128kbps" },
  { id: "abdulbasit", name: "Abdul Basit Abdus Samad", ar: "عبد الباسط عبد الصمد", place: "Egypt · Murattal", folder: "Abdul_Basit_Murattal_64kbps" },
  { id: "husary", name: "Mahmoud Khalil Al-Husary", ar: "محمود خليل الحصري", place: "Egypt", folder: "Husary_64kbps" },
  { id: "minshawy", name: "Mohamed Siddiq Al-Minshawi", ar: "محمد صديق المنشاوي", place: "Egypt · Murattal", folder: "Minshawy_Murattal_128kbps" },
];
export const DEFAULT_RECITER = "sudais";
export const reciter = (id) => RECITERS.find((r) => r.id === id) || RECITERS[0];
const p3 = (n) => String(n).padStart(3, "0");
export const ayahAudioUrl = (id, s, a) => `https://everyayah.com/data/${reciter(id).folder}/${p3(s)}${p3(a)}.mp3`;
