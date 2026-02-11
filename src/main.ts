import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";

/**
 * Remove DNS settings from WireGuard config to prevent wg-quick from hanging.
 * GitHub Actions runners use resolvconf which can cause hangs when DNS is set.
 */
function removeDnsConfig(configContent: string): string {
  const dnsMatch = configContent.match(/^DNS\s*=.*/m);
  if (dnsMatch) {
    core.info("Removing DNS setting to prevent resolvconf hang...");
    return configContent.replace(/^DNS\s*=.*\n?/gm, "");
  }
  return configContent;
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const wgConfig = core.getInput("wg-config-file", { required: true });
    const allowedIps = core.getInput("allowed-ips");
    const keepDns = core.getInput("keep-dns") === "true";

    // Install WireGuard
    core.info("Installing WireGuard...");
    await exec.exec("sudo", ["apt-get", "update"]);
    await exec.exec("sudo", [
      "apt-get",
      "install",
      "-y",
      "wireguard",
      "wireguard-tools",
      "resolvconf",
    ]);

    // Decode config if base64 encoded
    let configContent = decodeConfig(wgConfig);

    // Override AllowedIPs if provided
    if (allowedIps) {
      core.info(`Overriding AllowedIPs with: ${allowedIps}`);
      configContent = configContent.replace(/^AllowedIPs\s*=.*/m, `AllowedIPs = ${allowedIps}`);
    }

    // Remove DNS setting by default to prevent wg-quick from hanging on resolvconf
    if (!keepDns) {
      configContent = removeDnsConfig(configContent);
    }

    // Create config directory and write config file
    core.info("Setting up WireGuard configuration...");
    await exec.exec("sudo", ["mkdir", "-p", "/etc/wireguard"]);

    // Write config to temp file first, then move with sudo
    const tempConfigPath = "/tmp/wg0.conf";
    fs.writeFileSync(tempConfigPath, configContent, { mode: 0o600 });
    await exec.exec("sudo", ["mv", tempConfigPath, "/etc/wireguard/wg0.conf"]);
    await exec.exec("sudo", ["chmod", "600", "/etc/wireguard/wg0.conf"]);

    // Start WireGuard
    core.info("Starting WireGuard connection...");
    await exec.exec("sudo", ["wg-quick", "up", "wg0"]);

    // Show connection status
    core.info("WireGuard connection established");
    await exec.exec("sudo", ["wg", "show"]);

    // Save state for cleanup
    core.saveState("wireguard-started", "true");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed("Action failed with unknown error");
    }
  }
}

function decodeConfig(wgConfig: string): string {
  try {
    const decoded = Buffer.from(wgConfig, "base64").toString("utf-8");
    // Verify it looks like a valid WireGuard config
    if (decoded.includes("[Interface]")) {
      return decoded;
    }
  } catch {
    // Not base64 encoded, use as plain text
  }
  return wgConfig;
}

run();
