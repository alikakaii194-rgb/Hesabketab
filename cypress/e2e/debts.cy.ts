
describe("Debts Flow", () => {
  beforeEach(() => {
    // Log in and navigate to the debts page
    cy.visit("/login");
    cy.get('input[name="email"]').type("fatemeh@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");
    cy.visit("/debts");
    cy.contains("h1", "مدیریت بدهی‌ها").should("be.visible");
  });

  it("should allow a user to add a new installment-based debt, pay it, view details, and then fail to delete it", () => {
    const debtDescription = `بدهی تستی قسطی - ${new Date().getTime()}`;
    const debtAmount = "1000000";
    const installmentAmount = "200000";

    // --- Part 1: Add a new debt ---
    cy.contains("button", "ثبت بدهی جدید").click();

    // Fill out the form
    cy.get('textarea[name="description"]').type(debtDescription);
    cy.get('input[name="amount"]').type(debtAmount);

    cy.get('button[role="combobox"]').eq(0).click(); // Payee
    cy.get('div[role="option"]').first().click();

    cy.get('button[role="combobox"]').eq(1).click(); // Owner
    cy.get('div[role="option"]').contains("مشترک").click();
    
    cy.get('button[role="switch"]').click(); // Make it installment based

    cy.get('input[name="installmentAmount"]').type(installmentAmount);
    cy.get('input[name="numberOfInstallments"]').type("5");

    cy.contains("button", "ذخیره").click();

    // Assert the new debt is visible
    cy.contains(debtDescription).should("be.visible");
    cy.contains("۱٬۰۰۰٬۰۰۰ تومان").should("be.visible");

    // --- Part 2: Pay an installment ---
    cy.contains(debtDescription).parents('.group').contains("button", "پرداخت بدهی").click();
    
    // Confirm payment in the dialog
    cy.get('button[role="combobox"]').last().click(); // Select bank account
    cy.get('div[role="option"]').first().click();
    cy.contains("button", "پرداخت و ثبت هزینه").click();

    // Assert the remaining amount is updated
    cy.contains(debtDescription).parents('.group').contains("۸۰۰٬۰۰۰ تومان").should("be.visible");
    
    // --- Part 3: View Details and Verify ---
    cy.contains(debtDescription).parents('.group').click();
    cy.url().should('include', '/debts/');
    cy.contains('h1', debtDescription).should('be.visible');
    cy.contains('مبلغ باقی‌مانده: ۸۰۰٬۰۰۰ تومان').should('be.visible');
    cy.contains('td', '۲۰۰٬۰۰۰ تومان').should('be.visible'); // Check for payment in history table
    cy.go('back'); // Go back to the list

    // --- Part 4: Attempt to delete (should fail) ---
    cy.contains(debtDescription).parents('.group').find('button[aria-label="Actions"]').click();
    cy.contains('div', 'حذف بدهی').click({force: true});
    cy.contains('این بدهی دارای سابقه پرداخت است').should('be.visible');
    cy.get('button').contains('بله، حذف کن').should('be.disabled');
    cy.get('button').contains('انصراف').click();
  });
  
  it("should allow a user to add a single-payment debt and then delete it", () => {
    const debtDescription = `بدهی تستی حذف شدنی - ${new Date().getTime()}`;
    const debtAmount = "50000";

    // --- Part 1: Add a new single-payment debt ---
    cy.contains("button", "ثبت بدهی جدید").click();

    cy.get('textarea[name="description"]').type(debtDescription);
    cy.get('input[name="amount"]').type(debtAmount);

    cy.get('button[role="combobox"]').eq(0).click(); // Payee
    cy.get('div[role="option"]').first().click();

    cy.get('button[role="combobox"]').eq(1).click(); // Owner
    cy.get('div[role="option"]').contains("علی").click();
    
    // Keep isInstallment switch off (default)

    cy.contains("button", "ذخیره").click();

    // Assert the new debt is visible
    cy.contains(debtDescription).should("be.visible");
    cy.contains("۵۰٬۰۰۰ تومان").should("be.visible");
    
    // --- Part 2: Delete the debt (should succeed) ---
    cy.contains(debtDescription).parents('.group').find('button[aria-label="Actions"]').click();
    cy.contains('div', 'حذف بدهی').click({force: true});

    // Assert that there's no error message and delete button is enabled
    cy.contains('این بدهی دارای سابقه پرداخت است').should('not.exist');
    cy.get('button').contains('بله، حذف کن').should('not.be.disabled');
    
    // Confirm deletion
    cy.get('button').contains('بله، حذف کن').click();

    // Assert the debt is gone
    cy.contains(debtDescription).should("not.exist");
  });
});
