/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * regionalCompaniesData.js - 60+ Verified Regional & Pan-India Companies
 * Featuring Khandesh (Jalgaon, Bhusawal), Marathwada & Nashik, Pune & Mumbai,
 * Bengaluru, NCR (Gurgaon, Noida, Manesar), Hyderabad, Gujarat, and Chennai corridors.
 *
 * Disheera - Enterprise Industrial Proximity Radar Engine
 */

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers rounded to 1 decimal place
 */
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = (numLat2 - numLat1) * Math.PI / 180;
  const dLon = (numLon2 - numLon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(numLat1 * Math.PI / 180) * Math.cos(numLat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const regionalCompanies = [
  // =================================================================
  // 1. MAHARASHTRA: KHANDESH INDUSTRIAL & AGRI-TECH (JALGAON & BHUSAWAL)
  // =================================================================
  {
    id: 'jain-irrigation',
    name: 'Jain Irrigation Systems Ltd',
    cluster: 'Jalgaon Agri-Tech & Irrigation Hub',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0077,
    longitude: 75.5626,
    distanceKm: 8,
    industry: 'Micro-Irrigation, Solar Pumping & Agri-Biotech',
    website: 'https://www.jains.com',
    openingsCount: 14,
    topRoles: ['IoT Sensor Telemetry Engineer', 'Automation Engineer (PLC)', 'Agronomy Tech Specialist', 'Python Data Analyst'],
    requiredSkills: ['IoT Sensor Telemetry', 'Micro-irrigation Automation', 'Embedded C / Arduino', 'Python', 'PLC Programming'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'supreme-industries-jalgaon',
    name: 'Supreme Industries Ltd',
    cluster: 'Jalgaon Gadegaon Industrial Belt',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0250,
    longitude: 75.5480,
    distanceKm: 12,
    industry: 'Plastic Piping, Industrial Moldings & Protective Packaging',
    website: 'https://www.supreme.co.in',
    openingsCount: 9,
    topRoles: ['PLC / SCADA Maintenance Engineer', 'Production Quality Inspector', 'Extrusion Line Automation Trainee'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'SCADA / HMI Screen Design', 'Industrial Sensor & Relay Circuits'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'jain-farm-fresh',
    name: 'Jain Farm Fresh Foods Ltd',
    cluster: 'Jalgaon Food Processing Zone',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 20.9920,
    longitude: 75.5840,
    distanceKm: 10,
    industry: 'Food Processing, Aseptic Fruit Purees & Dehydrated Vegetables',
    website: 'https://www.jainfarmfresh.com',
    openingsCount: 7,
    topRoles: ['Cold Chain QA Executive', 'HACCP Safety Inspector', 'Dehydration Automation Supervisor'],
    requiredSkills: ['HACCP Quality Standards', 'Fruit Dehydration & Pulping Tech', 'Cold Storage Temperature Telemetry', 'ISO 22000 Compliance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'legrand-india-jalgaon',
    name: 'Legrand India Pvt Ltd',
    cluster: 'Jalgaon Electrical Manufacturing Zone',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0360,
    longitude: 75.5390,
    distanceKm: 14,
    industry: 'Electrical Wiring Devices, Smart Switchgear & Home Automation',
    website: 'https://www.legrand.co.in',
    openingsCount: 6,
    topRoles: ['Embedded Testing Engineer', 'Assembly Line Quality Trainee', 'Circuit Board QA'],
    requiredSkills: ['Industrial Sensor & Relay Circuits', 'Embedded C / Arduino', 'Modbus TCP / Profinet'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'marico-jalgaon',
    name: 'Marico Ltd (Jalgaon Edible Oils)',
    cluster: 'Jalgaon Agro-Industrial MIDC',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0180,
    longitude: 75.5710,
    distanceKm: 11,
    industry: 'FMCG & Edible Oil Packaging Automation',
    website: 'https://marico.com',
    openingsCount: 4,
    topRoles: ['Packaging Line Automation Engineer', 'Supply Chain QA Officer'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'HACCP Quality Standards', 'Tally / SAP ERP Logistics'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: false,
    campusDriveActive: false
  },
  {
    id: 'orient-cement-jalgaon',
    name: 'Orient Cement Ltd (Grinding Unit)',
    cluster: 'Jalgaon Heavy Materials MIDC',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0520,
    longitude: 75.5120,
    distanceKm: 18,
    industry: 'Cement Grinding, Pneumatic Conveying & SCADA Control',
    website: 'https://orientcement.com',
    openingsCount: 5,
    topRoles: ['Continuous Plant Maintenance Trainee', 'Baghouse Filter Telemetry Operator'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'SCADA / HMI Screen Design', 'Predictive Maintenance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'jjsb-jalgaon',
    name: 'Jalgaon Janata Sahakari Bank (JJSB)',
    cluster: 'Jalgaon BFSI & FinTech Center',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0080,
    longitude: 75.5680,
    distanceKm: 4,
    industry: 'Cooperative Banking, CBS Systems & Cyber Compliance',
    website: 'https://www.jjsbl.com',
    openingsCount: 8,
    topRoles: ['Junior Database Administrator (SQL)', 'Network Security Support Officer', 'FinTech Integration Trainee'],
    requiredSkills: ['SQL Database Administration', 'Network Firewalls / VPN', 'Core Banking System (CBS) Workflows', 'Python'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'raymond-jalgaon',
    name: 'Raymond Ltd (Jalgaon Textile Division)',
    cluster: 'Jalgaon Textile Corridor',
    clusterGroup: 'khandesh',
    city: 'Jalgaon',
    state: 'Maharashtra',
    latitude: 21.0290,
    longitude: 75.5820,
    distanceKm: 13,
    industry: 'Automated Weaving, Textile Dyeing & Quality Telemetry',
    website: 'https://www.raymond.in',
    openingsCount: 7,
    topRoles: ['Weaving Loom Automation Supervisor', 'Dyeing Lab QA Assistant'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'Quality Control (Textile)', 'Industrial Sensor & Relay Circuits'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'central-railway-bhusawal',
    name: 'Central Railway Electric Locomotive Workshop',
    cluster: 'Bhusawal Rail Logistics Hub',
    clusterGroup: 'khandesh',
    city: 'Bhusawal',
    state: 'Maharashtra',
    latitude: 21.0454,
    longitude: 75.7885,
    distanceKm: 27,
    industry: 'High-Voltage Traction Motors, Pantograph Overhauling & IGBT Drives',
    website: 'https://cr.indianrailways.gov.in',
    openingsCount: 16,
    topRoles: ['Traction Motor Testing Apprentice', 'Relay Testing Technician', 'Loco Electronics Maintenance Junior'],
    requiredSkills: ['Traction Motors & Inverter Drives', 'Transformer Oil Dissolved Gas Analysis', 'Industrial Sensor & Relay Circuits'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'mahagenco-bhusawal',
    name: 'Mahagenco Bhusawal Thermal Power Station (Deepnagar)',
    cluster: 'Bhusawal Energy Belt',
    clusterGroup: 'khandesh',
    city: 'Bhusawal',
    state: 'Maharashtra',
    latitude: 21.0610,
    longitude: 75.8230,
    distanceKm: 31,
    industry: 'Supercritical Thermal Generation, Boiler Telemetry & Grid Substation',
    website: 'https://www.mahagenco.in',
    openingsCount: 12,
    topRoles: ['DCS Boiler Control Room Trainee', 'Flue Gas Desulfurization (FGD) Chemist', 'Switchyard Relay Engineer'],
    requiredSkills: ['Distributed Control Systems (DCS)', 'SCADA / HMI Screen Design', 'High Voltage Switchyard Operations'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'bhusawal-ordnance',
    name: 'Ordnance Factory Bhusawal (Varangaon)',
    cluster: 'Varangaon Defense Cluster',
    clusterGroup: 'khandesh',
    city: 'Bhusawal',
    state: 'Maharashtra',
    latitude: 21.0280,
    longitude: 75.9120,
    distanceKm: 38,
    industry: 'Defense Ammunition Cartridges, CNC Milling & Ballistics Quality Testing',
    website: 'https://ddpdoo.gov.in',
    openingsCount: 11,
    topRoles: ['CNC Precision Tooling Apprentice', 'Metrology & Ballistic Inspection Trainee'],
    requiredSkills: ['CNC G-code & Milling Machine Setup', 'Ultrasonic Non-Destructive Testing (NDT)', 'ISO 9001 Defense Standards'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'godavari-biorefineries',
    name: 'Godavari Biorefineries Ltd (Sakarwadi & Khandesh)',
    cluster: 'Khandesh Bio-Energy & Chemicals',
    clusterGroup: 'khandesh',
    city: 'Bhusawal',
    state: 'Maharashtra',
    latitude: 21.0350,
    longitude: 75.8100,
    distanceKm: 29,
    industry: 'Renewable Chemicals, Bio-Ethanol & Distillation Telemetry',
    website: 'https://www.godavari.com',
    openingsCount: 5,
    topRoles: ['Bio-Process Automation Trainee', 'Chemical Chromatography Lab Analyst'],
    requiredSkills: ['Chemical Process Telemetry', 'SCADA / HMI Screen Design', 'Bio-Ethanol Fermentation Tech'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },

  // =================================================================
  // 2. MAHARASHTRA: MARATHWADA & NASHIK MIDC (AURANGABAD & NASHIK)
  // =================================================================
  {
    id: 'bajaj-auto-waluj',
    name: 'Bajaj Auto Ltd',
    cluster: 'Waluj MIDC Automotive Corridor',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8450,
    longitude: 75.2340,
    distanceKm: 154,
    industry: 'Two-Wheeler & Three-Wheeler Manufacturing, Robotic Welding & Painting',
    website: 'https://www.bajajauto.com',
    openingsCount: 22,
    topRoles: ['Robotic Welding Maintenance Trainee', 'Paint Shop Automated Conveyor Engineer', 'EV Powertrain Quality Inspector'],
    requiredSkills: ['Robotic Arm Programming (FANUC / KUKA)', 'PLC Programming (Siemens/Allen-Bradley)', 'Predictive Maintenance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'skoda-vw-shendra',
    name: 'Skoda Auto Volkswagen India Pvt Ltd',
    cluster: 'Shendra MIDC Global Automotive Belt',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8920,
    longitude: 75.4680,
    distanceKm: 161,
    industry: 'Passenger Vehicle Assembly, MQB Platform Robotics & ECU Diagnostics',
    website: 'https://www.skoda-auto.co.in',
    openingsCount: 18,
    topRoles: ['Vehicle Assembly Automated Guided Vehicle (AGV) Tech', 'Electronic Control Unit (ECU) Calibration Trainee'],
    requiredSkills: ['CAN Bus / OBD-II Diagnostics', 'PLC Programming (Siemens/Allen-Bradley)', 'Robotic Arm Programming'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'lupin-aurangabad',
    name: 'Lupin Pharma Ltd',
    cluster: 'Chikalthana MIDC Pharma Corridor',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8820,
    longitude: 75.3910,
    distanceKm: 158,
    industry: 'Active Pharmaceutical Ingredients (API) & Sterile Injectables',
    website: 'https://www.lupin.com',
    openingsCount: 15,
    topRoles: ['HPLC / GC Analytical Chemist Trainee', 'Cleanroom HVAC Telemetry Supervisor', 'GMP Documentation Officer'],
    requiredSkills: ['HPLC & Gas Chromatography', 'Cleanroom Air Handling & HVAC Sensors', 'US FDA / WHO GMP Compliance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'endurance-waluj',
    name: 'Endurance Technologies Ltd',
    cluster: 'Waluj MIDC Auto Die-Casting & Brakes',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8510,
    longitude: 75.2280,
    distanceKm: 155,
    industry: 'Aluminium Die-Casting, Suspension Systems & Dual-Channel ABS',
    website: 'https://www.endurancegroup.com',
    openingsCount: 13,
    topRoles: ['High-Pressure Die Casting (HPDC) Machine Programmer', 'Hydraulic Brake Testing Trainee'],
    requiredSkills: ['High-Pressure Die Casting Machine Ops', 'Hydraulic Circuits & Servo Valves', 'Coordinate Measuring Machine (CMM) Inspection'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'sterlite-auric',
    name: 'Sterlite Technologies Ltd (STL)',
    cluster: 'AURIC Shendra Smart Industrial City',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8970,
    longitude: 75.4790,
    distanceKm: 163,
    industry: 'Optical Fiber Drawing, 5G Cable Extrusion & Smart Grid Connectivity',
    website: 'https://www.stl.tech',
    openingsCount: 19,
    topRoles: ['Optical Fiber Draw Tower Automation Engineer', 'OTDR Laser Testing Specialist', '5G Telecom Cable QA'],
    requiredSkills: ['Optical Time-Domain Reflectometry (OTDR)', 'Laser Attenuation Measurement', 'Industrial Sensor & Relay Circuits', 'Python'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'siemens-aurangabad',
    name: 'Siemens India Ltd (Switchgear Unit)',
    cluster: 'Waluj MIDC Switchgear Hub',
    clusterGroup: 'marathwada',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8490,
    longitude: 75.2410,
    distanceKm: 156,
    industry: 'Medium Voltage Switchgear, Relays & Industrial Automation',
    website: 'https://www.siemens.com/in',
    openingsCount: 10,
    topRoles: ['Relay Automation Testing Engineer', 'Digital Substation Support Tech'],
    requiredSkills: ['PLC Programming (Siemens S7/TIA Portal)', 'SCADA / HMI Screen Design', 'Modbus TCP / Profinet'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'mahindra-nashik',
    name: 'Mahindra & Mahindra Ltd (Automotive)',
    cluster: 'Satpur MIDC Automotive Corridor',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7460,
    distanceKm: 215,
    industry: 'SUV Manufacturing (Scorpio-N & Thar), Robotic Body-in-White Assembly',
    website: 'https://www.mahindra.com',
    openingsCount: 25,
    topRoles: ['Body-in-White Welding Automation Engineer', 'Automotive Paint Shop Defect Analyst', 'Vehicle Final Inspection Trainee'],
    requiredSkills: ['Robotic Arm Programming (FANUC / KUKA)', 'PLC Programming (Siemens/Allen-Bradley)', 'Quality Management Systems (IATF 16949)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'bosch-nashik',
    name: 'Bosch India Ltd',
    cluster: 'Satpur & Ambad MIDC Precision Tech',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9880,
    longitude: 73.7380,
    distanceKm: 216,
    industry: 'Common Rail Diesel Injectors, EV Power Electronics & Sensors',
    website: 'https://www.bosch.in',
    openingsCount: 20,
    topRoles: ['Common Rail Injector Calibration Trainee', 'Cleanroom Micro-Machining Operator', 'Industrial IoT Sensor Field Engineer'],
    requiredSkills: ['Precision Micro-Machining Tolerances', 'Cleanroom Particulate Controls (ISO 14644)', 'Industrial IoT Sensor & Gateway Config'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'abb-nashik',
    name: 'ABB India Ltd',
    cluster: 'Satpur MIDC Power Transmission',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9920,
    longitude: 73.7420,
    distanceKm: 214,
    industry: 'Vacuum Interrupters, Circuit Breakers & Digital Substation Products',
    website: 'https://new.abb.com/in',
    openingsCount: 14,
    topRoles: ['Vacuum Bottle High Voltage Testing Trainee', 'Circuit Breaker Mechanism Assembly QA', 'Substation Automation Assistant'],
    requiredSkills: ['High Voltage Dielectric Breakdown Testing', 'Spring & Magnetic Actuator Mechanism Alignment', 'IEC 61850 Substation Protocol'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'schneider-nashik',
    name: 'Schneider Electric India',
    cluster: 'Ambad MIDC Energy Management',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9540,
    longitude: 73.7290,
    distanceKm: 218,
    industry: 'Smart Metering, Low Voltage Distribution Panels & EcoStruxure IoT',
    website: 'https://www.se.com/in',
    openingsCount: 16,
    topRoles: ['Smart Energy Meter Testing Specialist', 'EcoStruxure IoT Cloud Integration Trainee', 'Busbar Automated Bending QA'],
    requiredSkills: ['DLMS / COSEM Metering Protocol', 'Modbus TCP / Profinet', 'Python for Industrial Analytics'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'crompton-nashik',
    name: 'Crompton Greaves Consumer Electricals',
    cluster: 'Ambad MIDC Consumer Products Hub',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9590,
    longitude: 73.7340,
    distanceKm: 217,
    industry: 'Energy-Efficient BLDC Fans, Submersible Pumps & Household Appliances',
    website: 'https://www.crompton.co.in',
    openingsCount: 11,
    topRoles: ['BLDC Motor Driver Firmware Trainee', 'Pump Dynamometer Efficiency Analyst', 'Motor Stator Automated Winding QA'],
    requiredSkills: ['BLDC Motor Control Algorithms', 'PWM Inverter Gate Driver Tuning', 'Dynamometer Power & Torque Measurement'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'glenmark-nashik',
    name: 'Glenmark Pharmaceuticals Ltd',
    cluster: 'Satpur MIDC Pharmaceutical Zone',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9940,
    longitude: 73.7480,
    distanceKm: 214,
    industry: 'Topical Formulations, Dermatology Creams & Metered Dose Inhalers',
    website: 'https://glenmarkpharma.com',
    openingsCount: 12,
    topRoles: ['Aerosol Valve Particle Size Analyst', 'Dermatology Ointment Pilot Plant Assistant', 'Analytical Chemistry Trainee'],
    requiredSkills: ['Cascade Impactor Aerodynamic Testing', 'Viscometer & Rheology Measurement', '21 CFR Part 11 Electronic Records'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'hal-ozar-nashik',
    name: 'Hindustan Aeronautics Ltd (HAL Ozar)',
    cluster: 'Ozar Aerospace Defense Corridor',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 20.1190,
    longitude: 73.9140,
    distanceKm: 205,
    industry: 'Military Aircraft Overhaul (Su-30MKI), Avionics Radar & Structural Flight Testing',
    website: 'https://hal-india.co.in',
    openingsCount: 15,
    topRoles: ['Avionics Radar Wire Harness Apprentice', 'Aircraft Structural NDT Inspector', 'Turbofan Engine Maintenance Trainee'],
    requiredSkills: ['MIL-STD-1553 Databus Architecture', 'Ultrasonic Non-Destructive Testing (NDT)', 'Aircraft Hydraulic System Overhaul'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'ceat-tyres-satpur',
    name: 'CEAT Tyres Ltd',
    cluster: 'Satpur MIDC Rubber & Polymers',
    clusterGroup: 'nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9860,
    longitude: 73.7410,
    distanceKm: 215,
    industry: 'Automated Radial Tyre Curing, Calender Lines & Rubber Compounds',
    website: 'https://www.ceat.com',
    openingsCount: 9,
    topRoles: ['Tyre Curing Press Automation Engineer', 'Tread Extrusion Line Quality Supervisor'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'Industrial Thermal Sensors & Steam Telemetry', 'Six Sigma Quality Control'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },

  // =================================================================
  // 3. MAHARASHTRA: PUNE & MUMBAI INDUSTRIAL & IT CORRIDOR
  // =================================================================
  {
    id: 'tata-motors-pune',
    name: 'Tata Motors Passenger Vehicles & EV',
    cluster: 'Chakan MIDC Automotive Belt',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.7520,
    longitude: 73.8180,
    distanceKm: 325,
    industry: 'Electric Vehicles, Connected Car Telematics & Battery Systems',
    website: 'https://www.tatamotors.com',
    openingsCount: 30,
    topRoles: ['Battery Management System (BMS) Firmware Trainee', 'Vehicle Telematics Software Engineer', 'Assembly Automation QA'],
    requiredSkills: ['Embedded C / Arduino', 'Python', 'IoT Sensor Telemetry', 'Modbus TCP / Profinet'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'bharat-forge-pune',
    name: 'Bharat Forge Ltd',
    cluster: 'Mundhwa Industrial Heavy Engineering',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5360,
    longitude: 73.9180,
    distanceKm: 345,
    industry: 'Aerospace Forging, Defense Systems & High-Tonnage Presses',
    website: 'https://www.bharatforge.com',
    openingsCount: 17,
    topRoles: ['Hydraulic Press Automation Engineer', 'Defect Inspection Vision AI Trainee'],
    requiredSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'Python for Industrial Analytics', 'Predictive Maintenance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'thermax-bhosari',
    name: 'Thermax Ltd (Clean Energy & Water)',
    cluster: 'Bhosari MIDC Clean Tech',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.6290,
    longitude: 73.8420,
    distanceKm: 335,
    industry: 'Boilers, Air Pollution Control & Industrial Wastewater Treatment',
    website: 'https://www.thermaxglobal.com',
    openingsCount: 14,
    topRoles: ['Boiler IoT Telemetry Associate', 'Water Treatment SCADA Engineer', 'Energy Audit Junior'],
    requiredSkills: ['SCADA / HMI Screen Design', 'Industrial Sensor & Relay Circuits', 'Chemical Process Telemetry'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'persistent-systems-hinjewadi',
    name: 'Persistent Systems Ltd',
    cluster: 'Hinjewadi Infotech Park Phase 1',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5910,
    longitude: 73.7380,
    distanceKm: 342,
    industry: 'Cloud Engineering, Digital Product Development & Enterprise AI',
    website: 'https://www.persistent.com',
    openingsCount: 45,
    topRoles: ['Full-Stack Node.js / React Trainee', 'Cloud Infrastructure Engineer (AWS)', 'Python Machine Learning Associate'],
    requiredSkills: ['Node.js & Express', 'React.js', 'Python', 'AWS Cloud Architecture', 'Docker / Kubernetes'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'kpit-hinjewadi',
    name: 'KPIT Technologies Ltd',
    cluster: 'Hinjewadi Infotech Park Phase 3',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5820,
    longitude: 73.7020,
    distanceKm: 346,
    industry: 'Autonomous Driving Software, AUTOSAR & Connected Mobility',
    website: 'https://www.kpit.com',
    openingsCount: 28,
    topRoles: ['Embedded AUTOSAR Firmware Developer', 'ADAS Model-Based Design Trainee', 'CAN Vehicle Network QA'],
    requiredSkills: ['Embedded C / Arduino', 'AUTOSAR Classic/Adaptive', 'CAN Bus / OBD-II Diagnostics', 'Python'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'serum-institute-pune',
    name: 'Serum Institute of India Pvt Ltd',
    cluster: 'Hadapsar Biopharma SEZ',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5020,
    longitude: 73.9390,
    distanceKm: 350,
    industry: 'Vaccines, Biologics Fermentation & Automated Sterile Filling',
    website: 'https://www.seruminstitute.com',
    openingsCount: 20,
    topRoles: ['Bioreactor Automation Technician', 'Cold Chain Telemetry Officer', 'Quality Control Microbiologist'],
    requiredSkills: ['Bioreactor Control Systems', 'Cold Storage Temperature Telemetry', 'cGMP & US FDA Guidelines'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'reliance-jio-navi-mumbai',
    name: 'Reliance Jio Infocomm Ltd',
    cluster: 'Reliance Corporate Park (Ghansoli)',
    clusterGroup: 'pune_mumbai',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    latitude: 19.1240,
    longitude: 73.0080,
    distanceKm: 395,
    industry: '5G Core Telecom, Cloud Native Infrastructure & Edge AI Platforms',
    website: 'https://www.jio.com',
    openingsCount: 65,
    topRoles: ['5G RAN Network Optimization Trainee', 'Cloud Infrastructure Engineer (Kubernetes)', 'Full-Stack Platform Developer'],
    requiredSkills: ['5G Telecom Network Architecture', 'Kubernetes / Containerization', 'Golang / Python', 'React.js'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'larsen-toubro-powai',
    name: 'Larsen & Toubro Ltd (Technology & Heavy Engineering)',
    cluster: 'Powai Industrial Knowledge City',
    clusterGroup: 'pune_mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.1170,
    longitude: 72.9060,
    distanceKm: 410,
    industry: 'Defense Equipment, Nuclear Power Components & Smart Infrastructure',
    website: 'https://www.larsentoubro.com',
    openingsCount: 32,
    topRoles: ['Structural Stress Analysis Trainee', 'Industrial DCS SCADA Commissioning Engineer', 'BIM Smart Site Tech'],
    requiredSkills: ['FEA Structural Simulation (ANSYS)', 'SCADA / HMI Screen Design', 'Python for Industrial Analytics'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'tata-elxsi-pune',
    name: 'Tata Elxsi Ltd',
    cluster: 'Hinjewadi Infotech Park Phase 2',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5950,
    longitude: 73.7250,
    distanceKm: 344,
    industry: 'Automotive Design, Autonomous Driving AI & Medical Device Software',
    website: 'https://www.tataelxsi.com',
    openingsCount: 22,
    topRoles: ['Autonomous Mobility AI Trainee', 'AUTOSAR Software Engineer', 'Medical Software Verification Associate'],
    requiredSkills: ['Embedded C / C++', 'AUTOSAR Classic/Adaptive', 'Python for Industrial Analytics', 'Machine Learning'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'bajaj-finserv-pune',
    name: 'Bajaj Finserv Ltd',
    cluster: 'Viman Nagar FinTech Corridor',
    clusterGroup: 'pune_mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5670,
    longitude: 73.9140,
    distanceKm: 340,
    industry: 'Consumer Lending FinTech, Real-Time Credit Underwriting & Payment Gateways',
    website: 'https://www.bajajfinserv.in',
    openingsCount: 35,
    topRoles: ['Full-Stack FinTech Developer', 'Data Platform Engineer (SQL/Snowflake)', 'Cybersecurity Analyst'],
    requiredSkills: ['Java / Spring Boot', 'Node.js & Express', 'SQL Database Administration', 'RESTful API Engineering'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },

  // =================================================================
  // 4. KARNATAKA: BENGALURU TECH & INDUSTRIAL CORRIDOR
  // =================================================================
  {
    id: 'infosys-electronic-city',
    name: 'Infosys Ltd',
    cluster: 'Electronic City Phase 1 Tech Hub',
    clusterGroup: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.8452,
    longitude: 77.6602,
    distanceKm: 924,
    industry: 'Global Digital Services, Enterprise Cloud Solutions & AI Platforms',
    website: 'https://www.infosys.com',
    openingsCount: 80,
    topRoles: ['Systems Engineer Trainee', 'Cloud DevOps Associate', 'Full-Stack Developer (MERN)', 'Data Analytics Engineer'],
    requiredSkills: ['JavaScript / TypeScript', 'React.js', 'Node.js', 'Python', 'AWS / Azure Cloud', 'SQL'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'wipro-sarjapur',
    name: 'Wipro Technologies Ltd',
    cluster: 'Sarjapur Doddakannelli Campus',
    clusterGroup: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9116,
    longitude: 77.6874,
    distanceKm: 928,
    industry: 'IT Consulting, Cyber Defense Centers & Industrial IoT Engineering',
    website: 'https://www.wipro.com',
    openingsCount: 55,
    topRoles: ['Project Engineer (Fresher)', 'Cybersecurity Operations Trainee', 'API Backend Specialist'],
    requiredSkills: ['Java / Spring Boot', 'Python', 'Network Security Architecture', 'RESTful API Engineering'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'titan-engineering-peenya',
    name: 'Titan Engineering & Automation Ltd (TEAL)',
    cluster: 'Peenya Industrial Area Stage 1',
    clusterGroup: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 13.0285,
    longitude: 77.5197,
    distanceKm: 910,
    industry: 'Special Purpose Machines, Precision Aerospace & Robotic Assembly',
    website: 'https://www.titanteal.com',
    openingsCount: 18,
    topRoles: ['Robotic Cell Integration Engineer', 'PLC & Vision Inspection Programmer', 'Precision Tooling Associate'],
    requiredSkills: ['Robotic Arm Programming (FANUC / KUKA)', 'PLC Programming (Siemens/Beckhoff)', 'Machine Vision Inspection'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'bosch-adugodi',
    name: 'Bosch India Ltd (Smart Campus)',
    cluster: 'Adugodi / Koramangala Tech Park',
    clusterGroup: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9352,
    longitude: 77.6069,
    distanceKm: 921,
    industry: 'Mobility Solutions, Connected Car Cloud & AIoT Smart Devices',
    website: 'https://www.bosch.in',
    openingsCount: 38,
    topRoles: ['Embedded Systems Trainee', 'AIoT Cloud Platform Engineer', 'Automotive Software Test Automation'],
    requiredSkills: ['Embedded C / Arduino', 'Python', 'IoT Sensor Telemetry', 'CAN Bus / OBD-II Diagnostics'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'ather-energy-whitefield',
    name: 'Ather Energy Ltd',
    cluster: 'Whitefield Tech & Automotive SEZ',
    clusterGroup: 'bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9698,
    longitude: 77.7500,
    distanceKm: 935,
    industry: 'Smart Electric Two-Wheelers, Battery Packs & Dashboard OS',
    website: 'https://www.atherenergy.com',
    openingsCount: 24,
    topRoles: ['Battery Management System (BMS) Firmware Engineer', 'Dashboard UI Android Trainee', 'Vehicle Fleet Telematics Dev'],
    requiredSkills: ['Embedded C / C++', 'Android / Kotlin', 'Python for Industrial Analytics', 'IoT Sensor Telemetry'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },

  // =================================================================
  // 5. NORTH INDIA: NCR CYBER & AUTOMOTIVE CORRIDOR (GURGAON, NOIDA, MANESAR)
  // =================================================================
  {
    id: 'maruti-suzuki-manesar',
    name: 'Maruti Suzuki India Ltd',
    cluster: 'Manesar Industrial Model Township (IMT)',
    clusterGroup: 'ncr',
    city: 'Gurgaon',
    state: 'Haryana',
    latitude: 28.3588,
    longitude: 76.9378,
    distanceKm: 825,
    industry: 'High-Volume Passenger Car Manufacturing, Robotics & Automated Paint Shop',
    website: 'https://www.marutisuzuki.com',
    openingsCount: 42,
    topRoles: ['Assembly Automation Trainee', 'Powertrain Quality Engineer', 'Robotics Cell Maintenance Associate'],
    requiredSkills: ['Robotic Arm Programming (FANUC / KUKA)', 'PLC Programming (Siemens/Allen-Bradley)', 'Six Sigma Quality Control'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'samsung-electronics-noida',
    name: 'Samsung India Electronics Pvt Ltd',
    cluster: 'Noida Sector 81 Global Mobile Plant',
    clusterGroup: 'ncr',
    city: 'Noida',
    state: 'Uttar Pradesh',
    latitude: 28.5355,
    longitude: 77.3910,
    distanceKm: 852,
    industry: 'Smartphone Surface Mount Technology (SMT), Display Displays & 5G Hardware',
    website: 'https://www.samsung.com/in',
    openingsCount: 35,
    topRoles: ['SMT Assembly Line QA Engineer', 'RF Antenna Testing Specialist', 'Smartphone Hardware Diagnostic Trainee'],
    requiredSkills: ['SMT Surface Mount Technology', 'RF Signal Spectrum Analysis', 'Embedded C / Arduino', 'Quality Control'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'tcs-gurgaon-cybercity',
    name: 'Tata Consultancy Services Ltd',
    cluster: 'Gurgaon DLF Cyber City Hub',
    clusterGroup: 'ncr',
    city: 'Gurgaon',
    state: 'Haryana',
    latitude: 28.4952,
    longitude: 77.0892,
    distanceKm: 835,
    industry: 'Enterprise Digital Transformation, BFSI Cloud Platforms & Cyber Defense',
    website: 'https://www.tcs.com',
    openingsCount: 95,
    topRoles: ['Associate Software Engineer (NQT)', 'Cloud Data Platform Analyst', 'Cybersecurity Trainee'],
    requiredSkills: ['Java / Spring Boot', 'Python', 'React.js', 'SQL Database Administration', 'AWS / Azure Cloud'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'dixon-technologies-noida',
    name: 'Dixon Technologies (India) Ltd',
    cluster: 'Noida Electronic Manufacturing Cluster',
    clusterGroup: 'ncr',
    city: 'Noida',
    state: 'Uttar Pradesh',
    latitude: 28.5921,
    longitude: 77.3853,
    distanceKm: 856,
    industry: 'Electronics Manufacturing Services (EMS), Smart TVs, Lighting & Telecom',
    website: 'https://dixoninfo.com',
    openingsCount: 28,
    topRoles: ['Electronics PCB Testing Trainee', 'Assembly Automation Line Supervisor', 'Firmware Flash Technician'],
    requiredSkills: ['PCB Schematic & Soldering Inspection', 'Industrial Sensor & Relay Circuits', 'Embedded C / Arduino'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'hero-motocorp-dharuhera',
    name: 'Hero MotoCorp Ltd',
    cluster: 'Dharuhera & Gurgaon Industrial Corridor',
    clusterGroup: 'ncr',
    city: 'Gurgaon',
    state: 'Haryana',
    latitude: 28.2120,
    longitude: 76.7974,
    distanceKm: 815,
    industry: 'Motorcycles & Scooters, Connected Dashboard Telematics & Green Mobility',
    website: 'https://www.heromotocorp.com',
    openingsCount: 26,
    topRoles: ['Engine Dynamometer Testing Apprentice', 'Vehicle Electrical Harness QA', 'Smart Connected Scooter Firmware Trainee'],
    requiredSkills: ['Dynamometer Power & Torque Measurement', 'CAN Bus / OBD-II Diagnostics', 'Embedded C / Arduino'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },

  // =================================================================
  // 6. TELANGANA: HYDERABAD TECH & LIFE SCIENCES HUB
  // =================================================================
  {
    id: 'dr-reddys-bachupally',
    name: 'Dr. Reddy\'s Laboratories Ltd',
    cluster: 'Bachupally Pharma Tech Cluster',
    clusterGroup: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.5381,
    longitude: 78.3688,
    distanceKm: 480,
    industry: 'Active Pharma Ingredients, Biologics Synthesis & Continuous Manufacturing',
    website: 'https://www.drreddys.com',
    openingsCount: 27,
    topRoles: ['Quality Control Chromatography Analyst', 'Continuous Flow Reactor Automation Trainee', 'GMP Compliance Assistant'],
    requiredSkills: ['HPLC & Gas Chromatography', 'Chemical Process Telemetry', 'US FDA / WHO GMP Compliance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'tech-mahindra-hitec',
    name: 'Tech Mahindra Ltd',
    cluster: 'HITEC City Madhapur IT Belt',
    clusterGroup: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4474,
    longitude: 78.3762,
    distanceKm: 488,
    industry: 'Next-Gen Telecom Software, 5G Network Solutions & AI Experience Labs',
    website: 'https://www.techmahindra.com',
    openingsCount: 50,
    topRoles: ['Associate Software Engineer', 'Cloud Network Trainee', 'Python Full-Stack Developer'],
    requiredSkills: ['Python', 'JavaScript / TypeScript', 'React.js', 'RESTful API Engineering', 'Docker / Kubernetes'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'bharat-biotech-genome-valley',
    name: 'Bharat Biotech International Ltd',
    cluster: 'Genome Valley Life Sciences SEZ',
    clusterGroup: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.6548,
    longitude: 78.5833,
    distanceKm: 475,
    industry: 'Vaccines, Bio-Therapeutics & Automated Cleanroom Fermentation',
    website: 'https://www.bharatbiotech.com',
    openingsCount: 22,
    topRoles: ['Bioprocess Fermentation Technician', 'Cleanroom HVAC Telemetry Supervisor', 'Bio-Analytics QA Specialist'],
    requiredSkills: ['Bioreactor Control Systems', 'Cleanroom Particulate Controls (ISO 14644)', 'Cold Storage Temperature Telemetry'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'cyient-gachibowli',
    name: 'Cyient Ltd',
    cluster: 'Gachibowli Financial District Hub',
    clusterGroup: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4401,
    longitude: 78.3489,
    distanceKm: 492,
    industry: 'Engineering Design, Geospatial Networks & Aerospace Embedded Systems',
    website: 'https://www.cyient.com',
    openingsCount: 30,
    topRoles: ['Aerospace Avionics Trainee', 'Geospatial GIS Data Engineer', 'Hardware Verification Engineer'],
    requiredSkills: ['Embedded C / Arduino', 'Python', 'GIS Spatial Mapping', 'Hardware Verification (Verilog/VHDL)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'darwinbox-financial-district',
    name: 'Darwinbox Digital Solutions Pvt Ltd',
    cluster: 'Financial District SaaS Corridor',
    clusterGroup: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4194,
    longitude: 78.3428,
    distanceKm: 494,
    industry: 'Enterprise HR-Tech SaaS, Scalable Distributed Systems & AI Workflow',
    website: 'https://darwinbox.com',
    openingsCount: 25,
    topRoles: ['Software Development Engineer 1 (Backend)', 'Frontend React Specialist', 'QA Automation Engineer'],
    requiredSkills: ['Node.js & Express', 'React.js', 'MongoDB / PostgreSQL', 'Redis Caching', 'Docker / Kubernetes'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },

  // =================================================================
  // 7. GUJARAT: SANAND, AHMEDABAD & VADODARA INDUSTRIAL CORRIDOR
  // =================================================================
  {
    id: 'tata-motors-sanand',
    name: 'Tata Motors Passenger Vehicles Ltd',
    cluster: 'Sanand Industrial GIDC Automotive Hub',
    clusterGroup: 'gujarat',
    city: 'Sanand',
    state: 'Gujarat',
    latitude: 22.9868,
    longitude: 72.3789,
    distanceKm: 410,
    industry: 'Electric Vehicles (Tiago/Nexon EV), High-Speed Stamping & Robotic Body Assembly',
    website: 'https://www.tatamotors.com',
    openingsCount: 35,
    topRoles: ['EV Assembly Line Robotics Trainee', 'Press Shop Stamping Quality Specialist', 'Battery Pack Assembly QA'],
    requiredSkills: ['Robotic Arm Programming (FANUC / KUKA)', 'PLC Programming (Siemens/Allen-Bradley)', 'Battery Management Systems (BMS)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'zydus-lifesciences-changodar',
    name: 'Zydus Lifesciences Ltd',
    cluster: 'Changodar GIDC Pharma Zone',
    clusterGroup: 'gujarat',
    city: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 22.9150,
    longitude: 72.4410,
    distanceKm: 405,
    industry: 'Formulations, Biosimilars & Automated Packaging Lines',
    website: 'https://www.zyduslife.com',
    openingsCount: 20,
    topRoles: ['Pharma Formulation QA Trainee', 'Packaging Line SCADA Operator', 'Analytical R&D Associate'],
    requiredSkills: ['HPLC & Gas Chromatography', 'SCADA / HMI Screen Design', 'US FDA / WHO GMP Compliance'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'larsen-toubro-hazira',
    name: 'Larsen & Toubro Heavy Engineering (Hazira)',
    cluster: 'Hazira Coastal Heavy Engineering Complex',
    clusterGroup: 'gujarat',
    city: 'Surat',
    state: 'Gujarat',
    latitude: 21.1684,
    longitude: 72.6841,
    distanceKm: 310,
    industry: 'Nuclear Reactors, Super-Heavy Pressure Vessels & Cryogenic Systems',
    website: 'https://www.larsentoubro.com',
    openingsCount: 25,
    topRoles: ['Heavy Vessel Welding Technology Trainee', 'Non-Destructive Testing (NDT) Level-II', 'Hydraulic Press Specialist'],
    requiredSkills: ['Ultrasonic Non-Destructive Testing (NDT)', 'Submerged Arc Welding Tech', 'ASME Boiler & Pressure Vessel Code'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'gujarat-fluorochemicals-dahej',
    name: 'Gujarat Fluorochemicals Ltd (GFL Dahej)',
    cluster: 'Dahej Petroleum & Chemical PCPIR SEZ',
    clusterGroup: 'gujarat',
    city: 'Dahej',
    state: 'Gujarat',
    latitude: 21.7126,
    longitude: 72.5855,
    distanceKm: 330,
    industry: 'Fluoropolymers, EV Battery Chemicals & Refrigerant Gas Distillation',
    website: 'https://www.gfl.co.in',
    openingsCount: 18,
    topRoles: ['Chemical DCS Plant Operator Trainee', 'Polymer Testing Lab Chemist', 'Hazardous Gas Telemetry Tech'],
    requiredSkills: ['Distributed Control Systems (DCS)', 'Chemical Process Telemetry', 'Hazardous Gas Safety Instrumentation'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: false
  },
  {
    id: 'adani-solar-ahmedabad',
    name: 'Adani Solar (Mundra & Ahmedabad Tech)',
    cluster: 'Solar Photovoltaic & Green Energy Hub',
    clusterGroup: 'gujarat',
    city: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    distanceKm: 400,
    industry: 'Bifacial Solar Cell Manufacturing, EVA Encapsulation & Smart Grid Inverters',
    website: 'https://www.adanisolar.com',
    openingsCount: 22,
    topRoles: ['Solar Photovoltaic Cell QA Trainee', 'Stringer Automated Soldering Technician', 'Inverter Telemetry Associate'],
    requiredSkills: ['Solar PV Cell Testing & Electroluminescence', 'Industrial Sensor & Relay Circuits', 'SCADA / HMI Screen Design'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },

  // =================================================================
  // 8. TAMIL NADU: CHENNAI AUTOMOTIVE & ELECTRONICS CORRIDOR
  // =================================================================
  {
    id: 'hyundai-motor-sriperumbudur',
    name: 'Hyundai Motor India Ltd',
    cluster: 'Sriperumbudur Auto SEZ Corridor',
    clusterGroup: 'chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 12.9756,
    longitude: 79.9482,
    distanceKm: 1040,
    industry: 'High-Volume Passenger Cars, Industry 4.0 Smart Factory & Robotic Assembly',
    website: 'https://www.hyundai.com/in',
    openingsCount: 40,
    topRoles: ['Robotic Paint Shop Trainee', 'Powertrain Precision Machining Specialist', 'Vehicle IoT Telematics QA'],
    requiredSkills: ['Robotic Arm Programming (Hyundai/FANUC)', 'PLC Programming (Siemens/Allen-Bradley)', 'CAN Bus / OBD-II Diagnostics'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'ashok-leyland-ennore',
    name: 'Ashok Leyland Ltd',
    cluster: 'Ennore Commercial Vehicle Plant',
    clusterGroup: 'chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.2089,
    longitude: 80.3204,
    distanceKm: 1030,
    industry: 'Heavy Commercial Trucks, Defense Vehicles & EV Buses',
    website: 'https://www.ashokleyland.com',
    openingsCount: 30,
    topRoles: ['Chassis Assembly Automation Associate', 'Heavy Diesel Engine Testing Trainee', 'Electric Bus Battery Integration QA'],
    requiredSkills: ['Heavy Automotive Chassis Assembly', 'Dynamometer Power & Torque Measurement', 'Battery Management Systems (BMS)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'zoho-corporation-estancia',
    name: 'Zoho Corporation',
    cluster: 'Estancia IT SEZ (Guduvanchery)',
    clusterGroup: 'chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 12.8236,
    longitude: 80.0444,
    distanceKm: 1055,
    industry: 'Cloud SaaS Office Suite, Distributed Databases & Deep Tech Frameworks',
    website: 'https://www.zoho.com',
    openingsCount: 75,
    topRoles: ['Software Developer (Fresher)', 'Product Technical Support Engineer', 'UI / Frontend React Developer'],
    requiredSkills: ['Java / C++', 'JavaScript / TypeScript', 'Data Structures & Algorithms', 'Relational Database Design (SQL)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'tvs-motor-hosur',
    name: 'TVS Motor Company Ltd',
    cluster: 'Hosur & Chennai Two-Wheeler Hub',
    clusterGroup: 'chennai',
    city: 'Hosur',
    state: 'Tamil Nadu',
    latitude: 12.7409,
    longitude: 77.8253,
    distanceKm: 950,
    industry: 'Premium Motorcycles (Apache/iQube EV), Connected Telematics & Racing R&D',
    website: 'https://www.tvsmotor.com',
    openingsCount: 28,
    topRoles: ['EV Motor Controller Tuning Trainee', 'SmartXonnect Bluetooth Telematics Dev', 'Frame Welding Robotics QA'],
    requiredSkills: ['Embedded C / Arduino', 'Bluetooth Low Energy (BLE) Protocols', 'Robotic Arm Programming (FANUC / KUKA)'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  },
  {
    id: 'freshworks-omr',
    name: 'Freshworks Technologies Pvt Ltd',
    cluster: 'Perungudi OMR Tech Corridor',
    clusterGroup: 'chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 12.9654,
    longitude: 80.2461,
    distanceKm: 1045,
    industry: 'Customer Engagement SaaS, Multi-Tenant Cloud Architecture & Generative AI',
    website: 'https://www.freshworks.com',
    openingsCount: 35,
    topRoles: ['Associate Software Engineer', 'SaaS Implementation Specialist', 'Frontend Engineer (React/Vue)'],
    requiredSkills: ['Ruby on Rails / Node.js', 'React.js', 'PostgreSQL / DynamoDB', 'RESTful API Engineering'],
    verifiedPartner: true,
    hiringFresher: true,
    internshipOffered: true,
    campusDriveActive: true
  }
];

/**
 * Filter and sort companies based on location, distance radius, cluster, and filters
 * @param {Object} options
 * @param {number} [options.userLat] - User's live latitude
 * @param {number} [options.userLng] - User's live longitude
 * @param {number} [options.maxDistanceKm] - Max radius filter in km
 * @param {string} [options.cluster] - Filter by clusterGroup ('khandesh', 'pune_mumbai', etc.) or 'all'
 * @param {string} [options.city] - Filter by city name
 * @param {string} [options.state] - Filter by state name
 * @param {boolean} [options.verifiedOnly] - Only return verified partner companies
 * @param {boolean} [options.hiringFresher] - Only return companies hiring freshers
 * @param {string} [options.search] - Text search across name, industry, cluster, skills
 * @returns {Array<Object>} Sorted list of companies with calculated distanceKm
 */
function getCompaniesByProximity(options = {}) {
  const {
    userLat = null,
    userLng = null,
    maxDistanceKm = null,
    cluster = null,
    city = null,
    state = null,
    verifiedOnly = false,
    hiringFresher = false,
    search = null
  } = options;

  const hasCoords = userLat != null && userLng != null && !isNaN(Number(userLat)) && !isNaN(Number(userLng));
  const uLat = hasCoords ? Number(userLat) : null;
  const uLng = hasCoords ? Number(userLng) : null;

  let sourceCompanies = regionalCompanies;
  try {
    const { getAllEmployers } = require('./radarEmployerStore');
    sourceCompanies = getAllEmployers(false);
  } catch (_) {}

  let list = sourceCompanies.map(c => {
    let distance = c.distanceKm;
    if (hasCoords) {
      const calc = calculateHaversineKm(uLat, uLng, c.latitude, c.longitude);
      if (calc != null) distance = calc;
    }
    return {
      ...c,
      distanceKm: distance
    };
  });

  // Filter: Cluster Group
  if (cluster && cluster.toLowerCase() !== 'all') {
    const cLower = cluster.toLowerCase().trim();
    list = list.filter(item =>
      (item.clusterGroup && item.clusterGroup.toLowerCase() === cLower) ||
      (item.cluster && item.cluster.toLowerCase().includes(cLower))
    );
  }

  // Filter: City
  if (city && city.toLowerCase() !== 'all') {
    const cityLower = city.toLowerCase().trim();
    list = list.filter(item => item.city && item.city.toLowerCase().includes(cityLower));
  }

  // Filter: State
  if (state && state.toLowerCase() !== 'all') {
    const stateLower = state.toLowerCase().trim();
    list = list.filter(item => item.state && item.state.toLowerCase() === stateLower);
  }

  // Filter: Verified Partner
  if (verifiedOnly === true || verifiedOnly === 'true') {
    list = list.filter(item => item.verifiedPartner);
  }

  // Filter: Hiring Fresher
  if (hiringFresher === true || hiringFresher === 'true') {
    list = list.filter(item => item.hiringFresher);
  }

  // Filter: Text Search
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    list = list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.industry.toLowerCase().includes(q) ||
      item.cluster.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.requiredSkills.some(s => s.toLowerCase().includes(q)) ||
      item.topRoles.some(r => r.toLowerCase().includes(q))
    );
  }

  // Filter: Max Distance Radius
  if (maxDistanceKm != null && !isNaN(Number(maxDistanceKm)) && Number(maxDistanceKm) > 0) {
    const max = Number(maxDistanceKm);
    list = list.filter(item => item.distanceKm <= max);
  }

  // Sort: Distance Ascending
  return list.sort((a, b) => a.distanceKm - b.distanceKm);
}

// Attach helpers and aliases for backward compatibility
regionalCompanies.REGIONAL_COMPANIES = regionalCompanies;
regionalCompanies.regionalCompanies = regionalCompanies;
regionalCompanies.getCompaniesByProximity = getCompaniesByProximity;
regionalCompanies.calculateHaversineKm = calculateHaversineKm;

module.exports = regionalCompanies;
