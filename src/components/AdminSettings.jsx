import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  Layout, 
  Database, 
  Image as ImageIcon, 
  Box, 
  Link2, 
  Radio, 
  BarChart3, 
  Search, 
  CheckSquare, 
  MinusSquare,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIZED_COMPONENTS } from './AppBuilder';

// Human-readable titles for widgets
const WIDGET_TITLES = {
  BUTTON: "Button",
  TEXT: "Text Label",
  INPUT_TEXT: "Text Input",
  NUMBER_INPUT: "Number Input",
  DATE_PICKER: "Date Picker",
  CHECKBOX: "Checkbox",
  SELECT_PICKER: "Dropdown Select",
  WIDGET_CONTAINER: "Widget Container",
  INTERACTIVE_TABLE: "Interactive Table",
  TULIP_TABLE: "Tulip DB Table",
  CSV_UPLOADER: "CSV File Uploader",
  EXPORT_BUTTON: "Data Export Button",
  IMAGE: "Image Box",
  VIDEO: "Video Player",
  PROGRESS_BAR: "Progress Bar",
  SLIDESHOW: "Image Slideshow",
  PDF_VIEWER: "PDF Document Viewer",
  CAROUSEL: "Visual Carousel",
  SHAPE: "Shape / Drawing Tool",
  CONNECTOR_WIDGET: "Connector API Widget",
  VARIABLE_VIEWER: "Variable Viewer",
  LOGIC_BLOCK: "Logic Block",
  API_TRIGGER: "Custom API Trigger",
  PLC_TAG_MONITOR: "PLC Tag Monitor",
  BARCODE_SCANNER: "Barcode Scanner",
  CAMERA_CAPTURE: "Camera Capture",
  SERIAL_WRITER: "Serial Port Writer",
  IoT_MONITOR: "IoT Device Monitor",
  CHART_WIDGET: "Interactive Chart",
  METRIC_CARD: "KPI Metric Card",
  TREND_LINE: "Trend Line Graph",
  HISTORY_TABLE: "History / Audit Table",
  SCADA_TANK: "SCADA Tank Control",
  SCADA_VALVE: "SCADA Valve",
  SCADA_PUMP: "SCADA Pump Engine",
  SCADA_GAUGE: "SCADA Dial Gauge",
  SCADA_MOTOR: "SCADA Motor",
  SCADA_PIPE: "SCADA Pipe Section",
  SCADA_CONVEYOR: "SCADA Conveyor Belt",
  SCADA_FAN: "SCADA Ventilation Fan",
  SCADA_HEAT_EXCHANGER: "SCADA Heat Exchanger",
  SCADA_SENSOR: "SCADA Sensor Hub"
};

const iconMap = {
  Layout: Layout,
  Database: Database,
  Image: ImageIcon,
  Box: Box,
  Link2: Link2,
  Radio: Radio,
  BarChart3: BarChart3,
  SlidersHorizontal: SlidersHorizontal
};

const DEFAULT_HIDDEN_CATEGORIES = ['MEDIA', 'SENSORS', 'CONNECTIVITY'];

const AdminSettings = () => {
  const [hiddenCategories, setHiddenCategories] = useState(DEFAULT_HIDDEN_CATEGORIES);
  const [hiddenWidgets, setHiddenWidgets] = useState([]);
  const [activeTab, setActiveTab] = useState('STANDARD_WIDGETS');
  const [widgetSearch, setWidgetSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    try {
      const cats = localStorage.getItem('mandor_hidden_categories');
      const wids = localStorage.getItem('mandor_hidden_widgets');
      if (cats) {
        const parsedCats = JSON.parse(cats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) setHiddenCategories(parsedCats);
        else setHiddenCategories(DEFAULT_HIDDEN_CATEGORIES);
      } else {
        setHiddenCategories(DEFAULT_HIDDEN_CATEGORIES);
      }
      if (wids) setHiddenWidgets(JSON.parse(wids));
    } catch (e) {
      console.error('Failed to load hidden configuration:', e);
    }
  }, []);

  // Save configuration
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('mandor_hidden_categories', JSON.stringify(hiddenCategories));
      localStorage.setItem('mandor_hidden_widgets', JSON.stringify(hiddenWidgets));
      toast.success('Widget visibility settings saved successfully!');
    } catch (e) {
      toast.error('Failed to save settings: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle category visibility
  const toggleCategory = (catKey) => {
    setHiddenCategories(prev => {
      if (prev.includes(catKey)) {
        return prev.filter(c => c !== catKey);
      } else {
        return [...prev, catKey];
      }
    });
  };

  // Toggle widget visibility
  const toggleWidget = (widgetType) => {
    setHiddenWidgets(prev => {
      if (prev.includes(widgetType)) {
        return prev.filter(w => w !== widgetType);
      } else {
        return [...prev, widgetType];
      }
    });
  };

  // Bulk actions
  const showAll = () => {
    setHiddenCategories([]);
    setHiddenWidgets([]);
    toast.success('All categories and widgets set to visible.');
  };

  const hideScadaOnly = () => {
    // Hide SCADA_CONTROL category and all SCADA widgets
    const scadaWidgets = CATEGORIZED_COMPONENTS.SCADA_CONTROL?.types || [];
    setHiddenCategories(prev => prev.includes('SCADA_CONTROL') ? prev : [...prev, 'SCADA_CONTROL']);
    setHiddenWidgets(prev => {
      const newHidden = [...prev];
      scadaWidgets.forEach(w => {
        if (!newHidden.includes(w)) newHidden.push(w);
      });
      return newHidden;
    });
    toast.success('All SCADA widgets and categories hidden.');
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden'
    }}>
      {/* Header Panel */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <SlidersHorizontal size={24} color="#2563eb" />
            Widget Visibility Manager
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Control which building blocks and categories are visible inside the App Builder palette.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={showAll}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            <CheckSquare size={16} />
            Show All
          </button>
          
          <button
            onClick={hideScadaOnly}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fee2e2',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
          >
            <MinusSquare size={16} />
            Hide SCADA
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />

          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              transition: 'background-color 0.2s',
              opacity: isSaving ? 0.7 : 1
            }}
            onMouseEnter={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseLeave={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#2563eb'; }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar: Categories Panel */}
        <div style={{
          width: '380px',
          borderRight: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', margin: 0 }}>Categories</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Toggle entire groups of widgets</p>
          </div>

          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(CATEGORIZED_COMPONENTS).map(([catKey, category]) => {
              const isHidden = hiddenCategories.includes(catKey);
              const isActive = activeTab === catKey;
              const IconComp = category.icon;

              return (
                <div
                  key={catKey}
                  onClick={() => setActiveTab(catKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? '#f0f7ff' : 'transparent',
                    border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: isHidden ? '#f1f5f9' : (isActive ? '#dbeafe' : '#f0fdf4'),
                      color: isHidden ? '#94a3b8' : (isActive ? '#2563eb' : '#16a34a'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {IconComp ? <IconComp size={18} /> : <Layout size={18} />}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: isHidden ? '#64748b' : '#1e293b',
                        textDecoration: isHidden ? 'line-through' : 'none'
                      }}>
                        {category.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {category.types.length} widgets
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(catKey);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '50%',
                      color: isHidden ? '#ef4444' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isHidden ? '#fef2f2' : '#ecfdf5',
                      transition: 'all 0.2s'
                    }}
                    title={isHidden ? 'Show category' : 'Hide category'}
                  >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content Pane: Individual Widgets list */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8fafc',
          overflow: 'hidden'
        }}>
          {/* Filter Toolbar */}
          <div style={{
            padding: '16px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                Widgets in {CATEGORIZED_COMPONENTS[activeTab]?.title}
              </span>
              {hiddenCategories.includes(activeTab) && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertCircle size={10} />
                  Category Hidden
                </span>
              )}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} color="#94a3b8" style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="text"
                placeholder="Search widgets..."
                value={widgetSearch}
                onChange={e => setWidgetSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  fontSize: '0.8rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  color: '#334155'
                }}
              />
            </div>
          </div>

          {/* Widgets Grid Container */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto'
          }}>
            {hiddenCategories.includes(activeTab) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '20px',
                color: '#b45309',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Notice:</strong> This category is currently set to hidden. Even if individual widgets below are set to visible, the entire category and its widgets will not show up in the App Builder.
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {(CATEGORIZED_COMPONENTS[activeTab]?.types || [])
                .filter(widgetKey => {
                  const title = WIDGET_TITLES[widgetKey] || widgetKey;
                  return title.toLowerCase().includes(widgetSearch.toLowerCase());
                })
                .map(widgetKey => {
                  const isWidgetHidden = hiddenWidgets.includes(widgetKey);
                  const isCatHidden = hiddenCategories.includes(activeTab);
                  const isFullyHidden = isCatHidden || isWidgetHidden;
                  const displayTitle = WIDGET_TITLES[widgetKey] || widgetKey;

                  return (
                    <div
                      key={widgetKey}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff',
                        border: isFullyHidden ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                        opacity: isFullyHidden ? 0.75 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: isWidgetHidden ? '#64748b' : '#1e293b',
                            textDecoration: isWidgetHidden ? 'line-through' : 'none'
                          }}>
                            {displayTitle}
                          </div>
                          <code style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '4px',
                            display: 'inline-block'
                          }}>
                            {widgetKey}
                          </code>
                        </div>

                        {/* Visual Eye Badge */}
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: isFullyHidden ? '#f1f5f9' : '#ecfdf5',
                          color: isFullyHidden ? '#64748b' : '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isFullyHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                          {isFullyHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '12px',
                        marginTop: '4px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HelpCircle size={12} title="Toggle whether this specific component is shown in the category palette" />
                          Visibility
                        </span>

                        {/* Switch Toggle */}
                        <div
                          onClick={() => toggleWidget(widgetKey)}
                          style={{
                            width: '40px',
                            height: '22px',
                            borderRadius: '11px',
                            backgroundColor: isWidgetHidden ? '#cbd5e1' : '#3b82f6',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: isWidgetHidden ? '2px' : '20px',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
