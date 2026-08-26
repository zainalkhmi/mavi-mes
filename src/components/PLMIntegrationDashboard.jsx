/**
 * PLMIntegrationDashboard.jsx
 * Full integration between Drawing Management, Inspector Designer, and Digital Check Sheet
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, FileText, Package, Circle, Square, Triangle, Diamond,
  Plus, Trash2, Edit2, Link2, Unlink, ExternalLink, Download,
  RefreshCw, Search, Check, X, AlertTriangle, Clock, User,
  GitBranch, ClipboardCheck, FileCode, BarChart3, Eye, Settings
} from 'lucide-react';

import {
  linkBalloonToInspector,
  linkBalloonToChecksheet,
  getInspectionLinksByRevision,
  getInspectionHistory,
  generateInspectorFromBalloons,
  generateCheckSheetFromBalloons,
  getRevisionInspectionStats,
  generateFAIReport,
  generateInspectionSummary
} from '../utils/plmIntegration';

import {
  getDrawings,
  getDrawing,
  getDrawingRevisions,
  getDrawingBalloons,
  createDrawingBalloon,
  deleteDrawingBalloon,
  getDrawingRelations,
  updateDrawingBalloon
} from '../utils/mavicorePLM';

export default function PLMIntegrationDashboard() {
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [balloons, setBalloons] = useState([]);
  const [inspectionLinks, setInspectionLinks] = useState([]);
  const [stats, setStats] = useState({ total: 0, ok: 0, ng: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState('overview'); // overview, balloons, inspector, reports
  const [loading, setLoading] = useState(true);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [showChecksheetModal, setShowChecksheetModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedBalloon, setSelectedBalloon] = useState(null);
  const [FAIReport, setFAIReport] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getDrawings();
    setDrawings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectDrawing = async (drawing) => {
    setSelectedDrawing(drawing);
    const revs = await getDrawingRevisions(drawing.id);
    setRevisions(revs);
    if (revs.length > 0) {
      setSelectedRevision(revs[0]);
    } else {
      setSelectedRevision(null);
    }
  };

  const loadRevisionData = async () => {
    if (!selectedRevision) return;

    const [bals, links, statsData] = await Promise.all([
      getDrawingBalloons(selectedRevision.id),
      getInspectionLinksByRevision(selectedRevision.id),
      getRevisionInspectionStats(selectedRevision.id)
    ]);

    setBalloons(bals);
    setInspectionLinks(links);
    setStats(statsData);
  };

  useEffect(() => {
    if (selectedRevision) {
      loadRevisionData();
    }
  }, [selectedRevision]);

  const handleGenerateInspector = async () => {
    if (!selectedRevision) return;

    const result = await generateInspectorFromBalloons(selectedRevision.id, {
      name: selectedDrawing.name,
      code: selectedDrawing.code,
      currentRevision: selectedRevision.revision_code,
    });

    if (result.success) {
      // Store in localStorage for Inspector Designer to pick up
      localStorage.setItem('mandor_p lm_inspector_from_drawing', JSON.stringify(result.data));
      window.open('/inspector-designer?fromDrawing=true', '_blank');
    }
  };

  const handleGenerateChecksheet = async () => {
    if (!selectedRevision) return;

    const result = await generateCheckSheetFromBalloons(selectedRevision.id, {
      name: selectedDrawing.name,
      code: selectedDrawing.code,
    });

    if (result.success) {
      localStorage.setItem('mandor_plm_checksheet_from_drawing', JSON.stringify(result.data));
      window.open('/qa-checksheet?fromDrawing=true', '_blank');
    }
  };

  const handleGenerateFAIReport = async () => {
    if (!selectedRevision) return;

    const result = await generateFAIReport(selectedRevision.id);
    if (result.success) {
      setFAIReport(result.data);
      setShowReportModal(true);
    }
  };

  const handleLinkBalloon = async (balloonId, type) => {
    if (type === 'inspector') {
      // Navigate to inspector with balloon pre-selected
      localStorage.setItem('mandor_plm_select_balloon', balloonId);
      window.location.href = '/inspector-designer';
    }
  };

  const handleViewHistory = async (balloonId) => {
    const history = await getInspectionHistory(balloonId);
    // Show history modal or panel
    console.log('History:', history);
  };

  const styles = {
    container: {
      display: 'flex',
      height: 'calc(100vh - 120px)',
      backgroundColor: '#F1F5F9',
      fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
      width: 280,
      backgroundColor: 'white',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarHeader: {
      padding: '1rem',
      borderBottom: '1px solid #E2E8F0',
    },
    searchInput: {
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      fontSize: '0.85rem',
    },
    list: {
      flex: 1,
      overflow: 'auto',
      padding: '0.5rem',
    },
    listItem: {
      padding: '0.75rem',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '0.25rem',
      border: '1px solid transparent',
    },
    listItemActive: {
      backgroundColor: '#EFF6FF',
      borderColor: '#2563EB',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '1rem 1.5rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      padding: '1.5rem',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      textAlign: 'center',
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
    },
    statLabel: {
      fontSize: '0.8rem',
      color: '#64748B',
      marginTop: '0.25rem',
    },
    tabs: {
      display: 'flex',
      gap: '0.25rem',
      padding: '0 1.5rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #E2E8F0',
    },
    tab: {
      padding: '0.75rem 1rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '0.85rem',
      color: '#64748B',
      borderBottom: '2px solid transparent',
    },
    tabActive: {
      color: '#2563EB',
      borderBottomColor: '#2563EB',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '1.5rem',
    },
    balloonsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1rem',
    },
    balloonCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1rem',
      border: '1px solid #E2E8F0',
    },
    balloonHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.75rem',
    },
    balloonNumber: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      color: 'white',
      fontSize: '1rem',
    },
    balloonInfo: {
      flex: 1,
    },
    balloonName: {
      fontWeight: '600',
      fontSize: '0.95rem',
    },
    balloonSpec: {
      fontSize: '0.8rem',
      color: '#64748B',
    },
    balloonActions: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.75rem',
      paddingTop: '0.75rem',
      borderTop: '1px solid #F1F5F9',
    },
    btn: {
      padding: '0.5rem 0.75rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
    },
    btnPrimary: {
      backgroundColor: '#2563EB',
      color: 'white',
    },
    btnSecondary: {
      backgroundColor: '#F1F5F9',
      color: '#475569',
    },
    btnSuccess: {
      backgroundColor: '#10B981',
      color: 'white',
    },
    btnDanger: {
      backgroundColor: '#EF4444',
      color: 'white',
    },
    badge: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: '600',
    },
    badgeOk: {
      backgroundColor: '#DCFCE7',
      color: '#16A34A',
    },
    badgeNg: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
    },
    badgePending: {
      backgroundColor: '#FEF3C7',
      color: '#D97706',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      width: '90%',
      maxWidth: 800,
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
    },
    reportPreview: {
      backgroundColor: '#F8FAFC',
      borderRadius: '8px',
      padding: '1.5rem',
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      whiteSpace: 'pre-wrap',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 300,
      color: '#64748B',
      gap: '1rem',
    },
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>PLM Integration Dashboard</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Drawing Management ↔ Inspector Designer ↔ Digital Check Sheet
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleGenerateInspector}
            disabled={!selectedRevision}
          >
            <FileCode size={16} /> Generate Inspector
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnSuccess }}
            onClick={handleGenerateChecksheet}
            disabled={!selectedRevision}
          >
            <ClipboardCheck size={16} /> Generate Check Sheet
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={handleGenerateFAIReport}
            disabled={!selectedRevision}
          >
            <Download size={16} /> FAI Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#2563EB' }}>{stats.total}</div>
          <div style={styles.statLabel}>Total Points</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#16A34A' }}>{stats.ok}</div>
          <div style={styles.statLabel}>OK</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#DC2626' }}>{stats.ng}</div>
          <div style={styles.statLabel}>NG</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#D97706' }}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
      </div>

      {/* Drawing Selector */}
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <input
              type="text"
              placeholder="Search drawings..."
              style={styles.searchInput}
            />
          </div>
          <div style={styles.list}>
            {drawings.map(drawing => (
              <div
                key={drawing.id}
                style={{
                  ...styles.listItem,
                  ...(selectedDrawing?.id === drawing.id ? styles.listItemActive : {})
                }}
                onClick={() => selectDrawing(drawing)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} />
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{drawing.code}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{drawing.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.main}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('overview')}
            >
              <Layers size={16} style={{ marginRight: 4 }} /> Overview
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'balloons' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('balloons')}
            >
              <Circle size={16} style={{ marginRight: 4 }} /> Balloons ({balloons.length})
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'inspector' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('inspector')}
            >
              <FileCode size={16} style={{ marginRight: 4 }} /> Inspector Links
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'reports' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={16} style={{ marginRight: 4 }} /> Reports
            </button>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {activeTab === 'overview' && (
              <div>
                {selectedDrawing ? (
                  <div style={{ backgroundColor: 'white', borderRadius: 12, padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Drawing Info</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Code</div>
                        <div style={{ fontWeight: '500' }}>{selectedDrawing.code}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Name</div>
                        <div style={{ fontWeight: '500' }}>{selectedDrawing.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Type</div>
                        <div style={{ fontWeight: '500' }}>{selectedDrawing.drawing_type}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Revisions</div>
                        <div style={{ fontWeight: '500' }}>{revisions.length}</div>
                      </div>
                    </div>

                    {selectedRevision && (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>Current Revision: {selectedRevision.revision_code}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              Status: {selectedRevision.status}
                            </div>
                          </div>
                          <span style={{
                            ...styles.badge,
                            ...(selectedRevision.status === 'RELEASED' ? styles.badgeOk : styles.badgePending)
                          }}>
                            {selectedRevision.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <Layers size={48} />
                    <div>Select a drawing to view integration overview</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'balloons' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Balloon Annotations</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    {balloons.length} balloons
                  </span>
                </div>

                {balloons.length > 0 ? (
                  <div style={styles.balloonsGrid}>
                    {balloons.map(balloon => (
                      <div key={balloon.id} style={styles.balloonCard}>
                        <div style={styles.balloonHeader}>
                          <div style={{
                            ...styles.balloonNumber,
                            backgroundColor: balloon.color || '#3B82F6'
                          }}>
                            {balloon.balloon_number}
                          </div>
                          <div style={styles.balloonInfo}>
                            <div style={styles.balloonName}>
                              {balloon.feature?.feature_name || `Balloon ${balloon.balloon_number}`}
                            </div>
                            <div style={styles.balloonSpec}>
                              {balloon.feature?.nominal_value
                                ? `${balloon.feature.nominal_value} ${balloon.feature.unit || 'mm'}`
                                : 'No spec'}
                            </div>
                          </div>
                          {balloon.linked_inspector_id && (
                            <span style={{ ...styles.badge, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                              <Link2 size={12} /> Linked
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          Position: ({balloon.position_x}, {balloon.position_y})
                        </div>

                        <div style={styles.balloonActions}>
                          <button
                            style={{ ...styles.btn, ...styles.btnSecondary, flex: 1 }}
                            onClick={() => handleLinkBalloon(balloon.id, 'inspector')}
                          >
                            <FileCode size={14} /> {balloon.linked_inspector_id ? 'View' : 'Link'} Inspector
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.btnSecondary }}
                            onClick={() => handleViewHistory(balloon.id)}
                          >
                            <Clock size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <Circle size={48} />
                    <div>No balloons found for this revision</div>
                    <button style={{ ...styles.btn, ...styles.btnPrimary }}>
                      <Plus size={16} /> Add Balloon
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inspector' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Inspector Designer Links</h3>
                <div style={{ backgroundColor: 'white', borderRadius: 12, padding: '1.5rem' }}>
                  {inspectionLinks.length > 0 ? (
                    <div>
                      {inspectionLinks.map(link => (
                        <div key={link.id} style={{
                          padding: '1rem',
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          marginBottom: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              Balloon {link.balloon?.balloon_number}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              {link.feature?.feature_name || 'No feature'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {link.inspector_template_id && (
                              <span style={{ ...styles.badge, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                                <FileCode size={12} /> Inspector Linked
                              </span>
                            )}
                            {link.checksheet_id && (
                              <span style={{ ...styles.badge, backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                                <ClipboardCheck size={12} /> Check Sheet Linked
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      No inspector links found. Generate an Inspector template to create links.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Inspection Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <button
                    style={{
                      ...styles.btn,
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      padding: '1.5rem',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onClick={handleGenerateFAIReport}
                    disabled={!selectedRevision}
                  >
                    <Download size={32} color="#2563EB" />
                    <span style={{ fontWeight: '600' }}>FAI Report</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      First Article Inspection Report
                    </span>
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      padding: '1.5rem',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    disabled={!selectedRevision}
                  >
                    <BarChart3 size={32} color="#10B981" />
                    <span style={{ fontWeight: '600' }}>Summary Report</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Statistics Overview
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAI Report Modal */}
      {showReportModal && FAIReport && (
        <div style={styles.modal} onClick={() => setShowReportModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: 900 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={styles.modalTitle}>FAI Report - {FAIReport.reportNumber}</h3>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setShowReportModal(false)}
              >
                <X size={16} /> Close
              </button>
            </div>

            <div style={styles.reportPreview}>
              {JSON.stringify(FAIReport, null, 2)}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }}>
                <Download size={16} /> Download PDF
              </button>
              <button style={{ ...styles.btn, ...styles.btnPrimary }}>
                <ExternalLink size={16} /> Open in Report Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
