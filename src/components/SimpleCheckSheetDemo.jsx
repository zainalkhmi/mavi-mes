/**
 * SimpleCheckSheetDemo.jsx
 * Demo page for SimpleDigitalCheckSheet with sample data
 */

import React from 'react';
import SimpleDigitalCheckSheet from './SimpleDigitalCheckSheet';

export const demoCheckSheetData = {
  id: 'cs-demo-001',
  name: 'Standard Daily Machine & Quality Inspection',
  docNo: 'CS-DEMO-2026',
  partNo: 'PRT-DEMO-01',
  partName: 'Hydraulic Cylinder Rod',
  stationId: 'ST-QC-01',
  workOrder: 'WO-2026-DEMO',
  items: [
    { id: 1, name: 'Main Shaft Diameter (Nominal: 25.00 ±0.05 mm)', spec: '25.00 ±0.05 mm', type: 'MEASUREMENT', required: true },
    { id: 2, name: 'Surface Scratch / Dent Free Visual Check', spec: 'No visible defect', type: 'VISUAL', required: true },
    { id: 3, name: 'Flange Thread M8x1.25 Pitch & Depth', spec: 'Thread Gauge Go/NoGo', type: 'GAUGE', required: true },
    { id: 4, name: 'Oil Seal Groove Width (3.20 ±0.02 mm)', spec: '3.20 ±0.02 mm', type: 'MEASUREMENT', required: true }
  ]
};

export default function SimpleCheckSheetDemo() {
  const handleComplete = (result) => {
    console.log('Check Sheet Completed:', result);
    alert(`Check Sheet Submitted!\n\nStatus: ${result.status}\nOK: ${result.okCount}\nNG: ${result.ngCount}`);
  };

  return (
    <SimpleDigitalCheckSheet
      checkSheetData={demoCheckSheetData}
      onComplete={handleComplete}
    />
  );
}
