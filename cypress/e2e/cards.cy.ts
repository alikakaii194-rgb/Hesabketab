
describe("Bank Cards Flow", () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // Navigate to the cards page
    cy.visit("/cards");
    cy.contains("h1", "مدیریت کارت‌های بانکی").should("be.visible");
  });

  it("should allow a user to add, search for, view details of, and then delete a bank card", () => {
    const cardNumber = `60379910${Math.floor(10000000 + Math.random() * 90000000)}`;
    const bankName = "بانک ملی ایران";

    // --- Part 1: Add Card ---
    cy.contains("button", "افزودن کارت جدید").click();

    // Fill out the form
    cy.get('button[role="combobox"]').first().click(); // Open bank name dropdown
    cy.get('div[role="option"]').contains(bankName).click();

    cy.get('input[name="accountNumber"]').type(`1234567${Math.floor(Math.random() * 1000)}`);
    cy.get('input[name="cardNumber"]').type(cardNumber);
    cy.get('input[name="expiryDate"]').type("12/07");
    cy.get('input[name="cvv2"]').type("123");
    cy.get('input[name="initialBalance"]').type("500000");

    cy.get('button[role="combobox"]').eq(1).click(); // Open account type
    cy.get('div[role="option"]').contains("پس‌انداز").click();
    
    cy.contains("button", "ذخیره").click();

    // Assert the new card is visible in the list
    cy.contains(cardNumber.replace(/(\d{4})/g, '$1 ')).should("be.visible");
    cy.contains("۵۰۰٬۰۰۰ تومان").should("be.visible");

    // --- Part 2: Search for the card ---
    cy.get('input[type="text"][placeholder*="جستجو"]').type(bankName);
    cy.contains(cardNumber.replace(/(\d{4})/g, '$1 ')).should('be.visible'); // Card should still be visible
    cy.get('input[type="text"][placeholder*="جستجو"]').clear().type(cardNumber.slice(0, 8));
    cy.contains(bankName).should('be.visible'); // Card should still be visible
    cy.get('input[type="text"][placeholder*="جستجو"]').clear();


    // --- Part 3: View Details ---
    cy.contains(cardNumber.replace(/(\d{4})/g, '$1 ')).parents('.group').contains('button', 'تاریخچه').click();

    cy.url().should("include", "/cards/");
    cy.contains("h1", `تاریخچه تراکنش‌های ${bankName}`).should("be.visible");
    cy.contains("آخرین موجودی: ۵۰۰٬۰۰۰ تومان").should("be.visible");
    cy.go('back'); // Go back to the list

    // --- Part 4: Delete the card ---
    cy.contains(cardNumber.replace(/(\d{4})/g, '$1 ')).parents('.relative.group').find('button[aria-label="Actions"]').click();
    cy.contains('div', 'حذف کارت').click();
    cy.get('button').contains('بله، حذف کن').click();

    // Assert the card is no longer in the list
    cy.contains(cardNumber.replace(/(\d{4})/g, '$1 ')).should("not.exist");
  });
});
