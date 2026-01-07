describe("Income Flow", () => {
  beforeEach(() => {
    // Log in and navigate to the income page
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");
    cy.visit("/income");
    cy.contains("h1", "مدیریت درآمدها").should("be.visible");
  });

  it("should allow a user to add an income, verify balance change, and then delete it, verifying the balance is restored", () => {
    const incomeDescription = `درآمد تستی با بازگشت موجودی - ${new Date().toLocaleDateString('fa-IR')}`;
    const incomeAmount = "100000";
    let initialBalance: number;

    // --- Part 1: Get Initial Balance ---
    cy.visit('/cards');
    cy.contains('موجودی کل')
      .first()
      .invoke('text')
      .then((text) => {
        initialBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
      });
    cy.visit('/income');

    // --- Part 2: Add Income ---
    cy.contains("button", "ثبت درآمد جدید").click();

    cy.get('textarea[name="description"]').type(incomeDescription);
    cy.get('input[name="amount"]').type(incomeAmount);
    
    cy.get('button[role="combobox"]').eq(0).click();
    cy.get('div[role="option"]').first().click();
    
    cy.get('button[role="combobox"]').eq(1).click();
    cy.get('div[role="option"]').first().click();

    cy.contains("button", "ذخیره").click();

    cy.contains(incomeDescription).should("be.visible");
    cy.contains("+۱۰۰٬۰۰۰ تومان").should("be.visible");
    
    // --- Part 3: Verify Balance Increase ---
     cy.visit('/cards');
    cy.contains('موجودی کل')
      .first()
      .invoke('text')
      .then((text) => {
        const newBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
        expect(newBalance).to.eq(initialBalance + parseFloat(incomeAmount));
      });
    cy.visit('/income');

    // --- Part 4: Delete Income ---
    cy.contains(incomeDescription)
      .parents('.flex-col')
      .find('button[aria-label="حذف تراکنش"]')
      .click();

    // Confirm deletion in the dialog
    cy.get('button').contains('بله، حذف کن').click();

    // Assert the income is no longer visible
    cy.contains(incomeDescription).should("not.exist");

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
