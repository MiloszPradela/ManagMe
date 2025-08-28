describe('Logowanie i zadania', () => {
    const userCredentials = {
        login: 'milosz.pradela1@onet.pl',
        password: 'Test@123!'
    };
    it('powinien wykonać pełny cykl życia zadania: tworzenie, edycja, milestone, usuwanie', () => {
        // --- Krok 1: Logowanie ---
        cy.clearLocalStorage();
        cy.visit('/login');
        cy.get('#login-form').should('be.visible');
        cy.get('#login').type(userCredentials.login);
        cy.get('#password').type(userCredentials.password, { log: false });
        cy.get('button[type="submit"]').click();
        cy.url({ timeout: 15000 }).should('not.include', '/login');
        cy.get('body', { timeout: 15000 }).should('be.visible');
        
        // --- Krok 2: Przejście do strony zadań ---
        cy.visit('/tasks');
        cy.url().should('include', '/tasks');
        cy.get('body').should('contain', 'Zadania');
        cy.get('button').contains('Utwórz nowe zadanie', { timeout: 15000 }).should('be.visible');

        // --- Krok 3: Tworzenie nowego zadania ---
        cy.get('button').contains('Utwórz nowe zadanie').click();
        cy.get('.modal, [role="dialog"]', { timeout: 10000 }).should('be.visible');
        
        cy.get('#task-title-modal').type('T1');
        
        cy.get('#task-project-modal option').eq(1).invoke('val').then((value) => {
            if (value) {
                cy.get('#task-project-modal').select(value as string);
            }
        });
        
        cy.get('#task-description-modal').type('Opis zadania T1');
        
        cy.get('#task-assigned-to-modal option').eq(1).invoke('val').then((value) => {
            if (value) {
                cy.get('#task-assigned-to-modal').select(value as string);
            }
        });
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
        cy.get('#task-deadline-modal').type(tomorrowFormatted);
        
        cy.get('.modal form button[type="submit"]').click();
        cy.get('.modal, [role="dialog"]', { timeout: 15000 }).should('not.exist');
        
        // --- Krok 4: Weryfikacja utworzenia zadania i przejście do szczegółów ---
        cy.reload();
        cy.get('body').should('contain', 'Zadania');
        cy.get('#tasks-list-container table tbody', { timeout: 15000 }).should('contain', 'T1');
        
        cy.get('#tasks-list-container .btn-outline-primary').last().click();
        cy.url().should('match', /\/task\/[a-f0-9]{24}/);
        cy.get('body').should('contain', 'Powrót do listy');
        
        // --- Krok 5: Edycja zadania ---
        cy.get('.btn').contains('Edytuj').click();
        cy.url().should('include', '/edit-task/');
        
        cy.get('#edit-task-form').should('be.visible');
        cy.get('#task-title').should('have.value', 'T1');
        
        cy.get('#task-title').clear().type('T1E');
        cy.get('#task-description').clear().type('Zaktualizowany opis zadania T1E');
        cy.get('#task-status').select('w trakcie');
        cy.get('#task-priority').select('wysoki');
        
        cy.get('#edit-task-form button[type="submit"]').click();
        
        // --- Krok 6: Weryfikacja edycji zadania ---
        cy.url({ timeout: 10000 }).should('include', '/task/');
        cy.url().should('not.include', '/edit-task/');
        cy.get('body').should('contain', 'T1E');

        // --- Krok 7: Dodawanie nowego Milestone ---
        cy.get('#add-milestone-btn').click();
        cy.get('#milestone-form-modal').should('be.visible');

        cy.get('#milestone-name').type('Milestone 1');
        cy.get('#milestone-desc').type('Opis dla Milestone 1');
        cy.get('#milestone-time').type('120');

        cy.get('#milestone-user option').eq(1).invoke('val').then((value) => {
            if (value) {
                cy.get('#milestone-user').select(value as string);
            }
        });

        cy.get('#milestone-form-in-modal button[type="submit"]').click();
        cy.get('#milestone-form-modal').should('not.exist');

        cy.get('#milestones-list', { timeout: 10000 }).should('contain', 'Milestone 1');

        // --- Krok 8: Edycja Milestone (zmiana statusu) ---
        cy.get('#milestones-list').contains('Milestone 1').parents('.list-group-item').find('.edit-milestone-btn').click();
        cy.get('#milestone-form-modal').should('be.visible');

        cy.get('#milestone-status').select('done');

        cy.get('#milestone-form-in-modal button[type="submit"]').click();
        cy.get('#milestone-form-modal').should('not.exist');

        cy.get('#milestones-list').contains('Milestone 1').parents('.list-group-item').find('.badge').should('contain', 'Zakończony');

        // --- Krok 9: Usuwanie Milestone ---
        cy.get('#milestones-list').contains('Milestone 1').parents('.list-group-item').find('.remove-milestone-btn').click();
        cy.get('#confirm-container-dynamic').should('be.visible');
        cy.get('#confirm-container-dynamic .btn-danger[data-action="confirm"]').click();
        cy.get('#milestones-list', { timeout: 10000 }).should('not.contain', 'Milestone 1');

        // --- Krok 10: Usuwanie całego zadania ---
        cy.get('#delete-task-btn').click();
        cy.get('#confirm-container-dynamic').should('be.visible');
        cy.get('#confirm-container-dynamic .btn-danger[data-action="confirm"]').click();

        // --- Krok 11: Weryfikacja usunięcia zadania ---
        cy.url({ timeout: 10000 }).should('include', '/tasks');
        cy.get('body').should('not.contain', 'T1E');
    });
});
