import { testWithSynpress } from '@synthetixio/synpress'
import { ethereumWalletMockFixtures } from '@synthetixio/synpress/playwright'

// The wallet mock must not be merged with metaMaskFixtures: those launch their own
// browser context, so the mock's init script (which defines Web3Mock) would never load.
const test = testWithSynpress(ethereumWalletMockFixtures)
const { expect } = test

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
