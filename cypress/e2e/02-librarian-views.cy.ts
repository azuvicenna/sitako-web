describe('02 - Librarian Views E2E', () => {
  beforeEach(() => {
    cy.loginAsLibrarian();
  });

  it('renders Dashboard with summary stats and today transactions', () => {
    cy.url().should('include', '/pustakawan/dashboard');
    cy.contains('h1', 'Dashboard Pustakawan').should('be.visible');

    // Stat cards from fixture
    cy.contains('1.250').should('be.visible'); // Fisik
    cy.contains('450').should('be.visible'); // Digital
    cy.contains('380').should('be.visible'); // Anggota aktif
    cy.contains('65').should('be.visible'); // Dipinjam

    // Transactions table
    cy.contains('TRX-20260917-0001').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');
  });

  it('renders ShelfView and opens Add Shelf modal', () => {
    cy.visit('/pustakawan/rak');
    cy.wait('@getShelves');

    cy.contains('Kelola Rak Buku').should('be.visible');
    cy.contains('Rak Sastra & Fiksi').should('be.visible');
    cy.contains('Rak Sains & Teknologi').should('be.visible');

    // Trigger Add Shelf Modal
    cy.contains('button', 'Tambah Rak').click();
    cy.contains('h3', 'Tambah Rak Baru').should('be.visible');
    cy.contains('button', 'Batal').click();
  });

  it('renders BookView with filters and opens Add Book modal', () => {
    cy.visit('/pustakawan/buku');
    cy.wait('@getBooks');

    cy.contains('Kelola Buku Perpustakaan').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');
    cy.contains('Clean Code').should('be.visible');

    // Type filter tabs
    cy.contains('button', 'Fisik').should('be.visible');
    cy.contains('button', 'Digital').should('be.visible');

    // Trigger Add Book Modal
    cy.contains('button', 'Tambah Buku').click();
    cy.contains('h3', 'Tambah Buku Baru').should('be.visible');
    cy.contains('button', 'Batal').click();
  });

  it('renders FineView and opens fine rule configuration modal', () => {
    cy.visit('/pustakawan/denda');
    cy.wait(['@getFines', '@getFineRules']);

    cy.contains('Kelola Denda Buku').should('be.visible');
    cy.contains('TRX-20260901-001').should('be.visible');
    cy.contains('Budi Santoso').should('be.visible');

    // Trigger Rule Modal
    cy.contains('button', 'Pengaturan Denda').click();
    cy.contains('h3', 'Konfigurasi Tarif & Aturan Denda').should('be.visible');
    cy.contains('button', 'Batal').click();
  });

  it('renders MemberView with member list and active badges', () => {
    cy.visit('/pustakawan/anggota');
    cy.wait('@getMembers');

    cy.contains('Daftar Anggota').should('be.visible');
    cy.contains('Budi Santoso').should('be.visible');
    cy.contains('20251001').should('be.visible');
    cy.contains('Aktif').should('be.visible');

    cy.contains('button', 'Tambah Anggota').should('be.visible');
  });

  it('renders LibrarianView with staff members list', () => {
    cy.visit('/pustakawan/pustakawan');
    cy.wait('@getStaff');

    cy.contains('Daftar Pustakawan').should('be.visible');
    cy.contains('Siti Rahma').should('be.visible');
    cy.contains('198501012010012001').should('be.visible');
  });

  it('renders BorrowingView and ReturningView circulation tables', () => {
    cy.visit('/pustakawan/peminjaman');
    cy.wait('@getBorrowings');

    cy.contains('Daftar Peminjaman').should('be.visible');
    cy.contains('TRX-20260901-001').should('be.visible');
    cy.contains('Laskar Pelangi').should('be.visible');

    cy.visit('/pustakawan/pengembalian');
    cy.contains('Daftar Pengembalian').should('be.visible');
  });

  it('renders ReportView with circulation and fines generator tabs', () => {
    cy.visit('/pustakawan/laporan');

    cy.contains('Buat Laporan').should('be.visible');
    cy.contains('Laporan Sirkulasi').should('be.visible');
    cy.contains('Laporan Denda').should('be.visible');

    cy.contains('button', 'Buat Laporan').should('be.visible');
  });
});
