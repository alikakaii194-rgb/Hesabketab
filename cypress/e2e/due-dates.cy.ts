
describe("Due Dates Page", () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // Navigate to the due dates page
    cy.visit("/due-dates");
    cy.contains("h1", "سررسیدهای نزدیک").should("be.visible");
  });

  it("should display upcoming deadlines like pending checks and loan installments", () => {
    // This is a "read-only" test. It assumes there is some data seeded.
    // It looks for at least one item of any type (check, loan, debt).
    // The component shows items due in the next 15 days or overdue.
    
    cy.get('div[class*="space-y-4"]').within(() => {
        // Look for at least one card that contains a due date title
        // This makes the test flexible and not dependent on specific data
        cy.contains('[class*="font-bold"]', 'تومان').should('be.visible'); 
        cy.contains('p', 'موعد:').should('be.visible');
    });
  });

  it("should navigate to the correct page when the action button is clicked", () => {
    // Find the first deadline card and click its action button
    cy.get('button').contains('پرداخت').first().click();

    // Check that we've been redirected. The URL could be /loans or /debts.
    cy.url().should('not.eq', 'http://localhost:3000/due-dates');
    // Check that one of the possible page titles is visible
    cy.get('h1').should(h1 => {
        expect(h1.text()).to.be.oneOf(['مدیریت وام‌ها', 'مدیریت بدهی‌ها', 'مدیریت چک‌ها']);
    });
  });
});
