
describe("Categories Flow", () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.url().should("eq", "http://localhost:3000/");

    // Navigate to the categories page
    cy.visit("/categories");
    cy.contains("h1", "مدیریت دسته‌بندی‌ها").should("be.visible");
  });

  it("should allow a user to add a new category, view its details, and then delete it", () => {
    const categoryName = `تست حذف دسته‌بندی - ${new Date().getTime()}`;

    // --- Part 1: Add Category ---
    cy.contains("button", "افزودن دسته‌بندی").click();

    cy.get('input[name="name"]').type(categoryName);
    cy.get('textarea[name="description"]').type("این یک توضیحات تستی برای حذف است.");
    
    cy.contains("button", "ذخیره").click();

    cy.contains("td", categoryName).should("be.visible");

    // --- Part 2: View Details ---
    cy.contains("td", categoryName).click();

    cy.url().should("include", "/categories/");
    cy.contains("h1", categoryName).should("be.visible");
    cy.contains("این یک توضیحات تستی برای حذف است.").should("be.visible");
    cy.visit("/categories"); // Go back to the list

    // --- Part 3: Delete Category ---
    cy.contains("td", categoryName)
      .parents("tr")
      .find('button[aria-label="Delete"]')
      .click();

    // Confirm deletion in the dialog
    cy.get('button').contains('بله، حذف کن').click();

    // Assert the category is no longer visible
    cy.contains("td", categoryName).should("not.exist");
  });

  it("should prevent deleting a category that has associated transactions", () => {
    const categoryName = "کافه و رستوران"; // A category we know will have transactions

    // Create a transaction linked to this category
    cy.visit('/transactions');
    cy.contains('button', 'ثبت هزینه جدید').click();
    cy.get('textarea[name="description"]').type(`هزینه تستی برای ${categoryName}`);
    cy.get('input[name="amount"]').type('1000');
    cy.get('button[role="combobox"]').first().click(); // Bank account
    cy.get('div[role="option"]').first().click();
    cy.get('button[role="combobox"]').eq(1).click(); // Category
    cy.get('div[role="option"]').contains(categoryName).click();
    cy.contains('button', 'ذخیره').click();
    
    // Go back to categories page
    cy.visit('/categories');

    // Find the category and try to delete it
    cy.contains("td", categoryName)
      .parents("tr")
      .find('button[aria-label="Delete"]')
      .click();
    
    cy.get('button').contains('بله، حذف کن').click();

    // Assert that a toast error message is shown
    cy.contains("امکان حذف وجود ندارد. این دسته‌بندی در یک یا چند هزینه یا چک استفاده شده است.").should("be.visible");
  });
});
