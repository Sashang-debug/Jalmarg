export function routeAdvisory({ route, vehicle = 'BIKE', origin, destination, demo = false }, language = 'en-IN') {
  const selected = route.selected
  const hindi = language === 'hi-IN'
  const name = { BIKE: hindi ? 'दो पहिया वाहन' : '2-wheeler', SEDAN: hindi ? 'कार' : 'car', SUV: 'SUV' }[vehicle]
  const prefix = demo ? hindi ? 'यह परीक्षण है। जलभराव की रिपोर्ट नकली है, सड़क का मार्ग वास्तविक है। ' : 'Test mode: flood observations are dummy data; street routes are real. ' : ''
  if (!selected) return prefix + (hindi ? 'अभी कोई उपयुक्त मार्ग उपलब्ध नहीं है। यात्रा से पहले स्थिति की पुष्टि करें।' : 'No suitable route is currently available. Review conditions before travelling.')
  const avoided = route.fastest?.blocking || []
  const changed = avoided.length > 0
  const reasons = avoided.slice(0,3).map(item => `${item.roadName}, ${item.depthCm} ${hindi ? 'सेंटीमीटर अनुमानित पानी' : 'cm approximate reported water'}`).join('; ')
  const delta = selected.durationMins - (route.fastest?.durationMins || selected.durationMins)
  const distanceDelta = selected.distanceKm - (route.fastest?.distanceKm || selected.distanceKm)
  if (hindi) return prefix + `${name} के लिए ${origin?.name || 'शुरुआती स्थान'} से ${destination?.name || 'गंतव्य'} तक अनुमानित समय ${selected.durationMins} मिनट और दूरी ${selected.distanceKm.toFixed(1)} किलोमीटर है। ` +
    (changed ? `मार्ग बदला गया क्योंकि ${reasons} आपके वाहन की जलभराव सीमा के बराबर या अधिक है। चुना गया मार्ग इन रिपोर्टों से बचता है। मूल अनुमान ${route.fastest.durationMins} मिनट था; बदलाव ${delta} मिनट और ${distanceDelta.toFixed(1)} किलोमीटर है। ` : 'मूल उपलब्ध मार्ग चुना गया है; जलभराव के कारण बदलाव आवश्यक नहीं था। ') +
    (selected.description ? `मार्ग: ${selected.description}। ` : '') +
    (route.timingProvider === 'GOOGLE' ? 'समय गूगल के अभी रवाना होने के यातायात अनुमान पर आधारित है। ' : 'समय OSRM का सड़क अनुमान है; इसमें लाइव यातायात शामिल नहीं है। ') +
    (selected.hazards.length ? `चुने गए मार्ग के पास ${selected.hazards.length} जलभराव रिपोर्ट अभी भी हैं। उन्हें देखें। ` : 'चुने गए मार्ग पर अभी कोई सक्रिय रिपोर्ट नहीं मिली। ') + 'बिना रिपोर्ट का अर्थ सुरक्षित सड़क नहीं है।'
  return prefix + `For your ${name}, from ${origin?.name || 'your starting point'} to ${destination?.name || 'your destination'}, the estimate is ${selected.durationMins} minutes over ${selected.distanceKm.toFixed(1)} kilometres. ` +
    (changed ? `I changed the route because ${reasons} meets or exceeds your vehicle's avoidance setting. The selected alternative avoids ${avoided.length === 1 ? 'that report' : 'those reports'}. The original estimate was ${route.fastest.durationMins} minutes. The change is ${delta > 0 ? '+' : ''}${delta} minutes and ${distanceDelta > 0 ? '+' : ''}${distanceDelta.toFixed(1)} kilometres. ` : 'The original available route is selected; no flood detour was needed. ') +
    (selected.description ? `Route via ${selected.description}. ` : '') +
    (route.timingProvider === 'GOOGLE' ? 'Timing uses Google traffic-aware estimates for departure now. ' : 'Timing uses an OSRM road estimate, without live traffic. ') +
    (selected.hazards.length ? `${selected.hazards.length} reported waterlogged point${selected.hazards.length === 1 ? ' remains' : 's remain'} near the selected route. Review them before travelling. ` : 'No active reports intersect the selected route. ') + 'Conditions may be unreported; this is not a guarantee of safe passage.'
}
