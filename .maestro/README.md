# Maestro E2E prerequisites

Install the official Maestro CLI from mobile.dev, build/install `com.medimate.medicalaiassistant`, start a simulator/device, and provide controlled non-production account variables referenced by each flow. Do not put credentials in these YAML files.

The flows are intentionally not marked passing in release evidence until they run against an installed native build. Payment is excluded because the supplied backend/provider does not expose a safe automated sandbox charge path.
