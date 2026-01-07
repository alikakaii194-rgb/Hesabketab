
describe("Dashboard", () => {
  beforeEach(() => {
    // Log in before each test in this suite
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    // Wait for redirection to the dashboard
    cy.url().should("eq", "http://localhost:3000/");
  });

  it("should display the main dashboard elements", () => {
    // Check for the main title
    cy.contains("h1", "داشبورد").should("be.visible");

    // Check for summary cards
    cy.contains("div", "دارایی خالص").should("be.visible");
    cy.contains("div", "کل دارایی").should("be.visible");
    cy.contains("div", "کل درآمد").should("be.visible");
    cy.contains("div", "کل هزینه").should("be.visible");
    
    // Check for main chart container
    cy.contains("h2", "درآمد در مقابل هزینه").should("be.visible");
  });

  it("should navigate to the expenses page from quick access", () => {
    cy.contains("a", "هزینه‌ها").click();
    cy.url().should("include", "/transactions");
    cy.contains("h1", "مدیریت هزینه‌ها").should("be.visible");
  });
});
