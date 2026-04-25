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
    assert f"Session {session_id} initialized" in result[0].text

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
    assert "Node '192.168.1.1' reported." in result[0].text

@pytest.mark.asyncio
async def test_domain_reputation():
    # Test domain reputation logic
    malicious_args = {"domain": "data-exfil.darknet.io"}
    malicious_res = await mcp_server.call_tool("domain_reputation", malicious_args)
    assert "MALICIOUS" in malicious_res[0].text

@pytest.mark.asyncio
async def test_hash_constraint_check():
    # Test hash constraint logic
    malicious_args = {"sha256": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"}
    malicious_res = await mcp_server.call_tool("hash_constraint_check", malicious_args)
    assert "MALICIOUS" in malicious_res[0].text

    benign_args = {"sha256": "unknown_hash_123"}
    benign_res = await mcp_server.call_tool("hash_constraint_check", benign_args)
    assert "CLEAN" in benign_res[0].text
