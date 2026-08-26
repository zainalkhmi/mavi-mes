/**
 * HealthDashboard.jsx
 * =====================================================
 * Health monitoring dashboard for admins
 * Shows app health, metrics, and logs
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
  Download,
  Filter,
  X,
} from 'lucide-react';
import {
  performHealthCheck,
  getMetricsSummary,
  getLogs,
  clearLogs,
  CATEGORIES,
} from '../utils/logger';
import {
  addHealthListener,
  startHealthChecks,
  stopHealthChecks,
} from '../utils/appHealthMonitor';

export default function HealthDashboard() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ level: '', category: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Initialize health monitoring
  useEffect(() => {
    startHealthChecks();

    // Subscribe to health events
    const unsubscribe = addHealthListener((event, data) => {
      if (event === 'apiCall' || event === 'reset') {
        setMetrics(getMetricsSummary());
      }
    });

    // Initial data load
    setHealthStatus(performHealthCheck());
    setMetrics(getMetricsSummary());
    setLogs(getLogs({ limit: 50 }));

    // Auto-refresh logs
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        setLogs(getLogs({ ...filter, limit: 50 }));
      }
    }, 5000);

    return () => {
      stopHealthChecks();
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Refresh data
  const refresh = () => {
    setHealthStatus(performHealthCheck());
    setMetrics(getMetricsSummary());
    setLogs(getLogs({ ...filter, limit: 50 }));
  };

  // Export logs
  const exportLogs = () => {
    const allLogs = getLogs({ limit: 1000 });
    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mavi-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get level color
  const getLevelColor = (level) => {
    switch (level) {
      case 'DEBUG': return '#6b7280';
      case 'INFO': return '#3b82f6';
      case 'WARN': return '#f59e0b';
      case 'ERROR': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Activity size={20} />
          <h2 style={styles.title}>System Health</h2>
          {healthStatus && (
            <span style={{
              ...styles.badge,
              backgroundColor: healthStatus.score >= 80 ? '#ecfdf5' : healthStatus.score >= 50 ? '#fef3c7' : '#fef2f2',
              color: healthStatus.score >= 80 ? '#065f46' : healthStatus.score >= 50 ? '#92400e' : '#991b1b',
            }}>
              {healthStatus.status.toUpperCase()}
            </span>
          )}
        </div>
        <div style={styles.headerActions}>
          <label style={styles.autoRefresh}>
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={refresh} style={styles.iconButton}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['overview', 'metrics', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && (
          <div style={styles.overviewGrid}>
            {/* Health Score */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Health Score</h3>
              <div style={styles.scoreContainer}>
                <div style={{
                  ...styles.scoreCircle,
                  backgroundColor: healthStatus?.score >= 80 ? '#ecfdf5' :
                    healthStatus?.score >= 50 ? '#fef3c7' : '#fef2f2',
                }}>
                  <span style={{
                    ...styles.scoreValue,
                    color: healthStatus?.score >= 80 ? '#059669' :
                      healthStatus?.score >= 50 ? '#d97706' : '#dc2626',
                  }}>
                    {healthStatus?.score || 0}
                  </span>
                  <span style={styles.scoreLabel}>/100</span>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Connection</h3>
              <div style={styles.statusRow}>
                {healthStatus?.isOnline ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <AlertCircle size={24} color="#ef4444" />
                )}
                <span style={styles.statusText}>
                  {healthStatus?.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Health Checks */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Health Checks</h3>
              <div style={styles.checksList}>
                {healthStatus?.checks?.map((check, i) => (
                  <div key={i} style={styles.checkRow}>
                    {check.status === 'ok' && <CheckCircle size={16} color="#10b981" />}
                    {check.status === 'warning' && <AlertCircle size={16} color="#f59e0b" />}
                    {check.status === 'error' && <AlertCircle size={16} color="#ef4444" />}
                    <span style={styles.checkName}>{check.name}</span>
                    <span style={styles.checkMessage}>{check.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Quick Stats</h3>
              <div style={styles.statsGrid}>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{metrics?.apiCalls || 0}</span>
                  <span style={styles.statLabel}>API Calls</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{metrics?.apiFailureRate || '0%'}</span>
                  <span style={styles.statLabel}>Failure Rate</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{metrics?.errors || 0}</span>
                  <span style={styles.statLabel}>Errors</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{metrics?.avgApiResponse || '0ms'}</span>
                  <span style={styles.statLabel}>Avg Response</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && metrics && (
          <div style={styles.metricsGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>API Metrics</h3>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td>Total API Calls</td>
                    <td style={styles.tableValue}>{metrics.apiCalls}</td>
                  </tr>
                  <tr>
                    <td>API Failures</td>
                    <td style={styles.tableValue}>{metrics.apiFailures}</td>
                  </tr>
                  <tr>
                    <td>Failure Rate</td>
                    <td style={{
                      ...styles.tableValue,
                      color: parseFloat(metrics.apiFailureRate) > 10 ? '#ef4444' : '#10b981',
                    }}>
                      {metrics.apiFailureRate}
                    </td>
                  </tr>
                  <tr>
                    <td>Slow API Calls</td>
                    <td style={styles.tableValue}>{metrics.slowApiCalls}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Performance</h3>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td>Avg Page Load</td>
                    <td style={styles.tableValue}>{metrics.avgPageLoad}</td>
                  </tr>
                  <tr>
                    <td>Avg API Response</td>
                    <td style={{
                      ...styles.tableValue,
                      color: parseInt(metrics.avgApiResponse) > 2000 ? '#ef4444' : '#10b981',
                    }}>
                      {metrics.avgApiResponse}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Errors</h3>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td>Total Errors</td>
                    <td style={styles.tableValue}>{metrics.errors}</td>
                  </tr>
                  <tr>
                    <td>Warnings</td>
                    <td style={styles.tableValue}>{metrics.warnings}</td>
                  </tr>
                  <tr>
                    <td>Page Loads</td>
                    <td style={styles.tableValue}>{metrics.pageLoads}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Connection</h3>
              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td>Status</td>
                    <td style={{
                      ...styles.tableValue,
                      color: metrics.isOnline ? '#10b981' : '#ef4444',
                    }}>
                      {metrics.isOnline ? 'Online' : 'Offline'}
                    </td>
                  </tr>
                  <tr>
                    <td>Last Online</td>
                    <td style={styles.tableValue}>
                      {metrics.lastOnline ? new Date(metrics.lastOnline).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td>Last Offline</td>
                    <td style={styles.tableValue}>
                      {metrics.lastOffline ? new Date(metrics.lastOffline).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={styles.logsContainer}>
            {/* Log Filters */}
            <div style={styles.logFilters}>
              <select
                value={filter.level}
                onChange={(e) => setFilter(f => ({ ...f, level: e.target.value }))}
                style={styles.select}
              >
                <option value="">All Levels</option>
                <option value="DEBUG">Debug</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>

              <select
                value={filter.category}
                onChange={(e) => setFilter(f => ({ ...f, category: e.target.value }))}
                style={styles.select}
              >
                <option value="">All Categories</option>
                <option value="auth">Auth</option>
                <option value="api">API</option>
                <option value="app">App</option>
                <option value="system">System</option>
                <option value="perf">Performance</option>
              </select>

              <button onClick={exportLogs} style={styles.iconButton}>
                <Download size={16} />
                Export
              </button>

              <button onClick={() => { clearLogs(); setLogs([]); }} style={styles.iconButton}>
                <Trash2 size={16} />
                Clear
              </button>
            </div>

            {/* Log List */}
            <div style={styles.logList}>
              {logs.length === 0 ? (
                <div style={styles.emptyState}>No logs yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={styles.logEntry}>
                    <span style={{
                      ...styles.logLevel,
                      backgroundColor: getLevelColor(log.level) + '20',
                      color: getLevelColor(log.level),
                    }}>
                      {log.level}
                    </span>
                    <span style={styles.logCategory}>[{log.category}]</span>
                    <span style={styles.logMessage}>{log.message}</span>
                    <span style={styles.logTime}>
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  autoRefresh: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  tabActive: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  scoreContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusText: {
    fontSize: '18px',
    fontWeight: '600',
  },
  checksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  checkName: {
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  checkMessage: {
    color: '#6b7280',
    marginLeft: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  stat: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableValue: {
    textAlign: 'right',
    fontWeight: '600',
  },
  logsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  logList: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    maxHeight: '500px',
    overflow: 'auto',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
  },
  logEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
  },
  logLevel: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  logCategory: {
    color: '#6b7280',
    fontWeight: '500',
  },
  logMessage: {
    flex: 1,
    color: '#374151',
    wordBreak: 'break-word',
  },
  logTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#9ca3af',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
};
