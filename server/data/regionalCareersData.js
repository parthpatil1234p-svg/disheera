/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * regionalCareersData.js - Localized Maharashtra & Khandesh Industrial Career Tracks
 * Specialized curriculum paths for Jalgaon, Bhusawal, Chhatrapati Sambhajinagar, and Nashik corridors.
 */

const regionalCareersData = [
  {
    id: 'agri-tech-smart-irrigation',
    slug: 'agri-tech-smart-irrigation',
    title: 'Agri-Tech & Smart Irrigation Systems Specialist',
    primaryStream: 'engineering',
    category: 'Regional Industrial & Agri-Tech',
    isRegional: true,
    regionalCluster: 'Jalgaon & Khandesh Agri-Tech Hub',
    regionalProximityKm: 8,
    description: 'Design and deploy automated micro-irrigation systems, solar pump IoT telemetry, soil moisture sensor grids, and precision agriculture software for major agro-industrial enterprises.',
    salaryRange: '₹4.8 LPA - ₹12.5 LPA',
    averageSalary: '₹7.2 LPA',
    demandLevel: 'High (Khandesh & Western Maharashtra Agri-Corridors)',
    targetCompanies: [
      'Jain Irrigation Systems Ltd (Jain Hills & Jain Valley, Jalgaon)',
      'Supreme Industries Ltd (Jalgaon Gadegaon Unit)',
      'Netafim India (Micro Irrigation Cluster)',
      'Finolex Plasson Industries',
      'Mahyco Seeds & Agri-Biotech'
    ],
    coreSkills: ['IoT Sensor Telemetry', 'Micro-irrigation Automation', 'Embedded C / Arduino', 'Soil Moisture Analytics'],
    toolSkills: ['Python', 'MQTT Protocol', 'Node-RED', 'Tasmota / ESP32', 'PostgreSQL / TimescaleDB', 'Grafana'],
    softSkills: ['Rural Field Operations', 'Farmer Advisory Communication', 'Industrial Troubleshooting'],
    roadmap: [
      {
        week: 1,
        title: 'Micro-Irrigation Hydraulics & Soil Moisture Dynamics',
        description: 'Understand drip, sprinkler, and subsurface irrigation dynamics. Interface analog soil moisture and NPK sensor arrays with microcontrollers.',
        skills: ['Micro-irrigation Automation', 'IoT Sensor Telemetry'],
        projectBrief: 'Build an automated soil moisture logger with ESP32 and publish sensor telemetry to an MQTT broker.'
      },
      {
        week: 2,
        title: 'Solar Pump Telemetry & Variable Frequency Drives (VFD)',
        description: 'Implement solar pump controller telemetry, battery state-of-charge calculation, and remote start-stop scheduling.',
        skills: ['Embedded C / Arduino', 'MQTT Protocol'],
        projectBrief: 'Create a Node.js MQTT telemetry receiver that alerts farmers via WhatsApp when solar pump voltage drops below threshold.'
      },
      {
        week: 3,
        title: 'Agri-Data Pipelines, TimescaleDB & Weather Forecasting Integration',
        description: 'Store multi-node telemetry in time-series databases. Integrate Indian Meteorological Department (IMD) / OpenWeather APIs for predictive watering schedules.',
        skills: ['Python', 'PostgreSQL / TimescaleDB', 'Grafana'],
        projectBrief: 'Design a predictive irrigation dashboard displaying evapotranspiration rates and soil moisture forecast curves.'
      },
      {
        week: 4,
        title: 'Industrial Field Deployment & Edge Fail-Safe Protocols',
        description: 'Deploy low-power LoRaWAN / GSM field gateways, offline caching when cellular connectivity drops, and water conservation compliance audits.',
        skills: ['Node-RED', 'Rural Field Operations'],
        projectBrief: 'Deploy a resilient LoRaWAN gateway packet forwarder with local SQLite buffering for remote Khandesh farms.'
      }
    ]
  },
  {
    id: 'food-processing-cold-chain-qa',
    slug: 'food-processing-cold-chain-qa',
    title: 'Khandesh Food Processing & Cold Chain QA Engineer',
    primaryStream: 'engineering',
    category: 'Regional Industrial & Agri-Tech',
    isRegional: true,
    regionalCluster: 'Jalgaon & Khandesh Banana/Fruit Processing Belt',
    regionalProximityKm: 12,
    description: 'Ensure food safety compliance, automated sorting telemetry, fruit dehydration quality metrics, and continuous temperature-controlled supply chain logistics.',
    salaryRange: '₹4.2 LPA - ₹10.5 LPA',
    averageSalary: '₹6.5 LPA',
    demandLevel: 'High (Jalgaon Banana Export & Agro-Food Zones)',
    targetCompanies: [
      'Jain Farm Fresh Foods Ltd (Elpro Unit, Chittegaon & Jalgaon)',
      'Supreme Industries Packaging Division',
      'Khandesh Agro Processing Cooperatives',
      'Mahalaxmi Agro Export Units',
      'Mother Dairy / Amul Cold Chain Distribution'
    ],
    coreSkills: ['HACCP Quality Standards', 'Fruit Dehydration & Pulping Tech', 'Cold Storage Temperature Telemetry', 'ISO 22000 Compliance'],
    toolSkills: ['Python Data Analysis', 'IoT Temperature Loggers', 'Tally / SAP ERP Logistics', 'Barcode / RFID Tracking'],
    softSkills: ['Audit Readiness', 'Food Safety Regulatory Reporting', 'Vendor Quality Auditing'],
    roadmap: [
      {
        week: 1,
        title: 'HACCP Protocols & Banana / Onion Dehydration Processing',
        description: 'Master critical control points (CCP) in post-harvest processing, aseptic pulp packaging, and industrial moisture reduction techniques.',
        skills: ['HACCP Quality Standards', 'Fruit Dehydration & Pulping Tech'],
        projectBrief: 'Develop a digital HACCP critical-control-point logging dashboard with automated violation flagging.'
      },
      {
        week: 2,
        title: 'IoT Cold Chain Telemetry & BLE Temperature Beacons',
        description: 'Deploy Bluetooth Low Energy (BLE) temperature/humidity sensors inside reefer containers. Track thermal abuse during interstate transit.',
        skills: ['Cold Storage Temperature Telemetry', 'IoT Temperature Loggers'],
        projectBrief: 'Build an alert pipeline that flags perishable fruit spoilage risk if container temperature exceeds 4°C for over 45 minutes.'
      },
      {
        week: 3,
        title: 'Export Compliance, Phytosanitary Standards & APEDA Documentation',
        description: 'Format digital phytosanitary records, residue testing certificates, and APEDA export batch trace dossiers for global shipments.',
        skills: ['ISO 22000 Compliance', 'Barcode / RFID Tracking'],
        projectBrief: 'Create a QR-code verifiable export traceability portal showing farm origin, packing date, and cold-chain compliance history.'
      },
      {
        week: 4,
        title: 'Warehouse ERP, First-Expiry-First-Out (FEFO) Dispatch Automation',
        description: 'Automate inventory rotation to ensure perishables are dispatched by remaining shelf-life rather than arrival sequence.',
        skills: ['Tally / SAP ERP Logistics', 'Python Data Analysis'],
        projectBrief: 'Build an automated FEFO inventory optimizer script that minimizes warehouse spoilage across 50 regional cold rooms.'
      }
    ]
  },
  {
    id: 'midc-industrial-automation',
    slug: 'midc-industrial-automation',
    title: 'MIDC Industrial Automation (PLC/SCADA) Engineer',
    primaryStream: 'engineering',
    category: 'Regional Industrial & Manufacturing',
    isRegional: true,
    regionalCluster: 'Jalgaon, Aurangabad & Nashik MIDC Manufacturing Corridor',
    regionalProximityKm: 15,
    description: 'Program Programmable Logic Controllers (PLC), design SCADA and Human-Machine Interface (HMI) consoles, and maintain automated assembly lines across heavy manufacturing corridors.',
    salaryRange: '₹5.0 LPA - ₹14.0 LPA',
    averageSalary: '₹8.0 LPA',
    demandLevel: 'Very High (Automotive, Plastic & Heavy Electricals)',
    targetCompanies: [
      'Supreme Industries Ltd (Gadegaon Jalgaon)',
      'Legrand India Pvt Ltd (Jalgaon Plant)',
      'Bajaj Auto Ltd (Waluj MIDC, Chhatrapati Sambhajinagar)',
      'Skoda Auto Volkswagen India (Shendra MIDC)',
      'Bosch India (Satpur & Ambad MIDC, Nashik)',
      'Mahindra & Mahindra Automotive (Satpur MIDC, Nashik)',
      'Bhusawal Central Railway Locomotives Workshop'
    ],
    coreSkills: ['PLC Programming (Siemens/Allen-Bradley)', 'SCADA / HMI Screen Design', 'Industrial Sensor & Relay Circuits', 'Predictive Maintenance'],
    toolSkills: ['Siemens TIA Portal', 'RSLogix / Studio 5000', 'Modbus TCP / Profinet', 'Python for Industrial Analytics', 'AutoCAD Electrical'],
    softSkills: ['Factory Floor Safety (OSHA)', 'Cross-Disciplinary Team Coordination', 'Root Cause Failure Analysis'],
    roadmap: [
      {
        week: 1,
        title: 'Ladder Logic Programming & Discrete Control Circuits',
        description: 'Design digital input/output ladder logic, interlocking sequences, timers, counters, and industrial safety relay circuits.',
        skills: ['PLC Programming (Siemens/Allen-Bradley)', 'Industrial Sensor & Relay Circuits'],
        projectBrief: 'Program a simulated 3-stage conveyor sorting system with optical sensors, pneumatic pushers, and emergency stop logic.'
      },
      {
        week: 2,
        title: 'Analog Signal Conditioning & Variable Frequency Drive (VFD) Control',
        description: 'Wire 4-20mA and 0-10V analog transducers (pressure, temperature, flow). Program VFD motor speed modulation over Modbus TCP.',
        skills: ['Modbus TCP / Profinet', 'PLC Programming (Siemens/Allen-Bradley)'],
        projectBrief: 'Configure a simulated closed-loop PID pressure control loop regulating pumping motor RPM via Modbus communication.'
      },
      {
        week: 3,
        title: 'SCADA Architecture, Alarm Historiography & HMI Graphic Design',
        description: 'Design intuitive touch-screen HMI screens. Configure high-priority alarm logs, trend charts, and operator permission tiers.',
        skills: ['SCADA / HMI Screen Design', 'Siemens TIA Portal'],
        projectBrief: 'Design a responsive web SCADA dashboard displaying live line OEE (Overall Equipment Effectiveness) and motor vibration alerts.'
      },
      {
        week: 4,
        title: 'Predictive Vibration Telemetry & Industry 4.0 IoT Gateways',
        description: 'Interface edge vibration sensors to cloud MQTT telemetry. Implement anomaly detection to schedule bearing lubrication before motor seizure.',
        skills: ['Predictive Maintenance', 'Python for Industrial Analytics'],
        projectBrief: 'Build an edge anomaly detection script that flags bearing degradation based on FFT spectral vibration peaks.'
      }
    ]
  },
  {
    id: 'rural-fintech-msme-digital',
    slug: 'rural-fintech-msme-digital',
    title: 'Rural FinTech & Local MSME Digital Specialist',
    primaryStream: 'business',
    category: 'Regional Business & Technology',
    isRegional: true,
    regionalCluster: 'North Maharashtra District Banking & MSME Networks',
    regionalProximityKm: 5,
    description: 'Empower district cooperative banks, agricultural credit societies (PACS), APMC mandis, and local small businesses with digital UPI integrations, automated accounting, and omni-channel commerce.',
    salaryRange: '₹4.0 LPA - ₹9.5 LPA',
    averageSalary: '₹6.0 LPA',
    demandLevel: 'High (APMC Markets, Cooperative Banks & MSMEs)',
    targetCompanies: [
      'Jalgaon District Central Cooperative Bank (DCCB)',
      'Jalgaon Janata Sahakari Bank (JJSB)',
      'Maharashtra Gramin Bank',
      'APMC Jalgaon & Bhusawal Grain Markets',
      'Local Cotton Ginning & Dal Mill Associations',
      'Rural E-Commerce Logistics Hubs'
    ],
    coreSkills: ['UPI & Payment Gateway Integration', 'District Cooperative Banking Workflows', 'Tally Prime & ERP Automation', 'APMC Mandi Ledger Software'],
    toolSkills: ['Razorpay / Cashfree APIs', 'PostgreSQL', 'JavaScript / Node.js', 'Excel Advanced Modeling', 'WhatsApp Business API'],
    softSkills: ['Regional Merchant Relationship Management', 'Financial Literacy Training', 'Vernacular Hindi/Marathi Negotiation'],
    roadmap: [
      {
        week: 1,
        title: 'APMC Grain Mandi Auction Workflows & Digital Bill Settlement',
        description: 'Understand commission agent (Adatiya) billing, statutory farmer deduction rules, cess calculations, and electronic mandi trading.',
        skills: ['APMC Mandi Ledger Software', 'Tally Prime & ERP Automation'],
        projectBrief: 'Build an automated mandi bill calculator that computes net farmer payout after moisture cut, weighing charges, and market cess.'
      },
      {
        week: 2,
        title: 'UPI QR Generation, Dynamic Virtual Accounts & Webhook Reconciliation',
        description: 'Generate dynamic UPI QR codes per invoice. Reconcile bank payments automatically using webhook callbacks without manual passbook entry.',
        skills: ['UPI & Payment Gateway Integration', 'Razorpay / Cashfree APIs'],
        projectBrief: 'Deploy a Node.js merchant payment desk that generates WhatsApp invoice payment links and updates ledger upon instant webhook receipt.'
      },
      {
        week: 3,
        title: 'District Cooperative Credit Society (PACS) Audit Readiness',
        description: 'Implement NABARD-compliant standard chart of accounts, Kisan Credit Card (KCC) interest subvention calculation, and loan recovery schedules.',
        skills: ['District Cooperative Banking Workflows', 'Excel Advanced Modeling'],
        projectBrief: 'Design a KCC interest subvention auditing model that automatically calculates prompt-repayment 3% subsidy discounts.'
      },
      {
        week: 4,
        title: 'Vernacular MSME E-Commerce & WhatsApp Ordering Desks',
        description: 'Launch Marathi and Hindi WhatsApp commerce bots enabling local merchants to take orders, track delivery, and confirm payment automatically.',
        skills: ['WhatsApp Business API', 'Vernacular Hindi/Marathi Negotiation'],
        projectBrief: 'Build an automated WhatsApp catalog bot in Marathi enabling local Khandesh grocery stores to take digital orders.'
      }
    ]
  }
];

regionalCareersData.REGIONAL_CAREERS = regionalCareersData;
regionalCareersData.regionalCareersData = regionalCareersData;
module.exports = regionalCareersData;
