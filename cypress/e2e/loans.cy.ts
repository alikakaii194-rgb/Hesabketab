
describe("Loans Flow", () => {
  beforeEach(() => {
    // Log in and navigate to the loans page
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");
    cy.visit("/loans");
    cy.contains("h1", "مدیریت وام‌ها").should("be.visible");
  });

  it("should allow a user to add a new loan, pay an installment, view details, and then attempt deletion", () => {
    const loanTitle = `وام خرید خودرو - ${Math.floor(Math.random() * 1000)}`;
    const loanAmount = "50000000";
    const installmentAmount = "2000000";

    // --- Part 1: Add a new loan ---
    cy.contains("button", "ثبت وام جدید").click();

    // Fill out the form
    cy.get('input[name="title"]').type(loanTitle);
    cy.get('input[name="amount"]').type(loanAmount);
    cy.get('input[name="installmentAmount"]').type(installmentAmount);
    cy.get('input[name="numberOfInstallments"]').type("25");

    cy.get('button[role="combobox"]').eq(1).click(); // Owner
    cy.get('div[role="option"]').contains("مشترک").click();

    cy.contains("button", "ذخیره").click();

    // Assert the new loan is visible
    cy.contains(loanTitle).should("be.visible");
    cy.contains("۵۰٬۰۰۰٬۰۰۰ تومان").should("be.visible");

    // --- Part 2: Pay an installment ---
    cy.contains(loanTitle).parents('.group').contains("button", "پرداخت قسط").click();
    
    // In the payment dialog
    cy.get('button[role="combobox"]').last().click(); // Open bank account dropdown
    cy.get('div[role="option"]').first().click(); // Select the first bank
    cy.contains("button", "پرداخت و ثبت هزینه").click();

    // Assert the remaining amount is updated on the list view
    cy.contains(loanTitle).parents('.group').contains("۴۸٬۰۰۰٬۰۰۰ تومان").should("be.visible");
    cy.contains(loanTitle).parents('.group').contains("۱ از ۲۵ قسط").should("be.visible");

    // --- Part 3: View Details and verify ---
    cy.contains(loanTitle).parents('.group').click();
    cy.url().should('include', '/loans/');
    cy.contains('h1', loanTitle).should('be.visible');
    cy.contains('مبلغ باقی‌مانده: ۴۸٬۰۰۰٬۰۰۰ تومان').should('be.visible');
    cy.contains('td', '۲٬۰۰۰٬۰۰۰ تومان').should('be.visible'); // Check for payment in history table
    cy.go('back'); // Go back to the list

    // --- Part 4: Attempt to delete (should fail due to payment history) ---
    cy.contains(loanTitle).parents('.group').find('button[aria-label="Actions"]').click();
    cy.contains('div', 'حذف وام').click();
    // The dialog should show an error message because there's a payment history
    cy.contains('این وام دارای سابقه پرداخت است').should('be.visible');
    // The confirmation button should be disabled
    cy.get('button').contains('بله، حذف کن').should('be.disabled');
    // Close the dialog
    cy.get('button').contains('انصراف').click();
  });

  it('should filter deposit accounts based on the loan owner', () => {
    cy.contains("button", "ثبت وام جدید").click();

    // Select Fatemeh as the owner
    cy.get('button[role="combobox"]').eq(1).click();
    cy.get('div[role="option"]').contains('فاطمه').click();

    // Enable deposit on create
    cy.get('button[role="switch"]').click();

    // Open the deposit account dropdown
    cy.get('button[role="combobox"]').last().click();
    
    // Assert that only Fatemeh's accounts are visible
    cy.get('div[role="option"]').should('contain', '(فاطمه)');
    cy.get('div[role="option"]').should('not.contain', '(علی)');
    cy.get('div[role="option"]').should('not.contain', '(مشترک)');
  });
});
