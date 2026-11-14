/*
 * Copyright (C) 2026 Disheera Technologies Inc.
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See the LICENSE file for details.
 */
/**
 * data/aisheMasterRegistry.js — National Higher Education Institutional Registry
 *
 * Master lookup directory for AISHE (All India Survey on Higher Education) codes,
 * state university affiliations, NAAC accreditation, and recognized domains.
 *
 * Disheera Technologies Inc.
 */

const AISHE_MASTER_REGISTRY = [
  {
    aisheCode: 'C-41234',
    name: 'College of Engineering, Pune (COEP Technological University)',
    shortName: 'COEP',
    domain: 'coep.ac.in',
    city: 'Pune',
    state: 'Maharashtra',
    affiliatedTo: 'COEP Technological University (Unitary Public)',
    naacGrade: 'A+',
    nirfBand: 'Top 50 Engineering',
    establishedYear: 1854
  },
  {
    aisheCode: 'C-33874',
    name: 'Veermata Jijabai Technological Institute (VJTI)',
    shortName: 'VJTI',
    domain: 'vjti.ac.in',
    city: 'Mumbai',
    state: 'Maharashtra',
    affiliatedTo: 'University of Mumbai',
    naacGrade: 'A+',
    nirfBand: 'Top 100 Engineering',
    establishedYear: 1887
  },
  {
    aisheCode: 'C-41582',
    name: 'Pune Institute of Computer Technology (PICT)',
    shortName: 'PICT',
    domain: 'pict.edu',
    city: 'Pune',
    state: 'Maharashtra',
    affiliatedTo: 'Savitribai Phule Pune University (SPPU)',
    naacGrade: 'A+',
    nirfBand: 'Top 200 Engineering',
    establishedYear: 1983
  },
  {
    aisheCode: 'C-41890',
    name: 'Vishwakarma Institute of Technology (VIT Pune)',
    shortName: 'VIT Pune',
    domain: 'vit.edu',
    city: 'Pune',
    state: 'Maharashtra',
    affiliatedTo: 'Savitribai Phule Pune University (SPPU)',
    naacGrade: 'A++',
    nirfBand: 'Top 150 Engineering',
    establishedYear: 1983
  },
  {
    aisheCode: 'C-42105',
    name: 'G H Raisoni College of Engineering and Management',
    shortName: 'GHRCEM',
    domain: 'raisoni.net',
    city: 'Pune',
    state: 'Maharashtra',
    affiliatedTo: 'Savitribai Phule Pune University (SPPU)',
    naacGrade: 'A+',
    nirfBand: 'Top 200 Engineering',
    establishedYear: 2006
  },
  {
    aisheCode: 'C-34112',
    name: 'Sardar Patel Institute of Technology (SPIT)',
    shortName: 'SPIT',
    domain: 'spit.ac.in',
    city: 'Mumbai',
    state: 'Maharashtra',
    affiliatedTo: 'University of Mumbai',
    naacGrade: 'A+',
    nirfBand: 'Top 150 Engineering',
    establishedYear: 2005
  },
  {
    aisheCode: 'C-42998',
    name: 'Government College of Engineering, Aurangabad',
    shortName: 'GECA',
    domain: 'geca.ac.in',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    affiliatedTo: 'Dr. Babasaheb Ambedkar Marathwada University',
    naacGrade: 'A',
    nirfBand: 'Rank Band 151-200',
    establishedYear: 1960
  },
  {
    aisheCode: 'C-43150',
    name: 'Walchand College of Engineering, Sangli',
    shortName: 'WCE Sangli',
    domain: 'walchandsangli.ac.in',
    city: 'Sangli',
    state: 'Maharashtra',
    affiliatedTo: 'Shivaji University, Kolhapur',
    naacGrade: 'A',
    nirfBand: 'Top 200 Engineering',
    establishedYear: 1947
  },
  {
    aisheCode: 'U-0306',
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    domain: 'iitb.ac.in',
    city: 'Mumbai',
    state: 'Maharashtra',
    affiliatedTo: 'Institute of National Importance',
    naacGrade: 'Autonomous',
    nirfBand: 'Rank 3 Overall',
    establishedYear: 1958
  },
  {
    aisheCode: 'U-0220',
    name: 'Indian Institute of Technology Delhi',
    shortName: 'IIT Delhi',
    domain: 'iitd.ac.in',
    city: 'New Delhi',
    state: 'Delhi',
    affiliatedTo: 'Institute of National Importance',
    naacGrade: 'Autonomous',
    nirfBand: 'Rank 2 Engineering',
    establishedYear: 1961
  },
  {
    aisheCode: 'C-18450',
    name: 'BMS College of Engineering',
    shortName: 'BMSCE',
    domain: 'bmsce.ac.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    affiliatedTo: 'Visvesvaraya Technological University (VTU)',
    naacGrade: 'A++',
    nirfBand: 'Top 100 Engineering',
    establishedYear: 1946
  },
  {
    aisheCode: 'C-13420',
    name: 'PSG College of Technology',
    shortName: 'PSG Tech',
    domain: 'psgtech.edu',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    affiliatedTo: 'Anna University',
    naacGrade: 'A',
    nirfBand: 'Top 60 Engineering',
    establishedYear: 1951
  }
];

/**
 * Searches the institutional master directory by AISHE code, name, or domain
 */
function findInstitution(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  return (
    AISHE_MASTER_REGISTRY.find(
      inst =>
        inst.aisheCode.toLowerCase() === q ||
        inst.domain.toLowerCase() === q ||
        inst.name.toLowerCase().includes(q) ||
        inst.shortName.toLowerCase() === q
    ) || null
  );
}

/**
 * Checks if an email belongs to a blocked free consumer provider
 */
function isConsumerEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const blockedDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.co.in',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'icloud.com',
    'aol.com',
    'rediffmail.com',
    'proton.me',
    'protonmail.com'
  ];
  return blockedDomains.includes(domain);
}

/**
 * Checks if a domain looks like a valid educational domain
 */
function isAcademicDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const d = domain.toLowerCase();
  return (
    d.endsWith('.ac.in') ||
    d.endsWith('.edu.in') ||
    d.endsWith('.edu') ||
    AISHE_MASTER_REGISTRY.some(inst => inst.domain.toLowerCase() === d)
  );
}

module.exports = {
  AISHE_MASTER_REGISTRY,
  findInstitution,
  isConsumerEmail,
  isAcademicDomain
};
