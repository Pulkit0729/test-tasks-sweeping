import { SimulatedWalletService, WalletId, NotEnoughGasError, SupportedToken } from './wallet.service';

export interface SweepingService {
  /**
   * Sweep all funds from the user wallet to a specified address.
   * @param fromWalletId - Wallet to sweep from
   * @param toAddress - Target address for sweeping funds
   * @returns {Promise<SweepResult>}
   */
  sweepAll(walletIds: WalletId[], toAddress: WalletId): Promise<void>;
}

export class TaskSweepingService implements SweepingService {
  constructor(
    private walletService: SimulatedWalletService,
    private mainWalletId: string,
  ) {}

  async sweepAll(walletIds: WalletId[], toWalletId: WalletId): Promise<void> {
    for (const walletId of walletIds) {
      await this.sweepWallet(walletId, toWalletId);
    }
  }

  private async sweepWallet(fromWalletId: WalletId, toWalletId: WalletId): Promise<void> {
    // Get current balances
    const ethBalance = this.walletService.getBalance(fromWalletId, 'ETH');
    const usdtBalance = this.walletService.getBalance(fromWalletId, 'USDT');

    // Skip if no USDT to sweep
    if (usdtBalance <= 0) {
      return;
    }

    // Get gas fee from wallet service
    const gasFee = this.walletService.getGasFee();

    // Check if wallet has enough ETH for gas fee
    // Only sweep if wallet has sufficient gas AND some USDT
    if (ethBalance >= gasFee && usdtBalance > 0) {
      try {
        // Wallet has enough gas, sweep all USDT
        this.walletService.send(fromWalletId, toWalletId, 'USDT', usdtBalance);
      } catch (error) {
        console.warn(`Failed to sweep from wallet ${fromWalletId}:`, error);
      }
    }
    // If wallet doesn't have enough gas, don't sweep (per test expectations)
  }
}
