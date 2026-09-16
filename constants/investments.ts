export const investmentTypes = [
  {
    id: 'broiler',
    title: 'Broiler Investment',
    subtitle: 'Fast-growing birds raised for meat',
    durationLabel: '6 weeks cycle',
  },
  {
    id: 'layers',
    title: 'Layers Investment',
    subtitle: 'Egg-laying birds for periodic income',
    durationLabel: '12 months cycle',
  },
];

export const packages = [
  { id: 'broiler-100', typeId: 'broiler', birds: 100, amount: 150000, estimatedProfit: 45000, profitSharePercent: 30, duration: '6 weeks',
    description: 'Ideal for first-time investors. Covers feeding, medication and management of 100 broiler birds for one full cycle.' },
  { id: 'broiler-200', typeId: 'broiler', birds: 200, amount: 290000, estimatedProfit: 95000, profitSharePercent: 30, duration: '6 weeks',
    description: 'Mid-tier package for investors scaling returns with 200 broiler birds under full farm management.' },
  { id: 'broiler-1000', typeId: 'broiler', birds: 1000, amount: 1350000, estimatedProfit: 500000, profitSharePercent: 30, duration: '6 weeks',
    description: 'Large-scale broiler package with full farm management, feeding, vaccination and biosecurity for 1000 birds.' },
  { id: 'layers-100', typeId: 'layers', birds: 100, amount: 220000, estimatedProfit: 90000, profitSharePercent: 30, duration: '12 months',
    description: 'Entry-level layers package. 100 birds managed for egg production with periodic returns.' },
  { id: 'layers-200', typeId: 'layers', birds: 200, amount: 420000, estimatedProfit: 190000, profitSharePercent: 30, duration: '12 months',
    description: '200 layer birds under full farm management with periodic egg-sales returns.' },
  { id: 'layers-1000', typeId: 'layers', birds: 1000, amount: 1950000, estimatedProfit: 950000, profitSharePercent: 30, duration: '12 months',
    description: 'Large-scale layers package for consistent returns from 1000 birds over a full production cycle.' },
];

export const officeInfo = {
  address: '12 Farm Estate Road, Off Airport Road, Lagos, Nigeria',
  phone: '+234 800 000 0000',
  email: 'invest@yourpoultryco.com',
  hours: 'Mon – Sat, 9:00 AM – 5:00 PM',
};