import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function cleanup(): Promise<void> {
  try {
    core.info("Starting WireGuard cleanup...");

    // Check if WireGuard interface exists
    const interfaceExists = await checkInterfaceExists("wg0");

    // Stop WireGuard if running
    if (interfaceExists) {
      core.info("Stopping WireGuard connection...");
      try {
        await exec.exec("sudo", ["wg-quick", "down", "wg0"]);
        core.info("WireGuard connection stopped");
      } catch (error) {
        if (error instanceof Error) {
          core.warning(`Failed to stop WireGuard: ${error.message}`);
        }
      }
    } else {
      core.info("WireGuard interface wg0 not found, skipping disconnect");
    }

    // Remove config file if exists
    const configExists = await checkFileExists("/etc/wireguard/wg0.conf");
    if (configExists) {
      core.info("Removing WireGuard configuration...");
      await exec.exec("sudo", ["rm", "-f", "/etc/wireguard/wg0.conf"]);
      core.info("WireGuard configuration removed");
    } else {
      core.info("WireGuard config file not found, skipping cleanup");
    }

    core.info("WireGuard cleanup completed");
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Cleanup failed: ${error.message}`);
    } else {
      core.warning("Cleanup failed with unknown error");
    }
  }
}

async function checkInterfaceExists(interfaceName: string): Promise<boolean> {
  try {
    await exec.exec("ip", ["link", "show", interfaceName], { silent: true });
    return true;
  } catch {
    return false;
  }
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await exec.exec("sudo", ["test", "-f", filePath], { silent: true });
    return true;
  } catch {
    return false;
  }
}

cleanup();
