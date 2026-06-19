import basicSetup from '../wallet-setup/basic.setup'
import { testWithSynpress } from '@synthetixio/synpress'
import { MetaMask, ethereumWalletMockFixtures, metaMaskFixtures } from '@synthetixio/synpress/playwright'
import { mergeTests } from '@playwright/test'

const test = testWithSynpress(mergeTests(ethereumWalletMockFixtures, metaMaskFixtures(basicSetup)))
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

test('wallet connection should work', async ({ page, ethereumWalletMock: mockWallet }) => {
  await mockWallet.connectToDapp()

  await expect(page.getByTestId("rk-connect-button")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("rk-connect-button").click();
  await page.getByTestId("rk-wallet-option-metaMask").waitFor({
    state: "visible",
    timeout: 15000
  });
  await page.getByTestId('rk-wallet-option-metaMask').click();

  await expect(page.getByText("Token Address")).toBeVisible({ timeout: 15000 });
});

test('should show airdrop form when wallet is connected', async ({ context, page, metamaskPage, extensionId }) => {
  
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

  const customNetwork = {
    name: "Anvil",
    rpcUrl: "http://localhost:8545",
    chainId: 31337,
    symbol: "ETH"
  };
  await metamask.addNetwork(customNetwork);

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