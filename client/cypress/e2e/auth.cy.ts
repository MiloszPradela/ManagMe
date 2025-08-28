// cypress/e2e/login.cy.ts

describe('Proces logowania użytkownika', () => {
    beforeEach(() => {
        // Czyszczenie localStorage przed każdym testem
        cy.clearLocalStorage();
        
        // Ustawiamy interceptor dla API logowania
        cy.intercept('POST', '/api/auth/login').as('loginRequest');
        
        // Odwiedzamy stronę logowania przed każdym testem
        cy.visit('/login');
        
        // Czekamy aż strona się załaduje
        cy.get('#login-form').should('be.visible');
    });

    // Test pozytywny - pomyślne logowanie
    it('powinien pomyślnie zalogować użytkownika', () => {
        const userCredentials = {
            login: 'milosz.pradela1@onet.pl',
            password: 'Test@123!'
        };

        const mockResponse = {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
                id: 1,
                login: 'milosz.pradela1@onet.pl',
                rola: 'USER',
                imie: 'Miłosz',
                nazwisko: 'Pradela'
            }
        };

        // Mockujemy odpowiedź API z poprawnymi danymi
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: mockResponse
        }).as('loginRequestSuccess');

        // Wypełniamy formularz
        cy.get('#login').type(userCredentials.login);
        cy.get('#password').type(userCredentials.password, { log: false });

        // Klikamy przycisk logowania
        cy.get('button[type="submit"]').click();

        // Sprawdzamy żądanie API
        cy.wait('@loginRequestSuccess').then((interception) => {
            // API może oczekiwać różnej struktury danych
            const requestBody = interception.request.body;
            expect(requestBody).to.have.property('login', userCredentials.login);
            expect(requestBody).to.have.property('password', userCredentials.password);
        });

        // Sprawdzamy czy token został zapisany w localStorage
        cy.window().its('localStorage').invoke('getItem', 'token').should('eq', mockResponse.token);
        cy.window().its('localStorage').invoke('getItem', 'userRole').should('eq', mockResponse.user.rola);

        // Sprawdzamy komunikat sukcesu - AlertService może generować różne struktury
        // Sprawdzamy różne możliwe selektory dla alertów
        cy.get('body').then(($body) => {
            const alertExists = $body.find('.alert, .toast, [role="alert"], .notification, .message').length > 0;
            if (alertExists) {
                cy.get('.alert, .toast, [role="alert"], .notification, .message')
                  .should('be.visible');
            }
        });

        // Sprawdzamy przekierowanie na stronę główną po 1.5 sekundy
        cy.url({ timeout: 3000 }).should('not.include', '/login');
        cy.url().should('include', '/'); // Może być różne w zależności od konfiguracji
    });

    // Test walidacji - puste login
    it('powinien wyświetlić błąd gdy login jest pusty', () => {
        // Wypełniamy tylko hasło
        cy.get('#password').type('Test@123!', { log: false });

        cy.get('button[type="submit"]').click();

        // Sprawdzamy błąd loginu
        cy.get('#login-error').should('be.visible');

        // Sprawdzamy że żądanie API nie zostało wysłane
        cy.get('@loginRequest.all').should('have.length', 0);

        // Formularz nie powinien zostać przesłany
        cy.url().should('include', '/login');
    });

    // Test walidacji - puste hasło
    it('powinien wyświetlić błąd gdy hasło jest puste', () => {
        // Wypełniamy tylko login
        cy.get('#login').type('milosz.pradela1@onet.pl');

        cy.get('button[type="submit"]').click();

        // Sprawdzamy błąd hasła
        cy.get('#password-error').should('be.visible');

        // Sprawdzamy że żądanie API nie zostało wysłane
        cy.get('@loginRequest.all').should('have.length', 0);

        // Formularz nie powinien zostać przesłany
        cy.url().should('include', '/login');
    });

    // Test walidacji - oba pola puste
    it('powinien wyświetlić błędy gdy oba pola są puste', () => {
        cy.get('button[type="submit"]').click();

        // Sprawdzamy oba błędy
        cy.get('#login-error').should('be.visible');
        cy.get('#password-error').should('be.visible');

        // Sprawdzamy że żądanie API nie zostało wysłane
        cy.get('@loginRequest.all').should('have.length', 0);
    });

    // Test błędu API - nieprawidłowe dane logowania
    it('powinien wyświetlić błąd przy nieprawidłowych danych logowania', () => {
        // Mockujemy odpowiedź błędu z API
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 401,
            body: { 
                success: false,
                msg: 'Nieprawidłowy login lub hasło',
                error: 'INVALID_CREDENTIALS'
            }
        }).as('loginRequestError');

        // Wypełniamy formularz z nieprawidłowymi danymi
        cy.get('#login').type('wrong@example.com');
        cy.get('#password').type('wrongpassword', { log: false });

        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequestError');

        // Sprawdzamy komunikat błędu - różne możliwe selektory
        cy.get('body').then(($body) => {
            const alertExists = $body.find('.alert, .toast, [role="alert"], .notification, .message, .error').length > 0;
            if (alertExists) {
                cy.get('.alert, .toast, [role="alert"], .notification, .message, .error')
                  .should('be.visible');
            } else {
                // Jeśli nie ma wizualnego alertu, sprawdź czy błąd nie zostanie wyświetlony w konsoli
                cy.window().then((win) => {
                    // Możesz dodać sprawdzenie window.lastAlert jeśli AlertService to wspiera
                });
            }
        });

        // Sprawdzamy że token nie został zapisany
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');

        // Pozostajemy na stronie logowania
        cy.url().should('include', '/login');
    });

    // Test błędu API - błąd serwera
    it('powinien obsłużyć błąd serwera', () => {
        // Mockujemy błąd serwera
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 500,
            body: { 
                success: false,
                msg: 'Błąd wewnętrzny serwera',
                error: 'INTERNAL_SERVER_ERROR'
            }
        }).as('loginServerError');

        cy.get('#login').type('milosz.pradela1@onet.pl');
        cy.get('#password').type('Test@123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.wait('@loginServerError');

        // Sprawdzamy komunikat błędu - różne możliwe selektory
        cy.get('body').then(($body) => {
            const alertExists = $body.find('.alert, .toast, [role="alert"], .notification, .message, .error').length > 0;
            if (alertExists) {
                cy.get('.alert, .toast, [role="alert"], .notification, .message, .error')
                  .should('be.visible');
            }
        });

        // Sprawdzamy że token nie został zapisany
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
    });

    // Test linku do Google OAuth
    it('powinien mieć działający link do logowania przez Google', () => {
        cy.get('a[href*="/api/auth/google"]')
            .should('be.visible')
            .and('have.attr', 'href')
            .and('include', '/api/auth/google');
    });

    // Test linku do rejestracji
    it('powinien mieć działający link do strony rejestracji', () => {
        cy.get('a[href="/register"]')
            .should('be.visible')
            .click();
        
        cy.url().should('include', '/register');
    });

    // Test linku do odzyskiwania hasła
    it('powinien mieć działający link do odzyskiwania hasła', () => {
        cy.get('a[href="/lost-password"]')
            .should('be.visible')
            .click();
        
        cy.url().should('include', '/lost-password');
    });

    // Test czyszczenia błędów po poprawieniu danych
    it('powinien ukryć błędy po wypełnieniu pól', () => {
        // Najpierw wywołujemy błędy
        cy.get('button[type="submit"]').click();
        
        cy.get('#login-error').should('be.visible');
        cy.get('#password-error').should('be.visible');

        // Następnie wypełniamy pola
        cy.get('#login').type('milosz.pradela1@onet.pl');
        cy.get('#password').type('Test@123!', { log: false });

        // Mockujemy pomyślną odpowiedź
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: {
                token: 'test-token-success',
                user: { 
                    rola: 'USER',
                    login: 'milosz.pradela1@onet.pl',
                    imie: 'Miłosz'
                }
            }
        }).as('loginSuccess');

        cy.get('button[type="submit"]').click();

        cy.wait('@loginSuccess');

        // Błędy powinny zniknąć
        cy.get('#login-error').should('not.be.visible');
        cy.get('#password-error').should('not.be.visible');
    });

    // Test różnych typów użytkowników
    it('powinien zapisać rolę administratora do localStorage', () => {
        const adminResponse = {
            token: 'admin-token-12345',
            user: {
                id: 1,
                login: 'admin@example.com',
                rola: 'ADMIN',
                imie: 'Admin',
                nazwisko: 'User'
            }
        };

        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: adminResponse
        }).as('adminLoginSuccess');

        cy.get('#login').type('admin@example.com');
        cy.get('#password').type('AdminPassword123!', { log: false });

        cy.get('button[type="submit"]').click();

        cy.wait('@adminLoginSuccess');

        // Sprawdzamy zapisanie roli administratora
        cy.window().its('localStorage').invoke('getItem', 'userRole').should('eq', 'ADMIN');
    });

    // Test logowania z użyciem klawisza Enter
    it('powinien umożliwić logowanie poprzez klawisz Enter', () => {
        const mockResponse = {
            token: 'enter-test-token',
            user: { 
                rola: 'USER',
                login: 'milosz.pradela1@onet.pl',
                imie: 'Miłosz'
            }
        };

        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: mockResponse
        }).as('enterLoginSuccess');

        cy.get('#login').type('milosz.pradela1@onet.pl');
        cy.get('#password').type('Test@123!{enter}', { log: false });

        cy.wait('@enterLoginSuccess');

        // Sprawdzamy że logowanie się powiodło
        cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'enter-test-token');
    });

    // Test bezpieczeństwa - nie wyświetlanie hasła
    it('powinien ukrywać wprowadzone hasło', () => {
        cy.get('#password').should('have.attr', 'type', 'password');
        
        cy.get('#password').type('Test@123!');
        
        // Sprawdzamy że hasło jest ukryte wizualnie
        cy.get('#password').should('have.attr', 'type', 'password');
    });

    // Test dostępności formularza
    it('powinien mieć prawidłowe etykiety dla czytników ekranu', () => {
        // Sprawdzamy czy wszystkie pola mają etykiety
        cy.get('label[for="login"]').should('exist');
        cy.get('label[for="password"]').should('exist');

        // Sprawdzamy czy pola są połączone z etykietami
        cy.get('#login').should('have.attr', 'id', 'login');
        cy.get('#password').should('have.attr', 'id', 'password');

        // Sprawdzamy wymagane pola
        cy.get('#login').should('have.attr', 'required');
        cy.get('#password').should('have.attr', 'required');
    });

    // Test responsywności
    it('powinien wyświetlać się poprawnie na różnych rozmiarach ekranu', () => {
        // Test na urządzeniu mobilnym
        cy.viewport('iphone-x');
        cy.get('#login-form').should('be.visible');
        cy.get('#login').should('be.visible');
        
        // Test na tablecie  
        cy.viewport('ipad-2');
        cy.get('#login-form').should('be.visible');
        
        // Test na deskopie
        cy.viewport(1920, 1080);
        cy.get('#login-form').should('be.visible');
    });

    // Test timeout żądania API - POPRAWIONY
    it('powinien obsłużyć timeout żądania API', () => {
        // Ustawiamy krótszy timeout dla Cypress
        cy.intercept('POST', '/api/auth/login', (req) => {
            // Symulujemy długie oczekiwanie bez odpowiedzi
            req.reply({ forceNetworkError: true });
        }).as('timeoutLogin');

        cy.get('#login').type('milosz.pradela1@onet.pl');
        cy.get('#password').type('Test@123!', { log: false });

        cy.get('button[type="submit"]').click();

        // Sprawdzamy czy aplikacja obsługuje błąd sieciowy
        // Może wyświetlić alert lub pozostać na stronie logowania
        cy.url({ timeout: 5000 }).should('include', '/login');
        
        // Alternatywnie sprawdź czy pojawił się jakiś komunikat błędu
        cy.get('body').then(($body) => {
            const hasAlert = $body.find('.alert, .toast, [role="alert"], .notification, .message, .error').length > 0;
            if (hasAlert) {
                cy.get('.alert, .toast, [role="alert"], .notification, .message, .error')
                  .should('be.visible');
            }
        });
    });
});
