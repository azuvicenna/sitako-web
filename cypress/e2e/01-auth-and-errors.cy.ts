describe('01 - Auth & Error Pages E2E', () => {
  beforeEach(() => {
    cy.interceptCommonApis();
  });

  it('renders login page with all inputs and captcha', () => {
    cy.visit('/login');
    cy.contains('h1', 'SITAKO').should('be.visible');
    cy.contains('h2', 'Masuk ke Akun').should('be.visible');

    cy.get('input#identifier').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#captcha').should('be.visible');
    cy.contains('button', 'Masuk ke Sistem').should('be.visible');
  });

  it('validates required fields on client side before submission', () => {
    cy.visit('/login');
    cy.get('button[type="submit"]').click();

    cy.contains('NIP atau NIS wajib diisi').should('be.visible');
    cy.contains('Kata sandi wajib diisi').should('be.visible');
    cy.contains('Kode CAPTCHA wajib diisi').should('be.visible');
  });

  it('displays error alert on invalid credentials', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      fixture: 'auth/login-error.json',
    }).as('loginFailed');

    cy.visit('/login');
    cy.get('input#identifier').type('wrong-nip');
    cy.get('input#password').type('wrong-pass');
    cy.get('input#captcha').type('ABCD');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFailed');
    cy.contains('NIP/NIS atau kata sandi yang Anda masukkan salah').should('be.visible');
  });

  it('successfully logs in as Pustakawan and redirects to librarian dashboard', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      fixture: 'auth/login-librarian.json',
    }).as('loginLibrarian');

    cy.intercept('GET', '**/profile/me', {
      fixture: 'auth/user-librarian.json',
    }).as('getProfileMe');

    cy.visit('/login');
    cy.get('input#identifier').type('198501012010012001');
    cy.get('input#password').type('password123');
    cy.get('input#captcha').type('ABCD');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginLibrarian');
    cy.url().should('include', '/pustakawan/dashboard');
    cy.contains('Dashboard Pustakawan').should('be.visible');
  });

  it('successfully logs in as Anggota and redirects to member dashboard', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      fixture: 'auth/login-member.json',
    }).as('loginMember');

    cy.intercept('GET', '**/profile/me', {
      fixture: 'auth/user-member.json',
    }).as('getProfileMeMember');

    cy.visit('/login');
    cy.get('input#identifier').type('20251001');
    cy.get('input#password').type('password123');
    cy.get('input#captcha').type('ABCD');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginMember');
    cy.url().should('include', '/anggota/dashboard');
    cy.contains('Dashboard Anggota').should('be.visible');
  });

  it('renders 404 Not Found page on unregistered route', () => {
    cy.visit('/halaman-antah-berantah-yang-tidak-ada');
    cy.url().should('include', '/404');
    cy.contains('404').should('be.visible');
    cy.contains('Halaman Tidak Ditemukan').should('be.visible');
  });

  it('renders 403 Forbidden page directly', () => {
    cy.visit('/403');
    cy.contains('403').should('be.visible');
    cy.contains('Akses Ditolak').should('be.visible');
  });
});
