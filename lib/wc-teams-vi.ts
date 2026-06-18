// English team name → Vietnamese name (and common aliases)
export const VI_NAMES: Record<string, string[]> = {
  // Châu Âu
  Germany: ['Đức', 'Đức'],
  France: ['Pháp'],
  Spain: ['Tây Ban Nha', 'Tay Ban Nha'],
  Portugal: ['Bồ Đào Nha', 'Bo Dao Nha'],
  England: ['Anh'],
  Netherlands: ['Hà Lan', 'Ha Lan'],
  Belgium: ['Bỉ', 'Bi'],
  Italy: ['Ý', 'Y'],
  Sweden: ['Thụy Điển', 'Thuy Dien'],
  Poland: ['Ba Lan'],
  Denmark: ['Đan Mạch', 'Dan Mach'],
  Switzerland: ['Thụy Sĩ', 'Thuy Si'],
  Austria: ['Áo'],
  Croatia: ['Croatia'],
  Serbia: ['Serbia'],
  'Türkiye': ['Thổ Nhĩ Kỳ', 'Tho Nhi Ky', 'Thổ'],
  Turkey: ['Thổ Nhĩ Kỳ', 'Tho Nhi Ky', 'Thổ'],
  Ukraine: ['Ukraine'],
  'Czech Republic': ['Séc', 'Sec', 'Cộng hòa Séc'],
  Czechia: ['Séc', 'Sec'],
  Slovakia: ['Slovakia'],
  Romania: ['Romania'],
  Hungary: ['Hungary'],
  Greece: ['Hy Lạp', 'Hy Lap'],
  Scotland: ['Scotland'],
  Norway: ['Na Uy'],
  Finland: ['Phần Lan', 'Phan Lan'],
  Iceland: ['Iceland'],
  Russia: ['Nga'],
  Wales: ['Wales', 'Xứ Wales'],
  Albania: ['Albania'],
  Slovenia: ['Slovenia'],
  Georgia: ['Georgia'],
  Kosovo: ['Kosovo'],
  'North Macedonia': ['Bắc Macedonia'],
  Montenegro: ['Montenegro'],
  Bosnia: ['Bosnia'],
  'Bosnia-Herzegovina': ['Bosnia'],
  Bulgaria: ['Bulgaria'],
  Israel: ['Israel'],

  // Nam Mỹ
  Brazil: ['Brazil'],
  Argentina: ['Argentina'],
  Uruguay: ['Uruguay'],
  Colombia: ['Colombia'],
  Chile: ['Chile'],
  Ecuador: ['Ecuador'],
  Peru: ['Peru'],
  Paraguay: ['Paraguay'],
  Bolivia: ['Bolivia'],
  Venezuela: ['Venezuela'],

  // Bắc Mỹ & Trung Mỹ
  Mexico: ['Mexico'],
  'United States': ['Mỹ', 'My', 'Hoa Kỳ', 'USA'],
  Canada: ['Canada'],
  'Costa Rica': ['Costa Rica'],
  Honduras: ['Honduras'],
  Panama: ['Panama'],
  Jamaica: ['Jamaica'],
  'El Salvador': ['El Salvador'],
  Cuba: ['Cuba'],
  Haiti: ['Haiti'],
  Guatemala: ['Guatemala'],
  Trinidad: ['Trinidad'],
  'Trinidad and Tobago': ['Trinidad'],

  // Châu Á
  Japan: ['Nhật Bản', 'Nhat Ban', 'Nhật'],
  'South Korea': ['Hàn Quốc', 'Han Quoc', 'Hàn'],
  Korea: ['Hàn Quốc', 'Han Quoc'],
  Australia: ['Úc'],
  'Saudi Arabia': ['Ả Rập Xê Út', 'A Rap Xe Ut', 'Ả Rập'],
  Iran: ['Iran'],
  Indonesia: ['Indonesia'],
  China: ['Trung Quốc', 'Trung Quoc'],
  'United Arab Emirates': ['UAE', 'Các Tiểu Vương Quốc Ả Rập'],
  Iraq: ['Iraq'],
  Qatar: ['Qatar'],
  Oman: ['Oman'],
  Jordan: ['Jordan'],
  Syria: ['Syria'],
  Uzbekistan: ['Uzbekistan'],
  'New Zealand': ['New Zealand'],
  India: ['Ấn Độ', 'An Do'],
  Thailand: ['Thái Lan', 'Thai Lan'],
  Vietnam: ['Việt Nam'],

  // Châu Phi
  Morocco: ['Maroc', 'Ma Rốc'],
  Nigeria: ['Nigeria'],
  Senegal: ['Senegal'],
  Cameroon: ['Cameroon'],
  Ghana: ['Ghana'],
  Egypt: ['Ai Cập', 'Ai Cap'],
  Algeria: ['Algeria'],
  Tunisia: ['Tunisia'],
  "Côte d'Ivoire": ['Bờ Biển Ngà', 'Bo Bien Nga', 'Ivory Coast'],
  'Ivory Coast': ['Bờ Biển Ngà', 'Bo Bien Nga'],
  'South Africa': ['Nam Phi'],
  Congo: ['Congo'],
  Zambia: ['Zambia'],
  Zimbabwe: ['Zimbabwe'],
  Tanzania: ['Tanzania'],
  Angola: ['Angola'],
  Mali: ['Mali'],
  Burkina: ['Burkina Faso'],
  'Burkina Faso': ['Burkina Faso'],
  Mozambique: ['Mozambique'],
  Gabon: ['Gabon'],
  Libya: ['Libya'],
  Sudan: ['Sudan'],
  Kenya: ['Kenya'],
  Uganda: ['Uganda'],
  Ethiopia: ['Ethiopia'],
}

// Normalize string for fuzzy matching (lowercase + remove diacritics)
export function normalizeTeam(s: string): string {
  return normalize(s)
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

// Check if a team name matches the query (English or Vietnamese)
export function teamMatchesQuery(teamName: string, query: string): boolean {
  if (!query.trim()) return true
  const q = normalize(query)

  // Match English name
  if (normalize(teamName).includes(q)) return true

  // Match Vietnamese names
  const viNames = VI_NAMES[teamName] ?? []
  return viNames.some((v) => normalize(v).includes(q))
}
