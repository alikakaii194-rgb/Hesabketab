
describe("Chat Flow", () => {
  const uniqueId = new Date().getTime();
  const firstMessageText = `این یک پیام تستی است - ${uniqueId}`;
  const replyMessageText = `این یک پاسخ به پیام تستی است - ${uniqueId}`;

  // Log in as Ali to send the first message
  before(() => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");
  });

  it("should allow Ali to send a message and Fatemeh to see it as unread, reply to it, and Ali sees the read receipt", () => {
    // --- Part 1: Ali sends a message ---
    cy.visit("/chat");
    cy.get('input[type="text"]').type(firstMessageText);
    cy.contains("button", "ارسال").click();
    cy.contains('p', firstMessageText).should("be.visible");
    
    // The message should have a single check (sent, but not read by Fatemeh yet)
    cy.contains('p', firstMessageText)
      .parents('[class*="rounded-lg"]')
      .find('svg[class*="lucide-check-check"]')
      .should('not.exist');
    cy.contains('p', firstMessageText)
      .parents('[class*="rounded-lg"]')
      .find('svg[class*="lucide-check"]')
      .should('be.visible');

    // Logout Ali
    cy.get('button[aria-label="خروج"]').first().click();
    cy.url().should("eq", "http://localhost:3000/login");

    // --- Part 2: Fatemeh logs in and sees the unread message ---
    cy.get('input[name="email"]').type("fatemeh@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // Check for unread indicator on the chat FAB and sidebar
    cy.get('a[href="/chat"]').find('span').should('contain.text', '1');
    
    // Navigate to chat
    cy.visit("/chat");

    // The message from Ali should be visible
    cy.contains('p', firstMessageText).should("be.visible");
    
    // --- Part 3: Fatemeh replies to the message ---
    cy.contains('p', firstMessageText).click();
    cy.contains("در پاسخ به:").should("be.visible");

    cy.get('input[type="text"]').type(replyMessageText);
    cy.contains("button", "ارسال").click();

    // The reply should be visible and correctly formatted
    cy.contains('p', replyMessageText)
      .should("be.visible")
      .parents('[class*="rounded-lg"]')
      .find('[class*="border-l-2"]')
      .should('contain', firstMessageText);

    // Logout Fatemeh
    cy.get('button[aria-label="خروج"]').first().click();
    cy.url().should("eq", "http://localhost:3000/login");

    // --- Part 4: Ali logs back in and sees the read receipt ---
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.visit("/chat");

    // Ali's original message should now have a double check (read by Fatemeh)
    cy.contains('p', firstMessageText)
      .parents('[class*="rounded-lg"]')
      .find('svg[class*="lucide-check-check"]')
      .should('be.visible');
  });
});
