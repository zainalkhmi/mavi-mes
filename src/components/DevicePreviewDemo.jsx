/**
 * DevicePreviewDemo.jsx
 * Demo page showing DevicePreviewCanvas with all device presets
 */

import React, { useState } from 'react';
import { DevicePreviewCanvas, DeviceSelector, DemoHmiDashboard, DEVICE_PRESETS } from './DevicePreviewCanvas';

/**
 * DevicePreviewDemo - Main demo component
 */
const DevicePreviewDemo = () => {
  const [selectedDevice, setSelectedDevice] = useState('desktop-1080p');
  const [scaleMode, setScaleMode] = useState('FIT');
  const [showFrame, setShowFrame] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [showMultiView, setShowMultiView] = useState(false);

  const device = DEVICE_PRESETS[selectedDevice];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      backgroundColor: '#0a0a0f',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Sidebar - Device Selector */}
      <div style={{
        width: 320,
        minWidth: 320,
        backgroundColor: '#14141f',
        borderRight: '1px solid #2a2a3a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 20,
          borderBottom: '1px solid #2a2a3a'
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            📱 Device Preview
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888' }}>
            Select device to preview canvas
          </p>
        </div>

        {/* Device List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DeviceSelector
            selectedDevice={selectedDevice}
            onSelect={setSelectedDevice}
          />
        </div>

        {/* Controls */}
        <div style={{
          padding: 16,
          borderTop: '1px solid #2a2a3a',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Scale Mode */}
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6 }}>
              SCALE MODE
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['FIT', 'FILL', 'ACTUAL', 'STRETCH'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setScaleMode(mode)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: scaleMode === mode ? '#3b82f6' : '#2a2a3a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: showFrame ? '#3b82f6' : '#2a2a3a',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12
            }}>
              <input
                type="checkbox"
                checked={showFrame}
                onChange={e => setShowFrame(e.target.checked)}
                style={{ display: 'none' }}
              />
              📱 Frame
            </label>
            <label style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: showSafeArea ? '#3b82f6' : '#2a2a3a',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12
            }}>
              <input
                type="checkbox"
                checked={showSafeArea}
                onChange={e => setShowSafeArea(e.target.checked)}
                style={{ display: 'none' }}
              />
              🛡️ Safe Area
            </label>
          </div>

          {/* Multi-view Toggle */}
          <button
            onClick={() => setShowMultiView(!showMultiView)}
            style={{
              padding: 12,
              fontSize: 13,
              fontWeight: 600,
              background: showMultiView ? '#22c55e' : '#2a2a3a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            {showMultiView ? '👁️ Hide Multi-View' : '👁️ Show Multi-View'}
          </button>
        </div>
      </div>

      {/* Main Content - Canvas Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#14141f',
          borderBottom: '1px solid #2a2a3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              {device.icon} {device.name}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
              {device.width} × {device.height}px
              {device.pixelRatio > 1 && ` • Retina @${device.pixelRatio}x`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              padding: '6px 12px',
              background: '#1e293b',
              borderRadius: 6,
              fontSize: 12,
              color: '#888'
            }}>
              {device.category}
            </span>
          </div>
        </div>

        {/* Canvas Preview Area */}
        <div style={{ flex: 1, padding: 24, backgroundColor: '#0a0a0f' }}>
          {showMultiView ? (
            /* Multi-Device View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 24,
              height: '100%'
            }}>
              {/* Selected Device - Large */}
              <div style={{
                gridColumn: 'span 2',
                backgroundColor: '#1a1a2e',
                borderRadius: 16,
                overflow: 'hidden'
              }}>
                <DevicePreviewCanvas
                  devicePreset={selectedDevice}
                  scaleMode={scaleMode}
                  showDeviceFrame={showFrame}
                  showSafeArea={showSafeArea}
                  backgroundColor="#0f172a"
                >
                  <DemoHmiDashboard
                    deviceWidth={device.width}
                    deviceHeight={device.height}
                  />
                </DevicePreviewCanvas>
              </div>

              {/* Compare with other devices */}
              {['iphone-15-pro', 'ipad-pro-12', 'hmi-10inch', 'tv-1080p'].map(dev => {
                const d = DEVICE_PRESETS[dev];
                return (
                  <div
                    key={dev}
                    style={{
                      backgroundColor: '#1a1a2e',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: dev === selectedDevice ? '2px solid #3b82f6' : 'none'
                    }}
                  >
                    <div style={{
                      padding: '8px 12px',
                      background: '#14141f',
                      fontSize: 11,
                      color: '#888'
                    }}>
                      {d.icon} {d.name} ({d.width}×{d.height})
                    </div>
                    <div style={{ height: 200 }}>
                      <DevicePreviewCanvas
                        devicePreset={dev}
                        scaleMode="FIT"
                        showDeviceFrame={showFrame}
                        backgroundColor="#0f172a"
                      >
                        <DemoHmiDashboard
                          deviceWidth={d.width}
                          deviceHeight={d.height}
                        />
                      </DevicePreviewCanvas>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Device View */
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#1a1a2e',
              borderRadius: 16,
              overflow: 'hidden'
            }}>
              <DevicePreviewCanvas
                devicePreset={selectedDevice}
                scaleMode={scaleMode}
                showDeviceFrame={showFrame}
                showSafeArea={showSafeArea}
                backgroundColor="#0f172a"
              >
                <DemoHmiDashboard
                  deviceWidth={device.width}
                  deviceHeight={device.height}
                />
              </DevicePreviewCanvas>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevicePreviewDemo;
