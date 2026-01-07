describe("Internal Transfers Flow", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    cy.visit("/transfers");
    cy.contains("h1", "انتقال داخلی").should("be.visible");
  });

  it("should allow a user to transfer money between two accounts and then delete the transfer, restoring balances", () => {
    const transferAmount = "150000";
    const transferDescription = "انتقال تستی قابل حذف";
    let initialFromBalance: number;
    let initialToBalance: number;
    let fromAccountName: string;
    let toAccountName: string;

    // --- Part 1: Get Initial Balances ---
    cy.visit('/cards');
    // Get first card balance
    cy.get('.relative.group').first().within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            initialFromBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
        });
        cy.get('span.font-bold').invoke('text').then(text => {
            fromAccountName = text;
        });
    });
    // Get second card balance
    cy.get('.relative.group').eq(1).within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            initialToBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
        });
         cy.get('span.font-bold').invoke('text').then(text => {
            toAccountName = text;
        });
    });
    cy.visit('/transfers');

    // --- Part 2: Create Transfer ---
    cy.contains("button", "ثبت انتقال جدید").click();

    cy.get('button[role="combobox"]').eq(0).click();
    cy.get('div[role="option"]').contains(fromAccountName).click();

    cy.get('button[role="combobox"]').eq(1).click();
    cy.get('div[role="option"]').contains(toAccountName).click();

    cy.get('input[name="amount"]').type(transferAmount);
    cy.get('textarea[name="description"]').type(transferDescription);
    
    cy.contains("button", "تایید و انتقال").click();

    cy.contains("۱۵۰٬۰۰۰ تومان").should("be.visible");
    cy.contains(transferDescription).should("be.visible");

    // --- Part 3: Verify New Balances ---
    cy.visit('/cards');
     cy.get('.relative.group').first().within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            const newBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
            expect(newBalance).to.eq(initialFromBalance - parseFloat(transferAmount));
        });
    });
    cy.get('.relative.group').eq(1).within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            const newBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
            expect(newBalance).to.eq(initialToBalance + parseFloat(transferAmount));
        });
    });

    // --- Part 4: Delete Transfer ---
    cy.visit('/transfers');
    cy.contains(transferDescription).parents('div.flex-col').find('button').contains('حذف تراکنش').click();
    cy.get('button').contains('بله، حذف کن').click();
    cy.contains(transferDescription).should('not.exist');

    // --- Part 5: Verify Restored Balances ---
     cy.visit('/cards');
     cy.get('.relative.group').first().within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            const finalBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
            expect(finalBalance).to.eq(initialFromBalance);
        });
    });
    cy.get('.relative.group').eq(1).within(() => {
        cy.contains('موجودی کل').invoke('text').then(text => {
            const finalBalance = parseFloat(text.replace(/[^\d.-]/g, ''));
            expect(finalBalance).to.eq(initialToBalance);
        });
    });
  });

  it("should show an error when source and destination accounts are the same", () => {
    cy.contains("button", "ثبت انتقال جدید").click();

    // Select the same account for both source and destination
    cy.get('button[role="combobox"]').eq(0).click();
    cy.get('div[role="option"]').first().click();

    cy.get('button[role="combobox"]').eq(1).click();
    cy.get('button[role="combobox"]').eq(0).invoke('text').then((fromAccountText) => {
        cy.get('div[role="option"]').contains(fromAccountText).click();
    });

    cy.get('input[name="amount"]').type("1000");
    cy.contains("button", "تایید و انتقال").click();

    // We expect a toast message for this error
    cy.contains("حساب مبدا و مقصد نمی‌توانند یکسان باشند.").should("be.visible");
  });
});
