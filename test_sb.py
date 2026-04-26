import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")
url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(url, key)
try:
    res = sb.table("agent_state").select("*").limit(1).execute()
    print("Success:", res.data)
except Exception as e:
    print("Error:", repr(e))
