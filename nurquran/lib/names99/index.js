// The 99 Names of Allah (al-Asma al-Husna), in the order of the hadith in Sunan at-Tirmidhi (3507).
// Audio: public/sounds/names/<nn>.mp3 says "Ya <name>". Replace any file with a recording of the same name to change it.
import p1 from "./part1";
import p2 from "./part2";
import p3 from "./part3";
import p4 from "./part4";

export const NAMES = [...p1, ...p2, ...p3, ...p4];
export const nameAudio = (n) => `/sounds/names/${String(n).padStart(2, "0")}.mp3`;

export const NAME_LANGS = [
  { id: "bn", name: "বাংলা" },
  { id: "en", name: "English" },
  { id: "hi", name: "हिन्दी" },
  { id: "ur", name: "اردو", rtl: true },
];
// explanation / virtue are written in these; Urdu shows the English text (the Quran meaning and tafsir books are in Urdu)
export const TEXT_LANGS = ["bn", "en", "hi"];
export const textLang = (l) => (TEXT_LANGS.includes(l) ? l : "en");

const toBn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
export const num = (n, lang) => (lang === "bn" ? toBn(n) : lang === "ur" ? String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]) : String(n));

export const UI = {
  bn: {
    title: "আল্লাহর ৯৯ নাম", sub: "আল-আসমাউল হুসনা", search: "নাম বা অর্থ খুঁজুন", playAll: "সব শুনুন", stop: "থামান",
    tafsir: "তাফসির", listen: "শুনুন", meaning: "অর্থ", explain: "ব্যাখ্যা", virtue: "ফজিলত ও আমল", inQuran: "কুরআনে এই নাম",
    readQuran: "কুরআনে পড়ুন", ayahMeaning: "আয়াতের অর্থ", bookTafsir: "আয়াতের তাফসির", source: "সূত্র", none: "কিছু পাওয়া যায়নি",
    loading: "লোড হচ্ছে…", offline: "তাফসির লোড করা যায়নি। ইন্টারনেট সংযোগ দেখুন।", more: "আরও পড়ুন", less: "কম দেখান",
    noAudio: "অডিও চালানো যায়নি", close: "বন্ধ", lang: "ভাষা",
    introTitle: "আল্লাহর সুন্দর নামসমূহ",
    intro: [
      "“আল্লাহর রয়েছে সুন্দর সুন্দর নাম; সুতরাং সেসব নামে তাঁকে ডাকো।” — সূরা আল-আ'রাফ ৭:১৮০",
      "নবী ﷺ বলেছেন: “আল্লাহর নিরানব্বইটি নাম আছে — এক কম একশ। যে এগুলো আয়ত্ত করবে (মুখস্থ করবে, অর্থ বুঝবে ও সে অনুযায়ী আমল করবে), সে জান্নাতে প্রবেশ করবে।” — সহিহ বুখারি ২৭৩৬, সহিহ মুসলিম ২৬৭৭",
      "নামের ওপর চাপ দিলে উচ্চারণ শুনবেন; “তাফসির”-এ ব্যাখ্যা, ফজিলত, কুরআনের আয়াত ও তাফসির গ্রন্থের ব্যাখ্যা আছে।",
    ],
    note: "কিছু বইয়ে নির্দিষ্ট সংখ্যায় পড়ার বিশেষ ফজিলত লেখা থাকে, যার অধিকাংশ সহিহ হাদিসে পাওয়া যায় না। এখানে কুরআন ও সহিহ হাদিসভিত্তিক আমল দেওয়া হয়েছে। নামের তালিকা: সুনান তিরমিযি ৩৫০৭।",
    sources: "কুরআন, সহিহ বুখারি, সহিহ মুসলিম, সুনান তিরমিযি ও আবু দাউদ; তাফসির ইবনে কাসির; ইমাম গাযালির “আল-মাকসাদুল আসনা”।",
  },
  en: {
    title: "99 Names of Allah", sub: "Al-Asma ul-Husna", search: "Search a name or meaning", playAll: "Listen to all", stop: "Stop",
    tafsir: "Tafsir", listen: "Listen", meaning: "Meaning", explain: "Explanation", virtue: "Virtue & practice", inQuran: "This name in the Quran",
    readQuran: "Read in the Quran", ayahMeaning: "Meaning of the ayah", bookTafsir: "Tafsir of the ayah", source: "Source", none: "Nothing found",
    loading: "Loading…", offline: "Could not load the tafsir. Check your internet connection.", more: "Read more", less: "Show less",
    noAudio: "Could not play the audio", close: "Close", lang: "Language",
    introTitle: "The Most Beautiful Names",
    intro: [
      "“To Allah belong the most beautiful names, so call upon Him by them.” — Surah Al-A'raf 7:180",
      "The Prophet ﷺ said: “Allah has ninety-nine names, one hundred less one. Whoever learns them (memorises, understands and lives by them) will enter Paradise.” — Sahih al-Bukhari 2736, Sahih Muslim 2677",
      "Tap a name to hear it. “Tafsir” opens its explanation, virtue, the Quran ayah and what the tafsir books say about it.",
    ],
    note: "Some books promise special rewards for reciting a name a set number of times; most of these are not found in authentic hadith. The practices here are from the Quran and authentic hadith. Order of the names: Sunan at-Tirmidhi 3507.",
    sources: "The Quran; Sahih al-Bukhari, Sahih Muslim, Sunan at-Tirmidhi and Abu Dawud; Tafsir Ibn Kathir; Imam al-Ghazali's “al-Maqsad al-Asna”.",
  },
  hi: {
    title: "अल्लाह के 99 नाम", sub: "अल-अस्मा उल-हुस्ना", search: "नाम या अर्थ खोजें", playAll: "सब सुनें", stop: "रोकें",
    tafsir: "तफ़सीर", listen: "सुनें", meaning: "अर्थ", explain: "व्याख्या", virtue: "फ़ज़ीलत और अमल", inQuran: "क़ुरआन में यह नाम",
    readQuran: "क़ुरआन में पढ़ें", ayahMeaning: "आयत का अर्थ", bookTafsir: "आयत की तफ़सीर", source: "स्रोत", none: "कुछ नहीं मिला",
    loading: "लोड हो रहा है…", offline: "तफ़सीर लोड नहीं हो सकी। इंटरनेट कनेक्शन देखें।", more: "और पढ़ें", less: "कम दिखाएँ",
    noAudio: "ऑडियो नहीं चल सका", close: "बंद करें", lang: "भाषा",
    introTitle: "अल्लाह के सबसे अच्छे नाम",
    intro: [
      "“अल्लाह के अच्छे-अच्छे नाम हैं, तो उन्हीं नामों से उसे पुकारो।” — सूरह अल-आराफ़ 7:180",
      "नबी ﷺ ने फ़रमाया: “अल्लाह के निन्यानवे नाम हैं — सौ में एक कम। जो इन्हें याद करेगा (समझकर और उन पर अमल करते हुए) वह जन्नत में जाएगा।” — सहीह बुख़ारी 2736, सहीह मुस्लिम 2677",
      "नाम पर टैप करें, उसका उच्चारण सुनें। “तफ़सीर” में व्याख्या, फ़ज़ीलत, क़ुरआन की आयत और तफ़सीर की किताबों की व्याख्या है।",
    ],
    note: "कुछ किताबों में किसी नाम को तय गिनती में पढ़ने की ख़ास फ़ज़ीलत लिखी होती है, जिनमें से ज़्यादातर सहीह हदीस में नहीं मिलती। यहाँ क़ुरआन और सहीह हदीस पर आधारित अमल दिए गए हैं। नामों की तरतीब: सुनन तिर्मिज़ी 3507।",
    sources: "क़ुरआन; सहीह बुख़ारी, सहीह मुस्लिम, सुनन तिर्मिज़ी और अबू दाऊद; तफ़सीर इब्ने कसीर; इमाम ग़ज़ाली की “अल-मक़सद अल-अस्ना”।",
  },
  ur: {
    title: "اللہ کے ۹۹ نام", sub: "الاسماء الحسنیٰ", search: "نام یا معنی تلاش کریں", playAll: "سب سنیں", stop: "روکیں",
    tafsir: "تفسیر", listen: "سنیں", meaning: "معنی", explain: "Explanation", virtue: "Virtue & practice", inQuran: "قرآن میں یہ نام",
    readQuran: "قرآن میں پڑھیں", ayahMeaning: "آیت کا ترجمہ", bookTafsir: "آیت کی تفسیر", source: "حوالہ", none: "کچھ نہیں ملا",
    loading: "لوڈ ہو رہا ہے…", offline: "تفسیر لوڈ نہیں ہو سکی۔ انٹرنیٹ کنکشن دیکھیں۔", more: "مزید پڑھیں", less: "کم دکھائیں",
    noAudio: "آڈیو نہیں چل سکی", close: "بند کریں", lang: "زبان",
    introTitle: "اللہ کے خوبصورت نام",
    intro: [
      "”اور اللہ کے اچھے اچھے نام ہیں، پس انہی ناموں سے اسے پکارو۔“ — سورۃ الاعراف ۷:۱۸۰",
      "نبی ﷺ نے فرمایا: ”اللہ کے ننانوے نام ہیں — سو میں ایک کم۔ جو انہیں یاد کرے گا (سمجھ کر اور ان پر عمل کرتے ہوئے) وہ جنت میں داخل ہوگا۔“ — صحیح بخاری ۲۷۳۶، صحیح مسلم ۲۶۷۷",
      "نام پر ٹیپ کریں اور تلفظ سنیں۔ ”تفسیر“ میں قرآن کی آیت، اس کا ترجمہ اور تفسیر کی کتابوں کی وضاحت ہے۔",
    ],
    note: "بعض کتابوں میں کسی نام کو مقررہ تعداد میں پڑھنے کی خاص فضیلت لکھی ہوتی ہے، جن میں سے اکثر صحیح احادیث میں نہیں ملتیں۔ ناموں کی ترتیب: سنن ترمذی ۳۵۰۷۔",
    sources: "قرآن؛ صحیح بخاری، صحیح مسلم، سنن ترمذی اور ابو داؤد؛ تفسیر ابن کثیر؛ امام غزالی کی ”المقصد الاسنیٰ“۔",
  },
};
