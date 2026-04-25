#!/bin/bash

# Simple script to run the SIFT.Glass demo for video recording
echo "SIFT.Glass Demo Runner"
echo "----------------------"

echo "[1/4] Checking Supabase status..."
npx supabase status || {
  echo "Supabase not running. Starting local Supabase..."
  npx supabase start
}

echo "[2/4] Starting Next.js frontend (in background)..."
pnpm dev > /dev/null 2>&1 &
FRONTEND_PID=$!

echo "Waiting for frontend to compile (10 seconds)..."
sleep 10

echo "Frontend is running at http://localhost:3000"
echo ""
echo "🔥 Ready to record! Start your screen recorder now."
echo "Press ENTER when you are ready to launch the OpenClaw IR agent."
read -p ""

echo "[3/4] Activating Python environment and launching agent..."
cd agent
source .venv/bin/activate
python agent.py

echo ""
echo "[4/4] Agent finished. Shutting down frontend..."
kill $FRONTEND_PID
echo "Demo complete."
