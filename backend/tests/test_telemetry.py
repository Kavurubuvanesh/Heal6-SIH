"""
Automated Unit Tests for Zero-Trust Clinical Observability & APM (Phase 14)
"""

import pytest
from app.core.telemetry import clinical_telemetry

def test_telemetry_recording_and_percentiles():
    """Verify request recording and p50/p95 latency calculation"""
    clinical_telemetry.record_request("/api/v1/sinbad/analyze-wound", "POST", 0.185, 200)
    clinical_telemetry.record_request("/api/v1/sinbad/analyze-wound", "POST", 0.245, 200)
    clinical_telemetry.record_request("/api/v1/patients/queue", "GET", 0.015, 200)

    summary = clinical_telemetry.get_apm_telemetry_summary()
    assert summary["total_requests"] >= 3
    assert "global_latencies" in summary
    assert "p95_ms" in summary["global_latencies"]
    assert summary["global_latencies"]["p95_ms"] > 0
    assert summary["sub_300ms_compliance"] is True
    assert summary["system_health"] == "OPTIMAL"

def test_prometheus_format_export():
    """Verify Prometheus text format complies with OpenMetrics standard"""
    prom_text = clinical_telemetry.export_prometheus_text()
    assert "# HELP heal6_http_requests_total" in prom_text
    assert "# TYPE heal6_http_requests_total counter" in prom_text
    assert "# HELP heal6_inference_p95_milliseconds" in prom_text
    assert "heal6_inference_p95_milliseconds" in prom_text
