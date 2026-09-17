describe('04 - Profile View E2E', () => {
  it('renders librarian profile and handles profile update validation', () => {
    cy.loginAsLibrarian();

    cy.visit('/profil');
    cy.url().should('include', '/pustakawan/profil');

    // Verification of profile info
    cy.contains('h2', 'Siti Rahma, S.Ptk').should('be.visible');
    cy.contains('Pustakawan').should('be.visible');
    cy.contains('NIP: 198501012010012001').should('be.visible');

    // Inputs are prepopulated
    cy.get('input#name').should('have.value', 'Siti Rahma, S.Ptk');
    cy.get('input#email').should('have.value', 'siti.rahma@sitako.sch.id');

    // Password mismatch validation
    cy.get('input#password').type('rahasia123');
    cy.get('input#confirmPassword').type('berbeda123');
    cy.contains('button', 'Simpan Perubahan').click();

    cy.contains('Konfirmasi kata sandi tidak cocok').should('be.visible');
  });

  it('renders member profile correctly', () => {
    cy.loginAsMember();

    cy.visit('/profil');
    cy.url().should('include', '/anggota/profil');

    // Verification of member info
    cy.contains('h2', 'Budi Santoso').should('be.visible');
    cy.contains('Anggota').should('be.visible');
    cy.contains('NIS: 20251001').should('be.visible');

    cy.get('input#name').should('have.value', 'Budi Santoso');
    cy.get('input#email').should('have.value', 'budi.santoso@siswa.sch.id');
  });
});
