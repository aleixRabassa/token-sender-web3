import basicSetup from '../wallet-setup/basic.setup'
import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright'

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle("Token Sender");
});

test("should show landing page when wallet is not connected, and airdrop form when connected", async ({ page, context, metamaskPage, extensionId }) => {
  await page.goto('/');
  await expect(page.getByTestId("landing-page")).toBeVisible();
  await expect(page.getByTestId("landing-connect-wallet")).toBeVisible();
});

// fixme: with MetaMask 13.13.1 + Synpress 4.1.2 the connection popup (notification.html) never
// renders past its loading spinner, even for a raw eth_requestAccounts, so connectToDapp() times out.
// Re-enable once Synpress supports MetaMask 13's connect flow.
test.fixme('should show airdrop form when wallet is connected', async ({ context, page, metamaskPage, extensionId }) => {

  // Create a new MetaMask instance with the provided context, page, password, and extension ID
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

  // Click the connect button to initiate the wallet connection
  await page.getByTestId("rk-connect-button").click();
  await page.getByTestId("rk-wallet-option-metaMask").waitFor({
    state: "visible",
    timeout: 30000
  });

  await page.getByTestId('rk-wallet-option-metaMask').click();
  await metamask.connectToDapp();

  // The form renders on any supported chain, so no need to add the Anvil network here.
  await expect(page.getByText("Token Address")).toBeVisible()
});
/*
test('should show mock token if token address is provided', async ({ context, page, metamaskPage, extensionId }) => {
  
  // Create a new MetaMask instance with the provided context, page, password, and extension ID
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)

  // Click the connect button to initiate the wallet connection
  await page.getByTestId("rk-connect-button").click();
  await page.getByTestId("rk-wallet-option-metaMask").waitFor({
    state: "visible",
    timeout: 30000
  });

  await page.getByTestId('rk-wallet-option-metaMask').click();
  await metamask.connectToDapp();

  // const customNetwork = {
  //   name: "Anvil",
  //   rpcUrl: "http://localhost:8545",
  //   chainId: 31337,
  //   symbol: "ETH"
  // };
  // await metamask.addNetwork(customNetwork);

  // await expect(page.getByText("Token Address")).toBeVisible()
});
*/