/**
 * GlueStack Widgets Demo
 * Example usage of new widgets added to GlueStack UI
 */

import React, { useState } from 'react';
import {
  Timer,
  Counter,
  NumberInput,
  DateTimePicker,
  Gauge,
  ListItem,
  EmptyState,
  Skeleton,
  SkeletonList,
  Signature,
  Card,
  Text,
  Button,
  Badge
} from '../components';

// Timer Example
export function TimerExample() {
  const [timerValue, setTimerValue] = useState(45);

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Timer Examples</Text>

      <Box className="grid grid-cols-2 gap-4">
        <Timer
          value={0}
          duration={300}
          mode="countdown"
          label="Takt Time"
          size="md"
          onComplete={() => alert('Takt time reached!')}
        />

        <Counter
          value={0}
          min={0}
          max={999}
          label="Good Parts"
          variant="card"
          colorScheme="success"
          onChange={(val) => console.log('Good parts:', val)}
        />
      </Box>

      <Box className="mt-4">
        <NumberInput
          value={timerValue}
          min={0}
          max={3600}
          step={5}
          label="Cycle Time (seconds)"
          suffix="sec"
          decimals={0}
          showStepper
          onChange={setTimerValue}
        />
      </Box>
    </Card>
  );
}

// Gauge Example
export function GaugeExample() {
  const [rpm, setRpm] = useState(2400);

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Gauge Examples</Text>

      <Box className="grid grid-cols-3 gap-6">
        <Gauge
          value={rpm}
          min={0}
          max={3000}
          label="Motor RPM"
          unit="RPM"
          size={150}
          warningThreshold={2500}
          dangerThreshold={2800}
          decimals={0}
        />

        <Gauge
          value={85}
          min={0}
          max={100}
          label="OEE"
          unit="%"
          size={150}
          warningThreshold={70}
          dangerThreshold={60}
          color="#22c55e"
        />

        <Gauge
          value={78}
          min={0}
          max={120}
          label="Temperature"
          unit="°C"
          size={150}
          warningThreshold={80}
          dangerThreshold={100}
          color="#f59e0b"
        />
      </Box>
    </Card>
  );
}

// DateTimePicker Example
export function DateTimeExample() {
  const [dateValue, setDateValue] = useState(null);
  const [timeValue, setTimeValue] = useState(null);
  const [datetimeValue, setDatetimeValue] = useState(null);

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Date & Time Examples</Text>

      <Box className="grid grid-cols-3 gap-4">
        <DateTimePicker
          value={dateValue}
          onChange={setDateValue}
          mode="date"
          label="Date"
          placeholder="Select date..."
        />

        <DateTimePicker
          value={timeValue}
          onChange={setTimeValue}
          mode="time"
          label="Time"
          placeholder="Select time..."
        />

        <DateTimePicker
          value={datetimeValue}
          onChange={setDatetimeValue}
          mode="datetime"
          label="Schedule"
          placeholder="Select date & time..."
        />
      </Box>
    </Card>
  );
}

// ListItem Example
export function ListExample() {
  const workOrders = [
    { id: 1, title: 'WO-9921', subtitle: 'Flange Bracket A', status: 'success', badge: 'Completed' },
    { id: 2, title: 'WO-9922', subtitle: 'Gear Housing B', status: 'warning', badge: 'In Progress' },
    { id: 3, title: 'WO-9923', subtitle: 'Shaft Cylinder C', status: 'pending', badge: 'Pending' },
    { id: 4, title: 'WO-9924', subtitle: 'Bearing Assembly D', status: 'error', badge: 'Rejected' },
  ];

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">List Examples</Text>

      <Box className="space-y-2">
        {workOrders.map((wo) => (
          <ListItem
            key={wo.id}
            title={wo.title}
            subtitle={wo.subtitle}
            status={wo.status}
            rightBadge={wo.badge}
            rightBadgeColor={wo.status}
            onClick={() => console.log('Clicked:', wo)}
          />
        ))}
      </Box>
    </Card>
  );
}

// EmptyState Example
export function EmptyStateExample() {
  const [showData, setShowData] = useState(false);

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Empty State Examples</Text>

      <Button
        onPress={() => setShowData(!showData)}
        className="mb-4"
      >
        <Button.Text>Toggle Data</Button.Text>
      </Button>

      {showData ? (
        <Box className="p-8 text-center">
          <Text>Data loaded successfully!</Text>
        </Box>
      ) : (
        <EmptyState
          icon="FileText"
          title="No Records Found"
          description="There are no records to display. Try adjusting your filters or create a new record."
          actionLabel="Create Record"
          onAction={() => console.log('Create clicked')}
          size="md"
        />
      )}
    </Card>
  );
}

// Skeleton Example
export function SkeletonExample() {
  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Loading Skeletons</Text>

      <Box className="space-y-4">
        <Skeleton variant="card" />

        <Box className="grid grid-cols-2 gap-4">
          <Skeleton variant="text" lines={2} />
          <Skeleton variant="text" lines={3} />
        </Box>

        <SkeletonList count={3} />
      </Box>
    </Card>
  );
}

// Signature Example
export function SignatureExample() {
  const [signature, setSignature] = useState(null);

  return (
    <Card className="p-4">
      <Text className="text-lg font-bold mb-4">Signature Examples</Text>

      <Box className="grid grid-cols-2 gap-4">
        <Box>
          <Signature
            value={signature}
            onChange={setSignature}
            label="QC Inspector Sign-Off"
            required
            width={300}
            height={150}
            showClearButton
            showDownloadButton
          />
          {signature && (
            <Text size="sm" className="text-green-600 mt-2">✓ Signature captured</Text>
          )}
        </Box>

        <Box>
          <Signature
            label="Supervisor Approval"
            required
            width={300}
            height={150}
            strokeColor="#714b67"
            backgroundColor="#fafafa"
          />
        </Box>
      </Box>
    </Card>
  );
}

// Combined Dashboard Example
export function GlueStackWidgetsDashboard() {
  const [goodParts, setGoodParts] = useState(127);
  const [badParts, setBadParts] = useState(3);

  return (
    <Box className="p-6 space-y-6 bg-slate-50">
      <Text className="text-2xl font-bold text-slate-800">MES Widgets Demo</Text>

      {/* KPI Section */}
      <Box className="grid grid-cols-4 gap-4">
        <Counter
          value={goodParts}
          min={0}
          max={9999}
          label="Good Parts"
          variant="card"
          colorScheme="success"
          onChange={setGoodParts}
        />
        <Counter
          value={badParts}
          min={0}
          max={9999}
          label="Bad Parts"
          variant="card"
          colorScheme="danger"
          onChange={setBadParts}
        />
        <Counter
          value={goodParts + badParts}
          min={0}
          label="Total"
          variant="card"
          onChange={() => {}}
        />
        <Gauge
          value={Math.round((goodParts / (goodParts + badParts || 1)) * 100)}
          min={0}
          max={100}
          label="Yield"
          unit="%"
          size={100}
          warningThreshold={95}
          dangerThreshold={90}
          color="#22c55e"
        />
      </Box>

      {/* Timer & Input */}
      <Box className="grid grid-cols-2 gap-4">
        <Timer
          value={0}
          duration={300}
          mode="countdown"
          label="Cycle Time"
          variant="pill"
          size="lg"
        />
        <NumberInput
          value={45}
          min={0}
          max={500}
          step={5}
          label="Target Qty"
          suffix="pcs"
          decimals={0}
        />
      </Box>

      {/* Signatures */}
      <SignatureExample />
    </Box>
  );
}

export default GlueStackWidgetsDashboard;
