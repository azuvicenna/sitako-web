describe('03 - Member Views E2E', () => {
  beforeEach(() => {
    cy.loginAsMember();
  });

  it('renders Member Dashboard with active loans and statistics', () => {
    cy.url().should('include', '/anggota/dashboard');
    cy.contains('h1', 'Dashboard Anggota').should('be.visible');

    // Stat cards from fixture
    cy.contains('2').should('be.visible'); // Buku dipinjam
    cy.contains('Rp 5.000').should('be.visible'); // Total denda
    cy.contains('4').should('be.visible'); // Total bookmark

    // Active loans card
    cy.contains('TRX-20260910-001').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');
  });

  it('renders CatalogView with books grid and filters', () => {
    cy.visit('/anggota/katalog');
    cy.wait('@getMemberCatalog');

    cy.contains('Katalog Buku').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');
    cy.contains('Clean Code').should('be.visible');

    // Filter genre / tipe chips
    cy.contains('Fisik').should('be.visible');
    cy.contains('Digital').should('be.visible');

    // Search input
    cy.get('input[placeholder*="Cari judul"]').should('be.visible');
  });

  it('renders BookmarkView with saved items', () => {
    cy.visit('/anggota/bookmark');
    cy.wait('@getMemberBookmarks');

    cy.contains('Buku Tersimpan').should('be.visible');
    cy.contains('Clean Code').should('be.visible');
  });

  it('renders Member BorrowingView with borrowing records', () => {
    cy.visit('/anggota/peminjaman');
    cy.wait('@getMemberTransactions');

    cy.contains('Peminjaman Saya').should('be.visible');
    cy.contains('TRX-20260910-001').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');
  });

  it('renders Member FineView with fine history and bills', () => {
    cy.visit('/anggota/denda');
    cy.wait('@getMemberFines');

    cy.contains('Riwayat & Tagihan Denda').should('be.visible');
    cy.contains('TRX-20260901-001').should('be.visible');
    cy.contains('Rp 5.000').should('be.visible');
  });
});
