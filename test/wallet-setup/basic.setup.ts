// Import necessary Synpress modules
import { defineWalletSetup } from '@synthetixio/synpress'
import { MetaMask } from '@synthetixio/synpress/playwright'

// Define a test seed phrase and password
const SEED_PHRASE = 'test test test test test test test test test test test junk'
const PASSWORD = 'Tester@1234'

// Define the basic wallet setup
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  // Create a new MetaMask instance
  const metamask = new MetaMask(context, walletPage, PASSWORD)

  // Import the wallet using the seed phrase
  await metamask.importWallet(SEED_PHRASE)

  // Complete MetaMask v13 onboarding by clicking the "Done" button
  const doneButton = walletPage.getByTestId('onboarding-complete-done')
  await doneButton.waitFor({ state: 'visible', timeout: 10000 })
  await doneButton.click()

  // Dismiss any popover dialogs that appear after onboarding
  const popoverClose = walletPage.locator('.popover-container [data-testid="popover-close"]')
  await popoverClose.first().click({ timeout: 5000 }).catch(() => {})

  // Wait for MetaMask home page to fully load
  await walletPage.locator('button[data-testid="app-header-logo"]').waitFor({
    state: 'visible',
    timeout: 20000,
  })
})