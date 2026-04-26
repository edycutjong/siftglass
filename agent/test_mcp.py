import asyncio
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

async def main():
    params = StdioServerParameters(command="python", args=["mcp_server.py"])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("Initialized")
            try:
                res = await session.call_tool("domain_reputation", {"domain": "data-exfil.darknet.io"})
                print(res)
            except Exception as e:
                print("Error:", e)

asyncio.run(main())
