# WireGuard Action

A GitHub Action to set up a WireGuard VPN connection in your workflows. This action installs WireGuard on Ubuntu runners, establishes a VPN connection, and **automatically cleans up** on workflow completion.

## Features

- Installs WireGuard and required dependencies on Ubuntu runners
- Supports both plain text and base64 encoded configuration files
- Override `AllowedIPs` without updating your secrets
- **Automatic cleanup** - VPN connection and config files are removed when the job completes (even on failure)
- Secure handling of sensitive configuration data

## Usage

### Basic Example

```yaml
name: Deploy with VPN

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup WireGuard VPN
        uses: rkalkani/wireguard-action@v1
        with:
          wg-config-file: ${{ secrets.WG_CONFIG }}

      - name: Access internal resources
        run: |
          # Your commands that require VPN access
          curl https://internal.example.com/api

      # No cleanup step needed - it's automatic!
```

### With AllowedIPs Override

Override `AllowedIPs` dynamically without updating your secret:

```yaml
- name: Setup WireGuard VPN
  uses: rkalkani/wireguard-action@v1
  with:
    wg-config-file: ${{ secrets.WG_CONFIG }}
    allowed-ips: "10.0.0.0/8, 192.168.1.0/24"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `wg-config-file` | WireGuard configuration file content (plain text or base64 encoded) | Yes | - |
| `allowed-ips` | Override AllowedIPs in the WireGuard config | No | - |

## Configuration

### Storing Your WireGuard Config

1. Go to your repository **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Name it `WG_CONFIG` (or any name you prefer)
4. Paste your WireGuard configuration file content

#### Plain Text Config

You can paste your WireGuard config directly:

```ini
[Interface]
PrivateKey = your_private_key_here
Address = 10.0.0.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = server_public_key_here
AllowedIPs = 0.0.0.0/0
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25
```

#### Base64 Encoded Config

For additional security or to avoid formatting issues, you can base64 encode your config:

```bash
base64 -w 0 < your-wireguard.conf
```

Then store the output as your secret.

### Using AllowedIPs Override

The `allowed-ips` input lets you override the `AllowedIPs` setting in your WireGuard config without modifying your secret. This is useful when:

- You need to route traffic to different IP ranges per workflow
- Your target IPs change frequently
- You want to limit VPN routing to specific destinations

```yaml
# Route only specific subnets through VPN
- name: Setup WireGuard VPN
  uses: rkalkani/wireguard-action@v1
  with:
    wg-config-file: ${{ secrets.WG_CONFIG }}
    allowed-ips: "10.10.0.0/16, 172.16.0.0/12"
```

## Automatic Cleanup

This action automatically cleans up when the job completes:

- Stops the WireGuard connection
- Removes the configuration file from disk

Cleanup runs **automatically** via the action's `post` hook - no manual cleanup step required! This works even if your workflow fails.

## Requirements

- **Runner OS**: Ubuntu (ubuntu-latest, ubuntu-22.04, ubuntu-24.04)
- **Node.js**: 24.x (used by the action runtime)
- **Permissions**: The action requires sudo access (available by default on GitHub-hosted runners)

## Security Considerations

- Always store your WireGuard configuration in GitHub Secrets
- Never commit WireGuard private keys to your repository
- The action automatically sets restrictive permissions (600) on the config file
- Configuration files are automatically removed during cleanup

## Example: Multi-Job Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup WireGuard VPN
        uses: rkalkani/wireguard-action@v1
        with:
          wg-config-file: ${{ secrets.WG_CONFIG }}

      - name: Run tests against internal services
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup WireGuard VPN
        uses: rkalkani/wireguard-action@v1
        with:
          wg-config-file: ${{ secrets.WG_CONFIG }}
          allowed-ips: "10.0.0.5/32"

      - name: Deploy to internal server
        run: ./deploy.sh
```

## Troubleshooting

### Connection Issues

If the VPN connection fails, check:

1. Your WireGuard configuration is valid
2. The endpoint is reachable from GitHub Actions runners
3. Firewall rules allow the connection

### DNS Resolution

If you experience DNS issues after connecting:

1. Ensure your WireGuard config includes the `DNS` setting
2. The action installs `resolvconf` to handle DNS configuration

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development setup, building, and releasing.

### Quick Start

```bash
pnpm install
pnpm build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
