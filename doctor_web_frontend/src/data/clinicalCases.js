// Clinical dataset for Heal6 Diabetic Foot Risk Analysis

export const PATIENT_CASES = [
  {
    id: 'DFU-8842',
    name: 'Rajesh Verma',
    age: 61,
    gender: 'Male',
    diabetesType: 'Type 2 DM (14 yrs)',
    hba1c: '9.2%',
    locationLabel: 'Right Plantar Hindfoot / Heel',
    siteScore: 1, // Hindfoot
    ischemiaScore: 1, // Reduced pulses (Dorsalis Pedis absent)
    neuropathyScore: 1, // Loss of 10g monofilament sensation
    depthScore: 1, // Deep tissue / Fascial involvement
    // AI Computer Vision findings:
    aiInfectionScore: 1, // Bacterial erythema + purulence detected
    aiAreaScore: 1, // Area = 2.45 cm² (>= 1 cm²)
    calculatedSinbad: 4, // 4 out of 6
    woundAreaCm2: 2.45,
    arucoCalibration: 42, // px/cm
    infectionRiskPercent: 78.4,
    convnextConfidence: 62.0, // Trigger for Human-in-the-Loop warning
    maxDepthMm: 5.8,
    meanDepthMm: 3.6,
    woundVolumeCm3: 0.38,
    depthClassification: "Probe-to-Bone / Deep Fascia",
    tissueBreakdown: {
      granulation: 45,
      slough: 35,
      necrotic: 20,
    },
    healingEstimateWeeks: '12 - 16 Weeks',
    triageLevel: 'URGENT TRIAGE',
    triageColor: '#f43f5e',
    triageBg: '#fff1f2',
    radarData: [
      { axis: 'Site (Hindfoot)', value: 100, label: 'Hindfoot (1)' },
      { axis: 'Ischemia', value: 100, label: 'Reduced (1)' },
      { axis: 'Neuropathy', value: 100, label: 'Present (1)' },
      { axis: 'Bacterial Load', value: 85, label: 'High (1)' },
      { axis: 'Area (≥1cm²)', value: 90, label: '2.45cm² (1)' },
      { axis: 'Depth (Bone/Fascia)', value: 100, label: 'Deep (1)' },
    ],

    actionPlan: {
      headline: 'Standard wound care, multidisciplinary intervention.',
      debridement: 'Sharp mechanical debridement of slough margin required.',
      offloading: 'Immediate non-weight bearing Total Contact Casting (TCC) or Pneumatic Walker.',
      dressing: 'Hydrofiber silver antimicrobials with alginate barrier changed q48h.',
      consultation: 'Urgent Vascular Surgery Consult for ABI/Duplex Angiography within 24-48 hours.'
    }
  },
  {
    id: 'DFU-5104',
    name: 'Sunita Sharma',
    age: 54,
    gender: 'Female',
    diabetesType: 'Type 1 DM (22 yrs)',
    hba1c: '8.4%',
    locationLabel: 'Left 1st Metatarsal Head (Forefoot)',
    siteScore: 0, // Forefoot
    ischemiaScore: 0, // Palpable pulses intact
    neuropathyScore: 1, // Severe sensory neuropathy
    depthScore: 0, // Superficial dermis
    aiInfectionScore: 0,
    aiAreaScore: 1,
    calculatedSinbad: 2, // 2 out of 6
    woundAreaCm2: 1.20,
    arucoCalibration: 42,
    infectionRiskPercent: 34.2,
    convnextConfidence: 89.5,
    maxDepthMm: 1.8,
    meanDepthMm: 1.1,
    woundVolumeCm3: 0.08,
    depthClassification: "Superficial Dermal Ulcer",
    tissueBreakdown: {
      granulation: 75,
      slough: 20,
      necrotic: 5,
    },
    healingEstimateWeeks: '6 - 8 Weeks',
    triageLevel: 'MODERATE RISK',
    triageColor: '#f59e0b',
    triageBg: '#fffbeb',
    radarData: [
      { axis: 'Site (Forefoot)', value: 20, label: 'Forefoot (0)' },
      { axis: 'Ischemia', value: 10, label: 'Intact (0)' },
      { axis: 'Neuropathy', value: 100, label: 'Present (1)' },
      { axis: 'Bacterial Load', value: 30, label: 'Mild (0)' },
      { axis: 'Area (≥1cm²)', value: 65, label: '1.20cm² (1)' },
      { axis: 'Depth (Superficial)', value: 20, label: 'Superficial (0)' },
    ],

    actionPlan: {
      headline: 'Outpatient podiatric wound management & offloading footwear.',
      debridement: 'Callus and hyperkeratotic rim reduction.',
      offloading: 'Custom molded neuropathic orthotics with metatarsal relief.',
      dressing: 'Collagen matrix dressing with secondary polyurethane foam.',
      consultation: 'Routine 2-week podiatry follow-up.'
    }
  },
  {
    id: 'DFU-9311',
    name: 'Arjun Nair',
    age: 72,
    gender: 'Male',
    diabetesType: 'Type 2 DM (28 yrs)',
    hba1c: '10.8%',
    locationLabel: 'Left Midfoot Charcot Joint Collapse',
    siteScore: 1, // Midfoot
    ischemiaScore: 1, // Severe peripheral arterial disease
    neuropathyScore: 1, // Dense peripheral neuropathy
    depthScore: 1, // Probing to deep bone / joint capsule
    aiInfectionScore: 1, // Cellulitic margin > 2cm
    aiAreaScore: 1, // Area 4.80 cm²
    calculatedSinbad: 6, // 6 out of 6 (Maximum critical score)
    woundAreaCm2: 4.80,
    arucoCalibration: 42,
    infectionRiskPercent: 94.6,
    convnextConfidence: 96.2,
    maxDepthMm: 7.9,
    meanDepthMm: 4.8,
    woundVolumeCm3: 0.82,
    depthClassification: "Probe-to-Bone / Joint Capsule Excavation",
    tissueBreakdown: {
      granulation: 20,
      slough: 45,
      necrotic: 35,
    },
    healingEstimateWeeks: '20 - 28 Weeks (High Amputation Risk)',
    triageLevel: 'CRITICAL SURGICAL EMERGENCY',
    triageColor: '#f43f5e',
    triageBg: '#fff1f2',
    radarData: [
      { axis: 'Site (Midfoot)', value: 100, label: 'Midfoot (1)' },
      { axis: 'Ischemia', value: 100, label: 'Severe (1)' },
      { axis: 'Neuropathy', value: 100, label: 'Dense (1)' },
      { axis: 'Bacterial Load', value: 100, label: 'Systemic (1)' },
      { axis: 'Area (≥1cm²)', value: 100, label: '4.80cm² (1)' },
      { axis: 'Depth (Probe-to-Bone)', value: 100, label: 'Bone (1)' },
    ],

    actionPlan: {
      headline: 'Urgent limb salvage protocol & immediate hospital admission.',
      debridement: 'Operative debridement & deep tissue bone cultures.',
      offloading: 'Strict non-weight bearing immobilization (bivalved TCC).',
      dressing: 'Negative Pressure Wound Therapy (NPWT / VAC) post-op.',
      consultation: 'Emergency Vascular Surgery + Orthopedic Foot & Ankle consult.'
    }
  }
]
