describe("Login Flow", () => {
  it("should show validation errors for empty fields", () => {
    cy.visit("/login");
    cy.get('button[type="submit"]').click();
    cy.contains("لطفا یک ایمیل معتبر وارد کنید.").should("be.visible");
    cy.contains("رمز عبور باید حداقل ۶ کاراکتر باشد.").should("be.visible");
  });

  it("should show an error for an unauthorized email", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();
    cy.contains("شما اجازه ورود به این اپلیکیشن را ندارید.").should(
      "be.visible"
    );
  });

  it("should show an error for a wrong password", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();
    // We expect a toast message for this
    cy.contains("ایمیل یا رمز عبور اشتباه است.").should("be.visible");
  });

  it("should log in a valid user, redirect to dashboard, and then log out", () => {
    // --- Part 1: Login ---
    cy.visit("/login");
    cy.get('input[name="email"]').type("ali@khanevadati.app");
    cy.get('input[name="password"]').type("password123");
    cy.get('button[type="submit"]').click();

    // After successful login, the URL should be the dashboard
    cy.url().should("eq", "http://localhost:3000/");
    // And we should see a key element from the dashboard
    cy.contains("h1", "داشبورد").should("be.visible");

    // --- Part 2: Logout ---
    // The logout button is in the sidebar footer
    cy.get('div[class*="sidebar-footer"] button[aria-label="خروج"]').click();
    
    // After logout, we should be redirected to the login page
    cy.url().should("eq", "http://localhost:3000/login");
    // And we should see the login form again
    cy.contains("h1", "ورود به حساب کاربری").should("be.visible");
  });
});
