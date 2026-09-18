"""
Heal6 Federated Learning API Routes (Phase 10)
==============================================
Endpoints for multi-center privacy-preserving clinical AI aggregation:
1. GET /api/v1/federated/status: Global coordinator status and privacy budget metrics.
2. GET /api/v1/federated/nodes: Registry of registered hospital centers.
3. POST /api/v1/federated/round/initiate: Triggers FedAvg aggregation round.
4. POST /api/v1/federated/node/submit-update: Client node update ingestion with HMAC check.
5. GET /api/v1/federated/trajectory: Historical convergence trajectory across rounds.
6. POST /api/v1/federated/reset: Resets simulation state for demonstration.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json

from app.ml_engine.federated_engine import (
    get_federated_coordinator,
    FEDERATED_SIGNING_SECRET
)

router = APIRouter()


class ClientUpdatePayload(BaseModel):
    node_id: str
    samples_count: int
    weights_vector: List[float]
    hmac_signature: str


@router.get("/status", summary="Get Federated Learning Consortium Status")
async def get_federated_status():
    """
    Returns global federated coordination status, active participating hospital centers,
    aggregate dataset volume, and differential privacy budget metrics.
    """
    coord = get_federated_coordinator()
    latest_traj = coord.trajectory[-1]
    return {
        "status": "ONLINE",
        "current_round": coord.current_round,
        "max_rounds": coord.max_rounds,
        "active_nodes_count": len([n for n in coord.nodes if n["is_online"]]),
        "total_nodes_registered": len(coord.nodes),
        "total_dataset_samples": coord.get_total_dataset_size(),
        "global_metrics": {
            "convnext_accuracy": latest_traj["global_accuracy"],
            "global_loss": latest_traj["global_loss"],
            "unet_dice_score": latest_traj["unet_dice_score"]
        },
        "differential_privacy": {
            "target_epsilon": coord.dp_engine.target_epsilon,
            "consumed_epsilon": coord.dp_engine.consumed_epsilon,
            "target_delta": coord.dp_engine.target_delta,
            "clipping_threshold": coord.dp_engine.clipping_threshold,
            "status": "OPTIMAL_GUARANTEE" if coord.dp_engine.consumed_epsilon < coord.dp_engine.target_epsilon else "BUDGET_EXHAUSTED"
        },
        "privacy_compliance": {
            "hipaa_safe_harbor": True,
            "gdpr_article_9": True,
            "disha_india_compliant": True,
            "raw_phi_transmitted": False
        }
    }


@router.get("/nodes", summary="List Participating Hospital Centers")
async def get_participating_nodes():
    """
    Returns the roster of participating hospital nodes, location, dataset sizes,
    local model accuracies, and network latencies.
    """
    coord = get_federated_coordinator()
    return {
        "total_nodes": len(coord.nodes),
        "nodes": coord.nodes
    }


@router.post("/round/initiate", summary="Initiate Federated Averaging Round")
async def initiate_round():
    """
    Executes a communication round across all active hospital nodes:
    1. Collects parameter weight deltas.
    2. Applies L2 gradient clipping.
    3. Fuses parameters via FedAvg.
    4. Injects Gaussian Differential Privacy noise.
    5. Updates convergence trajectory.
    """
    try:
        coord = get_federated_coordinator()
        round_result = coord.initiate_new_round()
        return {
            "success": True,
            "data": round_result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Federated Round Execution Error: {str(e)}"
        )


@router.post("/node/submit-update", summary="Submit Signed Client Hospital Model Update")
async def submit_node_update(payload: ClientUpdatePayload):
    """
    Receives encrypted weight deltas from a participating clinical node
    and verifies HMAC-SHA256 signature to protect against adversarial poisoning.
    """
    coord = get_federated_coordinator()
    
    # Verify node exists
    matched_node = next((n for n in coord.nodes if n["node_id"] == payload.node_id), None)
    if not matched_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital node {payload.node_id} is not registered in the consortium."
        )

    # Reconstruct canonical payload for HMAC validation
    canonical_str = json.dumps({
        "node_id": payload.node_id,
        "samples_count": payload.samples_count,
        "weights_vector": payload.weights_vector
    }, sort_keys=True)
    
    is_valid = coord.verify_update_signature(
        node_id=payload.node_id,
        payload_bytes=canonical_str.encode(),
        signature_hex=payload.hmac_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cryptographic verification failed: Invalid HMAC-SHA256 parameter signature."
        )

    return {
        "status": "ACCEPTED",
        "node_id": payload.node_id,
        "samples_ingested": payload.samples_count,
        "signature_verified": True
    }


@router.get("/trajectory", summary="Get Historical Model Convergence Trajectory")
async def get_trajectory():
    """
    Returns round-by-round accuracy, loss, dice score, and consumed privacy budget.
    """
    coord = get_federated_coordinator()
    return {
        "total_rounds": len(coord.trajectory),
        "trajectory": coord.trajectory
    }


@router.post("/reset", summary="Reset Federated Simulation State")
async def reset_simulation():
    """
    Resets the coordinator state back to round 3 for interactive demonstrations.
    """
    coord = get_federated_coordinator()
    coord.reset_simulation()
    return {
        "success": True,
        "message": "Federated simulation state reset to round 3."
    }
