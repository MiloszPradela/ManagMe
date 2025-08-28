// cypress/e2e/register.cy.ts

describe('Proces rejestracji użytkownika', () => {
    beforeEach(() => {
        // Ustawiamy interceptor dla API rejestracji
        cy.intercept('POST', '/api/auth/register').as('registerRequest');
        // Odwiedzamy stronę rejestracji przed każdym testem
        cy.visit('/register');
        
        // Czekamy aż strona się załaduje
        cy.get('#register-form').should('be.visible');
    });

    // Test pozytywny - pomyślna rejestracja
    it('powinien pomyślnie zarejestrować nowego użytkownika', () => {
        const uniqueId = Date.now();
        const userEmail = `testuser_${uniqueId}@example.com`;
        const password = 'Password123!';

        // Wypełniamy wszystkie wymagane pola
        cy.get('#imie').type('Jan');
        cy.get('#nazwisko').type('Testowy');
        cy.get('#login').type(userEmail);
        cy.get('#password').type(password, { log: false });
        cy.get('#confirm-password').type(password, { log: false });

        // Klikamy przycisk rejestracji
        cy.get('button[type="submit"]').click();

        // Sprawdzamy odpowiedź API
        cy.wait('@registerRequest').its('response.statusCode').should('be.oneOf', [200, 201]);

        // Sprawdzamy czy nastąpiło przekierowanie na stronę logowania po 2 sekundach
        cy.url({ timeout: 5000 }).should('include', '/login');
    });

    // Test walidacji - puste imię
    it('powinien wyświetlić błąd gdy imię jest puste', () => {
        // Wypełniamy wszystkie pola oprócz imienia
        cy.get('#nazwisko').type('Testowy');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('Password123!', { log: false });
        cy.get('#confirm-password').type('Password123!', { log: false });

        cy.get('button[type="submit"]').click();

        // Sprawdzamy komunikat błędu dla imienia
        cy.get('#imie-error').should('be.visible');

        // Formularz nie powinien zostać przesłany
        cy.url().should('include', '/register');
    });

    // Test walidacji - puste login
    it('powinien wyświetlić błąd gdy login jest pusty', () => {
        cy.get('#imie').type('Jan');
        cy.get('#nazwisko').type('Testowy');
        // Login pozostawiamy pusty
        cy.get('#password').type('Password123!', { log: false });
        cy.get('#confirm-password').type('Password123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#login-error').should('be.visible');
    });

    // Test walidacji hasła - za krótkie
    it('powinien wyświetlić błąd gdy hasło jest za krótkie', () => {
        cy.get('#imie').type('Jan');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('123', { log: false });
        cy.get('#confirm-password').type('123', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#password-error').should('be.visible');
    });

    // Test walidacji hasła - brak wielkiej litery
    it('powinien wyświetlić błąd gdy hasło nie zawiera wielkiej litery', () => {
        cy.get('#imie').type('Jan');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('password123!', { log: false });
        cy.get('#confirm-password').type('password123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#password-error').should('be.visible');
    });

    // Test walidacji hasła - brak małej litery
    it('powinien wyświetlić błąd gdy hasło nie zawiera małej litery', () => {
        cy.get('#imie').type('Jan');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('PASSWORD123!', { log: false });
        cy.get('#confirm-password').type('PASSWORD123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#password-error').should('be.visible');
    });

    // Test walidacji hasła - brak cyfry
    it('powinien wyświetlić błąd gdy hasło nie zawiera cyfry', () => {
        cy.get('#imie').type('Jan');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('Password!', { log: false });
        cy.get('#confirm-password').type('Password!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#password-error').should('be.visible');
    });

    // Test walidacji hasła - brak znaku specjalnego
    it('powinien wyświetlić błąd gdy hasło nie zawiera znaku specjalnego', () => {
        cy.get('#imie').type('Jan');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('Password123', { log: false });
        cy.get('#confirm-password').type('Password123', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#password-error').should('be.visible');
    });

    // Test walidacji - hasła nie pasują
    it('powinien wyświetlić błąd gdy hasła się nie zgadzają', () => {
        cy.get('#imie').type('Anna');
        cy.get('#nazwisko').type('Błąd');
        cy.get('#login').type(`invalid_${Date.now()}@example.com`);
        cy.get('#password').type('Password123!', { log: false });
        cy.get('#confirm-password').type('InneHaslo123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.get('#confirm-password-error').should('be.visible');

        // Sprawdzamy, że NIE nastąpiło przekierowanie
        cy.url().should('include', '/register');
    });

    // Test błędu API - użytkownik już istnieje
    it('powinien wyświetlić błąd gdy użytkownik już istnieje', () => {
        // Mockujemy odpowiedź błędu z API
        cy.intercept('POST', '/api/auth/register', {
            statusCode: 400,
            body: { msg: 'Użytkownik o tym emailu już istnieje' }
        }).as('registerRequestError');

        const existingEmail = 'existing@example.com';

        cy.get('#imie').type('Jan');
        cy.get('#nazwisko').type('Testowy');
        cy.get('#login').type(existingEmail);
        cy.get('#password').type('Password123!', { log: false });
        cy.get('#confirm-password').type('Password123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.wait('@registerRequestError');

        // Sprawdzamy komunikat błędu w alercie - dostosuj do swojego AlertService
        cy.get('.alert').should('be.visible');
    });

    // Test linku do Google OAuth
    it('powinien mieć działający link do rejestracji przez Google', () => {
        cy.get('a[href*="/api/auth/google"]')
            .should('be.visible')
            .and('have.attr', 'href')
            .and('include', '/api/auth/google');
    });

    // Test linku do strony logowania
    it('powinien mieć działający link do strony logowania', () => {
        cy.get('a[href="/login"]')
            .should('be.visible')
            .click();
        
        cy.url().should('include', '/login');
    });

    // Test czyszczenia błędów
    it('powinien ukryć błędy po poprawieniu danych w formularzu', () => {
        // Najpierw wywołujemy błąd
        cy.get('button[type="submit"]').click();
        
        cy.get('#imie-error').should('be.visible');

        // Następnie wypełniamy pola
        cy.get('#imie').type('Jan');
        cy.get('#nazwisko').type('Testowy');
        cy.get('#login').type('test@example.com');
        cy.get('#password').type('Password123!', { log: false });
        cy.get('#confirm-password').type('WrongPassword!', { log: false });

        cy.get('button[type="submit"]').click();

        // Błąd imienia powinien zniknąć
        cy.get('#imie-error').should('not.be.visible');
        // Ale błąd confirm-password powinien się pojawić
        cy.get('#confirm-password-error').should('be.visible');
    });
});
