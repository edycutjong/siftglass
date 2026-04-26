"""Mock SIEM alert for the golden-path supply-chain attack scenario."""

GOLDEN_PATH_ALERT = {
    "alert_id": "SIEM-2026-0042",
    "severity": "high",
    "source_ip": "192.168.1.42",
    "description": "Anomalous outbound traffic detected — 847 DNS queries in 5 minutes, unusual destination domains",
    "timestamp": "2026-04-25T03:42:00Z",
    "raw_events": [
        {"type": "dns", "query": "cdn.legit-analytics.com", "count": 312},
        {"type": "dns", "query": "data-exfil.darknet.io", "count": 535},
        {
            "type": "process",
            "name": "npm",
            "pid": 4821,
            "args": "install evil-pkg@2.1.0",
        },
        {"type": "file", "path": "/tmp/.hidden_shell", "action": "created"},
    ],
    "package_artifacts": [
        {
            "name": "evil-pkg",
            "version": "2.1.0",
            "sha256": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        }
    ],
}
