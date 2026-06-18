import basicSetup from '../wallet-setup/basic.setup';
import { testWithSynpress } from '@synthetixio/synpress';
import { MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright';

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test;

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle("Token Sender");
});

test("should show landing page when wallet is not connected, and airdrop form when connected", async ({ page, context, metamaskPage, extensionId }) => {
  await page.goto('/');
  await expect(page.getByTestId("landing-page")).toBeVisible();
  await expect(page.getByTestId("landing-connect-wallet")).toBeVisible();

  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
  await page.getByTestId("rk-connect-wallet").click();

  await page.getByTestId("rk-wallet-option-io.metamask").waitFor({
    state: "visible",
    timeout: 30000
  });

  await page.getByTestId("rk-wallet-option-io.metamask").click();
  await metamask.connectToDapp();
});