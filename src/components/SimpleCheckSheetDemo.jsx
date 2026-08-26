/**
 * SimpleCheckSheetDemo.jsx
 * Demo page for SimpleDigitalCheckSheet with sample data
 */

import React from 'react';
import SimpleDigitalCheckSheet from './SimpleDigitalCheckSheet';
import { demoCheckSheetData } from './SimpleCheckSheetDemo';

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
