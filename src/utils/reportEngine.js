/**
 * reportEngine.js
 * =====================================================
 * SCADA Report Generation Engine
 * Generates PDF and Excel reports for shift summaries,
 * OEE reports, alarm summaries, and production analytics.
 * =====================================================
 */

import historian from './historianEngine';
import alarmEngine from './alarmEngine';

class ReportEngine {
    constructor() {
        this._templates = new Map();
        this._defaultTemplates();
    }

    _defaultTemplates() {
        this._templates.set('shift_summary', {
            name: 'Shift Summary Report',
            sections: ['header', 'production_summary', 'oee_metrics', 'alarm_summary', 'downtime_log', 'operator_notes']
        });
        this._templates.set('daily_oee', {
            name: 'Daily OEE Report',
            sections: ['header', 'oee_trend', 'availability_breakdown', 'performance_analysis', 'quality_metrics']
        });
        this._templates.set('alarm_history', {
            name: 'Alarm History Report',
            sections: ['header', 'alarm_summary', 'alarm_details', 'escalation_log', 'acknowledgment_stats']
        });
        this._templates.set('production_analytics', {
            name: 'Production Analytics Report',
            sections: ['header', 'output_summary', 'cycle_time_analysis', 'defect_tracking', 'trend_charts']
        });
    }

    generateShiftReport(data = {}) {
        const now = new Date();
        const shiftStart = data.shiftStart || new Date(now.getTime() - 8 * 60 * 60 * 1000);
        const shiftEnd = data.shiftEnd || now;

        const report = {
            type: 'shift_summary',
            title: 'Shift Summary Report',
            generatedAt: now.toISOString(),
            period: {
                start: shiftStart.toISOString(),
                end: shiftEnd.toISOString(),
                durationHours: (shiftEnd - shiftStart) / (1000 * 60 * 60)
            },
            sections: {}
        };

        report.sections.header = {
            title: report.title,
            period: `${this._formatDate(shiftStart)} - ${this._formatDate(shiftEnd)}`,
            shift: data.shiftNumber || 'N/A',
            operator: data.operatorName || 'N/A',
            station: data.station || 'All Stations',
            generatedAt: this._formatDateTime(now)
        };

        report.sections.production_summary = {
            title: 'Production Summary',
            data: {
                targetQuantity: data.targetQty || 0,
                actualQuantity: data.actualQty || 0,
                goodQuantity: data.goodQty || 0,
                rejectQuantity: data.rejectQty || 0,
                completionRate: data.targetQty ? Math.round((data.actualQty / data.targetQty) * 100) : 0,
                firstPassYield: data.actualQty ? Math.round((data.goodQty / data.actualQty) * 100) : 0
            }
        };

        report.sections.oee_metrics = {
            title: 'OEE Metrics',
            data: {
                availability: data.oeeAvailability || 0,
                performance: data.oeePerformance || 0,
                quality: data.oeeQuality || 0,
                oee: data.oeeTotal || 0
            }
        };

        report.sections.alarm_summary = {
            title: 'Alarm Summary',
            data: {
                totalAlarms: data.totalAlarms || 0,
                criticalAlarms: data.criticalAlarms || 0,
                unacknowledgedAlarms: data.unacknowledgedAlarms || 0,
                avgResponseTime: data.avgAlarmResponse || 'N/A'
            }
        };

        report.sections.downtime_log = {
            title: 'Downtime Log',
            events: data.downtimeEvents || []
        };

        report.sections.operator_notes = {
            title: 'Operator Notes',
            notes: data.operatorNotes || []
        };

        return report;
    }

    generateOEEReport(data = {}) {
        const now = new Date();
        const dayStart = data.date ? new Date(data.date) : new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return {
            type: 'daily_oee',
            title: 'Daily OEE Report',
            generatedAt: now.toISOString(),
            date: dayStart.toISOString().split('T')[0],
            sections: {
                header: {
                    title: 'Daily OEE Report',
                    date: this._formatDate(dayStart),
                    station: data.station || 'All Stations',
                    generatedAt: this._formatDateTime(now)
                },
                oee_trend: {
                    title: 'OEE Trend',
                    hourly: data.hourlyOEE || [],
                    average: data.averageOEE || 0,
                    target: data.oeeTarget || 85
                },
                availability_breakdown: {
                    title: 'Availability Breakdown',
                    running: data.runningTime || 0,
                    plannedDowntime: data.plannedDowntime || 0,
                    unplannedDowntime: data.unplannedDowntime || 0,
                    changeover: data.changeoverTime || 0
                },
                performance_analysis: {
                    title: 'Performance Analysis',
                    idealCycleTime: data.idealCycleTime || 0,
                    actualCycleTime: data.actualCycleTime || 0,
                    speedLoss: data.speedLoss || 0,
                    minorStops: data.minorStops || 0
                },
                quality_metrics: {
                    title: 'Quality Metrics',
                    totalProduced: data.totalProduced || 0,
                    goodParts: data.goodParts || 0,
                    defects: data.defects || 0,
                    rework: data.rework || 0,
                    scrap: data.scrap || 0,
                    firstPassYield: data.totalProduced ? Math.round((data.goodParts / data.totalProduced) * 100) : 0
                }
            }
        };
    }

    generateAlarmReport(data = {}) {
        const now = new Date();
        const alarms = data.alarms || alarmEngine.getAlarmHistory({
            startTime: data.startTime || Date.now() - 24 * 60 * 60 * 1000,
            endTime: data.endTime || Date.now()
        });

        const stats = alarmEngine.getAlarmStats();

        const bySeverity = {};
        const byTag = {};
        const responseTimes = [];

        alarms.forEach(alarm => {
            const sev = alarm.severity?.label || 'Unknown';
            bySeverity[sev] = (bySeverity[sev] || 0) + 1;
            byTag[alarm.tagName] = (byTag[alarm.tagName] || 0) + 1;
            if (alarm.acknowledgedAt && alarm.triggeredAt) {
                responseTimes.push(alarm.acknowledgedAt - alarm.triggeredAt);
            }
        });

        const avgResponse = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        return {
            type: 'alarm_history',
            title: 'Alarm History Report',
            generatedAt: now.toISOString(),
            sections: {
                header: {
                    title: 'Alarm History Report',
                    period: `${this._formatDate(new Date(data.startTime || Date.now() - 86400000))} - ${this._formatDate(now)}`,
                    generatedAt: this._formatDateTime(now)
                },
                alarm_summary: {
                    title: 'Alarm Summary',
                    totalAlarms: alarms.length,
                    bySeverity,
                    byTag,
                    avgResponseTimeMs: Math.round(avgResponse),
                    unacknowledged: stats.unacknowledged
                },
                alarm_details: {
                    title: 'Alarm Details',
                    alarms: alarms.map(a => ({
                        id: a.id,
                        tagName: a.tagName,
                        severity: a.severity?.label,
                        state: a.state,
                        message: a.message,
                        triggeredAt: this._formatDateTime(new Date(a.triggeredAt)),
                        acknowledgedAt: a.acknowledgedAt ? this._formatDateTime(new Date(a.acknowledgedAt)) : 'Not acknowledged',
                        acknowledgedBy: a.acknowledgedBy || 'N/A',
                        duration: a.returnedToNormalAt
                            ? `${Math.round((a.returnedToNormalAt - a.triggeredAt) / 1000)}s`
                            : 'Ongoing'
                    }))
                }
            }
        };
    }

    generateCSV(report) {
        if (!report || !report.sections) return '';
        let csv = '';

        csv += `Report: ${report.title}\n`;
        csv += `Generated: ${report.generatedAt}\n\n`;

        for (const [key, section] of Object.entries(report.sections)) {
            if (section.title) csv += `${section.title}\n`;
            if (section.data && typeof section.data === 'object') {
                for (const [k, v] of Object.entries(section.data)) {
                    csv += `${k},${v}\n`;
                }
            }
            if (section.alarms && Array.isArray(section.alarms)) {
                csv += 'ID,Tag,Severity,State,Message,Triggered,Acknowledged,Duration\n';
                section.alarms.forEach(a => {
                    csv += `${a.id},${a.tagName},${a.severity},${a.state},"${a.message}",${a.triggeredAt},${a.acknowledgedAt},${a.duration}\n`;
                });
            }
            csv += '\n';
        }

        return csv;
    }

    generateJSON(report) {
        return JSON.stringify(report, null, 2);
    }

    downloadReport(report, format = 'json') {
        let content, mimeType, extension;

        if (format === 'csv') {
            content = this.generateCSV(report);
            mimeType = 'text/csv';
            extension = 'csv';
        } else {
            content = this.generateJSON(report);
            mimeType = 'application/json';
            extension = 'json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.type || 'report'}_${this._formatDateFile(new Date())}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    _formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).format(date);
    }

    _formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(date);
    }

    _formatDateFile(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    }
}

const reportEngine = new ReportEngine();
export default reportEngine;
export { ReportEngine };
