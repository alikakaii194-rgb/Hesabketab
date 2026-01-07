describe("Expenses Flow", () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // Navigate to the expenses page
    cy.visit("/transactions");
    cy.contains("h1", "مدیریت هزینه‌ها").should("be.visible");
  });

  it("should allow a user to add an expense, verify balance change, and then delete it, verifying the balance is restored", () => {
    const expenseDescription = `هزینه تستی با بازگشت موجودی - ${new Date().getTime()}`;
    const expenseAmount = "5000";
    let initialBalance: number;

    // --- Part 1: Get Initial Balance ---
    cy.visit('/cards');
    cy.contains('موجودی کل')
      .first()
      .invoke('text')
      .then((text) => {
        initialBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
      });
    cy.visit('/transactions');

    // --- Part 2: Add Expense ---
    cy.contains("button", "ثبت هزینه جدید").click();

    // Fill out the form
    cy.get('textarea[name="description"]').type(expenseDescription);
    cy.get('input[name="amount"]').type(expenseAmount);

    cy.get('button[role="combobox"]').first().click(); 
    cy.get('div[role="option"]').first().click(); 

    cy.get('button[role="combobox"]').eq(1).click(); 
    cy.get('div[role="option"]').first().click(); 
    
    cy.contains("button", "ذخیره").click();

    // Assert the new expense is visible
    cy.contains("p", expenseDescription).should("be.visible");
    cy.contains("p", "-۵٬۰۰۰ تومان").should("be.visible");

    // --- Part 3: Verify Balance Reduction ---
    cy.visit('/cards');
    cy.contains('موجودی کل')
      .first()
      .invoke('text')
      .then((text) => {
        const newBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
        expect(newBalance).to.eq(initialBalance - parseFloat(expenseAmount));
      });
    cy.visit('/transactions');

    // --- Part 4: Delete Expense ---
    cy.contains("p", expenseDescription)
      .parents('.flex-grow')
      .find('button[aria-label="حذف هزینه"]')
      .click();

    // Confirm deletion in the dialog
    cy.get('button').contains('بله، حذف کن').click();

    // Assert the expense is no longer visible
    cy.contains("p", expenseDescription).should("not.exist");
    
    // --- Part 5: Verify Balance Restoration ---
    cy.visit('/cards');
    cy.contains('موجودی کل')
      .first()
      .invoke('text')
      .then((text) => {
        const finalBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
        expect(finalBalance).to.eq(initialBalance);
      });
  });
});
