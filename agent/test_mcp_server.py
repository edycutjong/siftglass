import pytest
import asyncio
import uuid
import mcp_server
from unittest.mock import MagicMock, patch

@pytest.fixture(autouse=True)
def mock_supabase():
    with patch('mcp_server.get_supabase') as mock_get_supabase:
        mock_client = MagicMock()
        mock_get_supabase.return_value = mock_client
        yield mock_client

@pytest.mark.asyncio
async def test_set_session():
    # Test setting a session
    session_id = str(uuid.uuid4())
    objective = "Test objective"
    
    # We can call the tool directly using call_tool
    args = {"session_id": session_id, "objective": objective}
    result = await mcp_server.call_tool("set_session", args)
    
    assert len(result) == 1
    assert "Active session set" in result[0].text

@pytest.mark.asyncio
async def test_report_node():
    # Must have an active session first
    session_id = str(uuid.uuid4())
    await mcp_server.call_tool("set_session", {"session_id": session_id, "objective": "Testing"})
    
    args = {
        "id": "node-1",
        "label": "192.168.1.1",
        "type": "ip",
        "details": "Suspicious IP",
        "confidence": 80,
        "position_x": 0,
        "position_y": 0
    }
    result = await mcp_server.call_tool("report_node", args)
    
    assert len(result) == 1
    assert "Reported node node-1" in result[0].text

@pytest.mark.asyncio
async def test_domain_reputation():
    # Test domain reputation logic
    malicious_args = {"domain": "api-telemetry-update.com"}
    malicious_res = await mcp_server.call_tool("domain_reputation", malicious_args)
    assert "MALICIOUS" in malicious_res[0].text

    benign_args = {"domain": "github.com"}
    benign_res = await mcp_server.call_tool("domain_reputation", benign_args)
    assert "LEGITIMATE" in benign_res[0].text

@pytest.mark.asyncio
async def test_hash_constraint_check():
    # Test hash constraint logic
    malicious_args = {"sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
    malicious_res = await mcp_server.call_tool("hash_constraint_check", malicious_args)
    assert "KNOWN_MALWARE" in malicious_res[0].text

    benign_args = {"sha256": "unknown_hash_123"}
    benign_res = await mcp_server.call_tool("hash_constraint_check", benign_args)
    assert "UNKNOWN" in benign_res[0].text
