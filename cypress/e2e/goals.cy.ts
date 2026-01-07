
describe("Financial Goals Flow", () => {
  beforeEach(() => {
    // Log in and navigate to the goals page
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");
    cy.visit("/goals");
    cy.contains("h1", "اهداف مالی").should("be.visible");
  });

  it("should allow a user to create a new goal, add funds, and view details", () => {
    const goalName = `سفر به کیش - ${new Date().getTime()}`;
    const targetAmount = "15000000";
    const contributionAmount = "500000";

    // --- Part 1: Create a new goal ---
    
    // 1. Click "Add New Goal"
    cy.contains("button", "افزودن هدف جدید").click();

    // 2. Fill out the form
    cy.get('input[name="name"]').type(goalName);
    cy.get('input[name="targetAmount"]').type(targetAmount);

    // 3. Submit
    cy.contains("button", "افزودن هدف").click();

    // 4. Assert the new goal is in the list
    cy.contains(goalName).should("be.visible");
    cy.contains("۰ تومان").should("be.visible"); // Initial amount is 0

    // --- Part 2: Add funds to the goal ---

    // 5. Find the goal and click "Add to Savings"
    cy.contains(goalName).parents('.group').contains("button", "افزایش پس‌انداز").click();

    // 6. Fill the contribution dialog
    cy.get('input[name="amount"]').last().type(contributionAmount);
    
    cy.get('button[role="combobox"]').last().click();
    cy.get('div[role="option"]').first().click();

    // 7. Submit contribution
    cy.contains("button", "افزودن و مسدود کردن").click();
    
    // 8. Assert the new total is updated
    cy.contains(goalName).parents('.group').contains("۵۰۰٬۰۰۰ تومان").should("be.visible");

    // --- Part 3: View Details (by clicking the card which is a link) ---
    // Note: The contributions are now expenses and not directly on the goal object, so we cannot test detail page contribution list easily in this E2E test.
    cy.contains(goalName).parents('.group').find('a').first().click(); // Click the link inside the card
    cy.url().should('include', '/goals/');
    cy.contains('h1', goalName).should('be.visible');
    cy.contains('۵۰۰٬۰۰۰ تومان').should('be.visible'); // Current amount on detail page
  });
});
