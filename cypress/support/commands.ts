/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      interceptCommonApis(): Chainable<void>;
      loginAsLibrarian(): Chainable<void>;
      loginAsMember(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('interceptCommonApis', () => {
  // Captcha endpoint
  cy.intercept('GET', '**/auth/captcha', {
    statusCode: 200,
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="10" y="25" fill="#333" font-size="20">ABCD</text></svg>',
    headers: { 'content-type': 'text/plain' },
  }).as('getCaptcha');

  // Librarian endpoints
  cy.intercept('GET', '**/dashboard/summary', { fixture: 'librarian/dashboard-summary.json' }).as('getDashboardSummary');
  cy.intercept('GET', '**/dashboard/transactions*', { fixture: 'librarian/dashboard-transactions.json' }).as('getDashboardTransactions');
  cy.intercept('GET', '**/dashboard/weekly-statistics*', { fixture: 'librarian/dashboard-weekly.json' }).as('getDashboardWeekly');
  cy.intercept('GET', '**/shelves/?*', { fixture: 'librarian/shelves.json' }).as('getShelves');
  cy.intercept('GET', '**/books/?*', { fixture: 'librarian/books.json' }).as('getBooks');
  cy.intercept('GET', '**/fine-rules/?*', { fixture: 'librarian/fine-rule.json' }).as('getFineRules');
  cy.intercept('GET', '**/fine-payments/?*', { fixture: 'librarian/fines.json' }).as('getFines');
  cy.intercept('GET', '**/user/members/?*', { fixture: 'librarian/members.json' }).as('getMembers');
  cy.intercept('GET', '**/user/librarians/?*', { fixture: 'librarian/staff.json' }).as('getStaff');
  cy.intercept('GET', '**/transactions/?*', { fixture: 'librarian/borrowings.json' }).as('getBorrowings');
  cy.intercept('GET', '**/reports/circulation?*', { fixture: 'librarian/report-circulation.json' }).as('getReportCirculation');
  cy.intercept('GET', '**/reports/fines?*', { fixture: 'librarian/report-fines.json' }).as('getReportFines');

  // Member endpoints
  cy.intercept('GET', '**/member/dashboard', { fixture: 'member/dashboard.json' }).as('getMemberDashboard');
  cy.intercept('GET', '**/book?*', { fixture: 'member/catalog.json' }).as('getMemberCatalog');
  cy.intercept('GET', '**/book/bookmark*', { fixture: 'member/bookmarks.json' }).as('getMemberBookmarks');
  cy.intercept('GET', '**/member/transactions/?*', { fixture: 'member/borrowings.json' }).as('getMemberTransactions');
  cy.intercept('GET', '**/member/fine-payments/?*', { fixture: 'member/fines.json' }).as('getMemberFines');
});

Cypress.Commands.add('loginAsLibrarian', () => {
  cy.interceptCommonApis();
  cy.intercept('GET', '**/profile/me', { fixture: 'auth/user-librarian.json' }).as('getProfileLibrarian');
  cy.visit('/pustakawan/dashboard');
  cy.wait(['@getProfileLibrarian', '@getDashboardSummary']);
});

Cypress.Commands.add('loginAsMember', () => {
  cy.interceptCommonApis();
  cy.intercept('GET', '**/profile/me', { fixture: 'auth/user-member.json' }).as('getProfileMember');
  cy.visit('/anggota/dashboard');
  cy.wait(['@getProfileMember', '@getMemberDashboard']);
});

export {};
