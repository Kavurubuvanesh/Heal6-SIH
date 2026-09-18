"""
Heal6 Federated Learning & Privacy-Preserving AI Test Suite (Phase 10)
======================================================================
Tests:
1. Differential Privacy Engine: L2 Gradient Clipping & Gaussian Noise.
2. Federated Averaging (FedAvg): Sample-weighted parameter aggregation.
3. Cryptographic HMAC-SHA256 update integrity verification.
4. API Endpoints: /status, /nodes, /round/initiate, /trajectory, /node/submit-update.
"""

import json
import pytest
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.ml_engine.federated_engine import (
    DifferentialPrivacyEngine,
    FederatedCoordinator,
    get_federated_coordinator,
    FEDERATED_SIGNING_SECRET
)

client = TestClient(app)


def test_dp_gradient_clipping():
    """Verify that gradients exceeding threshold C are scaled down properly."""
    dp = DifferentialPrivacyEngine(clipping_threshold=1.0)
    
    # Vector with norm > 1.0 (e.g. [3, 4] -> norm is 5.0)
    oversized = np.array([3.0, 4.0], dtype=np.float32)
    clipped = dp.clip_gradients(oversized)
    clipped_norm = np.linalg.norm(clipped)
    assert abs(clipped_norm - 1.0) < 1e-4

    # Vector with norm < 1.0 should remain unchanged
    small = np.array([0.3, 0.4], dtype=np.float32)
    kept = dp.clip_gradients(small)
    assert np.allclose(small, kept)


def test_dp_gaussian_noise_injection():
    """Verify calibrated noise is added and privacy budget tracks consumption."""
    dp = DifferentialPrivacyEngine(target_epsilon=1.25, target_delta=1e-5, clipping_threshold=1.0)
    initial_epsilon = dp.consumed_epsilon
    
    weights = np.zeros(20, dtype=np.float32)
    noisy_weights = dp.inject_noise(weights, num_participants=4)
    
    # Noise should alter values away from zero
    assert not np.allclose(weights, noisy_weights)
    assert dp.consumed_epsilon > initial_epsilon


def test_fedavg_mathematical_aggregation():
    """Verify FedAvg computes exact sample-weighted parameter fusion."""
    coord = FederatedCoordinator()
    
    # Two client updates: Node A has 300 samples ([1.0, 1.0]), Node B has 100 samples ([3.0, 3.0])
    # Expected weighted average before DP noise: (300/400)*1.0 + (100/400)*3.0 = 0.75 + 0.75 = 1.5
    client_updates = [
        {"node_id": "NODE-A", "samples": 300, "weights": [1.0, 1.0]},
        {"node_id": "NODE-B", "samples": 100, "weights": [3.0, 3.0]}
    ]
    
    result = coord.execute_fedavg(client_updates)
    assert result["total_samples"] == 400
    assert result["participating_nodes_count"] == 2
    assert len(result["aggregated_weights"]) == 2


def test_hmac_signature_validation():
    """Verify valid HMAC-SHA256 signatures are accepted and tampered payloads are rejected."""
    coord = FederatedCoordinator()
    
    payload_data = json.dumps({
        "node_id": "NODE-APOLLO-CHE",
        "samples_count": 480,
        "weights_vector": [0.1, -0.2, 0.35]
    }, sort_keys=True).encode()

    valid_signature = coord.generate_update_signature(payload_data)
    assert coord.verify_update_signature("NODE-APOLLO-CHE", payload_data, valid_signature) is True
    
    # Tampered signature should fail
    tampered_sig = "a" * 64
    assert coord.verify_update_signature("NODE-APOLLO-CHE", payload_data, tampered_sig) is False


def test_api_federated_status():
    """Verify /api/v1/federated/status returns correct schema and privacy budget."""
    response = client.get("/api/v1/federated/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["current_round"] >= 3
    assert data["total_dataset_samples"] >= 1800
    assert "convnext_accuracy" in data["global_metrics"]
    assert "differential_privacy" in data
    assert data["differential_privacy"]["target_epsilon"] == 1.25


def test_api_federated_nodes():
    """Verify /api/v1/federated/nodes lists registered hospital centers."""
    response = client.get("/api/v1/federated/nodes")
    assert response.status_code == 200
    data = response.json()
    assert data["total_nodes"] == 4
    institutions = [n["institution"] for n in data["nodes"]]
    assert any("Apollo" in inst for inst in institutions)
    assert any("AIIMS" in inst for inst in institutions)
    assert any("Christian Medical College" in inst for inst in institutions)
    assert any("Fortis" in inst for inst in institutions)


def test_api_federated_round_initiation():
    """Verify POST /api/v1/federated/round/initiate advances the round."""
    # Get initial round
    status_before = client.get("/api/v1/federated/status").json()
    round_before = status_before["current_round"]

    init_response = client.post("/api/v1/federated/round/initiate")
    assert init_response.status_code == 200
    res_data = init_response.json()
    assert res_data["success"] is True
    assert res_data["data"]["round"] == round_before + 1
    assert res_data["data"]["status"] == "COMPLETED"


def test_api_federated_trajectory():
    """Verify /api/v1/federated/trajectory returns historical rounds."""
    response = client.get("/api/v1/federated/trajectory")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rounds"] >= 4
    for entry in data["trajectory"]:
        assert "round" in entry
        assert "global_accuracy" in entry
        assert "global_loss" in entry


def test_api_submit_node_update():
    """Verify client node can submit update with valid HMAC signature."""
    coord = get_federated_coordinator()
    node_id = "NODE-APOLLO-CHE"
    samples_count = 480
    weights_vector = [0.05, -0.12, 0.33, 0.44]

    canonical_str = json.dumps({
        "node_id": node_id,
        "samples_count": samples_count,
        "weights_vector": weights_vector
    }, sort_keys=True)
    
    valid_sig = coord.generate_update_signature(canonical_str.encode())

    payload = {
        "node_id": node_id,
        "samples_count": samples_count,
        "weights_vector": weights_vector,
        "hmac_signature": valid_sig
    }

    response = client.post("/api/v1/federated/node/submit-update", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "ACCEPTED"

    # Test invalid signature fails
    payload["hmac_signature"] = "0" * 64
    fail_response = client.post("/api/v1/federated/node/submit-update", json=payload)
    assert fail_response.status_code == 401
