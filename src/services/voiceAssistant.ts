import { SupportedLanguage, TrafficLevel } from '../types';

export interface TrafficAlertParams {
  severity: TrafficLevel;
  affectedRoad: string;
  expectedDelayMins: number;
  alternativeRouteName?: string;
  timeSavedMins?: number;
}

/**
 * Localize stop and landmark names so Telugu TTS pronounces them naturally in native Telugu
 */
export function localizeStopName(stopName: string, language: SupportedLanguage = 'en'): string {
  if (!stopName) return '';
  if (language !== 'te') return stopName;

  const mapping: Record<string, string> = {
    'Kukatpally Y Junction': 'కూకట్‌పల్లి వై జంక్షన్',
    'KPHB Colony Phase 3': 'కేపీహెచ్‌బీ కాలనీ ఫేజ్ 3',
    'Main Road (Student Stop)': 'మెయిన్ రోడ్ స్టూడెంట్ స్టాప్',
    'Main Road': 'మెయిన్ రోడ్',
    'Main Road Junction': 'మెయిన్ రోడ్ జంక్షన్',
    'Main Road Junction (150m ahead)': 'మెయిన్ రోడ్ జంక్షన్',
    'Hitech Metro Junction': 'హైటెక్ మెట్రో జంక్షన్',
    'Cyber Gateway Stop': 'సైబర్ గేట్‌వే స్టాప్',
    'Cyber Gateway': 'సైబర్ గేట్‌వే',
    'Apex College Campus Terminal': 'ఎపెక్స్ కాలేజ్ క్యాంపస్ టెర్మినల్',
    'Apex College Campus (Terminal)': 'ఎపెక్స్ కాలేజ్ క్యాంపస్',
    'Apex College Campus Terminal (Arrived)': 'ఎపెక్స్ కాలేజ్ క్యాంపస్',
    'Apex College Campus': 'ఎపెక్స్ కాలేజ్ క్యాంపస్',
    'Apex Institute of Technology (Main Campus)': 'ఎపెక్స్ కాలేజ్ మెయిన్ క్యాంపస్',
    'Miyapur Metro Station': 'మియాపూర్ మెట్రో స్టేషన్',
    'Hafeezpet Flyover': 'హఫీజ్‌పేట్ ఫ్లైఓవర్',
    'Kondapur Signal': 'కొండాపూర్ సిగ్నల్',
    'Botanical Garden X Road': 'బొటానికల్ గార్డెన్ చౌరస్తా',
    'Gachibowli Stadium': 'గచ్చిబౌలి స్టేడియం',
    'Financial District Circle': 'ఫైనాన్షియల్ డిస్ట్రిక్ట్ సర్కిల్',
    'Wipro Circle': 'విప్రో సర్కిల్',
    'Wipro Circle Cross': 'విప్రో సర్కిల్ చౌరస్తా',
    'Mehdipatnam Depot': 'మెహదీపట్నం డిపో',
    'Tolichowki Flyover': 'టోలిచౌకి ఫ్లైఓవర్',
    'Shaikpet Dargah': 'షేక్‌పేట్ దర్గా',
    'Raidurgam Hill Cross': 'రాయదుర్గం హిల్ క్రాస్',
    'Stop 4 (Hitech Metro)': 'స్టాప్ 4 (హైటెక్ మెట్రో)',
  };

  if (mapping[stopName]) return mapping[stopName];

  // Partial match replacements
  for (const [enKey, teVal] of Object.entries(mapping)) {
    if (stopName.includes(enKey)) {
      return stopName.replace(enKey, teVal);
    }
  }

  return stopName;
}

/**
 * Localize road, corridor, and alternative route names into Telugu
 */
export function localizeRoadOrJunction(name: string, language: SupportedLanguage = 'en'): string {
  if (!name) return '';
  if (language !== 'te') return name;

  const mapping: Record<string, string> = {
    'KPHB Main Junction': 'కేపీహెచ్‌బీ మెయిన్ జంక్షన్',
    'KPHB Colony Arterial Road': 'కేపీహెచ్‌బీ కాలనీ మెయిన్ రోడ్',
    'North Corridor Arterial Road': 'నార్త్ కారిడార్ మెయిన్ రోడ్',
    'Hitech Metro Junction': 'హైటెక్ మెట్రో జంక్షన్',
    'Hitech City Corridor': 'హైటెక్ సిటీ కారిడార్',
    'Cyber Gateway Junction': 'సైబర్ గేట్‌వే జంక్షన్',
    'Madhapur Express Arterial': 'మాదాపూర్ ఎక్స్‌ప్రెస్ రోడ్',
    'Hafeezpet Flyover Junction': 'హఫీజ్‌పేట్ ఫ్లైఓవర్ జంక్షన్',
    'Hafeezpet Corridor': 'హఫీజ్‌పేట్ కారిడార్',
    'Kondapur Signal Junction': 'కొండాపూర్ సిగ్నల్ జంక్షన్',
    'Kondapur Main Road': 'కొండాపూర్ మెయిన్ రోడ్',
    'Gachibowli Ring Road': 'గచ్చిబౌలి రింగ్ రోడ్',
    'Financial District Circle': 'ఫైనాన్షియల్ డిస్ట్రిక్ట్ సర్కిల్',
    'Alternative Route A (Bypass Flyover)': 'ప్రత్యామ్నాయ మార్గం ఏ (ఫ్లైఓవర్ బైపాస్)',
    'Alternative Route B (Metro Service Corridor)': 'ప్రత్యామ్నాయ మార్గం బి (మెట్రో సర్వీస్ కారిడార్)',
    'Route A — North Corridor': 'రూట్ ఏ — నార్త్ కారిడార్',
    'Route B — Metro Link': 'రూట్ బి — మెట్రో లింక్',
    'Route C — South Campus': 'రూట్ సి — సౌత్ క్యాంపస్',
    'Route D — Express Transit': 'రూట్ డి — ఎక్స్‌ప్రెస్ ట్రాన్సిట్',
    'Route A': 'రూట్ ఏ',
    'Route B': 'రూట్ బి',
    'Route C': 'రూట్ సి',
    'Route D': 'రూట్ డి',
  };

  if (mapping[name]) return mapping[name];

  for (const [enKey, teVal] of Object.entries(mapping)) {
    if (name.includes(enKey)) {
      return name.replace(enKey, teVal);
    }
  }

  return name;
}

export function buildTrafficVoiceAlert(
  params: TrafficAlertParams,
  language: SupportedLanguage = 'en'
): string {
  const isSevere = params.severity === 'severe';
  const locRoad = localizeRoadOrJunction(params.affectedRoad, language);
  const locAlt = params.alternativeRouteName
    ? localizeRoadOrJunction(params.alternativeRouteName, language)
    : undefined;

  switch (language) {
    case 'te': {
      const sev = isSevere ? 'తీవ్ర ట్రాఫిక్ జామ్' : 'భారీ ట్రాఫిక్ రద్దీ';
      const alt = locAlt
        ? ` ప్రత్యామ్నాయ మార్గం: ${locAlt}${params.timeSavedMins ? `, ${params.timeSavedMins} నిమిషాలు ఆదా అవుతుంది` : ''}.`
        : '';
      return `ట్రాఫిక్ హెచ్చరిక: ${locRoad} వద్ద ${sev} ఉంది. సుమారు ${params.expectedDelayMins} నిమిషాల ఆలస్యం కావచ్చు.${alt}`;
    }
    case 'hi': {
      const sev = isSevere ? 'गंभीर ट्रैफिक जाम' : 'भारी ट्रैफिक';
      const alt = locAlt
        ? ` अनुशंसित वैकल्पिक मार्ग: ${locAlt}${params.timeSavedMins ? `, ${params.timeSavedMins} मिनट की बचत होगी` : ''}.`
        : '';
      return `ट्रैफिक चेतावनी: ${locRoad} पर ${sev} है। लगभग ${params.expectedDelayMins} मिनट की देरी की संभावना है।${alt}`;
    }
    case 'ta': {
      const sev = isSevere ? 'தீவிர போக்குவரத்து நெரிசல்' : 'கடுமையான போக்குவரத்து நெரிசல்';
      const alt = locAlt
        ? ` பரிந்துரைக்கப்பட்ட மாற்றுப் பாதை: ${locAlt}${params.timeSavedMins ? `, ${params.timeSavedMins} நிமிடங்கள் மிச்சமாகும்` : ''}.`
        : '';
      return `போக்குவரத்து எச்சரிக்கை: ${locRoad} இல் ${sev}. சுமார் ${params.expectedDelayMins} நிமிடங்கள் தாமதம் ஆகலாம்.${alt}`;
    }
    case 'kn': {
      const sev = isSevere ? 'ತೀವ್ರ ಸಂಚಾರ ದಟ್ಟಣೆ' : 'ಭಾರಿ ಸಂಚಾರ ದಟ್ಟಣೆ';
      const alt = locAlt
        ? ` ಪರ್ಯಾಯ ಮಾರ್ಗ: ${locAlt}${params.timeSavedMins ? `, ${params.timeSavedMins} ನಿಮಿಷ ಉಳಿತಾಯ` : ''}.`
        : '';
      return `ಸಂಚಾರ ಎಚ್ಚರಿಕೆ: ${locRoad} ಬಳಿ ${sev} ಇದೆ. ಸುಮಾರು ${params.expectedDelayMins} ನಿಮಿಷ ವಿಳಂಬವಾಗಬಹುದು.${alt}`;
    }
    case 'ml': {
      const sev = isSevere ? 'അതീവ രൂക്ഷമായ ഗതാഗതക്കുരുക്ക്' : 'കനത്ത ഗതാഗതക്കുരുക്ക്';
      const alt = locAlt
        ? ` ഇതര വഴി: ${locAlt}${params.timeSavedMins ? `, ${params.timeSavedMins} മിനിറ്റ് ലാഭിക്കാം` : ''}.`
        : '';
      return `ട്രാഫിക് മുന്നറിയിപ്പ്: ${locRoad} ൽ ${sev} ഉണ്ട്. ഏകദേശം ${params.expectedDelayMins} മിനിറ്റ് വൈകാൻ സാധ്യതയുണ്ട്.${alt}`;
    }
    case 'en':
    default: {
      const sev = isSevere ? 'Severe traffic congestion' : 'Heavy traffic';
      const alt = params.alternativeRouteName
        ? ` Recommended alternative route: ${params.alternativeRouteName}${params.timeSavedMins ? `, saving ${params.timeSavedMins} minutes` : ''}.`
        : '';
      return `Traffic Warning: ${sev} detected on ${params.affectedRoad}. Expected delay is ${params.expectedDelayMins} minutes.${alt}`;
    }
  }
}

/**
 * Route & Bypass Selection Announcements
 */
export function buildBypassRouteAlert(
  routeName: string,
  timeSavedMins: number,
  language: SupportedLanguage = 'en'
): string {
  const locRoute = localizeRoadOrJunction(routeName, language);

  switch (language) {
    case 'te':
      return `బైపాస్ రూట్ అప్‌డేట్: ${locRoute} ఎంపిక చేయబడింది మరియు సేవ్ చేయబడింది. ${timeSavedMins} నిమిషాలు సమయం ఆదా అవుతుంది.`;
    case 'hi':
      return `बाईपास रूट अपडेट: ${locRoute} चुना गया और सहेज लिया गया। ${timeSavedMins} मिनट की बचत होगी।`;
    case 'ta':
      return `மாற்றுப் பாதை அப்டேட்: ${locRoute} தேர்ந்தெடுக்கப்பட்டது. ${timeSavedMins} நிமிடங்கள் மிச்சமாகும்.`;
    case 'kn':
      return `ಬೈಪಾಸ್ ಮಾರ್ಗ ಅಪ್‌ಡೇಟ್: ${locRoute} ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ${timeSavedMins} ನಿಮಿಷ ಉಳಿತಾಯವಾಗಲಿದೆ.`;
    case 'ml':
      return `ബൈപാസ് റൂട്ട് അപ്‌ഡേറ്റ്: ${locRoute} തിരഞ്ഞെടുത്തു. ${timeSavedMins} മിനിറ്റ് ലാഭിക്കാം.`;
    case 'en':
    default:
      return `${routeName} selected and saved! Saving ${timeSavedMins} minutes.`;
  }
}

/**
 * Detour & Temporary Stop Alerts
 */
export function buildDetourVoiceAlert(language: SupportedLanguage = 'en'): string {
  switch (language) {
    case 'te':
      return 'రూట్ దారి మళ్లింపు: మెయిన్ రోడ్ స్టాప్ తాత్కాలికంగా మూసివేయబడింది. 150 మీటర్ల ముందున్న మెయిన్ రోడ్ జంక్షన్ వద్ద ఎక్కండి.';
    case 'hi':
      return 'मार्ग परिवर्तन: मेन रोड स्टॉप निर्माण कार्य के लिए बंद है। 150 मीटर आगे मेन रोड जंक्शन से बस पकड़ें।';
    case 'ta':
      return 'பாதை மாற்றம்: மெயின் ரோடு நிறுத்தம் மூடப்பட்டுள்ளது. 150 மீட்டர் முன்னால் உள்ள மெயின் ரோடு சந்திப்பில் ஏறவும்.';
    case 'kn':
      return 'ಮಾರ್ಗ ಬದಲಾವಣೆ: ಮೇನ್ ರೋಡ್ ನಿಲ್ದಾಣ ಮುಚ್ಚಲಾಗಿದೆ. 150 ಮೀಟರ್ ಮುಂದಿರುವ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಹತ್ತಿ.';
    case 'ml':
      return 'റൂട്ട് വഴിതിരിച്ചുവിടൽ: മെയിൻ റോഡ് സ്റ്റോപ്പ് അടച്ചിരിക്കുന്നു. 150 മീറ്റർ മുന്നിലുള്ള മെയിൻ റോഡ് ജംഗ്ഷനിൽ കയറുക.';
    case 'en':
    default:
      return 'Route detour active. Main Road stop is closed. Board at Main Road Junction 150 meters ahead.';
  }
}

/**
 * Road Hazard & Safety Alerts
 */
export function buildRoadHazardVoiceAlert(
  hazardType: string,
  language: SupportedLanguage = 'en'
): string {
  switch (language) {
    case 'te': {
      if (hazardType === 'waterlogging' || hazardType === 'flooded') {
        return 'రోడ్డు భద్రతా హెచ్చరిక: రోడ్డుపై తీవ్రమైన నీటి నిల్వ ఉంది. దయచేసి వేగాన్ని తగ్గించి నెమ్మదిగా డ్రైవ్ చేయండి.';
      }
      if (hazardType === 'construction') {
        return 'రోడ్డు భద్రతా హెచ్చరిక: రోడ్డు నిర్మాణ పనుల కారణంగా అడ్డంకి ఉంది. జాగ్రత్తగా కొనసాగండి.';
      }
      if (hazardType === 'accident-jam' || hazardType === 'accident') {
        return 'రోడ్డు భద్రతా హెచ్చరిక: ప్రమాదం కారణంగా ట్రాఫిక్ జామ్ నమోదైంది. రూట్ కమాండ్‌కు సమాచారం చేరింది.';
      }
      if (hazardType === 'police-diversion' || hazardType === 'temporary-closure') {
        return 'రోడ్డు భద్రతా హెచ్చరిక: పోలీస్ దారి మళ్లింపు అమల్లో ఉంది. సూచనలను పాటించండి.';
      }
      if (hazardType === 'road-blocked' || hazardType === 'traffic-jam') {
        return 'రోడ్డు భద్రతా హెచ్చరిక: మార్గంలో ట్రాఫిక్ నిలిచిపోయింది. ప్రత్యామ్నాయ దారిని గమనించండి.';
      }
      return 'రోడ్డు భద్రతా సమస్య నమోదైంది. రూట్ కమాండ్‌కు సమాచారం చేరింది.';
    }
    case 'hi': {
      if (hazardType === 'waterlogging') return 'सड़क सुरक्षा चेतावनी: आगे जलभराव है। कृपया गाड़ी धीरे चलाएं।';
      if (hazardType === 'construction') return 'सड़क सुरक्षा चेतावनी: सड़क पर निर्माण कार्य चल रहा है। सावधानी बरतें।';
      if (hazardType === 'accident-jam') return 'सड़क सुरक्षा चेतावनी: दुर्घटना के कारण जाम लगा है।';
      if (hazardType === 'police-diversion') return 'सड़क सुरक्षा चेतावनी: पुलिस द्वारा मार्ग परिवर्तन किया गया है।';
      return 'सड़क की समस्या दर्ज कर ली गई है।';
    }
    case 'en':
    default: {
      if (hazardType === 'waterlogging') return 'Road safety alert: Severe waterlogging reported ahead. Drive slowly.';
      if (hazardType === 'construction') return 'Road safety alert: Road construction block ahead. Proceed with caution.';
      if (hazardType === 'accident-jam') return 'Road safety alert: Accident traffic jam reported. Incorporated into AI routing.';
      if (hazardType === 'police-diversion') return 'Road safety alert: Police traffic diversion active.';
      return 'Road safety issue reported to transport dispatch.';
    }
  }
}

/**
 * Weather Safety Alert
 */
export function buildWeatherHazardVoiceAlert(
  _condition: string,
  language: SupportedLanguage = 'en'
): string {
  switch (language) {
    case 'te':
      return 'వాతావరణ భద్రతా హెచ్చరిక: భారీ వర్షం కారణంగా రోడ్లు జారుడుగా ఉన్నాయి. దయచేసి వేగాన్ని తగ్గించి సురక్షితంగా డ్రైవ్ చేయండి.';
    case 'hi':
      return 'मौसम सुरक्षा चेतावनी: भारी बारिश के कारण सड़क पर फिसलन है। कृपया गति धीमी रखें और सुरक्षित ड्राइव करें।';
    case 'en':
    default:
      return 'Weather advisory: Heavy rain and wet roads. Please reduce speed and drive safely.';
  }
}

/**
 * Emergency SOS Alert
 */
export function buildEmergencyVoiceAlert(
  type: string,
  language: SupportedLanguage = 'en'
): string {
  switch (language) {
    case 'te': {
      const typeTe =
        type === 'breakdown'
          ? 'వాహనం బ్రేక్‌డౌన్'
          : type === 'medical'
          ? 'వైద్య అత్యవసర పరిస్థితి'
          : type === 'accident'
          ? 'రోడ్డు ప్రమాదం'
          : type === 'security'
          ? 'భద్రతా సమస్య'
          : 'అత్యవసర పరిస్థితి';
      return `అత్యవసర ఎస్ఓఎస్ హెచ్చరిక: ${typeTe} అడ్మిన్‌కు రిపోర్ట్ చేయబడింది. అత్యవసర సహాయం పంపబడుతోంది.`;
    }
    case 'hi':
      return `आपातकालीन एसओएस अलर्ट: ${type} एडमिन को सूचित कर दिया गया है। त्वरित सहायता भेजी जा रही है।`;
    case 'en':
    default:
      return `Emergency SOS dispatched: ${type} has been broadcast to admin transport control.`;
  }
}

/**
 * Time & Arrival Duration Announcement
 */
export function buildTimeVoiceAlert(
  minsToCollege: number,
  language: SupportedLanguage = 'en'
): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;
  const period = isPM ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;

  switch (language) {
    case 'te': {
      let periodTe = 'ఉదయం';
      if (hours >= 12 && hours < 16) {
        periodTe = 'మధ్యాహ్నం';
      } else if (hours >= 16 && hours < 20) {
        periodTe = 'సాయంత్రం';
      } else if (hours >= 20 || hours < 4) {
        periodTe = 'రాత్రి';
      }
      const minText = minutes > 0 ? ` ${minutes} నిమిషాలు` : '';
      const collegeMsg =
        minsToCollege <= 0
          ? 'మీరు ఇప్పటికే కళాశాల క్యాంపస్‌కు చేరుకున్నారు.'
          : `కళాశాలకు ఇంకా సుమారు ${minsToCollege} నిమిషాలు సమయం పడుతుంది.`;
      return `ప్రస్తుత సమయం ${periodTe} ${hours} గంటల${minText}. ${collegeMsg}`;
    }
    case 'hi': {
      const periodHi = isPM ? 'दोपहर' : 'सुबह';
      return `वर्तमान समय ${periodHi} ${hours} बजकर ${minutes} मिनट है। कॉलेज पहुँचने में लगभग ${minsToCollege} मिनट लगेंगे।`;
    }
    case 'ta': {
      return `தற்போதைய நேரம் ${timeStr}. கல்லூரியை அடைய இன்னும் ${minsToCollege} நிமிடங்கள் ஆகும்.`;
    }
    case 'kn': {
      return `ಪ್ರಸ್ತುತ ಸಮಯ ${timeStr}. ಕಾಲೇಜು ತಲುಪಲು ಸುಮಾರು ${minsToCollege} ನಿಮಿಷ ಬೇಕು.`;
    }
    case 'ml': {
      return `ഇപ്പോഴത്തെ സമയം ${timeStr}. കോളേജിൽ എത്താൻ ${minsToCollege} മിനിറ്റ് ബാക്കിയുണ്ട്.`;
    }
    case 'en':
    default: {
      return `Current time is ${timeStr}. College is approximately ${minsToCollege} minutes away.`;
    }
  }
}

export interface VoicePhrases {
  nextStop: (stopName: string, distanceMeters: number) => string;
  stopApproaching: (stopName: string) => string;
  stopArrived: (stopName: string) => string;
  missedStop: (stopName: string) => string;
  tripStarted: string;
  collegeReached: string;
  trafficWarning: string;
  timeToCollege: (mins: number) => string;
  breakdownReported: string;
  roadIssueReported: string;
  commandNotUnderstood: string;
}

export const LANGUAGE_METADATA: Record<
  SupportedLanguage,
  { label: string; nativeName: string; locale: string; flag: string }
> = {
  en: { label: 'English', nativeName: 'English', locale: 'en-IN', flag: '🇬🇧' },
  te: { label: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN', flag: '🇮🇳' },
  hi: { label: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN', flag: '🇮🇳' },
  ta: { label: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN', flag: '🇮🇳' },
  kn: { label: 'Kannada', nativeName: 'ಕನ್ನಡ', locale: 'kn-IN', flag: '🇮🇳' },
  ml: { label: 'Malayalam', nativeName: 'മലയാളം', locale: 'ml-IN', flag: '🇮🇳' },
};

export const MULTILINGUAL_PHRASES: Record<SupportedLanguage, VoicePhrases> = {
  te: {
    nextStop: (stopName, dist) => `తర్వాత స్టాప్ ${localizeStopName(stopName, 'te')}. ఇంకా ${dist} మీటర్ల దూరం ఉంది.`,
    stopApproaching: (stopName) => `${localizeStopName(stopName, 'te')} సమీపిస్తోంది. దయచేసి ఆగడానికి సిద్ధంగా ఉండండి.`,
    stopArrived: (stopName) => `${localizeStopName(stopName, 'te')} స్టాప్‌కు చేరుకున్నారు. ప్రయాణికులు ఎక్కుతున్నారు.`,
    missedStop: (stopName) => `స్టాప్ ${localizeStopName(stopName, 'te')} దాటిపోయింది. దయచేసి రూట్ పరిశీలించండి.`,
    tripStarted: 'ట్రిప్ ప్రారంభమైంది. సురక్షిత ప్రయాణం.',
    collegeReached: 'మీరు కళాశాలకు చేరుకున్నారు. ట్రిప్ విజయవంతంగా పూర్తయింది.',
    trafficWarning: 'ముందు ట్రాఫిక్ రద్దీ ఉంది. జాగ్రత్తగా డ్రైవ్ చేయండి.',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'te'),
    breakdownReported: 'వాహనం బ్రేక్‌డౌన్ రిపోర్ట్ చేయబడింది. సహాయం మరియు రీప్లేస్‌మెంట్ బస్సు పంపబడుతోంది.',
    roadIssueReported: 'రోడ్డు సమస్య నమోదైంది. రూట్ కమాండ్‌కు సమాచారం పంపబడింది.',
    commandNotUnderstood: 'క్షమించండి, మీ ఆదేశం అర్థం కాలేదు. మళ్ళీ చెప్పండి.',
  },
  hi: {
    nextStop: (stopName, dist) => `अगला स्टॉप ${stopName} है। अभी ${dist} मीटर दूर है।`,
    stopApproaching: (stopName) => `${stopName} आ रहा है। कृपया रुकने के लिए तैयार रहें।`,
    stopArrived: (stopName) => `${stopName} पहुँच चुके हैं।`,
    missedStop: (stopName) => `स्टॉप ${stopName} छूट गया है। कृपया रूट की जांच करें।`,
    tripStarted: 'यात्रा शुरू हो गई है। सुरक्षित यात्रा करें।',
    collegeReached: 'आप कॉलेज पहुँच चुके हैं। यात्रा सफलतापूर्वक पूरी हो गई है।',
    trafficWarning: 'आगे भारी ट्रैफिक है। गति धीमी रखें।',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'hi'),
    breakdownReported: 'समस्या की सूचना एडमिन को भेज दी गई है।',
    roadIssueReported: 'सड़क की समस्या दर्ज कर ली गई है।',
    commandNotUnderstood: 'माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलें।',
  },
  en: {
    nextStop: (stopName, dist) => `Next stop is ${stopName}. Distance is ${dist} meters.`,
    stopApproaching: (stopName) => `${stopName} is approaching. Please prepare to stop.`,
    stopArrived: (stopName) => `Arrived at ${stopName}. Boarding passengers.`,
    missedStop: (stopName) => `Stop ${stopName} was passed without completing. Please verify.`,
    tripStarted: 'Trip has started. Drive safely.',
    collegeReached: 'You have reached the college campus. Trip has been completed.',
    trafficWarning: 'Heavy traffic congestion ahead. Proceed with caution.',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'en'),
    breakdownReported: 'Vehicle issue has been reported to transport dispatch.',
    roadIssueReported: 'Road issue has been submitted to route planning.',
    commandNotUnderstood: 'Command not recognized. Please repeat or use quick voice buttons.',
  },
  ta: {
    nextStop: (stopName, dist) => `அடுத்த நிறுத்தம் ${stopName}. இன்னும் ${dist} மீட்டர் தொலைவில் உள்ளது.`,
    stopApproaching: (stopName) => `${stopName} நெருங்குகிறது. நிறுத்த தயாராக இருங்கள்.`,
    stopArrived: (stopName) => `${stopName} வந்தடைந்தது.`,
    missedStop: (stopName) => `${stopName} நிறுத்தம் தவறவிடப்பட்டது. பாதையை சரிபார்க்கவும்.`,
    tripStarted: 'பயணம் தொடங்கியது. பாதுகாப்பாக ஓட்டவும்.',
    collegeReached: 'நீங்கள் கல்லூரியை அடைந்துவிட்டீர்கள். பயணம் முடிந்தது.',
    trafficWarning: 'முன்னால் போக்குவரத்து நெரிசல் உள்ளது.',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'ta'),
    breakdownReported: 'வாகன பழுது நிர்வாகத்திற்கு தெரிவிக்கப்பட்டது.',
    roadIssueReported: 'சாலை பிரச்சனை பதிவு செய்யப்பட்டது.',
    commandNotUnderstood: 'மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்லுங்கள்.',
  },
  kn: {
    nextStop: (stopName, dist) => `ಮುಂದಿನ ನಿಲ್ದಾಣ ${stopName}. ಇನ್ನು ${dist} ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.`,
    stopApproaching: (stopName) => `${stopName} ಸಮೀಪಿಸುತ್ತಿದೆ. ನಿಲ್ಲಿಸಲು ಸಿದ್ಧರಾಗಿರಿ.`,
    stopArrived: (stopName) => `${stopName} ತಲುಪಿದೆ.`,
    missedStop: (stopName) => `ನಿಲ್ದಾಣ ${stopName} ಬಿಟ್ಟುಹೋಗಿದೆ. ಮಾರ್ಗ ಪರಿಶೀಲಿಸಿ.`,
    tripStarted: 'ಪ್ರಯಾಣ ಪ್ರಾರಂಭವಾಯಿತು. ಸುರಕ್ಷಿತವಾಗಿ ಚಲಿಸಿ.',
    collegeReached: 'ನೀವು ಕಾಲೇಜನ್ನು ತಲುಪಿದ್ದೀರಿ. ಪ್ರಯಾಣ ಪೂರ್ಣಗೊಂಡಿದೆ.',
    trafficWarning: 'ಮುಂದೆ ಸಂಚಾರ ದಟ್ಟಣೆ ಇದೆ.',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'kn'),
    breakdownReported: 'ವಾಹನ ಸಮಸ್ಯೆಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ.',
    roadIssueReported: 'ರಸ್ತೆ ಸಮಸ್ಯೆಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.',
    commandNotUnderstood: 'ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. ಪುನರಾವರ್ತಿಸಿ.',
  },
  ml: {
    nextStop: (stopName, dist) => `അടുത്ത സ്റ്റോപ്പ് ${stopName} ആണ്. ${dist} മീറ്റർ അകലെയാണ്.`,
    stopApproaching: (stopName) => `${stopName} അടുക്കുന്നു. നിർത്താൻ തയ്യാറാകൂ.`,
    stopArrived: (stopName) => `${stopName} എത്തിച്ചേർന്നു.`,
    missedStop: (stopName) => `${stopName} സ്റ്റോപ്പ് കഴിഞ്ഞുപോയി. പരിശോധിക്കുക.`,
    tripStarted: 'യാത്ര ആരംഭിച്ചു. സുരക്ഷിതമായി ഡ്രൈവ് ചെയ്യുക.',
    collegeReached: 'നിങ്ങൾ കോളേജിൽ എത്തിച്ചേർന്നു. യാത്ര പൂർത്തിയായി.',
    trafficWarning: 'മുന്നിൽ ഗതാഗതക്കുരുക്കുണ്ട്.',
    timeToCollege: (mins) => buildTimeVoiceAlert(mins, 'ml'),
    breakdownReported: 'വാഹന തകരാർ റിപ്പോർട്ട് ചെയ്തു.',
    roadIssueReported: 'റോഡ് പ്രശ്നം രേഖപ്പെടുത്തി.',
    commandNotUnderstood: 'ക്ഷമിക്കണം, മനസ്സിലായില്ല. വീണ്ടും പറയുക.',
  },
};

// Retain active utterance references to avoid Chromium garbage collection bug cutting off speech mid-sentence
const activeUtterances = new Set<SpeechSynthesisUtterance>();

let cachedVoices: SpeechSynthesisVoice[] = [];
let activeSpeechSessionId = 0;
let currentCloudAudio: HTMLAudioElement | null = null;

type TeluguVoiceListener = (available: boolean) => void;
const teluguVoiceListeners = new Set<TeluguVoiceListener>();

type TeluguCloudStatusListener = (error: string | null) => void;
const teluguCloudStatusListeners = new Set<TeluguCloudStatusListener>();
let lastTeluguCloudError: string | null = null;

// Auto-Announced Hands-Free Voice Alerts State (Default: ON)
let autoVoiceAlertsEnabled = true;
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('driver_auto_voice_alerts');
    if (saved !== null) {
      autoVoiceAlertsEnabled = saved === 'true';
    }
  } catch (_) {}
}

type AutoVoiceAlertsListener = (enabled: boolean) => void;
const autoVoiceAlertsListeners = new Set<AutoVoiceAlertsListener>();

export function isAutoVoiceAlertsEnabled(): boolean {
  return autoVoiceAlertsEnabled;
}

export function setAutoVoiceAlertsEnabled(enabled: boolean): void {
  autoVoiceAlertsEnabled = enabled;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('driver_auto_voice_alerts', String(enabled));
    }
  } catch (_) {}

  // If turning OFF, immediately stop any playing audio or speech
  if (!enabled) {
    if (currentCloudAudio) {
      try {
        currentCloudAudio.pause();
        currentCloudAudio.currentTime = 0;
      } catch (_) {}
      currentCloudAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  autoVoiceAlertsListeners.forEach((fn) => {
    try {
      fn(enabled);
    } catch (e) {
      console.warn('Error in auto voice alerts listener', e);
    }
  });
}

export function subscribeAutoVoiceAlerts(listener: AutoVoiceAlertsListener): () => void {
  autoVoiceAlertsListeners.add(listener);
  listener(autoVoiceAlertsEnabled);
  return () => {
    autoVoiceAlertsListeners.delete(listener);
  };
}

export function subscribeTeluguCloudStatus(listener: TeluguCloudStatusListener): () => void {
  teluguCloudStatusListeners.add(listener);
  listener(lastTeluguCloudError);
  return () => {
    teluguCloudStatusListeners.delete(listener);
  };
}

export function notifyTeluguCloudStatus(error: string | null): void {
  lastTeluguCloudError = error;
  teluguCloudStatusListeners.forEach((fn) => {
    try {
      fn(error);
    } catch (e) {
      console.warn('Error in telugu cloud listener', e);
    }
  });
}

export function subscribeTeluguVoiceStatus(listener: TeluguVoiceListener): () => void {
  teluguVoiceListeners.add(listener);
  listener(true);
  return () => {
    teluguVoiceListeners.delete(listener);
  };
}

export function notifyTeluguVoiceStatus(available: boolean): void {
  teluguVoiceListeners.forEach((fn) => {
    try {
      fn(available);
    } catch (e) {
      console.warn('Error in telugu voice listener', e);
    }
  });
}

/**
 * Server-side / Cloud TTS playback for complete Telugu messages
 * Does not depend on browser SpeechSynthesis.
 */
export async function playCloudTeluguTTS(text: string, sessionId: number): Promise<void> {
  // Stop any active browser synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }

  // Stop active cloud audio if playing
  if (currentCloudAudio) {
    try {
      currentCloudAudio.pause();
      currentCloudAudio.currentTime = 0;
    } catch (_) {}
    currentCloudAudio = null;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: 'te',
      }),
    });

    if (sessionId !== activeSpeechSessionId) return;

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errorMsg =
        errJson?.error ||
        'Cloud Text-to-Speech API/service is not configured for Telugu (te-IN).';
      notifyTeluguCloudStatus(errorMsg);
      console.error('[Cloud TTS Error]', errorMsg);
      return;
    }

    const result = await response.json();
    if (sessionId !== activeSpeechSessionId) return;

    if (!result.audio) {
      const errorMsg =
        result?.error ||
        'Cloud Text-to-Speech service returned no audio for Telugu.';
      notifyTeluguCloudStatus(errorMsg);
      console.error('[Cloud TTS Error]', errorMsg);
      return;
    }

    // Clear any prior configuration error
    notifyTeluguCloudStatus(null);

    const audioUrl = `data:audio/mp3;base64,${result.audio}`;
    const audio = new Audio(audioUrl);
    currentCloudAudio = audio;

    await new Promise<void>((resolve) => {
      audio.onended = () => {
        if (currentCloudAudio === audio) currentCloudAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        console.warn('[Cloud TTS Audio playback issue]', e);
        if (currentCloudAudio === audio) currentCloudAudio = null;
        resolve();
      };
      audio.play().catch((playErr) => {
        console.warn('[Cloud TTS Audio play prevented or interrupted]', playErr);
        resolve();
      });
    });
  } catch (err: any) {
    if (sessionId !== activeSpeechSessionId) return;
    const errorMsg =
      err?.message ||
      'Cloud Text-to-Speech service is not configured or reachable for Telugu.';
    notifyTeluguCloudStatus(errorMsg);
    console.error('[Cloud TTS Exception]', err);
  }
}

/**
 * Robustly load and wait for browser voices to load before selecting a voice.
 */
export async function getLoadedVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }

  // 1. Return cached voices if already populated
  if (cachedVoices && cachedVoices.length > 0) {
    return cachedVoices;
  }

  // 2. Check immediate browser voices
  const immediate = window.speechSynthesis.getVoices();
  if (immediate && immediate.length > 0) {
    cachedVoices = immediate;
    return immediate;
  }

  // 3. Wait for voiceschanged event
  return new Promise((resolve) => {
    let resolved = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onVoicesChanged = () => {
      if (resolved) return;
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        resolved = true;
        if (timer) clearTimeout(timer);
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        cachedVoices = v;
        resolve(v);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        const fallback = window.speechSynthesis.getVoices() || [];
        if (fallback.length > 0) {
          cachedVoices = fallback;
        }
        resolve(cachedVoices);
      }
    }, 700);
  });
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const syncVoices = () => {
    const updated = window.speechSynthesis.getVoices();
    if (updated && updated.length > 0) {
      cachedVoices = updated;
      console.log(
        `[TTS Debug] Voices loaded (${updated.length}):`,
        updated.map((v) => `${v.name} (${v.lang})`)
      );
      const teVoice = findBestVoiceForLanguage('te', updated);
      notifyTeluguVoiceStatus(Boolean(teVoice));
    }
  };

  window.speechSynthesis.onvoiceschanged = syncVoices;
  window.speechSynthesis.addEventListener('voiceschanged', syncVoices);
  syncVoices();
}

/**
 * Check if a real Telugu-compatible browser TTS voice is installed/available.
 */
export async function isTeluguVoiceAvailable(): Promise<boolean> {
  const voices = await getLoadedVoices();
  const voice = findBestVoiceForLanguage('te', voices);
  return Boolean(voice);
}

/**
 * Select the best available voice for the requested language.
 * When Telugu is requested, all available SpeechSynthesis voices are checked,
 * and any Telugu-compatible voice whose language starts with "te" or "te-IN"
 * (or named with Telugu) is accepted and used.
 */
export function findBestVoiceForLanguage(
  language: SupportedLanguage,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  if (language === 'te') {
    // Log all available voice names and languages for debugging
    console.log(
      `[TTS Debug] Checking ${voices.length} available voices for Telugu (te/te-IN):`,
      voices.map((v) => ({ name: v.name, lang: v.lang, default: v.default }))
    );

    // Accept Telugu-compatible voices whose language starts with "te" or "te-IN"
    const teluguVoice = voices.find((v) => {
      const vLang = (v.lang || '').replace(/_/g, '-').toLowerCase().trim();
      const vName = (v.name || '').toLowerCase();
      const vUri = (v.voiceURI || '').toLowerCase();

      // Check if language starts with "te-in" or "te" (e.g. te, te-in, te_in, te-telu, etc.)
      const isLangTe =
        vLang === 'te' ||
        vLang.startsWith('te-in') ||
        vLang.startsWith('te-') ||
        vLang.startsWith('te');

      // Check if voice name or URI explicitly references Telugu
      const isNameTe =
        vName.includes('telugu') ||
        vName.includes('తెలుగు') ||
        vUri.includes('telugu');

      return isLangTe || isNameTe;
    });

    if (teluguVoice) {
      console.log(
        `[TTS Debug] Selected Telugu-compatible voice: "${teluguVoice.name}" (${teluguVoice.lang})`
      );
      return teluguVoice;
    }

    console.warn(
      '[TTS Debug] No Telugu-compatible voice found whose language starts with "te" or "te-IN". Available voice list:',
      voices.map((v) => `${v.name} (${v.lang})`).join(', ')
    );
    return undefined;
  }

  const meta = LANGUAGE_METADATA[language];
  const targetLocale = (meta?.locale || 'en-IN').toLowerCase();
  const targetLangCode = language.toLowerCase();

  return (
    voices.find((v) => {
      const vLang = (v.lang || '').replace(/_/g, '-').toLowerCase();
      return vLang === targetLocale;
    }) ||
    voices.find((v) => {
      const vLang = (v.lang || '').replace(/_/g, '-').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return (
        vLang.startsWith(targetLangCode) ||
        vName.includes(meta?.label.toLowerCase() || '')
      );
    })
  );
}

/**
 * Split long voice messages into safe, sentence-sized chunks so no part is skipped by the browser TTS engine.
 */
export function splitIntoSafeChunks(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Match sentences separated by periods (.), exclamation marks (!), question marks (?), danda (।), or newlines (\n)
  const rawSegments = text
    .split(/(?<=[.!?।\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: string[] = [];

  for (const seg of rawSegments) {
    if (seg.length <= 100) {
      chunks.push(seg);
    } else {
      // Sub-split by comma, semicolon, or colon
      const subSegments = seg
        .split(/(?<=[,;:])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const sub of subSegments) {
        if (sub.length <= 100) {
          chunks.push(sub);
        } else {
          // Word boundary split fallback
          const words = sub.split(/\s+/);
          let current = '';
          for (const word of words) {
            if ((current + ' ' + word).trim().length > 90) {
              if (current) chunks.push(current.trim());
              current = word;
            } else {
              current = (current + ' ' + word).trim();
            }
          }
          if (current) chunks.push(current.trim());
        }
      }
    }
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

/**
 * Internal helper to speak a single sentence chunk sequentially without calling speechSynthesis.cancel()
 */
function speakChunkSequentially(
  chunkText: string,
  voice: SpeechSynthesisVoice | undefined,
  targetLocale: string,
  language: SupportedLanguage,
  sessionId: number
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    if (sessionId !== activeSpeechSessionId) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = voice?.lang || targetLocale;
    if (voice) {
      utterance.voice = voice;
    }
    // Deliberate pacing for driving safety and crystal-clear pronunciation of Telugu
    utterance.rate = language === 'te' ? 0.88 : 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    activeUtterances.add(utterance);

    let finished = false;
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      activeUtterances.delete(utterance);
      resolve();
    };

    utterance.onend = () => {
      cleanup();
    };

    utterance.onerror = (e) => {
      console.warn('[Driver Voice Assistant Chunk Event]', e);
      cleanup();
    };

    // Keep-alive timer for Chromium speech pause/resume behavior
    keepAliveTimer = setInterval(() => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        cleanup();
        return;
      }
      if (!window.speechSynthesis.speaking) {
        cleanup();
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4000);

    // Timeout safety fallback so an unhandled browser event never freezes the sequential queue
    timeoutTimer = setTimeout(() => {
      cleanup();
    }, Math.max(6000, chunkText.length * 350));

    // CRITICAL: Speak without cancelling the engine
    window.speechSynthesis.speak(utterance);

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  });
}

/**
 * Text to Speech Synthesizer:
 * Uses Server-Side / Cloud TTS for complete Telugu messages (te-IN).
 * Uses Web Speech API for other languages (English, Hindi, Tamil, Kannada, Malayalam).
 */
export async function speakText(
  text: string,
  language: SupportedLanguage = 'en',
  isManual: boolean = false
): Promise<void> {
  if (!text || !text.trim()) return;

  // When auto-announced hands-free voice alerts are OFF:
  // Suppress automatic playback, but allow manual driver triggers (e.g. Replay Voice Alert or Voice Commands)
  if (!autoVoiceAlertsEnabled && !isManual) {
    return;
  }

  const currentSessionId = ++activeSpeechSessionId;

  // Stop any active cloud audio immediately
  if (currentCloudAudio) {
    try {
      currentCloudAudio.pause();
      currentCloudAudio.currentTime = 0;
    } catch (_) {}
    currentCloudAudio = null;
  }

  // 1. TELUGU SPEECH IMPLEMENTATION:
  // Uses server-side / cloud TTS solution (te-IN) for the complete message.
  // Does NOT depend on browser's built-in SpeechSynthesis Telugu voice.
  if (language === 'te') {
    await playCloudTeluguTTS(text, currentSessionId);
    return;
  }

  // 2. OTHER LANGUAGES (English, Hindi, Tamil, Kannada, Malayalam):
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.log(`[Voice Synthesis Fallback] (${language}): ${text}`);
    return;
  }

  try {
    // Ensure paused state is cleared and cancel previous browser speech transmission
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
  } catch (err) {
    // ignore
  }

  try {
    const voices = await getLoadedVoices();
    if (currentSessionId !== activeSpeechSessionId) return;

    const matchingVoice = findBestVoiceForLanguage(language, voices);
    const meta = LANGUAGE_METADATA[language];
    const targetLocale = meta?.locale || 'en-IN';

    const chunks = splitIntoSafeChunks(text);
    if (chunks.length === 0) return;

    for (let i = 0; i < chunks.length; i++) {
      if (currentSessionId !== activeSpeechSessionId) {
        break;
      }
      await speakChunkSequentially(chunks[i], matchingVoice, targetLocale, language, currentSessionId);
    }
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Voice Command Parser
 */
export function parseVoiceCommand(
  rawCommand: string,
  language: SupportedLanguage
): {
  intent:
    | 'START_TRIP'
    | 'NEXT_STOP'
    | 'TIME_TO_COLLEGE'
    | 'REPORT_BREAKDOWN'
    | 'REPORT_ROAD_ISSUE'
    | 'SHOW_ROUTE'
    | 'CHANGE_ROUTE'
    | 'REPEAT_INSTRUCTION'
    | 'UNKNOWN';
  confidence: number;
} {
  const text = rawCommand.toLowerCase().trim();

  if (
    text.includes('start') ||
    text.includes('ప్రారంభ') ||
    text.includes('शुरू') ||
    text.includes('തുടങ്ങുക') ||
    text.includes('ಪ್ರಾರಂಭ')
  ) {
    return { intent: 'START_TRIP', confidence: 0.95 };
  }

  if (
    text.includes('next stop') ||
    text.includes('తర్వాత స్టాప్') ||
    text.includes('अगला स्टॉप') ||
    text.includes('അടുത്ത സ്റ്റോപ്പ്') ||
    text.includes('ಮುಂದಿನ ನಿಲ್ದಾಣ')
  ) {
    return { intent: 'NEXT_STOP', confidence: 0.95 };
  }

  if (
    text.includes('how much time') ||
    text.includes('how far') ||
    text.includes('college') ||
    text.includes('సమయం') ||
    text.includes('కళాశాల') ||
    text.includes('समय') ||
    text.includes('कितना')
  ) {
    return { intent: 'TIME_TO_COLLEGE', confidence: 0.9 };
  }

  if (
    text.includes('breakdown') ||
    text.includes('problem') ||
    text.includes('బ్రేక్‌డౌన్') ||
    text.includes('సమస్య') ||
    text.includes('खराबी')
  ) {
    return { intent: 'REPORT_BREAKDOWN', confidence: 0.95 };
  }

  if (
    text.includes('road') ||
    text.includes('traffic') ||
    text.includes('రోడ్డు') ||
    text.includes('सड़क') ||
    text.includes('जाम')
  ) {
    return { intent: 'REPORT_ROAD_ISSUE', confidence: 0.9 };
  }

  if (
    text.includes('show route') ||
    text.includes('రూట్') ||
    text.includes('రస్తా') ||
    text.includes('रास्ता')
  ) {
    return { intent: 'SHOW_ROUTE', confidence: 0.85 };
  }

  if (text.includes('repeat') || text.includes('మళ్ళీ') || text.includes('दोबारा')) {
    return { intent: 'REPEAT_INSTRUCTION', confidence: 0.9 };
  }

  return { intent: 'UNKNOWN', confidence: 0.5 };
}
