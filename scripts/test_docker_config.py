"""
Heal6 Production Containerization Automated Verification Suite
Validates Dockerfiles, Nginx configurations, Compose schemas, security policies, and environment templates.
"""

import os
import re
import sys
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent


def report_section(title: str):
    print(f"\n{'=' * 70}\n[TEST SUITE] {title}\n{'=' * 70}")


def check(condition: bool, description: str):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {description}")
    if not condition:
        raise AssertionError(f"Check failed: {description}")


def test_docker_compose():
    report_section("Docker Compose Orchestration Specification")
    compose_path = WORKSPACE_ROOT / "docker-compose.yml"
    check(compose_path.exists(), "docker-compose.yml exists in workspace root")

    content = compose_path.read_text(encoding="utf-8")

    # Check services
    services = ["heal6-postgres", "heal6-backend", "heal6-doctor-web", "heal6-patient-app"]
    for svc in services:
        check(f"{svc}:" in content, f"Service '{svc}' defined in docker-compose.yml")

    # Check network
    check("heal6-network:" in content, "Custom bridge network 'heal6-network' configured")

    # Check persistent volume
    check("postgres_data:" in content, "Persistent volume 'postgres_data' configured")

    # Check healthchecks on all services
    for svc in services:
        pattern = rf"{svc}:[\s\S]*?healthcheck:"
        check(bool(re.search(pattern, content)), f"Healthcheck declared for '{svc}'")

    # Check resource limits
    check("limits:" in content and "cpus:" in content and "memory:" in content,
          "Container CPU/Memory resource constraints configured")

    # Check log rotation
    check('driver: "json-file"' in content and "max-size:" in content,
          "Container logging driver with max-size rotation configured")


def test_backend_dockerfile():
    report_section("Backend Dockerfile Security & Optimization")
    dockerfile_path = WORKSPACE_ROOT / "backend" / "Dockerfile"
    check(dockerfile_path.exists(), "backend/Dockerfile exists")

    content = dockerfile_path.read_text(encoding="utf-8")

    # Base image
    check("python:3.11-slim" in content, "Uses slim Python 3.11 base image")

    # OpenCV runtime packages
    check("libgl1" in content and "libglib2.0-0" in content, "Installs required OpenCV system libraries")

    # Non-root security
    check("groupadd -g 1000 heal6" in content, "Creates unprivileged system group 'heal6' (GID 1000)")
    check("useradd -u 1000" in content, "Creates unprivileged system user 'heal6' (UID 1000)")
    check("USER heal6" in content, "Switches execution context to non-root 'USER heal6' (CIS Docker Benchmark)")

    # Healthcheck
    check("HEALTHCHECK" in content and "/health" in content, "Defines automated container healthcheck via /health")

    # Exposed port & worker concurrency
    check("EXPOSE 8000" in content, "Exposes internal API port 8000")
    check("UVICORN_WORKERS" in content, "Supports configurable worker processes")


def test_doctor_web_dockerfile_and_nginx():
    report_section("Doctor Web Containerization & Nginx Proxy")
    df_path = WORKSPACE_ROOT / "doctor_web" / "Dockerfile"
    nginx_path = WORKSPACE_ROOT / "doctor_web" / "nginx.conf"

    check(df_path.exists(), "doctor_web/Dockerfile exists")
    check(nginx_path.exists(), "doctor_web/nginx.conf exists")

    df_content = df_path.read_text(encoding="utf-8")
    check("FROM node:20-alpine AS builder" in df_content, "Stage 1 uses Node 20 Alpine builder")
    check("FROM nginx:1.25-alpine AS runner" in df_content, "Stage 2 uses Nginx Alpine runner")
    check("COPY nginx.conf /etc/nginx/conf.d/default.conf" in df_content, "Copies custom Nginx configuration")
    check("HEALTHCHECK" in df_content, "Doctor web defines container healthcheck")

    nginx_content = nginx_path.read_text(encoding="utf-8")
    check("try_files $uri $uri/ /index.html;" in nginx_content, "SPA fallback try_files routing present")
    check("gzip on;" in nginx_content, "Gzip compression enabled")
    check("X-Frame-Options" in nginx_content, "Security header X-Frame-Options present")
    check("location /api/" in nginx_content, "Reverse proxy location for /api/ configured")
    check("location /ws/" in nginx_content, "Reverse proxy location for WebSocket /ws/ configured")
    check("location /health" in nginx_content, "Nginx /health probe configured")


def test_patient_app_dockerfile_and_nginx():
    report_section("Patient App Containerization & WebAssembly Nginx")
    df_path = WORKSPACE_ROOT / "heal6-patient-app" / "Dockerfile"
    nginx_path = WORKSPACE_ROOT / "heal6-patient-app" / "nginx.conf"

    check(df_path.exists(), "heal6-patient-app/Dockerfile exists")
    check(nginx_path.exists(), "heal6-patient-app/nginx.conf exists")

    df_content = df_path.read_text(encoding="utf-8")
    check("FROM node:20-alpine AS builder" in df_content, "Stage 1 uses Node 20 Alpine builder")
    check("FROM nginx:1.25-alpine AS runner" in df_content, "Stage 2 uses Nginx Alpine runner")
    check("COPY nginx.conf /etc/nginx/conf.d/default.conf" in df_content, "Copies custom Nginx configuration")
    check("HEALTHCHECK" in df_content, "Patient app defines container healthcheck")

    nginx_content = nginx_path.read_text(encoding="utf-8")
    check("application/wasm                      wasm;" in nginx_content, "WebAssembly MIME type registered")
    check("Cross-Origin-Opener-Policy" in nginx_content, "Cross-Origin-Opener-Policy header present")
    check("Cross-Origin-Embedder-Policy" in nginx_content, "Cross-Origin-Embedder-Policy header present")
    check("try_files $uri $uri/ /index.html;" in nginx_content, "SPA fallback try_files routing present")
    check("location /api/" in nginx_content, "Reverse proxy location for /api/ configured")
    check("location /health" in nginx_content, "Nginx /health probe configured")


def test_dockerignore_files():
    report_section("Dockerignore Build Context Optimizations")
    paths = [
        WORKSPACE_ROOT / ".dockerignore",
        WORKSPACE_ROOT / "backend" / ".dockerignore",
        WORKSPACE_ROOT / "doctor_web" / ".dockerignore",
        WORKSPACE_ROOT / "heal6-patient-app" / ".dockerignore",
    ]

    for p in paths:
        check(p.exists(), f"Found {p.relative_to(WORKSPACE_ROOT)}")

    # Specific exclusions
    backend_ignore = (WORKSPACE_ROOT / "backend" / ".dockerignore").read_text(encoding="utf-8")
    check("__pycache__" in backend_ignore, "backend/.dockerignore excludes __pycache__")
    check("heal6_clinical.db" in backend_ignore or "*.db" in backend_ignore,
          "backend/.dockerignore excludes local SQLite DB files")

    doctor_ignore = (WORKSPACE_ROOT / "doctor_web" / ".dockerignore").read_text(encoding="utf-8")
    check("node_modules" in doctor_ignore, "doctor_web/.dockerignore excludes node_modules")
    check("dist" in doctor_ignore, "doctor_web/.dockerignore excludes dist")

    patient_ignore = (WORKSPACE_ROOT / "heal6-patient-app" / ".dockerignore").read_text(encoding="utf-8")
    check("node_modules" in patient_ignore, "heal6-patient-app/.dockerignore excludes node_modules")
    check("dist" in patient_ignore, "heal6-patient-app/.dockerignore excludes dist")


def test_env_templates():
    report_section("Production Environment Configuration")
    env_example = WORKSPACE_ROOT / ".env.example"
    env_prod = WORKSPACE_ROOT / ".env.production"

    check(env_example.exists(), ".env.example exists")
    check(env_prod.exists(), ".env.production exists")

    example_content = env_example.read_text(encoding="utf-8")
    prod_content = env_prod.read_text(encoding="utf-8")

    required_keys = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "BACKEND_PORT", "DOCTOR_PORT", "PATIENT_PORT"]
    for key in required_keys:
        check(key in example_content, f"Key '{key}' found in .env.example")
        check(key in prod_content, f"Key '{key}' found in .env.production")


def main():
    print("Beginning Pillar 5 Containerization Automated Verification...")
    try:
        test_docker_compose()
        test_backend_dockerfile()
        test_doctor_web_dockerfile_and_nginx()
        test_patient_app_dockerfile_and_nginx()
        test_dockerignore_files()
        test_env_templates()
        print("\n" + "=" * 70)
        print("ALL PILLAR 5 CONTAINERIZATION TESTS PASSED SUCCESSFULLY! (100% COMPLIANT)")
        print("=" * 70 + "\n")
        return 0
    except Exception as e:
        print(f"\n[FAILED] Verification error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
