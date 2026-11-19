// Picture slots the website shows. Keep ids in step with the website:
// reciters → nurquran/lib/quran/reciters.js, home icons → nurquran/components/FeatureGrid.jsx, themes → SettingsScreen.jsx
export const IMAGE_GROUPS = [
  {
    kind: "reciter", title: "Reciter photos", hint: "Shown in the Reciter list on the home page and in the Quran settings. Square photo, about 300×300 px.",
    round: true,
    items: [
      ["sudais", "Abdur-Rahman As-Sudais"], ["shuraim", "Saud Ash-Shuraim"], ["maher", "Maher Al-Muaiqly"], ["yasser", "Yasser Ad-Dosari"],
      ["budair", "Salah Al-Budair"], ["hudhaify", "Ali Al-Hudhaify"], ["alafasy", "Mishary Rashid Alafasy"], ["ghamadi", "Saad Al-Ghamdi"],
      ["shatri", "Abu Bakr Ash-Shatri"], ["ajamy", "Ahmed Al-Ajamy"], ["qatami", "Nasser Al-Qatami"], ["abdulbasit", "Abdul Basit Abdus Samad"],
      ["husary", "Mahmoud Khalil Al-Husary"], ["minshawy", "Mohamed Siddiq Al-Minshawi"],
    ],
  },
  {
    kind: "feature", title: "Home page icons", hint: "The round icons at the top of the home page. Square PNG with a transparent background, about 200×200 px.",
    round: true,
    items: [
      ["read-quran", "Read Quran"], ["tasbeeh", "Tasbeeh"], ["learn-tajweed", "Learn Tajweed"], ["qibla", "Qibla"], ["e-card", "E-Card"],
      ["prayer-times", "Prayers Times"], ["inflight", "Inflight Prayer Times"], ["hifz", "Hifz"], ["hijri", "Hijri"], ["allah-names", "Allah Name"],
    ],
  },
  {
    kind: "theme", title: "Theme pictures", hint: "The round pictures in the Themes card (Green, Brown, Grey, Night Mode). Square picture, about 300×300 px.",
    round: true,
    items: [["green", "Green"], ["brown", "Brown"], ["grey", "Grey"], ["night", "Night Mode"]],
  },
];
