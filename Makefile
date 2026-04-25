.PHONY: test test-python test-node ci install-python

# Main test target (runs both python and node tests)
test: test-node test-python

# Node tests
test-node:
	npm run test

test-node-coverage:
	npm run test:coverage

# Python agent tests
test-python:
	cd agent && source .venv/bin/activate && pytest test_mcp_server.py -v

install-python:
	cd agent && /opt/homebrew/bin/python3.13 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Full CI target
ci:
	npm run ci
	$(MAKE) test-python
