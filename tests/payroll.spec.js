import { test, expect } from '@playwright/test';

test.describe('Payroll System Tests', () => {
  test('should navigate to payroll page and display correct data', async ({ page }) => {
    // Navigate to the application
    await page.goto('/'); // Replace with your app's URL

    // Log in (if authentication is required)
    await page.fill('#email', 'naodalemu11@gmail.com'); // Replace with valid credentials
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('/dashboard'); // Replace with the dashboard URL

    // Navigate to the payroll page
    await page.click('text=Payroll'); // Replace with the actual text or selector for the payroll menu item

    // Verify the payroll page is displayed
    await expect(page).toHaveURL('/staff/payroll'); // Replace with the payroll page URL
    await expect(page.locator('h1')).toHaveText('Payroll'); // Replace with the actual heading text

    // Verify payroll data is displayed
    const payrollTable = page.locator('table#payroll'); // Replace with the actual selector for the payroll table
    await expect(payrollTable).toBeVisible();
    await expect(payrollTable.locator('tr')).toHaveCount(5); // Example: Verify 5 rows in the table
  });

  test('should update payroll data successfully', async ({ page }) => {
    // Navigate to the payroll page
    await page.goto('/staff/payroll'); // Replace with the payroll page URL

    // Edit payroll data
    await page.click('button#edit-payroll'); // Replace with the actual selector for the edit button
    await page.fill('input[name="salary"]', '5000'); // Replace with the actual input field selector
    await page.click('button#save-payroll'); // Replace with the actual selector for the save button

    // Verify success message
    const successMessage = page.locator('.success-message'); // Replace with the actual selector for the success message
    await expect(successMessage).toHaveText('Payroll updated successfully!');
  });
});